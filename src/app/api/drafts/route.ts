import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getDbState,
  saveDbState,
  evaluateBatchStatusForGroup,
  recordActivityLog,
} from "@/lib/db";
import { shipmentDraftSchema } from "@/lib/validations";
import { toDateKey } from "@/lib/utils";
import { CourierType, PickupWindowType } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "mine"; // "mine" | "cluster" | "all"
    const clusterId = searchParams.get("clusterId") || "";
    const status = searchParams.get("status") || "";
    const courier = searchParams.get("courier") || "";

    const state = getDbState();

    let drafts = state.shipmentDrafts.slice();

    if (scope === "mine") {
      drafts = drafts.filter((d) => d.userId === authUser.id);
    } else if (scope === "cluster") {
      if (clusterId) {
        drafts = drafts.filter((d) => d.clusterId === clusterId);
      } else {
        // Ambil cluster yang dikelola atau diikuti user
        const myClusterIds = new Set([
          ...state.clusters
            .filter((c) => c.adminId === authUser.id)
            .map((c) => c.id),
          ...state.clusterMembers
            .filter((m) => m.userId === authUser.id && m.status === "ACTIVE")
            .map((m) => m.clusterId),
        ]);
        drafts = drafts.filter((d) => myClusterIds.has(d.clusterId));
      }
    } else if (scope === "all" && authUser.role !== "PLATFORM_ADMIN") {
      drafts = drafts.filter((d) => d.userId === authUser.id);
    }

    if (status) {
      drafts = drafts.filter((d) => d.status === status);
    }
    if (courier) {
      drafts = drafts.filter((d) => d.courier === courier);
    }

    const enriched = drafts
      .map((d) => {
        const seller = state.users.find((u) => u.id === d.userId);
        const cluster = state.clusters.find((c) => c.id === d.clusterId);
        const pickupItem = state.pickupItems.find(
          (pi) => pi.shipmentDraftId === d.id
        );
        const groupPickup = pickupItem
          ? state.groupPickups.find((g) => g.id === pickupItem.groupPickupId)
          : null;

        return {
          ...d,
          sellerName: seller?.name || "Penjual",
          storeName: seller?.storeName || "Toko UMKM",
          clusterName: cluster?.name || "-",
          clusterCode: cluster?.code || "-",
          groupPickupCode: groupPickup?.code || null,
          groupPickupId: groupPickup?.id || null,
          allocatedCharge: pickupItem?.totalCharge ?? null,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ drafts: enriched });
  } catch (error) {
    console.error("GET /api/drafts error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar draft pengiriman" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Silakan login untuk membuat draft pengiriman." },
        { status: 401 }
      );
    }

    const state = getDbState();

    // Aturan Bisnis 7: Draft harus masuk ke cluster sebelum bisa digabung
    const activeMembership = state.clusterMembers.find(
      (m) => m.userId === authUser.id && m.status === "ACTIVE"
    );

    if (!activeMembership) {
      return NextResponse.json(
        {
          error:
            "Anda belum tergabung secara aktif di cluster mana pun. Silakan bergabung ke cluster terlebih dahulu sebelum membuat draft pengiriman.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const normalizedBody = {
      ...body,
      weightGram: Number(body.weightGram),
      lengthCm: Number(body.lengthCm),
      widthCm: Number(body.widthCm),
      heightCm: Number(body.heightCm),
      itemValue: Number(body.itemValue),
      notes: body.notes ?? "",
      saveAsDraftOnly: Boolean(body.saveAsDraftOnly),
    };
    const parsed = shipmentDraftSchema.safeParse(normalizedBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Data draft paket tidak valid" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const dateKey = toDateKey(data.pickupDate);
    const initialStatus = data.saveAsDraftOnly ? "DRAFT" : "QUEUED";

    const newDraft = {
      id: `drf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: authUser.id,
      clusterId: activeMembership.clusterId,
      recipientName: data.recipientName.trim(),
      recipientPhone: data.recipientPhone.trim(),
      destinationAddress: data.destinationAddress.trim(),
      city: data.city.trim(),
      province: data.province.trim(),
      postalCode: data.postalCode.trim(),
      weightGram: data.weightGram,
      lengthCm: data.lengthCm,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
      itemValue: data.itemValue,
      notes: data.notes?.trim() || "",
      courier: data.courier as CourierType,
      pickupDate: dateKey,
      pickupWindow: data.pickupWindow as PickupWindowType,
      status: initialStatus as "DRAFT" | "QUEUED" | "READY_FOR_PICKUP",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.shipmentDrafts.push(newDraft);

    let batchEvaluation = null;
    if (initialStatus === "QUEUED") {
      batchEvaluation = evaluateBatchStatusForGroup(state, {
        clusterId: newDraft.clusterId,
        pickupDate: newDraft.pickupDate,
        pickupWindow: newDraft.pickupWindow,
        courier: newDraft.courier,
      });
    }

    const updatedDraft = state.shipmentDrafts.find((d) => d.id === newDraft.id)!;

    recordActivityLog(state, {
      actorId: authUser.id,
      action: "CREATE_SHIPMENT_DRAFT",
      entityType: "ShipmentDraft",
      entityId: newDraft.id,
      summary: `${authUser.name} membuat draft paket ke ${newDraft.recipientName} (${newDraft.city}) seberat ${newDraft.weightGram}g via ${newDraft.courier}`,
      details: batchEvaluation?.isThresholdMet
        ? `Kuota tercapai (${batchEvaluation.totalPackages} paket / ${batchEvaluation.totalWeightGram}g) -> Status grup berubah menjadi READY_FOR_PICKUP`
        : `Status saat ini: ${updatedDraft.status}`,
    });

    saveDbState(state);

    return NextResponse.json(
      {
        message: batchEvaluation?.isThresholdMet
          ? "Draft berhasil ditambahkan! Kuota minimum cluster kini TERCAPAI dan seluruh paket dalam grup berubah menjadi SIAP PICKUP."
          : initialStatus === "DRAFT"
            ? "Draft paket berhasil disimpan sementara."
            : "Draft paket berhasil masuk ke antrean penggabungan pickup!",
        draft: updatedDraft,
        batchEvaluation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/drafts error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan draft pengiriman" },
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
    const { draftId, action } = body;

    const state = getDbState();
    const draft = state.shipmentDrafts.find((d) => d.id === draftId);

    if (!draft) {
      return NextResponse.json(
        { error: "Draft pengiriman tidak ditemukan" },
        { status: 404 }
      );
    }

    // Pastikan pemilik draft atau admin aplikasi
    if (draft.userId !== authUser.id && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin mengubah draft milik penjual lain." },
        { status: 403 }
      );
    }

    // Action 1: Masukkan DRAFT ke antrean penggabungan (QUEUED)
    if (action === "QUEUE_DRAFT") {
      if (draft.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Hanya paket berstatus DRAFT yang dapat dimasukkan ke antrean." },
          { status: 400 }
        );
      }

      draft.status = "QUEUED";
      draft.updatedAt = new Date().toISOString();

      const evalResult = evaluateBatchStatusForGroup(state, {
        clusterId: draft.clusterId,
        pickupDate: draft.pickupDate,
        pickupWindow: draft.pickupWindow,
        courier: draft.courier,
      });

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "QUEUE_DRAFT",
        entityType: "ShipmentDraft",
        entityId: draft.id,
        summary: `${authUser.name} memasukkan draft paket (${draft.recipientName}) ke antrean penggabungan`,
      });

      saveDbState(state);

      return NextResponse.json({
        message: evalResult.isThresholdMet
          ? "Paket masuk antrean dan kuota minimum langsung terpenuhi (SIAP PICKUP)!"
          : "Paket berhasil dimasukkan ke antrean penggabungan!",
        draft,
      });
    }

    // Action 2: Batalkan draft (Aturan Bisnis: Penjual dapat membatalkan draft sebelum status READY_FOR_PICKUP)
    if (action === "CANCEL_DRAFT") {
      if (draft.status !== "DRAFT" && draft.status !== "QUEUED") {
        return NextResponse.json(
          {
            error:
              "Sesuai aturan Consolio, draft tidak dapat dibatalkan setelah mencapai status SIAP PICKUP (READY_FOR_PICKUP) atau setelah dijemput.",
          },
          { status: 400 }
        );
      }

      const prevGroup = {
        clusterId: draft.clusterId,
        pickupDate: draft.pickupDate,
        pickupWindow: draft.pickupWindow,
        courier: draft.courier,
      };

      draft.status = "CANCELLED";
      draft.updatedAt = new Date().toISOString();

      evaluateBatchStatusForGroup(state, prevGroup);

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "CANCEL_DRAFT",
        entityType: "ShipmentDraft",
        entityId: draft.id,
        summary: `${authUser.name} membatalkan draft pengiriman untuk ${draft.recipientName}`,
      });

      saveDbState(state);

      return NextResponse.json({
        message: "Draft pengiriman berhasil dibatalkan.",
        draft,
      });
    }

    // Action 3: Edit isi draft (Validasi 4.3: Draft hanya dapat diedit sebelum status READY_FOR_PICKUP)
    if (action === "UPDATE_DRAFT") {
      if (draft.status !== "DRAFT" && draft.status !== "QUEUED") {
        return NextResponse.json(
          {
            error:
              "Draft hanya dapat diedit sebelum status berubah menjadi SIAP PICKUP (READY_FOR_PICKUP).",
          },
          { status: 400 }
        );
      }

      const normalizedEdit = {
        ...body,
        weightGram: Number(body.weightGram),
        lengthCm: Number(body.lengthCm),
        widthCm: Number(body.widthCm),
        heightCm: Number(body.heightCm),
        itemValue: Number(body.itemValue),
        notes: body.notes ?? "",
        saveAsDraftOnly: Boolean(body.saveAsDraftOnly),
      };
      const parsed = shipmentDraftSchema.safeParse(normalizedEdit);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Data edit tidak valid" },
          { status: 400 }
        );
      }

      const oldGroup = {
        clusterId: draft.clusterId,
        pickupDate: draft.pickupDate,
        pickupWindow: draft.pickupWindow,
        courier: draft.courier,
      };

      const data = parsed.data;
      draft.recipientName = data.recipientName.trim();
      draft.recipientPhone = data.recipientPhone.trim();
      draft.destinationAddress = data.destinationAddress.trim();
      draft.city = data.city.trim();
      draft.province = data.province.trim();
      draft.postalCode = data.postalCode.trim();
      draft.weightGram = data.weightGram;
      draft.lengthCm = data.lengthCm;
      draft.widthCm = data.widthCm;
      draft.heightCm = data.heightCm;
      draft.itemValue = data.itemValue;
      draft.notes = data.notes?.trim() || "";
      draft.courier = data.courier as CourierType;
      draft.pickupDate = toDateKey(data.pickupDate);
      draft.pickupWindow = data.pickupWindow as PickupWindowType;
      draft.updatedAt = new Date().toISOString();

      evaluateBatchStatusForGroup(state, oldGroup);
      evaluateBatchStatusForGroup(state, {
        clusterId: draft.clusterId,
        pickupDate: draft.pickupDate,
        pickupWindow: draft.pickupWindow,
        courier: draft.courier,
      });

      recordActivityLog(state, {
        actorId: authUser.id,
        action: "UPDATE_DRAFT",
        entityType: "ShipmentDraft",
        entityId: draft.id,
        summary: `${authUser.name} memperbarui detail draft paket tujuan ${draft.city} (${draft.weightGram}g)`,
      });

      saveDbState(state);

      return NextResponse.json({
        message: "Perubahan draft pengiriman berhasil disimpan.",
        draft,
      });
    }

    return NextResponse.json(
      { error: "Action tidak dikenali" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/drafts error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui draft pengiriman" },
      { status: 500 }
    );
  }
}
