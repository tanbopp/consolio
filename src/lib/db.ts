import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import {
  buildInitialSeedData,
  DatabaseState,
  ShipmentDraftEntity,
  NotificationEntity,
  ActivityLogEntity,
  RoleType,
} from "@/lib/seed-data";
import { calculateGroupPickupCosts } from "@/lib/cost-calculator";
import { toDateKey } from "@/lib/utils";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  inMemoryDb: DatabaseState | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const DATA_FILE_PATH = path.join(process.cwd(), "prisma", "local-db.json");

/**
 * Mengambil state database lokal yang tersimpan di prisma/local-db.json
 * (atau menginisialisasi dari seed data jika belum ada).
 * Apabila PostgreSQL aktif dan dikehendaki, aplikasi juga menyediakan sinkronisasi Prisma penuh.
 */
export function getDbState(): DatabaseState {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as DatabaseState;
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Gagal membaca local-db.json, membuat ulang dari seed data:", err);
  }

  const initial = buildInitialSeedData();
  saveDbState(initial);
  return initial;
}

export function saveDbState(state: DatabaseState): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan local-db.json:", err);
  }
}

export function resetToSeedData(): DatabaseState {
  const initial = buildInitialSeedData();
  saveDbState(initial);
  return initial;
}

/**
 * Mencatat perubahan penting ke ActivityLog: siapa, kapan, dan apa yang berubah.
 */
export function recordActivityLog(
  state: DatabaseState,
  params: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    details?: string;
  }
): ActivityLogEntity {
  const actor = state.users.find((u) => u.id === params.actorId);
  const entry: ActivityLogEntity = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorId: params.actorId,
    actorName: actor?.name || "Sistem",
    actorRole: (actor?.role || "SELLER") as RoleType,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    summary: params.summary,
    details: params.details,
    createdAt: new Date().toISOString(),
  };
  state.activityLogs.unshift(entry);
  return entry;
}

/**
 * Menambahkan notifikasi in-app sekaligus struktur siap-pakai untuk integrasi WhatsApp API di kemudian hari
 */
export function createInAppNotification(
  state: DatabaseState,
  params: {
    userId: string;
    title: string;
    message: string;
    type?: "INFO" | "SUCCESS" | "WARNING";
    link?: string;
  }
): NotificationEntity {
  const notif: NotificationEntity = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: params.type || "INFO",
    link: params.link,
    isRead: false,
    whatsappStatus: "QUEUED_FOR_WA_GATEWAY",
    createdAt: new Date().toISOString(),
  };
  state.notifications.unshift(notif);
  return notif;
}

/**
 * Evaluasi aturan penggabungan pickup secara deterministik untuk satu grup:
 * (clusterId + pickupDate + pickupWindow + courier)
 *
 * Jika jumlah paket >= cluster.minPackages ATAU total berat >= cluster.minTotalWeightGram,
 * maka seluruh draft berstatus QUEUED di grup tersebut otomatis naik menjadi READY_FOR_PICKUP.
 * Sebaliknya jika ada pembatalan sehingga turun di bawah syarat dan belum masuk GroupPickup,
 * maka kembali menjadi QUEUED.
 */
export function evaluateBatchStatusForGroup(
  state: DatabaseState,
  params: {
    clusterId: string;
    pickupDate: string;
    pickupWindow: string;
    courier: string;
  }
): {
  totalPackages: number;
  totalWeightGram: number;
  isThresholdMet: boolean;
  updatedStatus: "QUEUED" | "READY_FOR_PICKUP";
} {
  const cluster = state.clusters.find((c) => c.id === params.clusterId);
  const dateKey = toDateKey(params.pickupDate);

  // Cari semua draft yang belum masuk ke GroupPickup yang aktif
  const assignedDraftIds = new Set(
    state.pickupItems
      .filter((pi) => {
        const gp = state.groupPickups.find((g) => g.id === pi.groupPickupId);
        return gp && gp.status !== "CANCELLED";
      })
      .map((pi) => pi.shipmentDraftId)
  );

  const matchingDrafts = state.shipmentDrafts.filter(
    (d) =>
      d.clusterId === params.clusterId &&
      toDateKey(d.pickupDate) === dateKey &&
      d.pickupWindow === params.pickupWindow &&
      d.courier === params.courier &&
      (d.status === "QUEUED" || d.status === "READY_FOR_PICKUP") &&
      !assignedDraftIds.has(d.id)
  );

  const totalPackages = matchingDrafts.length;
  const totalWeightGram = matchingDrafts.reduce((sum, d) => sum + d.weightGram, 0);

  const minPackages = cluster?.minPackages ?? 10;
  const minWeight = cluster?.minTotalWeightGram ?? 10000;

  const isThresholdMet =
    totalPackages >= minPackages || totalWeightGram >= minWeight;
  const targetStatus = isThresholdMet ? "READY_FOR_PICKUP" : "QUEUED";

  let statusChangedToReady = false;
  matchingDrafts.forEach((d) => {
    if (d.status !== targetStatus) {
      if (targetStatus === "READY_FOR_PICKUP") {
        statusChangedToReady = true;
      }
      d.status = targetStatus;
      d.updatedAt = new Date().toISOString();
    }
  });

  // Kirim notifikasi jika baru saja mencapai syarat minimum
  if (statusChangedToReady && cluster) {
    const uniqueSellers = Array.from(new Set(matchingDrafts.map((d) => d.userId)));
    uniqueSellers.forEach((sellerId) => {
      createInAppNotification(state, {
        userId: sellerId,
        title: "Syarat Minimum Pickup Tercapai!",
        message: `Grup pengiriman ${params.courier} tanggal ${dateKey} (${params.pickupWindow}) di ${cluster.name} telah mencapai ${totalPackages} paket (${(totalWeightGram / 1000).toFixed(2)} kg). Status paket Anda kini SIAP PICKUP!`,
        type: "SUCCESS",
        link: "/pickups/next",
      });
    });

    createInAppNotification(state, {
      userId: cluster.adminId,
      title: "Grup Baru Siap Dijadwalkan Pickup",
      message: `${totalPackages} paket (${(totalWeightGram / 1000).toFixed(2)} kg) kurir ${params.courier} untuk ${dateKey} telah mencapai kuota minimum dan siap dibuatkan jadwal Pickup Bersama.`,
      type: "INFO",
      link: "/cluster-admin",
    });
  }

  return {
    totalPackages,
    totalWeightGram,
    isThresholdMet,
    updatedStatus: targetStatus,
  };
}

/**
 * Mengelompokkan seluruh draft aktif (QUEUED & READY_FOR_PICKUP yang belum punya GroupPickup)
 * dalam sebuah cluster untuk menampilkan progress bar menuju syarat pickup.
 */
export interface ConsolidatedBatchGroup {
  groupKey: string;
  clusterId: string;
  clusterName: string;
  clusterCode: string;
  pickupDate: string;
  pickupWindow: string;
  courier: string;
  totalPackages: number;
  minPackages: number;
  packageProgressPct: number;
  totalWeightGram: number;
  minTotalWeightGram: number;
  weightProgressPct: number;
  isReadyForPickup: boolean;
  basePickupFee: number;
  platformFeePercent: number;
  drafts: Array<
    ShipmentDraftEntity & {
      sellerName: string;
      storeName: string;
    }
  >;
  sellerProjections: Array<{
    sellerId: string;
    sellerName: string;
    storeName: string;
    packageCount: number;
    weightGram: number;
    weightPercentage: number;
    costBeforeFee: number;
    platformFee: number;
    finalTotalCharge: number;
    estimatedSavings: number;
  }>;
}

export function getConsolidatedBatches(
  state: DatabaseState,
  options?: { clusterId?: string; sellerId?: string }
): ConsolidatedBatchGroup[] {
  const assignedDraftIds = new Set(
    state.pickupItems
      .filter((pi) => {
        const gp = state.groupPickups.find((g) => g.id === pi.groupPickupId);
        return gp && gp.status !== "CANCELLED";
      })
      .map((pi) => pi.shipmentDraftId)
  );

  const eligibleDrafts = state.shipmentDrafts.filter((d) => {
    if (d.status !== "QUEUED" && d.status !== "READY_FOR_PICKUP") return false;
    if (assignedDraftIds.has(d.id)) return false;
    if (options?.clusterId && d.clusterId !== options.clusterId) return false;
    return true;
  });

  const groupedMap = new Map<string, ShipmentDraftEntity[]>();
  eligibleDrafts.forEach((d) => {
    const key = `${d.clusterId}__${toDateKey(d.pickupDate)}__${d.pickupWindow}__${d.courier}`;
    const list = groupedMap.get(key) || [];
    list.push(d);
    groupedMap.set(key, list);
  });

  const results: ConsolidatedBatchGroup[] = [];

  groupedMap.forEach((drafts, groupKey) => {
    // Jika difilter berdasarkan sellerId, pastikan grup ini memiliki setidaknya 1 draft milik seller tsb
    // atau berada di cluster tempat seller tersebut bergabung
    const first = drafts[0];
    const cluster = state.clusters.find((c) => c.id === first.clusterId);
    if (!cluster) return;

    const totalPackages = drafts.length;
    const totalWeightGram = drafts.reduce((s, d) => s + d.weightGram, 0);

    const packageProgressPct = Math.min(
      100,
      Math.round((totalPackages / cluster.minPackages) * 100)
    );
    const weightProgressPct = Math.min(
      100,
      Math.round((totalWeightGram / cluster.minTotalWeightGram) * 100)
    );
    const isReadyForPickup =
      totalPackages >= cluster.minPackages ||
      totalWeightGram >= cluster.minTotalWeightGram;

    // Hitung proyeksi pembagian biaya menggunakan rumus transparan
    const sellerMap = new Map<
      string,
      {
        sellerId: string;
        sellerName: string;
        storeName: string;
        weightGram: number;
        packageCount: number;
        draftIds: string[];
      }
    >();

    const enrichedDrafts = drafts.map((d) => {
      const seller = state.users.find((u) => u.id === d.userId);
      const sellerName = seller?.name || "Penjual";
      const storeName = seller?.storeName || "Toko UMKM";

      const existing = sellerMap.get(d.userId);
      if (existing) {
        existing.weightGram += d.weightGram;
        existing.packageCount += 1;
        existing.draftIds.push(d.id);
      } else {
        sellerMap.set(d.userId, {
          sellerId: d.userId,
          sellerName,
          storeName,
          weightGram: d.weightGram,
          packageCount: 1,
          draftIds: [d.id],
        });
      }

      return {
        ...d,
        sellerName,
        storeName,
      };
    });

    const costResult = calculateGroupPickupCosts({
      basePickupFee: cluster.basePickupFee,
      platformFeePercent: cluster.platformFeePercent,
      sellers: Array.from(sellerMap.values()),
      soloPickupReferenceFee: cluster.basePickupFee,
    });

    results.push({
      groupKey,
      clusterId: cluster.id,
      clusterName: cluster.name,
      clusterCode: cluster.code,
      pickupDate: toDateKey(first.pickupDate),
      pickupWindow: first.pickupWindow,
      courier: first.courier,
      totalPackages,
      minPackages: cluster.minPackages,
      packageProgressPct,
      totalWeightGram,
      minTotalWeightGram: cluster.minTotalWeightGram,
      weightProgressPct,
      isReadyForPickup,
      basePickupFee: cluster.basePickupFee,
      platformFeePercent: cluster.platformFeePercent,
      drafts: enrichedDrafts,
      sellerProjections: costResult.allocations.map((a) => ({
        sellerId: a.sellerId,
        sellerName: a.sellerName,
        storeName: a.storeName || "Toko UMKM",
        packageCount: a.packageCount,
        weightGram: a.weightGram,
        weightPercentage: a.weightPercentage,
        costBeforeFee: a.costBeforeFee,
        platformFee: a.platformFee,
        finalTotalCharge: a.finalTotalCharge,
        estimatedSavings: a.estimatedSavings,
      })),
    });
  });

  // Urutkan yang sudah READY_FOR_PICKUP di paling atas, lalu berdasarkan tanggal
  return results.sort((a, b) => {
    if (a.isReadyForPickup !== b.isReadyForPickup) {
      return a.isReadyForPickup ? -1 : 1;
    }
    return a.pickupDate.localeCompare(b.pickupDate);
  });
}

