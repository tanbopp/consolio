import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getDbState,
  saveDbState,
  getConsolidatedBatches,
  evaluateBatchStatusForGroup,
  recordActivityLog,
  createInAppNotification,
} from "@/lib/db";
import { calculateGroupPickupCosts } from "@/lib/cost-calculator";
import { toDateKey } from "@/lib/utils";
import { CourierType, PickupWindowType } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idOrCode = searchParams.get("id") || "";
    const clusterId = searchParams.get("clusterId") || "";
    const courier = searchParams.get("courier") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const state = getDbState();
    const authUser = await getCurrentUser();

    // Helper untuk memperkaya objek GroupPickup dengan detail penjual, paket, dan rincian biaya
    const enrichGroupPickup = (gp: (typeof state.groupPickups)[number]) => {
      const cluster = state.clusters.find((c) => c.id === gp.clusterId);
      const admin = cluster
        ? state.users.find((u) => u.id === cluster.adminId)
        : null;

      const items = state.pickupItems
        .filter((pi) => pi.groupPickupId === gp.id)
        .map((pi) => {
          const draft = state.shipmentDrafts.find(
            (d) => d.id === pi.shipmentDraftId
          );
          const seller = state.users.find((u) => u.id === pi.sellerId);
          return {
            ...pi,
            sellerName: seller?.name || "Penjual",
            storeName: seller?.storeName || "Toko UMKM",
            sellerPhone: seller?.phone || "",
            recipientName: draft?.recipientName || "-",
            recipientPhone: draft?.recipientPhone || "-",
            destinationAddress: draft?.destinationAddress || "-",
            city: draft?.city || "-",
            province: draft?.province || "-",
            notes: draft?.notes || "",
            draftStatus: draft?.status || "PICKED_UP",
          };
        });

      const payments = state.paymentRecords
        .filter((pay) => pay.groupPickupId === gp.id)
        .map((pay) => {
          const seller = state.users.find((u) => u.id === pay.sellerId);
          const sellerPackages = items.filter(
            (i) => i.sellerId === pay.sellerId
          );
          const soloFee = cluster?.basePickupFee || gp.basePickupFee;
          const savings = Math.max(0, soloFee - pay.amount);

          return {
            ...pay,
            sellerName: seller?.name || "Penjual",
            storeName: seller?.storeName || "Toko UMKM",
            sellerPhone: seller?.phone || "",
            packageCount: sellerPackages.length,
            soloCostEstimate: soloFee,
            estimatedSavings: savings,
          };
        });

      return {
        ...gp,
        clusterName: cluster?.name || "Cluster",
        clusterCode: cluster?.code || "-",
        centerAddress: cluster?.centerAddress || "-",
        adminName: admin?.name || "Admin Cluster",
        items,
        payments,
      };
    };

    // Jika meminta detail 1 pickup bersama (mendukung akses publik melalui link share!)
    if (idOrCode) {
      const target = state.groupPickups.find(
        (g) =>
          g.id === idOrCode ||
          g.code.toUpperCase() === idOrCode.trim().toUpperCase()
      );
      if (!target) {
        return NextResponse.json(
          { error: "Pickup Bersama tidak ditemukan" },
          { status: 404 }
        );
      }

      const logs = state.activityLogs
        .filter((l) => l.entityId === target.id || l.summary.includes(target.code))
        .slice(0, 15);

      return NextResponse.json({
        pickup: enrichGroupPickup(target),
        logs,
      });
    }

    // Filter daftar GroupPickup
    let pickups = state.groupPickups.slice();
    if (clusterId) {
      pickups = pickups.filter((g) => g.clusterId === clusterId);
    }
    if (courier) {
      pickups = pickups.filter((g) => g.courier === courier);
    }
    if (status) {
      pickups = pickups.filter((g) => g.status === status);
    }
    if (dateFrom) {
      pickups = pickups.filter((g) => toDateKey(g.pickupDate) >= dateFrom);
    }
    if (dateTo) {
      pickups = pickups.filter((g) => toDateKey(g.pickupDate) <= dateTo);
    }

    const enrichedPickups = pickups
      .map(enrichGroupPickup)
      .sort((a, b) => b.pickupDate.localeCompare(a.pickupDate));

    // Ambil juga batch penggabungan yang sedang berjalan (belum dibuatkan GroupPickup)
    const consolidatedBatches = getConsolidatedBatches(state, {
      clusterId: clusterId || undefined,
      sellerId: authUser?.role === "SELLER" ? authUser.id : undefined,
    });

    return NextResponse.json({
      pickups: enrichedPickups,
      consolidatedBatches,
    });
  } catch (error) {
    console.error("GET /api/pickups error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pickup bersama" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      clusterId,
      pickupDate,
      pickupWindow,
      courier,
      pickupTime = "16:00",
      forceBelowMinimum = false,
    } = body;

    const state = getDbState();
    const cluster = state.clusters.find((c) => c.id === clusterId);

    if (!cluster) {
      return NextResponse.json(
        { error: "Cluster tidak ditemukan" },
        { status: 404 }
      );
    }

    // Server-side role & ownership check: Hanya Admin Cluster tersebut atau Admin Aplikasi
    if (
      authUser.role !== "PLATFORM_ADMIN" &&
      cluster.adminId !== authUser.id
    ) {
      return NextResponse.json(
        {
          error:
            "Hanya Admin Cluster atau Admin Aplikasi yang dapat membuat jadwal Pickup Bersama.",
        },
        { status: 403 }
      );
    }

    const dateKey = toDateKey(pickupDate);

    // Cari draft yang sesuai (Cluster + Tanggal + Jendela Waktu + Kurir sama) dan belum tergabung ke pickup aktif lain
    const assignedDraftIds = new Set(
      state.pickupItems
        .filter((pi) => {
          const gp = state.groupPickups.find((g) => g.id === pi.groupPickupId);
          return gp && gp.status !== "CANCELLED";
        })
        .map((pi) => pi.shipmentDraftId)
    );

    const eligibleDrafts = state.shipmentDrafts.filter(
      (d) =>
        d.clusterId === clusterId &&
        toDateKey(d.pickupDate) === dateKey &&
        d.pickupWindow === pickupWindow &&
        d.courier === courier &&
        (d.status === "QUEUED" || d.status === "READY_FOR_PICKUP") &&
        !assignedDraftIds.has(d.id)
    );

    if (eligibleDrafts.length === 0) {
      return NextResponse.json(
        {
          error:
            "Tidak ada draft pengiriman aktif untuk kombinasi tanggal, waktu, dan kurir ini.",
        },
        { status: 400 }
      );
    }

    const totalPackages = eligibleDrafts.length;
    const totalWeightGram = eligibleDrafts.reduce(
      (sum, d) => sum + d.weightGram,
      0
    );

    const isMinimumMet =
      totalPackages >= cluster.minPackages ||
      totalWeightGram >= cluster.minTotalWeightGram;

    if (!isMinimumMet && !forceBelowMinimum) {
      return NextResponse.json(
        {
          error: `Syarat minimum belum tercapai (${totalPackages}/${cluster.minPackages} paket atau ${(
            totalWeightGram / 1000
          ).toFixed(2)}/${(cluster.minTotalWeightGram / 1000).toFixed(
            2
          )} kg). Aktifkan opsi "Paksa Buat Pickup Bersama" jika tetap ingin menjadwalkan.`,
          requiresForceConfirmation: true,
        },
        { status: 400 }
      );
    }

    // Kelompokkan per penjual untuk menghitung rincian pembagian biaya secara deterministik
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

    eligibleDrafts.forEach((d) => {
      const seller = state.users.find((u) => u.id === d.userId);
      const existing = sellerMap.get(d.userId);
      if (existing) {
        existing.weightGram += d.weightGram;
        existing.packageCount += 1;
        existing.draftIds.push(d.id);
      } else {
        sellerMap.set(d.userId, {
          sellerId: d.userId,
          sellerName: seller?.name || "Penjual",
          storeName: seller?.storeName || "Toko UMKM",
          weightGram: d.weightGram,
          packageCount: 1,
          draftIds: [d.id],
        });
      }
    });

    const costResult = calculateGroupPickupCosts({
      basePickupFee: cluster.basePickupFee,
      platformFeePercent: cluster.platformFeePercent,
      sellers: Array.from(sellerMap.values()),
      soloPickupReferenceFee: cluster.basePickupFee,
    });

    const nextSeq = 101 + state.groupPickups.length;
    const code = `CSL-PCK-${String(nextSeq).padStart(6, "0")}`;
    const newPickupId = `gp-${Date.now()}`;

    const newGroupPickup = {
      id: newPickupId,
      code,
      clusterId: cluster.id,
      courier: courier as CourierType,
      pickupDate: dateKey,
      pickupWindow: pickupWindow as PickupWindowType,
      pickupTime,
      totalPackages: costResult.totalPackages,
      totalWeightGram: costResult.totalWeightGram,
      basePickupFee: cluster.basePickupFee,
      platformFeePercent: cluster.platformFeePercent,
      totalCost: costResult.exactTotalCeiling,
      roundingDiff: costResult.roundingDiscrepancy,
      forcedBelowMin: !isMinimumMet,
      costLocked: false,
      status: "SCHEDULED" as const,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    state.groupPickups.push(newGroupPickup);

    // Buat PickupItem per draft & PaymentRecord per penjual
    costResult.allocations.forEach((alloc) => {
      const sellerDrafts = eligibleDrafts.filter(
        (d) => d.userId === alloc.sellerId
      );

      sellerDrafts.forEach((d, idx) => {
        // Proporsi ke level draft untuk PickupItem
        const draftRatio = d.weightGram / alloc.weightGram;
        const itemCostShare =
          idx === sellerDrafts.length - 1
            ? alloc.costBeforeFee -
              sellerDrafts
                .slice(0, -1)
                .reduce(
                  (s, prev) =>
                    s + Math.round((prev.weightGram / alloc.weightGram) * alloc.costBeforeFee),
                  0
                )
            : Math.round(draftRatio * alloc.costBeforeFee);

        const itemTotalCharge =
          idx === sellerDrafts.length - 1
            ? alloc.finalTotalCharge -
              sellerDrafts
                .slice(0, -1)
                .reduce(
                  (s, prev) =>
                    s +
                    Math.round(
                      (prev.weightGram / alloc.weightGram) * alloc.finalTotalCharge
                    ),
                  0
                )
            : Math.round(draftRatio * alloc.finalTotalCharge);

        state.pickupItems.push({
          id: `pi-${newPickupId}-${d.id}`,
          groupPickupId: newPickupId,
          shipmentDraftId: d.id,
          sellerId: alloc.sellerId,
          weightGram: d.weightGram,
          costShare: itemCostShare,
          platformFee: itemTotalCharge - itemCostShare,
          totalCharge: itemTotalCharge,
        });

        // Pastikan seluruh draft di dalam pickup bersama berstatus READY_FOR_PICKUP
        d.status = "READY_FOR_PICKUP";
        d.updatedAt = new Date().toISOString();
      });

      state.paymentRecords.push({
        id: `pay-${newPickupId}-${alloc.sellerId}`,
        groupPickupId: newPickupId,
        sellerId: alloc.sellerId,
        totalWeightGram: alloc.weightGram,
        weightPercent: alloc.weightPercentage,
        costShare: alloc.costBeforeFee,
        platformFee: alloc.platformFee,
        roundingAdjust: alloc.roundingAdjustment,
        amount: alloc.finalTotalCharge,
        status: "UNPAID",
        paidAt: null,
        createdAt: new Date().toISOString(),
      });

      createInAppNotification(state, {
        userId: alloc.sellerId,
        title: `Pickup Bersama ${code} Terjadwal!`,
        message: `Admin Cluster telah menjadwalkan Pickup Bersama ${courier} pada ${dateKey} pukul ${pickupTime} WIB. Estimasi tagihan Anda: Rp${alloc.finalTotalCharge.toLocaleString(
          "id-ID"
        )} untuk ${alloc.packageCount} paket (${(
          alloc.weightGram / 1000
        ).toFixed(2)} kg).`,
        type: "INFO",
        link: `/pickups/${newPickupId}`,
      });
    });

    recordActivityLog(state, {
      actorId: authUser.id,
      action: "CREATE_GROUP_PICKUP",
      entityType: "GroupPickup",
      entityId: newPickupId,
      summary: `${authUser.name} membuat jadwal Pickup Bersama ${code} (${courier} - ${totalPackages} paket / ${(
        totalWeightGram / 1000
      ).toFixed(2)} kg) pukul ${pickupTime} WIB`,
      details: !isMinimumMet
        ? "Dibuat secara paksa sebelum syarat minimum tercapai (biaya per penjual lebih tinggi)."
        : "Memenuhi syarat kuota minimum cluster.",
    });

    saveDbState(state);

    return NextResponse.json(
      {
        message: `Pickup Bersama ${code} berhasil dijadwalkan untuk pukul ${pickupTime} WIB!`,
        pickup: newGroupPickup,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/pickups error:", error);
    return NextResponse.json(
      { error: "Gagal membuat jadwal Pickup Bersama" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pickupId, action } = body;

    const state = getDbState();
    const gp = state.groupPickups.find((g) => g.id === pickupId);

    if (!gp) {
      return NextResponse.json(
        { error: "Pickup Bersama tidak ditemukan" },
        { status: 404 }
      );
    }

    const cluster = state.clusters.find((c) => c.id === gp.clusterId);
    const isAdminForCluster =
      authUser.role === "PLATFORM_ADMIN" ||
      (cluster && cluster.adminId === authUser.id);

    // Action 1: Ubah status pembayaran (oleh penjual yang membayar atau konfirmasi admin)
    if (action === "MARK_PAYMENT_PAID") {
      const { paymentId } = body;
      const payRecord = state.paymentRecords.find((p) => p.id === paymentId);
      if (!payRecord) {
        return NextResponse.json(
          { error: "Data tagihan tidak ditemukan" },
          { status: 404 }
        );
      }
      if (!isAdminForCluster && payRecord.sellerId !== authUser.id) {
        return NextResponse.json(
          { error: "Anda tidak berhak mengubah status pembayaran ini" },
          { status: 403 }
        );
      }

      payRecord.status = "PAID";
      payRecord.paidAt = new Date().toISOString();

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "PAY_PICKUP_SHARE",
        entityType: "GroupPickup",
        entityId: gp.id,
        summary: `Tagihan patungan pickup ${gp.code} sebesar Rp${payRecord.amount.toLocaleString(
          "id-ID"
        )} telah dilunasi`,
      });

      saveDbState(state);
      return NextResponse.json({
        message: "Status pembayaran berhasil ditandai LUNAS!",
      });
    }

    if (!isAdminForCluster) {
      return NextResponse.json(
        {
          error:
            "Hanya Admin Cluster atau Admin Aplikasi yang dapat mengelola jadwal Pickup Bersama.",
        },
        { status: 403 }
      );
    }

    // Aturan Bisnis 7: Setelah pickup dikonfirmasi selesai, data pembagian biaya dikunci. Admin cluster tidak boleh mengubah biaya setelah pickup selesai.
    if (action === "UPDATE_PICKUP_SCHEDULE") {
      if (gp.status === "COMPLETED" || gp.costLocked) {
        return NextResponse.json(
          {
            error:
              "Pickup Bersama sudah selesai dan data pembagian biaya telah DIKUNCI. Admin Cluster tidak dapat mengubah biaya atau jadwal setelah pickup selesai.",
          },
          { status: 400 }
        );
      }

      const { pickupTime, basePickupFee } = body;
      if (pickupTime) {
        gp.pickupTime = pickupTime;
      }

      if (typeof basePickupFee === "number" && basePickupFee >= 5000) {
        gp.basePickupFee = basePickupFee;
        // Hitung ulang pembagian biaya karena belum selesai / belum dikunci
        const items = state.pickupItems.filter((pi) => pi.groupPickupId === gp.id);
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

        items.forEach((pi) => {
          const seller = state.users.find((u) => u.id === pi.sellerId);
          const cur = sellerMap.get(pi.sellerId);
          if (cur) {
            cur.weightGram += pi.weightGram;
            cur.packageCount += 1;
            cur.draftIds.push(pi.shipmentDraftId);
          } else {
            sellerMap.set(pi.sellerId, {
              sellerId: pi.sellerId,
              sellerName: seller?.name || "Penjual",
              storeName: seller?.storeName || "",
              weightGram: pi.weightGram,
              packageCount: 1,
              draftIds: [pi.shipmentDraftId],
            });
          }
        });

        const recalc = calculateGroupPickupCosts({
          basePickupFee: gp.basePickupFee,
          platformFeePercent: gp.platformFeePercent,
          sellers: Array.from(sellerMap.values()),
        });

        gp.totalCost = recalc.exactTotalCeiling;
        gp.roundingDiff = recalc.roundingDiscrepancy;

        recalc.allocations.forEach((alloc) => {
          const pay = state.paymentRecords.find(
            (p) => p.groupPickupId === gp.id && p.sellerId === alloc.sellerId
          );
          if (pay) {
            pay.costShare = alloc.costBeforeFee;
            pay.platformFee = alloc.platformFee;
            pay.roundingAdjust = alloc.roundingAdjustment;
            pay.amount = alloc.finalTotalCharge;
          }
        });
      }

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "UPDATE_GROUP_PICKUP",
        entityType: "GroupPickup",
        entityId: gp.id,
        summary: `${authUser.name} memperbarui jadwal Pickup Bersama ${gp.code} (Jam: ${gp.pickupTime})`,
      });

      saveDbState(state);
      return NextResponse.json({
        message: "Jadwal Pickup Bersama berhasil diperbarui.",
        pickup: gp,
      });
    }

    // Action 2: Tandai kurir sedang menjemput (IN_PROGRESS)
    if (action === "START_PICKUP") {
      if (gp.status !== "SCHEDULED") {
        return NextResponse.json(
          { error: "Hanya pickup berstatus TERJADWAL yang dapat dimulai." },
          { status: 400 }
        );
      }

      gp.status = "IN_PROGRESS";
      const draftIds = new Set(
        state.pickupItems
          .filter((pi) => pi.groupPickupId === gp.id)
          .map((pi) => pi.shipmentDraftId)
      );

      state.shipmentDrafts.forEach((d) => {
        if (draftIds.has(d.id)) {
          d.status = "PICKED_UP";
          d.updatedAt = new Date().toISOString();
        }
      });

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "START_GROUP_PICKUP",
        entityType: "GroupPickup",
        entityId: gp.id,
        summary: `${authUser.name} menandai kurir sedang menjemput paket untuk ${gp.code}`,
      });

      saveDbState(state);
      return NextResponse.json({
        message: `Status ${gp.code} berubah menjadi SEDANG DIJEMPUT dan paket ditandai PICKED_UP.`,
      });
    }

    // Action 3: Konfirmasi bahwa kurir telah melakukan pickup (COMPLETED) -> kunci pembagian biaya otomatis!
    if (action === "COMPLETE_PICKUP") {
      if (gp.status === "COMPLETED") {
        return NextResponse.json(
          { error: "Pickup Bersama ini sudah selesai." },
          { status: 400 }
        );
      }
      if (gp.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Pickup yang sudah dibatalkan tidak dapat diselesaikan." },
          { status: 400 }
        );
      }

      gp.status = "COMPLETED";
      gp.costLocked = true;
      gp.completedAt = new Date().toISOString();

      const items = state.pickupItems.filter((pi) => pi.groupPickupId === gp.id);
      const draftIds = new Set(items.map((pi) => pi.shipmentDraftId));

      state.shipmentDrafts.forEach((d) => {
        if (draftIds.has(d.id)) {
          d.status = "PICKED_UP";
          d.updatedAt = new Date().toISOString();
        }
      });

      // Kirim notifikasi rincian tagihan final ke setiap penjual
      const payments = state.paymentRecords.filter(
        (p) => p.groupPickupId === gp.id
      );

      payments.forEach((pay) => {
        createInAppNotification(state, {
          userId: pay.sellerId,
          title: `Pickup ${gp.code} Selesai — Rincian Biaya Terbit`,
          message: `Kurir ${gp.courier} telah menjemput seluruh paket (${(
            gp.totalWeightGram / 1000
          ).toFixed(2)} kg). Porsi berat Anda: ${(
            pay.totalWeightGram / 1000
          ).toFixed(2)} kg (${pay.weightPercent}%). Total tagihan Anda (termasuk fee platform): Rp${pay.amount.toLocaleString(
            "id-ID"
          )}. Data biaya kini telah dikunci.`,
          type: "SUCCESS",
          link: `/pickups/${gp.id}`,
        });
      });

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "COMPLETE_GROUP_PICKUP",
        entityType: "GroupPickup",
        entityId: gp.id,
        summary: `${authUser.name} mengonfirmasi Pickup Bersama ${gp.code} SELESAI. Pembagian biaya ke ${payments.length} penjual resmi DIKUNCI.`,
        details: `Total Berat: ${gp.totalWeightGram}g, Total Biaya + Fee: Rp${gp.totalCost.toLocaleString(
          "id-ID"
        )}, Selisih Pembulatan: Rp${gp.roundingDiff}`,
      });

      saveDbState(state);

      return NextResponse.json({
        message: `Pickup Bersama ${gp.code} telah dikonfirmasi SELESAI! Pembagian biaya otomatis telah dihitung dan dikunci.`,
        pickup: gp,
      });
    }

    // Action 4: Batalkan jadwal pickup bersama (sebelum selesai)
    if (action === "CANCEL_PICKUP") {
      if (gp.status === "COMPLETED" || gp.costLocked) {
        return NextResponse.json(
          {
            error:
              "Pickup Bersama yang sudah dikonfirmasi selesai tidak dapat dibatalkan.",
          },
          { status: 400 }
        );
      }

      gp.status = "CANCELLED";

      // Kembalikan draft ke antrean dan evaluasi ulang status grupnya
      const items = state.pickupItems.filter((pi) => pi.groupPickupId === gp.id);
      const draftIds = new Set(items.map((pi) => pi.shipmentDraftId));

      state.shipmentDrafts.forEach((d) => {
        if (draftIds.has(d.id)) {
          d.status = "QUEUED";
          d.updatedAt = new Date().toISOString();
        }
      });

      // Hapus PickupItem dan PaymentRecord dari pickup yang dibatalkan agar draft bisa dijadwalkan ulang
      state.pickupItems = state.pickupItems.filter(
        (pi) => pi.groupPickupId !== gp.id
      );
      state.paymentRecords = state.paymentRecords.filter(
        (pay) => pay.groupPickupId !== gp.id
      );

      evaluateBatchStatusForGroup(state, {
        clusterId: gp.clusterId,
        pickupDate: gp.pickupDate,
        pickupWindow: gp.pickupWindow,
        courier: gp.courier,
      });

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "CANCEL_GROUP_PICKUP",
        entityType: "GroupPickup",
        entityId: gp.id,
        summary: `${authUser.name} membatalkan jadwal Pickup Bersama ${gp.code}. Seluruh draft dikembalikan ke antrean.`,
      });

      saveDbState(state);

      return NextResponse.json({
        message: `Jadwal Pickup Bersama ${gp.code} telah dibatalkan dan paket dikembalikan ke antrean.`,
      });
    }

    return NextResponse.json(
      { error: "Action tidak dikenali" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/pickups error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status Pickup Bersama" },
      { status: 500 }
    );
  }
}

