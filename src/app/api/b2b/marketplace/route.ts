import { NextRequest, NextResponse } from "next/server";
import { getDbState, saveDbState } from "@/lib/db";
import { CourierType } from "@/lib/seed-data";

/**
 * Webhook API Simulasi B2B untuk Marketplace Hub (Shopee / Tokopedia / E-Commerce)
 * Mengizinkan marketplace menyuntikkan pesanan seller secara bulk ke Consolio.
 * Consolio akan otomatis mengelompokkan paket ke Cluster titik kumpul dan membuat Manifest Pengambilan Kurir.
 */

export async function GET() {
  const state = getDbState();
  const org = state.organizations.find((o) => o.type === "MARKETPLACE");

  // Buat manifest pickup untuk semua draft/paket di cluster tujuan
  const targetClusterCode = "GRIYA01";
  const cluster = state.clusters.find((c) => c.code === targetClusterCode) || state.clusters[0];

  const queuedDrafts = state.shipmentDrafts
    .filter((d) => d.clusterId === cluster.id && (d.status === "READY_FOR_PICKUP" || d.status === "QUEUED"))
    .map((d) => {
      const seller = state.users.find((u) => u.id === d.userId);
      return {
        draftId: d.id,
        sellerName: seller?.name || "UMKM",
        storeName: seller?.storeName || "Toko",
        recipientName: d.recipientName,
        destination: `${d.city}, ${d.province}`,
        weightGram: d.weightGram,
        courier: d.courier,
        pickupWindow: d.pickupWindow,
        status: d.status,
      };
    });

  const totalWeight = queuedDrafts.reduce((sum, d) => sum + d.weightGram, 0);

  const manifest = {
    manifestId: `MNF-SPX-${Date.now().toString().slice(-6)}`,
    organizationName: org?.name || "Shopee Express Logistics Hub",
    targetCluster: {
      name: cluster.name,
      code: cluster.code,
      centerAddress: cluster.centerAddress,
    },
    generatedAt: new Date().toISOString(),
    totalPackages: queuedDrafts.length,
    totalWeightKg: (totalWeight / 1000).toFixed(2),
    items: queuedDrafts,
  };

  return NextResponse.json({
    documentation: {
      title: "Consolio B2B Marketplace Hub API",
      version: "v1.2-B2B2C",
      endpointWebhook: "/api/b2b/marketplace",
      method: "POST",
      authentication: "Bearer Header: Authorization: Bearer <API_KEY>",
    },
    manifest,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const state = getDbState();

    const orders = body.orders;
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: "Payload harus memiliki properti 'orders' berupa array." },
        { status: 400 }
      );
    }

    const clusterCode = body.clusterCode || "GRIYA01";
    const cluster = state.clusters.find((c) => c.code === clusterCode) || state.clusters[0];

    let insertedCount = 0;
    const now = new Date();
    const pickupDateStr = body.pickupDate || now.toISOString().slice(0, 10);

    orders.forEach((ord: {
      sellerEmail?: string;
      sellerName?: string;
      storeName?: string;
      recipientName: string;
      recipientPhone: string;
      destinationAddress: string;
      city: string;
      province: string;
      postalCode: string;
      weightGram: number;
      courier?: CourierType;
      notes?: string;
    }) => {
      // Temukan atau buat seller UMKM
      let seller = state.users.find(
        (u) => ord.sellerEmail && u.email.toLowerCase() === ord.sellerEmail.toLowerCase()
      );
      if (!seller) {
        seller = state.users.find((u) => u.role === "SELLER");
      }
      const sellerId = seller ? seller.id : "usr-seller-1";

      const newDraft = {
        id: `drf-b2b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: sellerId,
        clusterId: cluster.id,
        recipientName: ord.recipientName || "Penerima Paket Shopee",
        recipientPhone: ord.recipientPhone || "081288889999",
        destinationAddress: ord.destinationAddress || "Jl. Sudirman No. 12",
        city: ord.city || "Jakarta Selatan",
        province: ord.province || "DKI Jakarta",
        postalCode: ord.postalCode || "12190",
        weightGram: Number(ord.weightGram) || 500,
        lengthCm: 15,
        widthCm: 10,
        heightCm: 8,
        itemValue: 50000,
        notes: ord.notes || "Injeksi pesanan Marketplace API",
        courier: (ord.courier as CourierType) || "JNT",
        pickupDate: pickupDateStr,
        pickupWindow: "AFTERNOON" as const,
        status: "READY_FOR_PICKUP" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.shipmentDrafts.unshift(newDraft);
      insertedCount++;
    });

    saveDbState(state);

    return NextResponse.json({
      success: true,
      message: `Berhasil menerima & mengelompokkan ${insertedCount} pesanan marketplace ke Cluster ${cluster.name} (${cluster.code}).`,
      batchManifestCode: `MNF-SPX-${Date.now().toString().slice(-6)}`,
      cluster: cluster.name,
      pickupDate: pickupDateStr,
      insertedCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
