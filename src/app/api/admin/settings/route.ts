import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getDbState,
  saveDbState,
  resetToSeedData,
  recordActivityLog,
  evaluateBatchStatusForGroup,
} from "@/lib/db";
import { platformConfigSchema } from "@/lib/validations";
import { RoleType } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Halaman ini khusus Admin Aplikasi (PLATFORM_ADMIN)." },
        { status: 403 }
      );
    }

    const state = getDbState();

    const totalUsers = state.users.length;
    const totalSellers = state.users.filter((u) => u.role === "SELLER").length;
    const totalClusterAdmins = state.users.filter(
      (u) => u.role === "CLUSTER_ADMIN"
    ).length;
    const totalClusters = state.clusters.length;
    const totalDrafts = state.shipmentDrafts.length;
    const totalGroupPickups = state.groupPickups.length;
    const completedPickups = state.groupPickups.filter(
      (g) => g.status === "COMPLETED"
    );

    const totalPlatformFeeRevenue = completedPickups.reduce(
      (sum, g) =>
        sum + Math.round(g.basePickupFee * (g.platformFeePercent / 100)),
      0
    );

    const totalWeightConsolidatedGram = completedPickups.reduce(
      (sum, g) => sum + g.totalWeightGram,
      0
    );

    const users = state.users.map((u) => {
      const activeClusterMember = state.clusterMembers.find(
        (m) => m.userId === u.id && m.status === "ACTIVE"
      );
      const cluster = activeClusterMember
        ? state.clusters.find((c) => c.id === activeClusterMember.clusterId)
        : null;
      const draftCount = state.shipmentDrafts.filter(
        (d) => d.userId === u.id
      ).length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        storeName: u.storeName,
        businessType: u.businessType,
        address: u.address,
        createdAt: u.createdAt,
        clusterName: cluster?.name || "-",
        clusterCode: cluster?.code || "-",
        draftCount,
      };
    });

    const clusters = state.clusters.map((c) => {
      const admin = state.users.find((u) => u.id === c.adminId);
      const activeMembers = state.clusterMembers.filter(
        (m) => m.clusterId === c.id && m.status === "ACTIVE"
      ).length;
      const pickupCount = state.groupPickups.filter(
        (g) => g.clusterId === c.id
      ).length;
      return {
        ...c,
        adminName: admin?.name || "Admin",
        activeMembers,
        pickupCount,
      };
    });

    return NextResponse.json({
      config: state.platformConfig,
      stats: {
        totalUsers,
        totalSellers,
        totalClusterAdmins,
        totalClusters,
        totalDrafts,
        totalGroupPickups,
        completedPickupsCount: completedPickups.length,
        totalPlatformFeeRevenue,
        totalWeightConsolidatedGram,
      },
      users,
      clusters,
      activityLogs: state.activityLogs.slice(0, 25),
    });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data admin aplikasi" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin Aplikasi yang dapat mengubah tarif global." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body.action || "UPDATE_TARIFF";
    const state = getDbState();

    // Action 1: Reset data ke kondisi seed awal (Berguna untuk demo)
    if (action === "RESET_DEMO_DATA") {
      resetToSeedData();
      return NextResponse.json({
        message: "Seluruh data berhasil di-reset kembali ke Seed Data awal!",
      });
    }

    // Action 2: Ubah role pengguna
    if (action === "UPDATE_USER_ROLE") {
      const { userId, newRole } = body as {
        userId: string;
        newRole: RoleType;
      };
      const targetUser = state.users.find((u) => u.id === userId);
      if (!targetUser) {
        return NextResponse.json(
          { error: "Pengguna tidak ditemukan" },
          { status: 404 }
        );
      }

      const oldRole = targetUser.role;
      targetUser.role = newRole;

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "CHANGE_USER_ROLE",
        entityType: "User",
        entityId: targetUser.id,
        summary: `Admin Aplikasi mengubah peran ${targetUser.name} dari ${oldRole} menjadi ${newRole}`,
      });

      saveDbState(state);
      return NextResponse.json({
        message: `Peran ${targetUser.name} berhasil diubah menjadi ${newRole}`,
      });
    }

    // Action 3: Simpan tarif dasar, biaya pickup, minimum berat, minimum paket, dan fee platform
    const normalizedConfig = {
      ...body,
      defaultBasePickupFee: Number(body.defaultBasePickupFee),
      defaultPlatformFeePct: Number(body.defaultPlatformFeePct),
      defaultMinPackages: Number(body.defaultMinPackages),
      defaultMinWeightGram: Number(body.defaultMinWeightGram),
      soloPickupEstimateRp: Number(body.soloPickupEstimateRp ?? 15000),
      applyToAllClusters: Boolean(body.applyToAllClusters),
    };
    const parsed = platformConfigSchema.safeParse(normalizedConfig);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Konfigurasi tarif dan fee tidak valid",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    state.platformConfig = {
      id: "default",
      defaultBasePickupFee: data.defaultBasePickupFee,
      defaultPlatformFeePct: data.defaultPlatformFeePct,
      defaultMinPackages: data.defaultMinPackages,
      defaultMinWeightGram: data.defaultMinWeightGram,
      soloPickupEstimateRp: data.soloPickupEstimateRp,
      updatedAt: new Date().toISOString(),
    };

    if (data.applyToAllClusters) {
      state.clusters.forEach((c) => {
        c.basePickupFee = data.defaultBasePickupFee;
        c.platformFeePercent = data.defaultPlatformFeePct;
        c.minPackages = data.defaultMinPackages;
        c.minTotalWeightGram = data.defaultMinWeightGram;
      });

      // Evaluasi ulang semua grup draft yang belum terjadwal
      const activeDrafts = state.shipmentDrafts.filter(
        (d) => d.status === "QUEUED" || d.status === "READY_FOR_PICKUP"
      );
      const seenKeys = new Set<string>();
      activeDrafts.forEach((d) => {
        const key = `${d.clusterId}__${d.pickupDate}__${d.pickupWindow}__${d.courier}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          evaluateBatchStatusForGroup(state, {
            clusterId: d.clusterId,
            pickupDate: d.pickupDate,
            pickupWindow: d.pickupWindow,
            courier: d.courier,
          });
        }
      });
    }

    recordActivityLog(state, {
      actorId: authUser.id,
      action: "UPDATE_PLATFORM_CONFIG",
      entityType: "PlatformConfig",
      entityId: "default",
      summary: `Admin Aplikasi memperbarui tarif global (Biaya Pickup: Rp${data.defaultBasePickupFee.toLocaleString(
        "id-ID"
      )}, Fee: ${data.defaultPlatformFeePct}%, Min Paket: ${
        data.defaultMinPackages
      }, Min Berat: ${data.defaultMinWeightGram}g)`,
      details: data.applyToAllClusters
        ? "Diterapkan serentak ke seluruh cluster yang aktif."
        : "Disimpan sebagai standar default cluster baru.",
    });

    saveDbState(state);

    return NextResponse.json({
      message: data.applyToAllClusters
        ? "Pengaturan tarif, kuota minimum, dan fee berhasil disimpan serta diterapkan ke seluruh cluster!"
        : "Pengaturan tarif dan fee platform berhasil disimpan!",
      config: state.platformConfig,
    });
  } catch (error) {
    console.error("PUT /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan platform" },
      { status: 500 }
    );
  }
}
