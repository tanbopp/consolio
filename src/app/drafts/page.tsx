"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Edit2,
  X,
  Send,
  Lock,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/custom-select";
import { DraftStatusBadge } from "@/components/ui/badge";
import {
  COURIER_LABELS,
  PICKUP_WINDOW_LABELS,
  DRAFT_STATUS_CONFIG,
  INDONESIAN_PROVINCES,
} from "@/lib/constants";
import { formatWeight, formatDateId } from "@/lib/utils";

interface DraftItem {
  id: string;
  recipientName: string;
  recipientPhone: string;
  destinationAddress: string;
  city: string;
  province: string;
  postalCode: string;
  weightGram: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  itemValue: number;
  notes: string;
  courier: string;
  pickupDate: string;
  pickupWindow: string;
  status: string;
  clusterName: string;
  clusterCode: string;
  groupPickupCode?: string | null;
  groupPickupId?: string | null;
  allocatedCharge?: number | null;
}

export default function MyDraftsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [courierFilter, setCourierFilter] = useState("");
  const [editingDraft, setEditingDraft] = useState<DraftItem | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["drafts", "mine", statusFilter, courierFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ scope: "mine" });
      if (statusFilter) params.set("status", statusFilter);
      if (courierFilter) params.set("courier", courierFilter);
      const res = await fetch(`/api/drafts?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat draft");
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses aksi");
      return json;
    },
    onSuccess: (res) => {
      setFeedback({ type: "success", text: res.message });
      setEditingDraft(null);
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pickups"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const drafts: DraftItem[] = data?.drafts || [];

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#182126]">
              Draft Paket Saya
            </h1>
            <p className="text-xs text-[#626E76] mt-0.5">
              Daftar seluruh paket Anda. Draft dapat diedit atau dibatalkan sebelum status Siap Pickup.
            </p>
          </div>
          <Link href="/drafts/new">
            <Button size="sm" className="gap-1.5 h-8 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" />
              <span>Buat Draft Paket</span>
            </Button>
          </Link>
        </div>

        {feedback && (
          <div
            className={`rounded border px-3 py-2 text-xs font-medium flex items-center justify-between ${feedback.type === "success"
                ? "border-[#C3E6D3] bg-[#EAF5EF] text-[#144D33]"
                : "border-[#F8D2CF] bg-[#FDF2F1] text-[#911D13]"
              }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] underline ml-3"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Filter Strip Ringkas */}
        <div className="rounded border border-[#E3E7EA] bg-white p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[#626E76] font-medium">Status:</span>
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder={`Semua status (${drafts.length})`}
                options={[
                  { value: "", label: `Semua status (${drafts.length})` },
                  ...Object.entries(DRAFT_STATUS_CONFIG).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  })),
                ]}
                triggerClassName="h-8 text-xs rounded-lg min-w-[140px]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#626E76] font-medium">Kurir:</span>
              <CustomSelect
                value={courierFilter}
                onChange={setCourierFilter}
                placeholder="Semua kurir"
                options={[
                  { value: "", label: "Semua kurir" },
                  ...Object.entries(COURIER_LABELS).map(([k, v]) => ({
                    value: k,
                    label: v,
                  })),
                ]}
                triggerClassName="h-8 text-xs rounded-lg min-w-[130px]"
              />
            </div>
          </div>

          {(statusFilter || courierFilter) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setCourierFilter("");
              }}
              className="text-xs text-[#17685F] hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>

        {/* Modal/Inline Form Edit Draft */}
        {editingDraft && (
          <div className="rounded border border-[#17685F] bg-white p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3E7EA] pb-3">
              <h2 className="text-sm font-semibold text-[#182126]">
                Edit Draft Paket — {editingDraft.recipientName}
              </h2>
              <button
                type="button"
                onClick={() => setEditingDraft(null)}
                className="text-[#626E76] hover:text-[#182126]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                actionMutation.mutate({
                  action: "UPDATE_DRAFT",
                  draftId: editingDraft.id,
                  ...editingDraft,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nama Penerima</Label>
                  <Input
                    value={editingDraft.recipientName}
                    onChange={(e) =>
                      setEditingDraft({
                        ...editingDraft,
                        recipientName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telepon Penerima</Label>
                  <Input
                    value={editingDraft.recipientPhone}
                    onChange={(e) =>
                      setEditingDraft({
                        ...editingDraft,
                        recipientPhone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kota Tujuan</Label>
                  <Input
                    value={editingDraft.city}
                    onChange={(e) =>
                      setEditingDraft({
                        ...editingDraft,
                        city: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Alamat Lengkap</Label>
                  <Input
                    value={editingDraft.destinationAddress}
                    onChange={(e) =>
                      setEditingDraft({
                        ...editingDraft,
                        destinationAddress: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Provinsi</Label>
                  <CustomSelect
                    value={editingDraft.province}
                    onChange={(val) =>
                      setEditingDraft({
                        ...editingDraft,
                        province: val,
                      })
                    }
                    placeholder="Pilih Provinsi"
                    options={INDONESIAN_PROVINCES.map((p) => ({
                      value: p,
                      label: p,
                    }))}
                    triggerClassName="h-9 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Berat (Gram)</Label>
                  <Input
                    type="number"
                    min={100}
                    value={editingDraft.weightGram}
                    onChange={(e) =>
                      setEditingDraft({
                        ...editingDraft,
                        weightGram: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kurir</Label>
                  <CustomSelect
                    value={editingDraft.courier}
                    onChange={(val) =>
                      setEditingDraft({
                        ...editingDraft,
                        courier: val,
                      })
                    }
                    placeholder="Pilih Kurir"
                    options={Object.entries(COURIER_LABELS).map(([k, v]) => ({
                      value: k,
                      label: v,
                    }))}
                    triggerClassName="h-9 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tanggal Pickup</Label>
                  <Input
                    type="date"
                    value={editingDraft.pickupDate}
                    onChange={(e) =>
                      setEditingDraft({
                        ...editingDraft,
                        pickupDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Jendela Waktu</Label>
                  <CustomSelect
                    value={editingDraft.pickupWindow}
                    onChange={(val) =>
                      setEditingDraft({
                        ...editingDraft,
                        pickupWindow: val,
                      })
                    }
                    placeholder="Pilih Jendela Waktu"
                    options={Object.entries(PICKUP_WINDOW_LABELS).map(
                      ([k, val]) => ({
                        value: k,
                        label: `${val.label} (${val.timeRange})`,
                      })
                    )}
                    triggerClassName="h-9 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E3E7EA]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setEditingDraft(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={actionMutation.isPending}
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        )}

{/* Tabel Utama Draft Paket (Table-first) */ }
<div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
  {isLoading ? (
    <div className="h-48 animate-pulse bg-white p-4" />
  ) : drafts.length === 0 ? (
    <div className="p-8 text-center space-y-2">
      <Package className="h-6 w-6 text-[#8D98A0] mx-auto" />
      <p className="text-xs font-semibold text-[#182126]">
        Tidak ada draft paket
      </p>
      <p className="text-xs text-[#626E76]">
        Mulai tambahkan paket untuk digabung dengan penjual di cluster Anda.
      </p>
      <Link href="/drafts/new">
        <Button size="sm" className="h-8 text-xs mt-2">
          Buat Draft Paket
        </Button>
      </Link>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#F6F7F8] text-[#626E76] font-semibold border-b border-[#E3E7EA]">
          <tr>
            <th className="py-2.5 px-4">Penerima & Alamat</th>
            <th className="py-2.5 px-3">Kurir</th>
            <th className="py-2.5 px-3">Jadwal pickup</th>
            <th className="py-2.5 px-3 text-right">Berat</th>
            <th className="py-2.5 px-3">Status</th>
            <th className="py-2.5 px-3">Pickup bersama</th>
            <th className="py-2.5 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E3E7EA]">
          {drafts.map((d) => {
            const isEditable = d.status === "DRAFT" || d.status === "QUEUED";
            return (
              <tr key={d.id} className="hover:bg-[#FAFAFA] transition-colors h-14">
                <td className="py-2.5 px-4">
                  <p className="font-semibold text-[#182126]">
                    {d.recipientName}
                  </p>
                  <p className="text-[11px] text-[#626E76]">
                    {d.city}, {d.province} • {d.recipientPhone}
                  </p>
                </td>
                <td className="py-2.5 px-3 font-medium text-[#182126]">
                  {COURIER_LABELS[d.courier] || d.courier}
                </td>
                <td className="py-2.5 px-3 text-[#182126]">
                  <span className="block font-medium">{formatDateId(d.pickupDate)}</span>
                  <span className="text-[11px] text-[#626E76]">
                    {PICKUP_WINDOW_LABELS[d.pickupWindow]?.label}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums font-medium text-[#182126]">
                  {formatWeight(d.weightGram)}
                </td>
                <td className="py-2.5 px-3">
                  <DraftStatusBadge status={d.status} />
                </td>
                <td className="py-2.5 px-3">
                  {d.groupPickupCode ? (
                    <Link
                      href={`/pickups/${d.groupPickupId}`}
                      className="font-medium text-[#17685F] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{d.groupPickupCode}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-[#8D98A0]">-</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {d.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] gap-1"
                        disabled={actionMutation.isPending}
                        onClick={() =>
                          actionMutation.mutate({
                            action: "QUEUE_DRAFT",
                            draftId: d.id,
                          })
                        }
                      >
                        <Send className="h-3 w-3" />
                        <span>Antrekan</span>
                      </Button>
                    )}

                    {isEditable ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingDraft(d)}
                          className="rounded border border-[#E3E7EA] bg-white p-1.5 text-[#626E76] hover:bg-[#F6F7F8] hover:text-[#182126]"
                          title="Edit draft"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({
                              action: "CANCEL_DRAFT",
                              draftId: d.id,
                            })
                          }
                          className="rounded border border-[#E3E7EA] bg-white p-1.5 text-[#626E76] hover:bg-[#FDF2F1] hover:text-[#B42318] hover:border-[#F8D2CF]"
                          title="Batalkan draft"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8D98A0]">
                        <Lock className="h-3 w-3" />
                        Terkunci
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</div>
      </div >
    </AppShell >
  );
}
