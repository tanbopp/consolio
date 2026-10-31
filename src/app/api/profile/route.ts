import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDbState, saveDbState, recordActivityLog } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan login kembali." },
        { status: 401 }
      );
    }

    const state = getDbState();
    const user = state.users.find((u) => u.id === authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek membership aktif atau pending
    const memberships = state.clusterMembers
      .filter((cm) => cm.userId === user.id)
      .map((cm) => {
        const cluster = state.clusters.find((c) => c.id === cm.clusterId);
        return {
          ...cm,
          cluster: cluster || null,
        };
      });

    const activeMembership =
      memberships.find((m) => m.status === "ACTIVE") || null;
    const pendingMembership =
      memberships.find((m) => m.status === "PENDING") || null;

    // Jika dia CLUSTER_ADMIN, ambil juga cluster yang ia kelola
    const managedClusters = state.clusters.filter((c) => c.adminId === user.id);

    const unreadNotifications = state.notifications.filter(
      (n) => n.userId === user.id && !n.isRead
    ).length;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        storeName: user.storeName,
        businessType: user.businessType,
        address: user.address,
        createdAt: user.createdAt,
      },
      activeMembership,
      pendingMembership,
      managedClusters,
      unreadNotifications,
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Gagal memuat profil pengguna" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan login kembali." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data profil tidak valid" },
        { status: 400 }
      );
    }

    const state = getDbState();
    const user = state.users.find((u) => u.id === authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    user.name = parsed.data.name.trim();
    user.phone = parsed.data.phone.trim();
    user.storeName = parsed.data.storeName.trim();
    user.businessType = parsed.data.businessType.trim();
    user.address = parsed.data.address.trim();

    recordActivityLog(state, {
      actorId: user.id,
      action: "UPDATE_PROFILE",
      entityType: "User",
      entityId: user.id,
      summary: `${user.name} memperbarui profil usaha (${user.storeName})`,
    });

    saveDbState(state);

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        storeName: user.storeName,
        businessType: user.businessType,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan perubahan profil" },
      { status: 500 }
    );
  }
}

