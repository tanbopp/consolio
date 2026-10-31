"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/lib/constants";
import { formatRupiah, formatWeight, formatDateId } from "@/lib/utils";

export default function PlatformAdminSettingsPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [configForm, setConfigForm] = useState({
    defaultBasePickupFee: 25000,
    defaultPlatformFeePct: 10,
    defaultMinPackages: 10,
    defaultMinWeightGram: 10000,
    soloPickupEstimateRp: 15000,
    applyToAllClusters: true,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data admin");
      return json;
    },
  });

  useEffect(() => {
    if (data?.config) {
      setConfigForm({
        defaultBasePickupFee: data.config.defaultBasePickupFee,
        defaultPlatformFeePct: data.config.defaultPlatformFeePct,
        defaultMinPackages: data.config.defaultMinPackages,
        defaultMinWeightGram: data.config.defaultMinWeightGram,
        soloPickupEstimateRp: data.config.soloPickupEstimateRp,
        applyToAllClusters: true,
      });
    }
  }, [data]);

  const saveConfigMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      return json;
    },
    onSuccess: (res) => {
      setFeedback({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const stats = data?.stats;
  const users = data?.users || [];
  const clusters = data?.clusters || [];
  const activityLogs = data?.activityLogs || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#182126]">
              Admin Aplikasi: Tarif & Platform
            </h1>
            <p className="text-xs text-[#626E76] mt-0.5">
              Tarif dasar pickup, kuota minimum, persentase fee platform, dan hak akses pengguna.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              saveConfigMutation.mutate({ action: "RESET_DEMO_DATA" })
            }
            className="gap-1.5 text-xs h-8"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#626E76]" />
            <span>Reset ke Seed Awal</span>
          </Button>
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

        {isLoading ? (
          <div className="h-36 rounded border border-[#E3E7EA] bg-white animate-pulse" />
        ) : error ? (
          <div className="rounded border border-[#F8D2CF] bg-[#FDF2F1] p-4 text-center text-xs text-[#911D13] flex items-center justify-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>{(error as Error).message}</span>
          </div>
        ) : (
          <>
            {/* Summary Strip Seluruh Platform */}
            <div className="rounded border border-[#E3E7EA] bg-white p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E3E7EA]">
                <div className="py-2 sm:py-0 sm:px-3 first:pl-0">
                  <span className="text-[11px] font-medium text-[#626E76] block">Pengguna & cluster</span>
                  <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                    {stats?.totalUsers} User / {stats?.totalClusters} Cluster
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    {stats?.totalSellers} penjual UMKM
                  </span>
                </div>

                <div className="py-2 sm:py-0 sm:px-3">
                  <span className="text-[11px] font-medium text-[#626E76] block">Total draft & pickup</span>
                  <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                    {stats?.totalDrafts} Paket / {stats?.totalGroupPickups} Pickup
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    {stats?.completedPickupsCount} pickup selesai
                  </span>
                </div>

                <div className="py-2 sm:py-0 sm:px-3">
                  <span className="text-[11px] font-medium text-[#626E76] block">Total berat konsolidasi</span>
                  <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                    {formatWeight(stats?.totalWeightConsolidatedGram || 0)}
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    Semua cluster aktif
                  </span>
                </div>

                <div className="py-2 sm:py-0 sm:px-3 last:pr-0">
                  <span className="text-[11px] font-medium text-[#626E76] block">Pendapatan fee platform</span>
                  <p className="text-lg font-bold text-[#17685F] mt-0.5 tabular-nums">
                    {formatRupiah(stats?.totalPlatformFeeRevenue || 0)}
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    Dari pickup selesai
                  </span>
                </div>
              </div>
            </div>

            {/* Konfigurasi Global & Cluster */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Form Tarif Global */}
              <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
                <div className="p-4 border-b border-[#E3E7EA] bg-[#FAFAFA]">
                  <h2 className="text-sm font-semibold text-[#182126]">
                    Pengaturan Tarif Dasar & Fee Platform
                  </h2>
                  <p className="text-xs text-[#626E76]">
                    Parameter global dasar untuk seluruh cluster
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveConfigMutation.mutate({
                      action: "UPDATE_TARIFF",
                      ...configForm,
                    });
                  }}
                  className="p-4 space-y-3 text-xs"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Biaya Pickup Dasar (Rp)</Label>
                      <Input
                        type="number"
                        step={1000}
                        value={configForm.defaultBasePickupFee}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            defaultBasePickupFee: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Fee Platform (%)</Label>
                      <Input
                        type="number"
                        step={0.5}
                        value={configForm.defaultPlatformFeePct}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            defaultPlatformFeePct: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Min. Jumlah Paket</Label>
                      <Input
                        type="number"
                        value={configForm.defaultMinPackages}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            defaultMinPackages: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Min. Total Berat (Gram)</Label>
                      <Input
                        type="number"
                        step={500}
                        value={configForm.defaultMinWeightGram}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            defaultMinWeightGram: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 rounded border border-[#E3E7EA] p-2.5 text-xs text-[#182126] cursor-pointer bg-[#F8FAFA]">
                    <input
                      type="checkbox"
                      checked={configForm.applyToAllClusters}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          applyToAllClusters: e.target.checked,
                        })
                      }
                      className="rounded border-[#E3E7EA] text-[#17685F]"
                    />
                    <span>Terapkan serentak ke seluruh cluster aktif sekarang</span>
                  </label>

                  <div className="pt-2 border-t border-[#E3E7EA] flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 text-xs font-semibold"
                      disabled={saveConfigMutation.isPending}
                    >
                      Simpan Parameter Global
                    </Button>
                  </div>
                </form>
              </div>

              {/* Daftar Seluruh Cluster */}
              <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
                <div className="p-4 border-b border-[#E3E7EA] bg-[#FAFAFA]">
                  <h2 className="text-sm font-semibold text-[#182126]">
                    Daftar Seluruh Cluster ({clusters.length})
                  </h2>
                  <p className="text-xs text-[#626E76]">
                    Cluster area fisik terdaftar dalam sistem Consolio
                  </p>
                </div>

                <div className="divide-y divide-[#E3E7EA] max-h-[360px] overflow-y-auto">
                  {clusters.map((c: {
                    id: string;
                    name: string;
                    code: string;
                    adminName: string;
                    activeMembers: number;
                    pickupCount: number;
                    minPackages: number;
                    minTotalWeightGram: number;
                    basePickupFee: number;
                  }) => (
                    <div key={c.id} className="p-3.5 text-xs space-y-1 hover:bg-[#FAFAFA]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#182126]">
                          {c.name} ({c.code})
                        </span>
                        <span className="text-[11px] text-[#626E76]">
                          {c.activeMembers} penjual • {c.pickupCount}x pickup
                        </span>
                      </div>
                      <p className="text-[11px] text-[#626E76]">
                        Admin: {c.adminName} • Kuota: {c.minPackages} pkt / {formatWeight(c.minTotalWeightGram)} • Biaya: {formatRupiah(c.basePickupFee)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Manajemen Pengguna & Role */}
            <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
              <div className="p-4 border-b border-[#E3E7EA] bg-[#FAFAFA]">
                <h2 className="text-sm font-semibold text-[#182126]">
                  Manajemen Pengguna ({users.length} Akun)
                </h2>
                <p className="text-xs text-[#626E76]">
                  Pengaturan hak akses peran pengguna sistem
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F7F8] text-[#626E76] font-semibold border-b border-[#E3E7EA]">
                    <tr>
                      <th className="py-2.5 px-4">Nama & Email</th>
                      <th className="py-2.5 px-3">Toko & Usaha</th>
                      <th className="py-2.5 px-3">Cluster Aktif</th>
                      <th className="py-2.5 px-3 text-right">Draft</th>
                      <th className="py-2.5 px-4">Peran (Role)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E7EA]">
                    {users.map((u: {
                      id: string;
                      name: string;
                      email: string;
                      storeName: string;
                      businessType: string;
                      clusterName: string;
                      clusterCode: string;
                      draftCount: number;
                      role: string;
                    }) => (
                      <tr key={u.id} className="hover:bg-[#FAFAFA] transition-colors h-14">
                        <td className="py-2.5 px-4">
                          <p className="font-semibold text-[#182126]">{u.name}</p>
                          <p className="text-[11px] text-[#626E76]">{u.email}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-[#182126]">{u.storeName}</p>
                          <p className="text-[11px] text-[#626E76]">{u.businessType}</p>
                        </td>
                        <td className="py-2.5 px-3 text-[#182126]">
                          {u.clusterCode !== "-" ? `${u.clusterName} (${u.clusterCode})` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#182126]">
                          {u.draftCount}
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              saveConfigMutation.mutate({
                                action: "UPDATE_USER_ROLE",
                                userId: u.id,
                                newRole: e.target.value,
                              })
                            }
                            className="rounded border border-[#E3E7EA] bg-white px-2 py-1 text-xs text-[#182126]"
                          >
                            {Object.entries(ROLE_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Activity Log */}
            <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
              <div className="p-4 border-b border-[#E3E7EA] bg-[#FAFAFA]">
                <h2 className="text-sm font-semibold text-[#182126]">
                  Audit & Log Aktivitas
                </h2>
                <p className="text-xs text-[#626E76]">
                  Riwayat transaksi dan perubahan data operasional
                </p>
              </div>

              <div className="divide-y divide-[#E3E7EA] max-h-72 overflow-y-auto">
                {activityLogs.map((log: {
                  id: string;
                  actorName: string;
                  action: string;
                  summary: string;
                  details?: string;
                  createdAt: string;
                }) => (
                  <div key={log.id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-[#FAFAFA]">
                    <div>
                      <p className="font-medium text-[#182126]">
                        {log.summary}
                      </p>
                      {log.details && (
                        <p className="text-[11px] text-[#626E76]">
                          {log.details}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8D98A0] shrink-0">
                      {log.actorName} • {formatDateId(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
