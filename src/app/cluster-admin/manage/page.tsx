"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DraftStatusBadge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import { COURIER_LABELS, PICKUP_WINDOW_LABELS } from "@/lib/constants";
import { formatWeight, formatDateId } from "@/lib/utils";

const ALL_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const ALL_WINDOWS = ["MORNING", "AFTERNOON", "EVENING", "NIGHT"];

export default function ClusterManagePage() {
  const queryClient = useQueryClient();
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data: dashData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      return res.json();
    },
  });

  const managedClusters = React.useMemo(
    () => dashData?.clusterAdminStats?.managedClusters || [],
    [dashData]
  );

  useEffect(() => {
    if (!selectedClusterId && managedClusters.length > 0) {
      setSelectedClusterId(managedClusters[0].id);
    }
  }, [managedClusters, selectedClusterId]);

  const { data: clustersData } = useQuery({
    queryKey: ["clusters", "manage-view"],
    queryFn: async () => {
      const res = await fetch("/api/clusters");
      return res.json();
    },
  });

  const { data: clusterDraftsData } = useQuery({
    queryKey: ["drafts", "cluster", selectedClusterId],
    queryFn: async () => {
      const res = await fetch(
        `/api/drafts?scope=cluster&clusterId=${encodeURIComponent(
          selectedClusterId
        )}`
      );
      return res.json();
    },
    enabled: !!selectedClusterId,
  });

  const activeCluster = (clustersData?.clusters || []).find(
    (c: { id: string }) => c.id === selectedClusterId
  );

  const [formState, setFormState] = useState({
    name: "",
    code: "",
    description: "",
    centerAddress: "",
    radiusKm: 2.5,
    pickupDays: [] as string[],
    pickupTimeWindows: [] as string[],
    minPackages: 10,
    minTotalWeightGram: 10000,
    basePickupFee: 25000,
    platformFeePercent: 10,
  });

  useEffect(() => {
    if (activeCluster) {
      setFormState({
        name: activeCluster.name,
        code: activeCluster.code,
        description: activeCluster.description,
        centerAddress: activeCluster.centerAddress,
        radiusKm: activeCluster.radiusKm,
        pickupDays: activeCluster.pickupDays || [],
        pickupTimeWindows: activeCluster.pickupTimeWindows || [],
        minPackages: activeCluster.minPackages,
        minTotalWeightGram: activeCluster.minTotalWeightGram,
        basePickupFee: activeCluster.basePickupFee,
        platformFeePercent: activeCluster.platformFeePercent,
      });
    }
  }, [activeCluster]);

  const updateClusterMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/clusters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_CLUSTER",
          clusterId: selectedClusterId,
          ...formState,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan pengaturan");
      return json;
    },
    onSuccess: (res) => {
      setFeedback({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const moderateMemberMutation = useMutation({
    mutationFn: async (payload: {
      memberId: string;
      decision: "ACTIVE" | "REJECTED";
    }) => {
      const res = await fetch("/api/clusters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MODERATE_MEMBER", ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses anggota");
      return json;
    },
    onSuccess: (res) => {
      setFeedback({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const clusterDrafts = clusterDraftsData?.drafts || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <Link
              href="/cluster-admin"
              className="inline-flex items-center gap-1.5 text-xs text-[#626E76] hover:text-[#182126] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke operasional cluster
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-[#182126]">
              Manajemen Cluster & Anggota
            </h1>
            <p className="text-xs text-[#626E76]">
              Konfigurasi parameter area, titik kumpul, kuota minimum, dan keanggotaan penjual.
            </p>
          </div>

          {managedClusters.length > 1 && (
            <CustomSelect
              value={selectedClusterId}
              onChange={setSelectedClusterId}
              placeholder="Pilih Cluster..."
              options={managedClusters.map(
                (c: { id: string; name: string; code: string }) => ({
                  value: c.id,
                  label: `Cluster: ${c.name} (${c.code})`,
                })
              )}
              triggerClassName="h-8 rounded-lg text-xs font-semibold"
              className="w-auto min-w-[220px]"
            />
          )}
        </div>

        {feedback && (
          <div
            className={`rounded border px-3 py-2 text-xs font-medium flex items-center justify-between ${
              feedback.type === "success"
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

        {activeCluster && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Form Konfigurasi Cluster */}
            <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
              <div className="p-4 border-b border-[#E3E7EA] bg-[#FAFAFA]">
                <h2 className="text-sm font-semibold text-[#182126]">
                  Parameter Cluster ({activeCluster.code})
                </h2>
                <p className="text-xs text-[#626E76]">
                  Titik kumpul, jam operasional, dan kuota minimum pickup
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateClusterMutation.mutate();
                }}
                className="p-4 space-y-4 text-xs"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Nama Cluster</Label>
                  <Input
                    value={formState.name}
                    onChange={(e) =>
                      setFormState({ ...formState, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Deskripsi Area</Label>
                  <Input
                    value={formState.description}
                    onChange={(e) =>
                      setFormState({ ...formState, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Alamat Pusat / Titik Kumpul</Label>
                    <Input
                      value={formState.centerAddress}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          centerAddress: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Radius (Km)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formState.radiusKm}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          radiusKm: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Hari Operasional</Label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ALL_DAYS.map((day) => {
                      const active = formState.pickupDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? formState.pickupDays.filter((d) => d !== day)
                              : [...formState.pickupDays, day];
                            setFormState({ ...formState, pickupDays: next });
                          }}
                          className={`rounded px-2.5 py-1 text-xs font-medium border ${
                            active
                              ? "bg-[#17685F] text-white border-[#17685F]"
                              : "bg-white text-[#626E76] border-[#E3E7EA]"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Jendela Waktu Operasional</Label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ALL_WINDOWS.map((w) => {
                      const active = formState.pickupTimeWindows.includes(w);
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? formState.pickupTimeWindows.filter((item) => item !== w)
                              : [...formState.pickupTimeWindows, w];
                            setFormState({ ...formState, pickupTimeWindows: next });
                          }}
                          className={`rounded px-2.5 py-1 text-xs font-medium border ${
                            active
                              ? "bg-[#17685F] text-white border-[#17685F]"
                              : "bg-white text-[#626E76] border-[#E3E7EA]"
                          }`}
                        >
                          {PICKUP_WINDOW_LABELS[w]?.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Min. Paket</Label>
                    <Input
                      type="number"
                      value={formState.minPackages}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          minPackages: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Min. Berat (Gram)</Label>
                    <Input
                      type="number"
                      step={500}
                      value={formState.minTotalWeightGram}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          minTotalWeightGram: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Biaya Pickup (Rp)</Label>
                    <Input
                      type="number"
                      step={1000}
                      value={formState.basePickupFee}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          basePickupFee: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Fee Platform (%)</Label>
                    <Input
                      type="number"
                      step={1}
                      value={formState.platformFeePercent}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          platformFeePercent: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E3E7EA] flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    disabled={updateClusterMutation.isPending}
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </div>

            {/* Daftar Anggota Penjual */}
            <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
              <div className="p-4 border-b border-[#E3E7EA] bg-[#FAFAFA]">
                <h2 className="text-sm font-semibold text-[#182126]">
                  Anggota Penjual ({activeCluster.members?.length || 0})
                </h2>
                <p className="text-xs text-[#626E76]">
                  Status keanggotaan penjual di {activeCluster.name}
                </p>
              </div>

              <div className="divide-y divide-[#E3E7EA] max-h-[520px] overflow-y-auto">
                {(activeCluster.members || []).map((m: {
                  id: string;
                  userName: string;
                  storeName: string;
                  businessType: string;
                  userPhone: string;
                  address: string;
                  status: string;
                }) => (
                  <div key={m.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#FAFAFA]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#182126]">
                          {m.userName} ({m.storeName})
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                          m.status === "ACTIVE"
                            ? "bg-[#EAF5EF] text-[#144D33] border-[#C3E6D3]"
                            : m.status === "PENDING"
                            ? "bg-[#FEF7E6] text-[#734C00] border-[#F9E2B6]"
                            : "bg-[#F6F7F8] text-[#626E76] border-[#E3E7EA]"
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#626E76]">
                        {m.businessType} • WA: {m.userPhone}
                      </p>
                      <p className="text-[11px] text-[#626E76]">
                        {m.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {m.status !== "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() =>
                            moderateMemberMutation.mutate({
                              memberId: m.id,
                              decision: "ACTIVE",
                            })
                          }
                          className="rounded border border-[#E3E7EA] bg-white px-2 py-1 text-[11px] font-medium text-[#182126] hover:bg-[#F6F7F8]"
                        >
                          Setujui
                        </button>
                      )}
                      {m.status !== "REJECTED" && (
                        <button
                          type="button"
                          onClick={() =>
                            moderateMemberMutation.mutate({
                              memberId: m.id,
                              decision: "REJECTED",
                            })
                          }
                          className="rounded border border-[#E3E7EA] bg-white px-2 py-1 text-[11px] font-medium text-[#B42318] hover:bg-[#FDF2F1]"
                        >
                          Nonaktifkan
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabel Semua Draft Paket dalam Cluster */}
        <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
          <div className="p-4 border-b border-[#E3E7EA] bg-[#FAFAFA]">
            <h2 className="text-sm font-semibold text-[#182126]">
              Seluruh Draft Paket dalam Cluster ({clusterDrafts.length})
            </h2>
            <p className="text-xs text-[#626E76]">
              Daftar paket aktif seluruh anggota penjual di cluster ini
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F7F8] text-[#626E76] font-semibold border-b border-[#E3E7EA]">
                <tr>
                  <th className="py-2.5 px-4">Pengirim / Toko</th>
                  <th className="py-2.5 px-3">Penerima & Kota</th>
                  <th className="py-2.5 px-3">Kurir</th>
                  <th className="py-2.5 px-3">Jadwal pickup</th>
                  <th className="py-2.5 px-3 text-right">Berat</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7EA]">
                {clusterDrafts.map((d: {
                  id: string;
                  sellerName: string;
                  storeName: string;
                  recipientName: string;
                  city: string;
                  province: string;
                  courier: string;
                  pickupDate: string;
                  pickupWindow: string;
                  weightGram: number;
                  status: string;
                }) => (
                  <tr key={d.id} className="hover:bg-[#FAFAFA] transition-colors h-14">
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-[#182126] block">
                        {d.storeName}
                      </span>
                      <span className="text-[11px] text-[#626E76]">
                        {d.sellerName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-[#182126] block">
                        {d.recipientName}
                      </span>
                      <span className="text-[11px] text-[#626E76]">
                        {d.city}, {d.province}
                      </span>
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
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#182126]">
                      {formatWeight(d.weightGram)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <DraftStatusBadge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
