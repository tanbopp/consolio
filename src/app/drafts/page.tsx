"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  PlusCircle,
  Edit3,
  XCircle,
  Send,
  Lock,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DraftStatusBadge } from "@/components/ui/badge";
import {
  COURIER_LABELS,
  PICKUP_WINDOW_LABELS,
  DRAFT_STATUS_CONFIG,
  INDONESIAN_PROVINCES,
} from "@/lib/constants";
import { formatRupiah, formatWeight, formatDateId } from "@/lib/utils";

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Draft Pengiriman Saya
            </h1>
            <p className="text-sm text-slate-600">
              Kelola daftar paket Anda. Sesuai aturan bisnis, draft hanya dapat
              diedit atau dibatalkan sebelum status berubah menjadi{" "}
              <strong>Siap Pickup</strong>.
            </p>
          </div>
          <Link href="/drafts/new">
            <Button variant="cta" className="gap-1.5">
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Draft Paket</span>
            </Button>
          </Link>
        </div>

        {feedback && (
          <div
            className={`rounded-xl border p-4 text-sm font-medium flex items-center justify-between ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline ml-4"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <Card>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Filter Status Draft</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                >
                  <option value="">Semua Status ({drafts.length})</option>
                  {Object.entries(DRAFT_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label} ({k})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Filter Kurir</Label>
                <select
                  value={courierFilter}
                  onChange={(e) => setCourierFilter(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                >
                  <option value="">Semua Kurir</option>
                  {Object.entries(COURIER_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    setStatusFilter("");
                    setCourierFilter("");
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal Edit Draft */}
        {editingDraft && (
          <Card className="border-2 border-teal-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">
                Edit Draft Paket — {editingDraft.recipientName}
              </CardTitle>
              <CardDescription>
                Ubah data penerima, berat, atau jadwal sebelum mencapai status
                Siap Pickup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  actionMutation.mutate({
                    action: "UPDATE_DRAFT",
                    draftId: editingDraft.id,
                    ...editingDraft,
                  });
                }}
                className="space-y-4"
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
                    <Label className="text-xs">Alamat Lengkap Tujuan</Label>
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
                    <select
                      value={editingDraft.province}
                      onChange={(e) =>
                        setEditingDraft({
                          ...editingDraft,
                          province: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    >
                      {INDONESIAN_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
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
                    <select
                      value={editingDraft.courier}
                      onChange={(e) =>
                        setEditingDraft({
                          ...editingDraft,
                          courier: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    >
                      {Object.entries(COURIER_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
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
                    <select
                      value={editingDraft.pickupWindow}
                      onChange={(e) =>
                        setEditingDraft({
                          ...editingDraft,
                          pickupWindow: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    >
                      {Object.entries(PICKUP_WINDOW_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDraft(null)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={actionMutation.isPending}
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Daftar Kartu & Tabel Responsif */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-slate-200/70 animate-pulse"
              />
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Belum Ada Draft Pengiriman
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Anda belum memiliki draft pengiriman yang sesuai filter ini.
                Mulai tambahkan paket Anda untuk ikut patungan pickup kurir!
              </p>
              <Link href="/drafts/new" className="inline-block pt-2">
                <Button variant="cta" size="sm">
                  Buat Draft Pengiriman
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {drafts.map((d) => {
              const isEditable = d.status === "DRAFT" || d.status === "QUEUED";
              return (
                <Card
                  key={d.id}
                  className="hover:border-teal-300 transition-colors"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <DraftStatusBadge status={d.status} />
                          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {COURIER_LABELS[d.courier] || d.courier}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            📅 {formatDateId(d.pickupDate)} •{" "}
                            {PICKUP_WINDOW_LABELS[d.pickupWindow]?.label} (
                            {PICKUP_WINDOW_LABELS[d.pickupWindow]?.timeRange})
                          </span>
                          {d.groupPickupCode && (
                            <Link
                              href={`/pickups/${d.groupPickupId}`}
                              className="inline-flex items-center gap-1 rounded bg-purple-50 border border-purple-200 px-2 py-0.5 font-mono text-xs font-bold text-purple-800 hover:underline"
                            >
                              <span>{d.groupPickupCode}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>

                        <div className="pt-1">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            Penerima: {d.recipientName}{" "}
                            <span className="font-normal text-xs text-slate-500">
                              ({d.recipientPhone})
                            </span>
                          </h3>
                          <p className="text-xs text-slate-600">
                            Tujuan: {d.destinationAddress}, {d.city},{" "}
                            {d.province} {d.postalCode}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                          <span>
                            Berat:{" "}
                            <strong className="text-slate-800">
                              {formatWeight(d.weightGram)}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Dimensi: {d.lengthCm}×{d.widthCm}×{d.heightCm} cm
                          </span>
                          <span>•</span>
                          <span>Nilai: {formatRupiah(d.itemValue)}</span>
                          {d.allocatedCharge !== null &&
                            d.allocatedCharge !== undefined && (
                              <>
                                <span>•</span>
                                <span className="text-teal-800 font-bold">
                                  Tagihan Paket Ini:{" "}
                                  {formatRupiah(d.allocatedCharge)}
                                </span>
                              </>
                            )}
                        </div>
                        {d.notes && (
                          <p className="text-[11px] italic text-slate-500">
                            Catatan: &ldquo;{d.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Aksi berdasarkan status */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                        {d.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="cta"
                            className="gap-1.5 text-xs"
                            disabled={actionMutation.isPending}
                            onClick={() =>
                              actionMutation.mutate({
                                action: "QUEUE_DRAFT",
                                draftId: d.id,
                              })
                            }
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Masukkan ke Antrean Gabung</span>
                          </Button>
                        )}

                        {isEditable ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs"
                              onClick={() => setEditingDraft(d)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1 text-xs"
                              disabled={actionMutation.isPending}
                              onClick={() =>
                                actionMutation.mutate({
                                  action: "CANCEL_DRAFT",
                                  draftId: d.id,
                                })
                              }
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Batalkan</span>
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-600">
                            <Lock className="h-3.5 w-3.5 text-slate-500" />
                            <span>
                              Terkunci ({DRAFT_STATUS_CONFIG[d.status]?.label})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

