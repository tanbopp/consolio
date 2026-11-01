import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDbState, saveDbState } from "@/lib/db";
import { rebatchAndRouteTasks } from "@/lib/campus-batcher";

// GET: Ambil daftar toko/kantin, produk, atau pesanan user
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const state = getDbState();
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "stores") {
    const stores = state.stores.filter((s) => s.type === "KANTIN" || s.type === "RESTORAN");
    const products = state.products.filter((p) => p.isAvailable);
    return NextResponse.json({ stores, products });
  }

  if (action === "my-orders") {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orders = state.orders
      .filter((o) => o.customerId === user.id)
      .map((o) => {
        const store = state.stores.find((s) => s.id === o.storeId);
        const items = state.orderItems
          .filter((it) => it.orderId === o.id)
          .map((it) => {
            const product = state.products.find((p) => p.id === it.productId);
            return { ...it, productName: product?.name || "Menu", imageUrl: product?.imageUrl || "🍲" };
          });
        return { ...o, storeName: store?.name || "Kantin", items };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ orders });
  }

  if (action === "store-orders") {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Kantin yang terhubung dengan user
    const store =
      state.stores.find((s) => s.name.toLowerCase().includes(user.name.toLowerCase())) ||
      state.stores[0];

    const orders = state.orders
      .filter((o) => o.storeId === store?.id)
      .map((o) => {
        const customer = state.users.find((u) => u.id === o.customerId);
        const items = state.orderItems
          .filter((it) => it.orderId === o.id)
          .map((it) => {
            const product = state.products.find((p) => p.id === it.productId);
            return { ...it, productName: product?.name || "Menu" };
          });
        return {
          ...o,
          customerName: customer?.name || "Mahasiswa",
          customerPhone: customer?.phone || "0812xxxx",
          items,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const myProducts = state.products.filter((p) => p.storeId === store?.id);

    return NextResponse.json({ store, orders, products: myProducts });
  }

  // Default: Overview data
  const stores = state.stores;
  const products = state.products;
  return NextResponse.json({ stores, products });
}

// POST: Buat Pesanan Baru (Mahasiswa)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { storeId, items, deliveryWindow, dropoffLocation, customerNotes } = body;

  if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Data pesanan tidak lengkap" }, { status: 400 });
  }

  const state = getDbState();
  const orgId = user.organizationId || "org-campus-ui";

  let totalPrice = 0;
  const newOrderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  items.forEach((item: { productId: string; qty: number; notes?: string }) => {
    const product = state.products.find((p) => p.id === item.productId);
    const price = product ? product.price : 15000;
    const subtotal = price * (item.qty || 1);
    totalPrice += subtotal;

    state.orderItems.push({
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: newOrderId,
      productId: item.productId,
      qty: item.qty || 1,
      price,
      notes: item.notes || null,
    });
  });

  const newOrder = {
    id: newOrderId,
    organizationId: orgId,
    customerId: user.id,
    storeId,
    batchId: null,
    status: "PENDING" as const,
    totalPrice,
    deliveryFee: 3000,
    deliveryWindow: deliveryWindow || "12:00",
    dropoffLocation: dropoffLocation || "Gedung B - Fakultas Teknik",
    customerNotes: customerNotes || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.orders.unshift(newOrder);

  // Buat notifikasi ke customer
  state.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: user.id,
    title: "Pesanan Kantin Berhasil Dibuat",
    message: `Pesanan Rp${(totalPrice + 3000).toLocaleString("id-ID")} sedang disiapkan untuk batch ${newOrder.deliveryWindow} WIB.`,
    type: "SUCCESS",
    link: "/campus/orders",
    isRead: false,
    whatsappStatus: "QUEUED",
    createdAt: new Date().toISOString(),
  });

  saveDbState(state);

  // Trigger Smart Batching & Task Routing
  rebatchAndRouteTasks(orgId);

  return NextResponse.json({ success: true, order: newOrder });
}

// PATCH: Update status pesanan (misal Kantin tandai "READY" atau Kurir tandai "COMPLETED")
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { orderId, status } = body;

  const state = getDbState();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  // Kirim notifikasi jika status berubah
  if (status === "READY") {
    state.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: order.customerId,
      title: "Pesanan Sudah Siap!",
      message: `Kantin telah menyelesaikan pesanan Anda. Menunggu pengambilan kurir batch ${order.deliveryWindow}.`,
      type: "INFO",
      link: "/campus/orders",
      isRead: false,
      whatsappStatus: "QUEUED",
      createdAt: new Date().toISOString(),
    });
  } else if (status === "COMPLETED") {
    state.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: order.customerId,
      title: "Pesanan Selesai Diantar 🎉",
      message: `Pesanan Anda telah tiba di ${order.dropoffLocation}. Selamat menikmati!`,
      type: "SUCCESS",
      link: "/campus/orders",
      isRead: false,
      whatsappStatus: "QUEUED",
      createdAt: new Date().toISOString(),
    });
  }

  saveDbState(state);
  rebatchAndRouteTasks(order.organizationId);

  return NextResponse.json({ success: true, order });
}
