import { getDbState, saveDbState } from "@/lib/db";

/**
 * Smart Batching & Task Routing untuk Mode Kampus (Multi-Drop)
 * Otomatis mengelompokkan pesanan berdasarkan Waktu Pengantaran (12:00 / 17:00),
 * membuat tugas Multi-Pickup dari Kantin, lalu Multi-Drop ke Gedung Tujuan.
 */
export function rebatchAndRouteTasks(organizationId: string) {
  const state = getDbState();
  const campusOrders = state.orders.filter(
    (o) => o.organizationId === organizationId && o.status !== "CANCELLED"
  );

  const windows = Array.from(new Set(campusOrders.map((o) => o.deliveryWindow || "12:00")));

  windows.forEach((win) => {
    let batch = state.deliveryBatches.find(
      (b) => b.organizationId === organizationId && b.deliveryWindow === win && b.status !== "COMPLETED"
    );

    if (!batch) {
      batch = {
        id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        organizationId,
        code: `BATCH-${win.replace(":", "")}-${Date.now().toString().slice(-4)}`,
        deliveryWindow: win,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.deliveryBatches.push(batch);
    }

    // Tautkan order ke batch
    const winOrders = campusOrders.filter(
      (o) => (o.deliveryWindow || "12:00") === win && !o.batchId
    );
    winOrders.forEach((o) => {
      o.batchId = batch!.id;
    });

    const activeBatchOrders = state.orders.filter(
      (o) => o.batchId === batch!.id && o.status !== "CANCELLED" && o.status !== "COMPLETED"
    );

    if (activeBatchOrders.length > 0) {
      const agent =
        state.users.find(
          (u) => u.role === "AGENT_COURIER" && (u.organizationId === organizationId || !u.organizationId)
        ) || state.users.find((u) => u.role === "AGENT_COURIER");

      const agentId = agent ? agent.id : "usr-agent-1";

      // Hapus tasks lama batch ini yang belum complete
      state.courierTasks = state.courierTasks.filter(
        (t) => !(t.batchId === batch!.id && t.status !== "COMPLETED")
      );

      let seq = 1;

      // 1. Multi-Pickup per Kantin
      const storeMap = new Map<string, number>();
      activeBatchOrders.forEach((o) => {
        storeMap.set(o.storeId, (storeMap.get(o.storeId) || 0) + 1);
      });

      storeMap.forEach((count, sId) => {
        const store = state.stores.find((s) => s.id === sId);
        state.courierTasks.push({
          id: `task-pick-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          agentId,
          batchId: batch!.id,
          type: "PICKUP",
          status: "ASSIGNED",
          targetName: store?.name || "Kantin Kampus",
          address: store?.location || "Kantin Pusat",
          orderCount: count,
          feeEarned: 2500,
          sequence: seq++,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      // 2. Multi-Drop per Gedung Tujuan
      const dropMap = new Map<string, number>();
      activeBatchOrders.forEach((o) => {
        const loc = o.dropoffLocation || "Gedung Kuliah";
        dropMap.set(loc, (dropMap.get(loc) || 0) + 1);
      });

      dropMap.forEach((count, loc) => {
        state.courierTasks.push({
          id: `task-deliv-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          agentId,
          batchId: batch!.id,
          type: "DELIVERY",
          status: "ASSIGNED",
          targetName: loc,
          address: `Antar pesanan ke ${loc}`,
          orderCount: count,
          feeEarned: 2500 * count,
          sequence: seq++,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    }
  });

  saveDbState(state);
}

