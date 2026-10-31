import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDbState, saveDbState } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = getDbState();
    const notifications = state.notifications
      .filter((n) => n.userId === authUser.id)
      .slice(0, 30);

    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil notifikasi" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = getDbState();
    state.notifications.forEach((n) => {
      if (n.userId === authUser.id) {
        n.isRead = true;
      }
    });
    saveDbState(state);

    return NextResponse.json({ message: "Semua notifikasi ditandai sudah dibaca" });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui notifikasi" },
      { status: 500 }
    );
  }
}

