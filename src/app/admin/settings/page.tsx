"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Users,
  MapPin,
  Save,
  RotateCcw,
  Wallet,
  History,
  ShieldAlert,
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
import { Badge } from "@/components/ui/badge";
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Admin Aplikasi: Pengaturan Tarif, Fee & Statistik Platform
            </h1>
            <p className="text-sm text-slate-600">
              Atur tarif dasar pickup, persentase fee platform, kuota minimum
              paket/berat, serta kelola seluruh pengguna dan cluster.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              saveConfigMutation.mutate({ action: "RESET_DEMO_DATA" })
            }
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-orange-600" />
            <span>Reset ke Seed Data Awal</span>
          </Button>
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

        {isLoading ? (
          <div className="h-48 rounded-xl bg-slate-200/70 animate-pulse" />
        ) : error ? (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-6 text-center space-y-2">
              <ShieldAlert className="h-8 w-8 text-red-600 mx-auto" />
              <p className="text-sm font-bold text-red-900">
                {(error as Error).message}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Statistik Seluruh Aplikasi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-teal-700">
                <CardContent className="pt-5">
                  <span className="text-xs font-semibold text-slate-500">
                    Total Pengguna & Cluster
                  </span>
                  <p className="mt-1.5 text-2xl font-extrabold text-slate-900">
                    {stats?.totalUsers} User • {stats?.totalClusters} Cluster
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {stats?.totalSellers} Penjual UMKM,{" "}
                    {stats?.totalClusterAdmins} Admin Cluster
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-5">
                  <span className="text-xs font-semibold text-slate-500">
                    Total Draft & Pickup Bersama
                  </span>
                  <p className="mt-1.5 text-2xl font-extrabold text-slate-900">
                    {stats?.totalDrafts} Paket
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {stats?.completedPickupsCount} dari{" "}
                    {stats?.totalGroupPickups} Pickup Bersama selesai
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5">
                  <span className="text-xs font-semibold text-slate-500">
                    Total Berat Terkonsolidasi
                  </span>
                  <p className="mt-1.5 text-2xl font-extrabold text-teal-900">
                    {formatWeight(stats?.totalWeightConsolidatedGram || 0)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Seluruh cluster aktif
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-teal-900 text-white border-none">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-200">
                      Pendapatan Fee Platform
                    </span>
                    <Wallet className="h-4 w-4 text-orange-400" />
                  </div>
                  <p className="mt-1.5 text-2xl font-extrabold text-white">
                    {formatRupiah(stats?.totalPlatformFeeRevenue || 0)}
                  </p>
                  <p className="text-[11px] text-teal-200 mt-0.5">
                    Dari pickup bersama yang selesai
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Form Pengaturan Tarif Dasar, Biaya Pickup, Minimum Berat, Minimum Paket & Fee Platform */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <Card className="border-2 border-teal-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings className="h-5 w-5 text-teal-700" />
                      Pengaturan Tarif Dasar, Kuota Minimum & Fee Platform
                    </CardTitle>
                    <CardDescription>
                      Atur parameter global perhitungan biaya pickup bersama.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveConfigMutation.mutate({
                          action: "UPDATE_TARIFF",
                          ...configForm,
                        });
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Biaya Pickup Dasar (Rp)</Label>
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

                        <div className="space-y-1.5">
                          <Label>Persentase Fee Platform (%)</Label>
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Minimum Jumlah Paket</Label>
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

                        <div className="space-y-1.5">
                          <Label>Minimum Total Berat (Gram)</Label>
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

                      <label className="flex items-center gap-2.5 rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs font-semibold text-teal-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={configForm.applyToAllClusters}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              applyToAllClusters: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-teal-400 text-teal-700"
                        />
                        <span>
                          Terapkan tarif & kuota baru ini secara serentak ke
                          seluruh Cluster aktif sekarang
                        </span>
                      </label>

                      <Button
                        type="submit"
                        variant="cta"
                        className="w-full gap-2"
                        disabled={saveConfigMutation.isPending}
                      >
                        <Save className="h-4 w-4" />
                        <span>
                          {saveConfigMutation.isPending
                            ? "Menyimpan..."
                            : "Simpan Pengaturan Tarif & Fee Platform"}
                        </span>
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Daftar Seluruh Cluster */}
              <div className="lg:col-span-6">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="h-5 w-5 text-teal-700" />
                      Daftar Seluruh Cluster ({clusters.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {clusters.map(
                      (c: {
                        id: string;
                        name: string;
                        code: string;
                        adminName: string;
                        activeMembers: number;
                        pickupCount: number;
                        minPackages: number;
                        minTotalWeightGram: number;
                        basePickupFee: number;
                        platformFeePercent: number;
                      }) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-slate-200 p-3.5 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold bg-teal-900 text-white px-2 py-0.5 rounded">
                                {c.code}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {c.name}
                              </span>
                            </div>
                            <Badge variant="teal">
                              {c.activeMembers} Penjual Aktif
                            </Badge>
                          </div>
                          <p className="text-slate-600">
                            Admin: <strong>{c.adminName}</strong> • Total Pickup
                            Bersama: <strong>{c.pickupCount}x</strong>
                          </p>
                          <p className="text-teal-800 font-semibold">
                            Kuota Min: {c.minPackages} pkt /{" "}
                            {formatWeight(c.minTotalWeightGram)} • Tarif:{" "}
                            {formatRupiah(c.basePickupFee)} (+Fee{" "}
                            {c.platformFeePercent}%)
                          </p>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabel Manajemen Pengguna & Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-teal-700" />
                  Manajemen Semua Pengguna ({users.length} Akun)
                </CardTitle>
                <CardDescription>
                  Admin Aplikasi dapat mengatur peran pengguna (SELLER,
                  CLUSTER_ADMIN, PLATFORM_ADMIN).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Nama & Email</th>
                        <th className="py-2.5 px-3">Nama Toko & Usaha</th>
                        <th className="py-2.5 px-3">Cluster Aktif</th>
                        <th className="py-2.5 px-3 text-center">Jml Draft</th>
                        <th className="py-2.5 px-3">Role / Peran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(
                        (u: {
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
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block">
                                {u.name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {u.email}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-800 block">
                                {u.storeName}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {u.businessType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {u.clusterCode !== "-" ? (
                                <Badge variant="outline">
                                  {u.clusterName} ({u.clusterCode})
                                </Badge>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {u.draftCount}
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                value={u.role}
                                onChange={(e) =>
                                  saveConfigMutation.mutate({
                                    action: "UPDATE_USER_ROLE",
                                    userId: u.id,
                                    newRole: e.target.value,
                                  })
                                }
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
                              >
                                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v} ({k})
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log Seluruh Platform */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-5 w-5 text-teal-700" />
                  Audit & Activity Log Platform
                </CardTitle>
                <CardDescription>
                  Semua perubahan penting tercatat: siapa, kapan, dan apa yang
                  berubah.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5 max-h-80 overflow-y-auto text-xs">
                  {activityLogs.map(
                    (log: {
                      id: string;
                      actorName: string;
                      actorRole: string;
                      action: string;
                      summary: string;
                      details?: string;
                      createdAt: string;
                    }) => (
                      <div
                        key={log.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="teal">{log.action}</Badge>
                            <span className="font-bold text-slate-900">
                              {log.summary}
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-[11px] text-slate-600 mt-1">
                              {log.details}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-[11px] text-slate-500 shrink-0">
                          <span className="font-semibold text-slate-700 block">
                            {log.actorName} ({log.actorRole})
                          </span>
                          <span>{formatDateId(log.createdAt)}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

