import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDbState, saveDbState } from "@/lib/db";

// GET: Ambil tugas kurir, riwayat selesai, dan statistik pendapatan
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = getDbState();
  const agentTasks = state.courierTasks.filter(
    (t) => t.agentId === user.id || t.agentId === "usr-agent-1"
  );

  const activeTasks = agentTasks
    .filter((t) => t.status !== "COMPLETED")
    .sort((a, b) => a.sequence - b.sequence);

  const completedTasks = agentTasks.filter((t) => t.status === "COMPLETED");

  const totalFeeEarned = completedTasks.reduce((sum, t) => sum + t.feeEarned, 0);
  const potentialFee = activeTasks.reduce((sum, t) => sum + t.feeEarned, 0);

  // Batches info
  const batches = state.deliveryBatches.filter((b) =>
    activeTasks.some((t) => t.batchId === b.id)
  );

  return NextResponse.json({
    activeTasks,
    completedTasks,
    totalFeeEarned,
    potentialFee,
    completedCount: completedTasks.length,
    activeCount: activeTasks.length,
    batches,
  });
}

// POST: Aksi Kurir ("Saya sudah ambil semua" / "Saya sudah antar")
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { taskId, action } = body;

  const state = getDbState();
  const task = state.courierTasks.find((t) => t.id === taskId);
  if (!task) {
    return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
  }

  if (action === "START_PROGRESS") {
    task.status = "IN_PROGRESS";
    task.updatedAt = new Date().toISOString();
  } else if (action === "COMPLETE_PICKUP") {
    // Kurir sudah mengambil semua pesanan dari Kantin
    task.status = "COMPLETED";
    task.updatedAt = new Date().toISOString();

    // Update status order di kantin ini menjadi ON_DELIVERY
    const store = state.stores.find((s) => s.name === task.targetName);
    if (store) {
      state.orders
        .filter((o) => o.batchId === task.batchId && o.storeId === store.id)
        .forEach((o) => {
          o.status = "ON_DELIVERY";
          o.updatedAt = new Date().toISOString();
          // Notifikasi ke pembeli
          state.notifications.unshift({
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            userId: o.customerId,
            title: "Pesanan Diambil Kurir 🛵",
            message: `Kurir telah mengambil pesanan Anda dari ${store.name} dan sedang dalam perjalanan!`,
            type: "INFO",
            link: "/campus/orders",
            isRead: false,
            whatsappStatus: "QUEUED",
            createdAt: new Date().toISOString(),
          });
        });
    }
  } else if (action === "COMPLETE_DELIVERY") {
    // Kurir sudah mengantar pesanan ke Gedung tujuan
    task.status = "COMPLETED";
    task.updatedAt = new Date().toISOString();

    // Update status order di gedung tujuan ini menjadi COMPLETED
    state.orders
      .filter((o) => o.batchId === task.batchId && o.dropoffLocation === task.targetName)
      .forEach((o) => {
        o.status = "COMPLETED";
        o.updatedAt = new Date().toISOString();
        // Notifikasi ke pembeli
        state.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          userId: o.customerId,
          title: "Pesanan Tiba & Selesai Diantar 🎉",
          message: `Pesanan Anda sudah sampai di ${o.dropoffLocation}. Terima kasih sudah menggunakan Consolio Kampus!`,
          type: "SUCCESS",
          link: "/campus/orders",
          isRead: false,
          whatsappStatus: "QUEUED",
          createdAt: new Date().toISOString(),
        });
      });

    // Cek apakah semua tugas di batch sudah selesai
    const remainingTasks = state.courierTasks.filter(
      (t) => t.batchId === task.batchId && t.status !== "COMPLETED"
    );
    if (remainingTasks.length === 0) {
      const batch = state.deliveryBatches.find((b) => b.id === task.batchId);
      if (batch) {
        batch.status = "COMPLETED";
        batch.updatedAt = new Date().toISOString();
      }
    }
  }

  saveDbState(state);

  return NextResponse.json({ success: true, task });
}
