"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  profileUpdateSchema,
  ProfileUpdateInput,
  clusterSchema,
  ClusterInput,
} from "@/lib/validations";
import { BUSINESS_TYPES } from "@/lib/constants";
import { formatRupiah, formatWeight } from "@/lib/utils";

export default function OnboardingPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [quickJoinCode, setQuickJoinCode] = useState("");
  const [showCreateCluster, setShowCreateCluster] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Gagal memuat profil");
      return res.json();
    },
  });

  const { data: clustersData } = useQuery({
    queryKey: ["clusters", searchQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/clusters?q=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error("Gagal memuat cluster");
      return res.json();
    },
  });

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
  });

  useEffect(() => {
    if (profileData?.user) {
      resetProfile({
        name: profileData.user.name || "",
        phone: profileData.user.phone || "",
        storeName: profileData.user.storeName || "",
        businessType: profileData.user.businessType || BUSINESS_TYPES[0],
        address: profileData.user.address || "",
      });
    }
  }, [profileData, resetProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileUpdateInput) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan profil");
      return json;
    },
    onSuccess: (data) => {
      setFeedback({ type: "success", text: data.message });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const joinClusterMutation = useMutation({
    mutationFn: async (payload: { clusterId?: string; clusterCode?: string }) => {
      const res = await fetch("/api/clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "JOIN_CLUSTER", ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal bergabung ke cluster");
      return json;
    },
    onSuccess: (data) => {
      setFeedback({ type: "success", text: data.message });
      setQuickJoinCode("");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const {
    register: regCluster,
    handleSubmit: handleClusterSubmit,
  } = useForm<ClusterInput>({
    resolver: zodResolver(clusterSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      centerAddress: "",
      radiusKm: 2.5,
      pickupDays: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
      pickupTimeWindows: ["MORNING", "AFTERNOON", "EVENING"],
      minPackages: 10,
      minTotalWeightGram: 10000,
      basePickupFee: 25000,
      platformFeePercent: 10,
    },
  });

  const createClusterMutation = useMutation({
    mutationFn: async (values: ClusterInput) => {
      const res = await fetch("/api/clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_CLUSTER", ...values }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat cluster");
      return json;
    },
    onSuccess: (data) => {
      setFeedback({ type: "success", text: data.message });
      setShowCreateCluster(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const activeMembership = profileData?.activeMembership;
  const pendingMembership = profileData?.pendingMembership;
  const clusters = clustersData?.clusters || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#182126]">
              Profil Penjual & Keanggotaan Cluster
            </h1>
            <p className="text-xs text-[#626E76] mt-0.5">
              Data usaha dan status keanggotaan area fisik Anda di Consolio.
            </p>
          </div>
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

        {/* Status Keanggotaan Cluster Saat Ini */}
        <div className="rounded border border-[#E3E7EA] bg-white p-4">
          <span className="text-[11px] font-semibold text-[#8D98A0] uppercase tracking-wider block mb-2">
            Status Keanggotaan Cluster Anda
          </span>

          {loadingProfile ? (
            <p className="text-xs text-[#626E76]">Memuat status keanggotaan...</p>
          ) : activeMembership?.cluster ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#182126]">
                    {activeMembership.cluster.name}
                  </span>
                  <span className="rounded bg-[#EAF5EF] px-2 py-0.5 text-xs font-medium text-[#144D33] border border-[#C3E6D3]">
                    Anggota Aktif ({activeMembership.cluster.code})
                  </span>
                </div>
                <p className="text-xs text-[#626E76]">
                  Titik kumpul: {activeMembership.cluster.centerAddress} • Radius {activeMembership.cluster.radiusKm} km
                </p>
                <p className="text-xs text-[#626E76]">
                  Syarat pickup: {activeMembership.cluster.minPackages} paket / {formatWeight(activeMembership.cluster.minTotalWeightGram)} • Biaya dasar: {formatRupiah(activeMembership.cluster.basePickupFee)}
                </p>
              </div>

              <Link href="/drafts/new">
                <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Draft Paket</span>
                </Button>
              </Link>
            </div>
          ) : pendingMembership?.cluster ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FEF7E6] p-3 rounded border border-[#F9E2B6]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-[#734C00]">
                    Permintaan Bergabung Menunggu Persetujuan
                  </span>
                  <span className="text-xs text-[#734C00]">
                    ({pendingMembership.cluster.name} - {pendingMembership.cluster.code})
                  </span>
                </div>
                <p className="text-xs text-[#9A6700]">
                  Admin cluster sedang meninjau permintaan Anda. Setelah disetujui, Anda dapat langsung membuat paket.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#626E76]">
              Anda belum terdaftar di cluster area mana pun. Pilih salah satu cluster di bawah atau masukkan kode unik cluster Anda.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Kolom Kiri: Profil Toko */}
          <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
            <div className="p-4 border-b border-[#E3E7EA] bg-[#FAFAFA]">
              <h2 className="text-sm font-semibold text-[#182126]">
                Profil Usaha & Kontak
              </h2>
              <p className="text-xs text-[#626E76]">
                Informasi pengirim yang digunakan untuk penjemputan paket
              </p>
            </div>

            <form
              onSubmit={handleProfileSubmit((vals) =>
                updateProfileMutation.mutate(vals)
              )}
              className="p-4 space-y-3 text-xs"
            >
              <div className="space-y-1">
                <Label className="text-xs">Nama Pemilik</Label>
                <Input {...regProfile("name")} />
                {profileErrors.name && (
                  <p className="text-[11px] text-[#B42318]">{profileErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Nomor WhatsApp</Label>
                <Input {...regProfile("phone")} />
                {profileErrors.phone && (
                  <p className="text-[11px] text-[#B42318]">{profileErrors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Nama Toko / Usaha</Label>
                <Input {...regProfile("storeName")} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Jenis Usaha</Label>
                <select
                  className="flex h-9 w-full rounded border border-[#E3E7EA] bg-white px-2 py-1 text-xs text-[#182126]"
                  {...regProfile("businessType")}
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Alamat Toko</Label>
                <Input {...regProfile("address")} />
              </div>

              <div className="pt-2 border-t border-[#E3E7EA] flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-semibold"
                  disabled={updateProfileMutation.isPending}
                >
                  Simpan Profil Usaha
                </Button>
              </div>
            </form>
          </div>

          {/* Kolom Kanan: Cari & Gabung Cluster */}
          <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden space-y-4 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EA]">
              <div>
                <h2 className="text-sm font-semibold text-[#182126]">
                  Pilih atau Buat Cluster
                </h2>
                <p className="text-xs text-[#626E76]">
                  Satu penjual aktif di satu cluster pada satu waktu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateCluster(!showCreateCluster)}
                className="text-xs text-[#17685F] hover:underline font-medium"
              >
                {showCreateCluster ? "Tutup form" : "+ Buat cluster baru"}
              </button>
            </div>

            {/* Gabung dengan Kode Cepat */}
            <div className="flex items-center gap-2">
              <Input
                value={quickJoinCode}
                onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase())}
                placeholder="Kode cluster (misal: GRIYA01)"
                className="font-mono text-xs uppercase h-8"
              />
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs font-semibold shrink-0"
                disabled={!quickJoinCode.trim() || joinClusterMutation.isPending}
                onClick={() =>
                  joinClusterMutation.mutate({
                    clusterCode: quickJoinCode.trim(),
                  })
                }
              >
                Gabung Kode
              </Button>
            </div>

            {/* Pencarian Cluster */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8D98A0]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari komplek, pasar, atau jalan..."
                className="pl-8 text-xs h-8"
              />
            </div>

            {/* Form Buat Cluster Baru jika dibuka */}
            {showCreateCluster && (
              <div className="rounded border border-[#17685F] p-4 bg-[#F8FAFA] space-y-3 text-xs">
                <p className="font-semibold text-xs text-[#182126]">
                  Buat Cluster Area Baru
                </p>

                <form
                  onSubmit={handleClusterSubmit((vals) =>
                    createClusterMutation.mutate(vals)
                  )}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Nama Cluster</Label>
                      <Input placeholder="Komplek..." {...regCluster("name")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Kode Cluster (Huruf Kapital)</Label>
                      <Input placeholder="KOMPLEK01" className="uppercase font-mono" {...regCluster("code")} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Deskripsi</Label>
                    <Input placeholder="Cakupan area RW 05..." {...regCluster("description")} />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Titik Kumpul / Alamat Pusat</Label>
                    <Input placeholder="Pos Satpam Blok A..." {...regCluster("centerAddress")} />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Min. Paket</Label>
                      <Input type="number" {...regCluster("minPackages", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Min. Berat (Gram)</Label>
                      <Input type="number" step="500" {...regCluster("minTotalWeightGram", { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="submit"
                      size="sm"
                      className="h-7 text-xs font-semibold"
                      disabled={createClusterMutation.isPending}
                    >
                      Simpan Cluster
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* List Cluster */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {clusters.map((c: {
                id: string;
                name: string;
                code: string;
                description: string;
                centerAddress: string;
                radiusKm: number;
                minPackages: number;
                minTotalWeightGram: number;
                basePickupFee: number;
                activeMemberCount: number;
                myMembershipStatus: string | null;
              }) => (
                <div key={c.id} className="rounded border border-[#E3E7EA] p-3 text-xs space-y-1.5 hover:bg-[#FAFAFA]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-[#182126]">{c.name}</span>{" "}
                      <span className="text-[#626E76]">({c.code})</span>
                    </div>
                    {c.myMembershipStatus === "ACTIVE" ? (
                      <span className="text-[11px] font-medium text-[#20734D]">
                        Cluster aktif
                      </span>
                    ) : c.myMembershipStatus === "PENDING" ? (
                      <span className="text-[11px] font-medium text-[#9A6700]">
                        Menunggu ACC
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!!activeMembership || joinClusterMutation.isPending}
                        onClick={() => joinClusterMutation.mutate({ clusterId: c.id })}
                        className="rounded border border-[#E3E7EA] bg-white px-2 py-0.5 text-[11px] font-medium text-[#182126] hover:bg-[#F6F7F8]"
                      >
                        Request Gabung
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#626E76]">
                    Titik kumpul: {c.centerAddress} • {c.activeMemberCount} penjual
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
