import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getDbState,
  saveDbState,
  recordActivityLog,
  createInAppNotification,
} from "@/lib/db";
import { clusterSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const state = getDbState();
    const authUser = await getCurrentUser();

    const clusters = state.clusters
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.centerAddress.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      })
      .map((c) => {
        const admin = state.users.find((u) => u.id === c.adminId);
        const members = state.clusterMembers
          .filter((m) => m.clusterId === c.id)
          .map((m) => {
            const usr = state.users.find((u) => u.id === m.userId);
            return {
              ...m,
              userName: usr?.name || "Penjual",
              userEmail: usr?.email || "",
              userPhone: usr?.phone || "",
              storeName: usr?.storeName || "",
              businessType: usr?.businessType || "",
              address: usr?.address || "",
            };
          });

        const activeMemberCount = members.filter(
          (m) => m.status === "ACTIVE"
        ).length;
        const pendingMemberCount = members.filter(
          (m) => m.status === "PENDING"
        ).length;

        const myMembership = authUser
          ? members.find((m) => m.userId === authUser.id) || null
          : null;

        return {
          ...c,
          adminName: admin?.name || "Admin Cluster",
          adminPhone: admin?.phone || "",
          activeMemberCount,
          pendingMemberCount,
          myMembershipStatus: myMembership?.status || null,
          members,
        };
      });

    return NextResponse.json({ clusters });
  } catch (error) {
    console.error("GET /api/clusters error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar cluster" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Anda harus login untuk membuat atau bergabung ke cluster." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const action = body.action || "CREATE_CLUSTER";

    const state = getDbState();

    // Action 1: Penjual request bergabung ke cluster
    if (action === "JOIN_CLUSTER") {
      const { clusterId, clusterCode } = body;
      const targetCluster = state.clusters.find(
        (c) =>
          c.id === clusterId ||
          (clusterCode &&
            c.code.toUpperCase() === String(clusterCode).trim().toUpperCase())
      );

      if (!targetCluster) {
        return NextResponse.json(
          { error: "Cluster dengan kode atau ID tersebut tidak ditemukan." },
          { status: 404 }
        );
      }

      // Aturan Bisnis 4.2: Satu penjual hanya boleh aktif di satu cluster pada satu waktu
      const existingActive = state.clusterMembers.find(
        (m) => m.userId === authUser.id && m.status === "ACTIVE"
      );

      if (existingActive) {
        const activeCluster = state.clusters.find(
          (c) => c.id === existingActive.clusterId
        );
        return NextResponse.json(
          {
            error: `Satu penjual hanya boleh aktif di satu cluster pada satu waktu. Anda saat ini sudah aktif di cluster "${activeCluster?.name || existingActive.clusterId
              }".`,
          },
          { status: 400 }
        );
      }

      const existingRequest = state.clusterMembers.find(
        (m) => m.userId === authUser.id && m.clusterId === targetCluster.id
      );

      if (existingRequest) {
        if (existingRequest.status === "PENDING") {
          return NextResponse.json(
            {
              error:
                "Permintaan gabung Anda ke cluster ini sedang menunggu persetujuan Admin Cluster.",
            },
            { status: 400 }
          );
        }
        // Jika sebelumnya REJECTED, izinkan ajukan ulang
        existingRequest.status = "PENDING";
        existingRequest.joinedAt = new Date().toISOString();
      } else {
        state.clusterMembers.push({
          id: `cm-${Date.now()}`,
          clusterId: targetCluster.id,
          userId: authUser.id,
          status: "PENDING",
          joinedAt: new Date().toISOString(),
        });
      }

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "REQUEST_JOIN_CLUSTER",
        entityType: "Cluster",
        entityId: targetCluster.id,
        summary: `${authUser.name} (${authUser.storeName}) meminta bergabung ke cluster ${targetCluster.name} (${targetCluster.code})`,
      });

      createInAppNotification(state, {
        userId: targetCluster.adminId,
        title: "Permintaan Gabung Cluster Baru",
        message: `${authUser.name} (${authUser.storeName}) mengajukan permintaan bergabung ke cluster ${targetCluster.name}.`,
        type: "WARNING",
        link: "/cluster-admin/manage",
      });

      saveDbState(state);

      return NextResponse.json({
        message: `Permintaan bergabung ke cluster "${targetCluster.name}" (${targetCluster.code}) berhasil dikirim! Menunggu persetujuan Admin Cluster.`,
      });
    }

    // Action 2: Membuat Cluster baru
    const normalizedCluster = {
      ...body,
      radiusKm: Number(body.radiusKm),
      minPackages: Number(body.minPackages),
      minTotalWeightGram: Number(body.minTotalWeightGram),
      basePickupFee: Number(body.basePickupFee),
      platformFeePercent: Number(body.platformFeePercent),
    };
    const parsed = clusterSchema.safeParse(normalizedCluster);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data cluster tidak valid" },
        { status: 400 }
      );
    }

    const codeUpper = parsed.data.code.trim().toUpperCase();
    const codeExists = state.clusters.some(
      (c) => c.code.toUpperCase() === codeUpper
    );
    if (codeExists) {
      return NextResponse.json(
        {
          error: `Kode cluster "${codeUpper}" sudah digunakan. Gunakan kode unik lainnya.`,
        },
        { status: 409 }
      );
    }

    // Jika yang membuat adalah SELLER, naikkan perannya ke CLUSTER_ADMIN atau daftarkan dia sebagai anggota ACTIVE sekaligus admin
    const dbUser = state.users.find((u) => u.id === authUser.id);
    if (dbUser && dbUser.role === "SELLER") {
      dbUser.role = "CLUSTER_ADMIN";
    }

    const newCluster = {
      id: `cls-${Date.now()}`,
      name: parsed.data.name.trim(),
      code: codeUpper,
      description: parsed.data.description.trim(),
      centerAddress: parsed.data.centerAddress.trim(),
      radiusKm: parsed.data.radiusKm,
      pickupDays: parsed.data.pickupDays,
      pickupTimeWindows: parsed.data.pickupTimeWindows,
      minPackages: parsed.data.minPackages,
      minTotalWeightGram: parsed.data.minTotalWeightGram,
      basePickupFee: parsed.data.basePickupFee,
      platformFeePercent: parsed.data.platformFeePercent,
      adminId: authUser.id,
      createdAt: new Date().toISOString(),
    };

    state.clusters.push(newCluster);

    // Jika belum punya cluster aktif, jadikan juga anggota aktif di cluster yang baru dibuatnya
    const hasActiveMembership = state.clusterMembers.some(
      (m) => m.userId === authUser.id && m.status === "ACTIVE"
    );
    if (!hasActiveMembership) {
      state.clusterMembers.push({
        id: `cm-${Date.now()}`,
        clusterId: newCluster.id,
        userId: authUser.id,
        status: "ACTIVE",
        joinedAt: new Date().toISOString(),
      });
    }

    recordActivityLog(state, {
      actorId: authUser.id,
      action: "CREATE_CLUSTER",
      entityType: "Cluster",
      entityId: newCluster.id,
      summary: `${authUser.name} membuat cluster baru "${newCluster.name}" (${newCluster.code})`,
    });

    saveDbState(state);

    return NextResponse.json(
      {
        message: `Cluster "${newCluster.name}" (${newCluster.code}) berhasil dibuat!`,
        cluster: newCluster,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/clusters error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses cluster" },
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
    const { action } = body;
    const state = getDbState();

    // Action A: Admin Cluster menyetujui / menolak permintaan gabung cluster
    if (action === "MODERATE_MEMBER") {
      const { memberId, decision } = body as {
        memberId: string;
        decision: "ACTIVE" | "REJECTED";
      };

      const memberRecord = state.clusterMembers.find((m) => m.id === memberId);
      if (!memberRecord) {
        return NextResponse.json(
          { error: "Data permintaan anggota tidak ditemukan" },
          { status: 404 }
        );
      }

      const cluster = state.clusters.find(
        (c) => c.id === memberRecord.clusterId
      );
      if (!cluster) {
        return NextResponse.json(
          { error: "Cluster tidak ditemukan" },
          { status: 404 }
        );
      }

      // Server-side authorization: Hanya Admin Cluster pemilik cluster tersebut atau Admin Aplikasi
      if (
        authUser.role !== "PLATFORM_ADMIN" &&
        cluster.adminId !== authUser.id
      ) {
        return NextResponse.json(
          {
            error:
              "Akses ditolak: Anda bukan Admin Cluster untuk area ini.",
          },
          { status: 403 }
        );
      }

      if (decision === "ACTIVE") {
        // Pastikan penjual belum aktif di cluster lain
        const otherActive = state.clusterMembers.find(
          (m) =>
            m.userId === memberRecord.userId &&
            m.status === "ACTIVE" &&
            m.id !== memberRecord.id
        );
        if (otherActive) {
          return NextResponse.json(
            {
              error:
                "Penjual tersebut sudah terdaftar aktif di cluster lain.",
            },
            { status: 400 }
          );
        }
      }

      memberRecord.status = decision;
      memberRecord.joinedAt = new Date().toISOString();

      const sellerUser = state.users.find((u) => u.id === memberRecord.userId);

      recordActivityLog(state, {
        actorId: authUser.id,
        action:
          decision === "ACTIVE"
            ? "APPROVE_CLUSTER_MEMBER"
            : "REJECT_CLUSTER_MEMBER",
        entityType: "ClusterMember",
        entityId: memberRecord.id,
        summary: `${authUser.name} ${decision === "ACTIVE" ? "menyetujui" : "menolak"
          } bergabungnya ${sellerUser?.name || "Penjual"} ke cluster ${cluster.name
          }`,
      });

      createInAppNotification(state, {
        userId: memberRecord.userId,
        title:
          decision === "ACTIVE"
            ? "Permintaan Gabung Cluster Disetujui!"
            : "Permintaan Gabung Cluster Ditolak",
        message:
          decision === "ACTIVE"
            ? `Selamat! Anda kini menjadi anggota aktif di cluster "${cluster.name}" (${cluster.code}). Anda sudah bisa membuat Draft Pengiriman.`
            : `Maaf, permintaan bergabung Anda ke cluster "${cluster.name}" belum dapat disetujui oleh Admin Cluster.`,
        type: decision === "ACTIVE" ? "SUCCESS" : "WARNING",
        link: decision === "ACTIVE" ? "/drafts/new" : "/onboarding",
      });

      saveDbState(state);

      return NextResponse.json({
        message:
          decision === "ACTIVE"
            ? `Penjual ${sellerUser?.name || ""} berhasil disetujui masuk ke cluster!`
            : `Permintaan gabung ${sellerUser?.name || ""} telah ditolak.`,
      });
    }

    // Action B: Update pengaturan Cluster
    if (action === "UPDATE_CLUSTER") {
      const { clusterId, ...updateFields } = body;
      const cluster = state.clusters.find((c) => c.id === clusterId);
      if (!cluster) {
        return NextResponse.json(
          { error: "Cluster tidak ditemukan" },
          { status: 404 }
        );
      }

      if (
        authUser.role !== "PLATFORM_ADMIN" &&
        cluster.adminId !== authUser.id
      ) {
        return NextResponse.json(
          { error: "Anda tidak memiliki izin mengubah pengaturan cluster ini." },
          { status: 403 }
        );
      }

      const parsed = clusterSchema.safeParse({
        ...cluster,
        ...updateFields,
      });

      if (!parsed.success) {
        return NextResponse.json(
          {
            error:
              parsed.error.issues[0]?.message ||
              "Data pengaturan cluster tidak valid",
          },
          { status: 400 }
        );
      }

      cluster.name = parsed.data.name.trim();
      cluster.description = parsed.data.description.trim();
      cluster.centerAddress = parsed.data.centerAddress.trim();
      cluster.radiusKm = parsed.data.radiusKm;
      cluster.pickupDays = parsed.data.pickupDays;
      cluster.pickupTimeWindows = parsed.data.pickupTimeWindows;
      cluster.minPackages = parsed.data.minPackages;
      cluster.minTotalWeightGram = parsed.data.minTotalWeightGram;
      cluster.basePickupFee = parsed.data.basePickupFee;
      cluster.platformFeePercent = parsed.data.platformFeePercent;

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "UPDATE_CLUSTER_SETTINGS",
        entityType: "Cluster",
        entityId: cluster.id,
        summary: `${authUser.name} memperbarui konfigurasi cluster ${cluster.name}`,
        details: `Min Paket: ${cluster.minPackages}, Min Berat: ${cluster.minTotalWeightGram}g, Biaya Pickup: Rp${cluster.basePickupFee}`,
      });

      saveDbState(state);

      return NextResponse.json({
        message: "Pengaturan cluster berhasil disimpan",
        cluster,
      });
    }

    return NextResponse.json(
      { error: "Action tidak dikenali" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/clusters error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data cluster" },
      { status: 500 }
    );
  }
}
