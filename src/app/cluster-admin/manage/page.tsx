"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Users,
  Package,
  Save,
  CheckCircle2,
  XCircle,
  ArrowLeft,
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
import { Badge, DraftStatusBadge } from "@/components/ui/badge";
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/cluster-admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Dashboard Admin Cluster
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Manajemen Cluster, Anggota & Semua Draft Paket
            </h1>
            <p className="text-sm text-slate-600">
              Atur jam operasional, kuota minimum pickup, biaya pickup dasar,
              dan kelola anggota penjual di cluster Anda.
            </p>
          </div>

          {managedClusters.length > 1 && (
            <select
              value={selectedClusterId}
              onChange={(e) => setSelectedClusterId(e.target.value)}
              className="flex h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-teal-900"
            >
              {managedClusters.map(
                (c: { id: string; name: string; code: string }) => (
                  <option key={c.id} value={c.id}>
                    Cluster: {c.name} ({c.code})
                  </option>
                )
              )}
            </select>
          )}
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

        {activeCluster && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pengaturan Cluster */}
            <div className="lg:col-span-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-5 w-5 text-teal-700" />
                    Konfigurasi Area & Kuota Minimum ({activeCluster.code})
                  </CardTitle>
                  <CardDescription>
                    Perubahan kuota minimum langsung dievaluasi terhadap draft
                    aktif.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateClusterMutation.mutate();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label>Nama Cluster</Label>
                      <Input
                        value={formState.name}
                        onChange={(e) =>
                          setFormState({ ...formState, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Deskripsi</Label>
                      <Input
                        value={formState.description}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label>Alamat Pusat / Titik Kumpul</Label>
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
                      <div className="space-y-1.5">
                        <Label>Radius (Km)</Label>
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

                    <div className="space-y-1.5">
                      <Label>Hari Operasional</Label>
                      <div className="flex flex-wrap gap-1.5">
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
                                setFormState({
                                  ...formState,
                                  pickupDays: next,
                                });
                              }}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                                active
                                  ? "bg-teal-700 text-white border-teal-700"
                                  : "bg-white text-slate-600 border-slate-300"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Jendela Waktu Pickup</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_WINDOWS.map((w) => {
                          const active =
                            formState.pickupTimeWindows.includes(w);
                          return (
                            <button
                              key={w}
                              type="button"
                              onClick={() => {
                                const next = active
                                  ? formState.pickupTimeWindows.filter(
                                      (item) => item !== w
                                    )
                                  : [...formState.pickupTimeWindows, w];
                                setFormState({
                                  ...formState,
                                  pickupTimeWindows: next,
                                });
                              }}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                                active
                                  ? "bg-teal-700 text-white border-teal-700"
                                  : "bg-white text-slate-600 border-slate-300"
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
                        <Label className="text-xs">Min. Paket</Label>
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
                        <Label className="text-xs">Min. Berat (Gram)</Label>
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
                        <Label className="text-xs">Biaya Pickup (Rp)</Label>
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
                        <Label className="text-xs">Fee Platform (%)</Label>
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

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={updateClusterMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                      <span>
                        {updateClusterMutation.isPending
                          ? "Menyimpan..."
                          : "Simpan Konfigurasi Cluster"}
                      </span>
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Daftar Anggota Cluster */}
            <div className="lg:col-span-6">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-teal-700" />
                    Anggota Penjual di {activeCluster.name} (
                    {activeCluster.members?.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Kelola status keanggotaan penjual UMKM di area Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {(activeCluster.members || []).map(
                      (m: {
                        id: string;
                        userName: string;
                        storeName: string;
                        businessType: string;
                        userPhone: string;
                        address: string;
                        status: string;
                      }) => (
                        <div
                          key={m.id}
                          className="rounded-xl border border-slate-200 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {m.userName} ({m.storeName})
                              </span>
                              <Badge
                                variant={
                                  m.status === "ACTIVE"
                                    ? "teal"
                                    : m.status === "PENDING"
                                    ? "orange"
                                    : "outline"
                                }
                              >
                                {m.status}
                              </Badge>
                            </div>
                            <p className="text-slate-500">
                              {m.businessType} • WA: {m.userPhone}
                            </p>
                            <p className="text-slate-600">📍 {m.address}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {m.status !== "ACTIVE" && (
                              <Button
                                size="sm"
                                className="h-8 px-2.5 text-xs gap-1"
                                onClick={() =>
                                  moderateMemberMutation.mutate({
                                    memberId: m.id,
                                    decision: "ACTIVE",
                                  })
                                }
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Setujui</span>
                              </Button>
                            )}
                            {m.status !== "REJECTED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1"
                                onClick={() =>
                                  moderateMemberMutation.mutate({
                                    memberId: m.id,
                                    decision: "REJECTED",
                                  })
                                }
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Nonaktifkan</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tabel Semua Draft Paket dalam Cluster */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-teal-700" />
              Semua Draft Paket dalam Cluster ({clusterDrafts.length} Paket)
            </CardTitle>
            <CardDescription>
              Pantau seluruh paket dari semua anggota penjual di cluster ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Penjual / Toko</th>
                    <th className="py-2.5 px-3">Penerima & Kota Tujuan</th>
                    <th className="py-2.5 px-3">Kurir</th>
                    <th className="py-2.5 px-3">Jadwal Pickup</th>
                    <th className="py-2.5 px-3 text-right">Berat</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clusterDrafts.map(
                    (d: {
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
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">
                            {d.sellerName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {d.storeName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">
                            {d.recipientName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {d.city}, {d.province}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-teal-800">
                          {COURIER_LABELS[d.courier] || d.courier}
                        </td>
                        <td className="py-2.5 px-3">
                          {formatDateId(d.pickupDate)} •{" "}
                          {PICKUP_WINDOW_LABELS[d.pickupWindow]?.label}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {formatWeight(d.weightGram)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <DraftStatusBadge status={d.status} />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

