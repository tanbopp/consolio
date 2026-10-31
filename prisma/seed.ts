import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { buildInitialSeedData } from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai proses seeding data Consolio...");
  const seedData = buildInitialSeedData();

  // 1. Simpan ke local-db.json agar langsung dapat digunakan meskipun PostgreSQL belum menyala
  const localDbPath = path.join(process.cwd(), "prisma", "local-db.json");
  fs.writeFileSync(localDbPath, JSON.stringify(seedData, null, 2), "utf-8");
  console.log(
    `✅ Berhasil menyimpan data seed ke ${localDbPath}:`
  );
  console.log(`   - ${seedData.users.length} Pengguna (1 Admin Aplikasi, 2 Admin Cluster, 10 Penjual)`);
  console.log(`   - ${seedData.clusters.length} Cluster (GRIYA01 & KAMPUS02)`);
  console.log(`   - ${seedData.shipmentDrafts.length} Draft Pengiriman`);
  console.log(`   - ${seedData.groupPickups.length} Pickup Bersama Selesai + Rincian Biaya`);

  // 2. Coba seed ke PostgreSQL melalui Prisma jika server PostgreSQL aktif
  try {
    await prisma.$connect();
    console.log("🐘 Terhubung ke PostgreSQL! Menyinkronkan data ke database PostgreSQL...");

    await prisma.paymentRecord.deleteMany();
    await prisma.pickupItem.deleteMany();
    await prisma.groupPickup.deleteMany();
    await prisma.shipmentDraft.deleteMany();
    await prisma.clusterMember.deleteMany();
    await prisma.cluster.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.platformConfig.deleteMany();
    await prisma.user.deleteMany();

    for (const u of seedData.users) {
      await prisma.user.create({
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          phone: u.phone,
          role: u.role,
          storeName: u.storeName,
          businessType: u.businessType,
          address: u.address,
          createdAt: new Date(u.createdAt),
        },
      });
    }

    for (const c of seedData.clusters) {
      await prisma.cluster.create({
        data: {
          id: c.id,
          name: c.name,
          code: c.code,
          description: c.description,
          centerAddress: c.centerAddress,
          radiusKm: c.radiusKm,
          pickupDays: c.pickupDays,
          pickupTimeWindows: c.pickupTimeWindows,
          minPackages: c.minPackages,
          minTotalWeightGram: c.minTotalWeightGram,
          basePickupFee: c.basePickupFee,
          platformFeePercent: c.platformFeePercent,
          adminId: c.adminId,
          createdAt: new Date(c.createdAt),
        },
      });
    }

    for (const cm of seedData.clusterMembers) {
      await prisma.clusterMember.create({
        data: {
          id: cm.id,
          clusterId: cm.clusterId,
          userId: cm.userId,
          status: cm.status,
          joinedAt: new Date(cm.joinedAt),
        },
      });
    }

    for (const d of seedData.shipmentDrafts) {
      await prisma.shipmentDraft.create({
        data: {
          id: d.id,
          userId: d.userId,
          clusterId: d.clusterId,
          recipientName: d.recipientName,
          recipientPhone: d.recipientPhone,
          destinationAddress: d.destinationAddress,
          city: d.city,
          province: d.province,
          postalCode: d.postalCode,
          weightGram: d.weightGram,
          lengthCm: d.lengthCm,
          widthCm: d.widthCm,
          heightCm: d.heightCm,
          itemValue: d.itemValue,
          notes: d.notes,
          courier: d.courier,
          pickupDate: new Date(d.pickupDate),
          pickupWindow: d.pickupWindow,
          status: d.status,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        },
      });
    }

    for (const gp of seedData.groupPickups) {
      await prisma.groupPickup.create({
        data: {
          id: gp.id,
          code: gp.code,
          clusterId: gp.clusterId,
          courier: gp.courier,
          pickupDate: new Date(gp.pickupDate),
          pickupWindow: gp.pickupWindow,
          pickupTime: gp.pickupTime,
          totalPackages: gp.totalPackages,
          totalWeightGram: gp.totalWeightGram,
          basePickupFee: gp.basePickupFee,
          platformFeePercent: gp.platformFeePercent,
          totalCost: gp.totalCost,
          roundingDiff: gp.roundingDiff,
          forcedBelowMin: gp.forcedBelowMin,
          costLocked: gp.costLocked,
          status: gp.status,
          createdAt: new Date(gp.createdAt),
          completedAt: gp.completedAt ? new Date(gp.completedAt) : null,
        },
      });
    }

    for (const pi of seedData.pickupItems) {
      await prisma.pickupItem.create({
        data: {
          id: pi.id,
          groupPickupId: pi.groupPickupId,
          shipmentDraftId: pi.shipmentDraftId,
          sellerId: pi.sellerId,
          weightGram: pi.weightGram,
          costShare: pi.costShare,
          platformFee: pi.platformFee,
          totalCharge: pi.totalCharge,
        },
      });
    }

    for (const pay of seedData.paymentRecords) {
      await prisma.paymentRecord.create({
        data: {
          id: pay.id,
          groupPickupId: pay.groupPickupId,
          sellerId: pay.sellerId,
          totalWeightGram: pay.totalWeightGram,
          weightPercent: pay.weightPercent,
          costShare: pay.costShare,
          platformFee: pay.platformFee,
          roundingAdjust: pay.roundingAdjust,
          amount: pay.amount,
          status: pay.status,
          paidAt: pay.paidAt ? new Date(pay.paidAt) : null,
          createdAt: new Date(pay.createdAt),
        },
      });
    }

    await prisma.platformConfig.create({
      data: {
        id: "default",
        defaultBasePickupFee: seedData.platformConfig.defaultBasePickupFee,
        defaultPlatformFeePct: seedData.platformConfig.defaultPlatformFeePct,
        defaultMinPackages: seedData.platformConfig.defaultMinPackages,
        defaultMinWeightGram: seedData.platformConfig.defaultMinWeightGram,
        soloPickupEstimateRp: seedData.platformConfig.soloPickupEstimateRp,
      },
    });

    console.log("✅ Seeding ke PostgreSQL selesai dengan sukses!");
  } catch {
    console.log(
      "ℹ️ Server PostgreSQL tidak terdeteksi di localhost:5432. Aplikasi akan otomatis berjalan menggunakan database lokal (prisma/local-db.json) yang telah diisi penuh dengan seed data."
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

