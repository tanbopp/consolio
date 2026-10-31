import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDbState, getConsolidatedBatches } from "@/lib/db";
import { toDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = getDbState();

    // Membership penjual
    const activeMembership = state.clusterMembers.find(
      (m) => m.userId === authUser.id && m.status === "ACTIVE"
    );
    const activeCluster = activeMembership
      ? state.clusters.find((c) => c.id === activeMembership.clusterId) || null
      : null;

    // 1. Statistik Dashboard Penjual (4.7)
    const myDrafts = state.shipmentDrafts.filter(
      (d) => d.userId === authUser.id
    );

    const activeDraftsCount = myDrafts.filter(
      (d) =>
        d.status === "DRAFT" ||
        d.status === "QUEUED" ||
        d.status === "READY_FOR_PICKUP"
    ).length;

    const batchesInMyCluster = activeCluster
      ? getConsolidatedBatches(state, { clusterId: activeCluster.id })
      : [];

    // Paket milik penjual ini di batch berikutnya (yang belum selesai)
    let packagesInNextPickup = 0;
    let estimatedNextCost = 0;

    batchesInMyCluster.forEach((b) => {
      const myProj = b.sellerProjections.find(
        (p) => p.sellerId === authUser.id
      );
      if (myProj) {
        packagesInNextPickup += myProj.packageCount;
        estimatedNextCost += myProj.finalTotalCharge;
      }
    });

    // Tambahkan juga jika ada GroupPickup yang berstatus SCHEDULED / IN_PROGRESS milik penjual ini
    const myPayments = state.paymentRecords.filter(
      (p) => p.sellerId === authUser.id
    );

    myPayments.forEach((pay) => {
      const gp = state.groupPickups.find((g) => g.id === pay.groupPickupId);
      if (gp && (gp.status === "SCHEDULED" || gp.status === "IN_PROGRESS")) {
        const myItems = state.pickupItems.filter(
          (pi) => pi.groupPickupId === gp.id && pi.sellerId === authUser.id
        );
        packagesInNextPickup += myItems.length;
        estimatedNextCost += pay.amount;
      }
    });

    const shippedDrafts = myDrafts.filter(
      (d) =>
        d.status === "PICKED_UP" ||
        d.status === "SHIPPED" ||
        d.status === "DELIVERED"
    );

    const totalPackagesShipped = shippedDrafts.length;
    const totalWeightShippedGram = shippedDrafts.reduce(
      (sum, d) => sum + d.weightGram,
      0
    );

    // Estimasi penghematan dibanding mengirim sendiri-sendiri
    // Setiap kali ikut GroupPickup COMPLETED, penjual menghemat (soloPickupFee - tagihanKonsolidasi)
    let totalSavingsRp = 0;
    let totalPaidRp = 0;

    myPayments.forEach((pay) => {
      const gp = state.groupPickups.find((g) => g.id === pay.groupPickupId);
      if (gp && gp.status === "COMPLETED") {
        const soloFee = gp.basePickupFee;
        const saved = Math.max(0, soloFee - pay.amount);
        totalSavingsRp += saved;
        totalPaidRp += pay.amount;
      }
    });

    // Tambahkan juga estimasi penghematan dari batch yang sudah READY_FOR_PICKUP
    let projectedSavingsNextPickupRp = 0;
    batchesInMyCluster.forEach((b) => {
      const myProj = b.sellerProjections.find(
        (p) => p.sellerId === authUser.id
      );
      if (myProj) {
        projectedSavingsNextPickupRp += myProj.estimatedSavings;
      }
    });

    // Riwayat pickup yang diikuti penjual ini
    const myPickupHistory = state.groupPickups
      .filter((gp) =>
        state.paymentRecords.some(
          (p) => p.groupPickupId === gp.id && p.sellerId === authUser.id
        )
      )
      .map((gp) => {
        const myPay = state.paymentRecords.find(
          (p) => p.groupPickupId === gp.id && p.sellerId === authUser.id
        )!;
        const myItems = state.pickupItems.filter(
          (pi) => pi.groupPickupId === gp.id && pi.sellerId === authUser.id
        );
        const cluster = state.clusters.find((c) => c.id === gp.clusterId);
        return {
          ...gp,
          clusterName: cluster?.name || "-",
          myPackageCount: myItems.length,
          myWeightGram: myPay.totalWeightGram,
          myWeightPercent: myPay.weightPercent,
          myCostShare: myPay.costShare,
          myPlatformFee: myPay.platformFee,
          myTotalAmount: myPay.amount,
          myPaymentStatus: myPay.status,
          mySavings: Math.max(0, gp.basePickupFee - myPay.amount),
        };
      })
      .sort((a, b) => b.pickupDate.localeCompare(a.pickupDate));

    // 2. Statistik Dashboard Admin Cluster (4.8)
    const managedClusters =
      authUser.role === "PLATFORM_ADMIN"
        ? state.clusters
        : state.clusters.filter((c) => c.adminId === authUser.id);

    const managedClusterIds = new Set(managedClusters.map((c) => c.id));

    const clusterActiveSellers = state.clusterMembers.filter(
      (m) => managedClusterIds.has(m.clusterId) && m.status === "ACTIVE"
    ).length;

    const pendingRequests = state.clusterMembers
      .filter(
        (m) => managedClusterIds.has(m.clusterId) && m.status === "PENDING"
      )
      .map((m) => {
        const usr = state.users.find((u) => u.id === m.userId);
        const cls = state.clusters.find((c) => c.id === m.clusterId);
        return {
          ...m,
          userName: usr?.name || "Penjual",
          userEmail: usr?.email || "",
          userPhone: usr?.phone || "",
          storeName: usr?.storeName || "",
          businessType: usr?.businessType || "",
          address: usr?.address || "",
          clusterName: cls?.name || "",
          clusterCode: cls?.code || "",
        };
      });

    const clusterDrafts = state.shipmentDrafts.filter((d) =>
      managedClusterIds.has(d.clusterId)
    );

    const activeClusterDraftsCount = clusterDrafts.filter(
      (d) => d.status === "QUEUED" || d.status === "READY_FOR_PICKUP"
    ).length;

    const clusterGroupPickups = state.groupPickups.filter((gp) =>
      managedClusterIds.has(gp.clusterId)
    );

    const totalConsolidatedWeightGram = clusterGroupPickups
      .filter((gp) => gp.status === "COMPLETED")
      .reduce((sum, gp) => sum + gp.totalWeightGram, 0);

    const totalPickupCostRp = clusterGroupPickups
      .filter((gp) => gp.status === "COMPLETED")
      .reduce((sum, gp) => sum + gp.totalCost, 0);

    const clusterBatches = Array.from(managedClusterIds).flatMap((cid) =>
      getConsolidatedBatches(state, { clusterId: cid })
    );

    const pickupsToConfirm = clusterGroupPickups
      .filter(
        (gp) => gp.status === "SCHEDULED" || gp.status === "IN_PROGRESS"
      )
      .map((gp) => {
        const cls = state.clusters.find((c) => c.id === gp.clusterId);
        return {
          ...gp,
          clusterName: cls?.name || "",
          clusterCode: cls?.code || "",
        };
      });

    return NextResponse.json({
      sellerStats: {
        activeCluster,
        activeDraftsCount,
        packagesInNextPickup,
        estimatedNextCost,
        totalPackagesShipped,
        totalWeightShippedGram,
        totalSavingsRp,
        projectedSavingsNextPickupRp,
        totalPaidRp,
        batchesInMyCluster,
        myPickupHistory,
        recentDrafts: myDrafts
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 6),
      },
      clusterAdminStats: {
        managedClusters,
        activeSellersCount: clusterActiveSellers,
        activeDraftsTodayCount: activeClusterDraftsCount,
        totalGroupPickupsCount: clusterGroupPickups.length,
        totalConsolidatedWeightGram,
        totalPickupCostRp,
        pendingRequests,
        clusterBatches,
        pickupsToConfirm,
      },
      recentActivityLogs: state.activityLogs.slice(0, 12),
      serverDate: toDateKey(new Date()),
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "Gagal memuat statistik dashboard" },
      { status: 500 }
    );
  }
}

