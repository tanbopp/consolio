"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MapPin,
  Search,
  CheckCircle2,
  Clock,
  PlusCircle,
  Store,
  Users,
  Save,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
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
import {
  profileUpdateSchema,
  ProfileUpdateInput,
  clusterSchema,
  ClusterInput,
} from "@/lib/validations";
import { BUSINESS_TYPES, PICKUP_WINDOW_LABELS } from "@/lib/constants";
import { formatRupiah, formatWeight } from "@/lib/utils";

const ALL_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const ALL_WINDOWS: Array<"MORNING" | "AFTERNOON" | "EVENING" | "NIGHT"> = [
  "MORNING",
  "AFTERNOON",
  "EVENING",
  "NIGHT",
];

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

  const { data: clustersData, isLoading: loadingClusters } = useQuery({
    queryKey: ["clusters", searchQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/clusters?q=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error("Gagal memuat cluster");
      return res.json();
    },
  });

  // Form Profil Usaha
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

  // Mutation Join Cluster
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

  // Form Buat Cluster Baru
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ]);
  const [selectedWindows, setSelectedWindows] = useState<
    Array<"MORNING" | "AFTERNOON" | "EVENING" | "NIGHT">
  >(["MORNING", "AFTERNOON", "EVENING"]);

  const {
    register: regCluster,
    handleSubmit: handleClusterSubmit,
    setValue: setClusterValue,
    formState: { errors: clusterErrors },
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

  const toggleDay = (day: string) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(next);
    setClusterValue("pickupDays", next);
  };

  const toggleWindow = (w: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT") => {
    const next = selectedWindows.includes(w)
      ? selectedWindows.filter((item) => item !== w)
      : [...selectedWindows, w];
    setSelectedWindows(next);
    setClusterValue("pickupTimeWindows", next);
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Onboarding Penjual: Profil & Pilih Cluster Area
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Lengkapi profil usaha Anda dan bergabunglah ke satu cluster area
              fisik untuk mulai menggabungkan jadwal pickup.
            </p>
          </div>
          {activeMembership && (
            <Link href="/drafts/new">
              <Button variant="cta" className="gap-2">
                <span>Buat Draft Pengiriman</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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

        {/* Status Cluster Saat Ini */}
        <Card className="border-l-4 border-l-teal-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-teal-700" />
              Status Keanggotaan Cluster Anda
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProfile ? (
              <p className="text-sm text-slate-500">Memuat status cluster...</p>
            ) : activeMembership?.cluster ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-teal-50/80 border border-teal-200 p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white border-none">
                      ANGGOTA AKTIF
                    </Badge>
                    <span className="font-mono text-xs font-bold text-teal-800">
                      Kode: {activeMembership.cluster.code}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-teal-950">
                    {activeMembership.cluster.name}
                  </h3>
                  <p className="text-xs text-teal-800">
                    Titik Kumpul: {activeMembership.cluster.centerAddress} •
                    Radius {activeMembership.cluster.radiusKm} km
                  </p>
                  <p className="text-xs text-teal-700 font-medium">
                    Syarat Minimum Pickup: {activeMembership.cluster.minPackages}{" "}
                    paket atau{" "}
                    {formatWeight(activeMembership.cluster.minTotalWeightGram)}{" "}
                    • Biaya Pickup Dasar:{" "}
                    {formatRupiah(activeMembership.cluster.basePickupFee)} (+Fee{" "}
                    {activeMembership.cluster.platformFeePercent}%)
                  </p>
                </div>
                <div className="shrink-0">
                  <Link href="/drafts/new">
                    <Button className="gap-1.5">
                      <PlusCircle className="h-4 w-4" />
                      <span>Tambah Draft Paket</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ) : pendingMembership?.cluster ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-700" />
                    <span className="text-xs font-bold uppercase text-amber-800">
                      Menunggu Persetujuan Admin Cluster
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {pendingMembership.cluster.name} (
                    {pendingMembership.cluster.code})
                  </p>
                  <p className="text-xs text-slate-600">
                    Permintaan bergabung Anda sedang ditinjau oleh Admin
                    Cluster. Setelah disetujui, Anda dapat langsung membuat
                    draft pengiriman.
                  </p>
                </div>
                <Badge variant="orange">Status: PENDING</Badge>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-xs text-slate-700">
                Anda belum tergabung di cluster mana pun. Silakan cari kode
                cluster di bawah (misalnya{" "}
                <strong className="text-teal-800">GRIYA01</strong> atau{" "}
                <strong className="text-teal-800">KAMPUS02</strong>) dan klik{" "}
                <strong>Request Gabung Cluster</strong>.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Edit Profil Usaha */}
          <div className="lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-teal-700" />
                  Profil Usaha & Toko UMKM
                </CardTitle>
                <CardDescription>
                  Data ini tampil kepada Admin Cluster dan kurir saat penjemputan
                  paket.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleProfileSubmit((vals) =>
                    updateProfileMutation.mutate(vals)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-name">Nama Pemilik</Label>
                    <Input id="prof-name" {...regProfile("name")} />
                    {profileErrors.name && (
                      <p className="text-xs text-red-600">
                        {profileErrors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-phone">Nomor WhatsApp Indonesia</Label>
                    <Input id="prof-phone" {...regProfile("phone")} />
                    {profileErrors.phone && (
                      <p className="text-xs text-red-600">
                        {profileErrors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-store">Nama Toko</Label>
                    <Input id="prof-store" {...regProfile("storeName")} />
                    {profileErrors.storeName && (
                      <p className="text-xs text-red-600">
                        {profileErrors.storeName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-btype">Jenis Usaha</Label>
                    <select
                      id="prof-btype"
                      className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                      {...regProfile("businessType")}
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-address">Alamat Lengkap Toko</Label>
                    <Input id="prof-address" {...regProfile("address")} />
                    {profileErrors.address && (
                      <p className="text-xs text-red-600">
                        {profileErrors.address.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save className="h-4 w-4" />
                    <span>
                      {updateProfileMutation.isPending
                        ? "Menyimpan..."
                        : "Simpan Profil Usaha"}
                    </span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Cari / Gabung Cluster atau Buat Cluster Baru */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-teal-700" />
                      Cari & Gabung Cluster Area
                    </CardTitle>
                    <CardDescription>
                      Satu penjual hanya boleh aktif di satu cluster pada satu
                      waktu.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCreateCluster(!showCreateCluster)}
                    className="gap-1.5"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>
                      {showCreateCluster
                        ? "Tutup Form Cluster"
                        : "Buat Cluster Baru"}
                    </span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Join dengan Kode Unik */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="flex-1">
                    <Input
                      value={quickJoinCode}
                      onChange={(e) =>
                        setQuickJoinCode(e.target.value.toUpperCase())
                      }
                      placeholder="Masukkan Kode Cluster (contoh: GRIYA01 atau KAMPUS02)"
                      className="font-mono uppercase"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="cta"
                    disabled={
                      !quickJoinCode.trim() || joinClusterMutation.isPending
                    }
                    onClick={() =>
                      joinClusterMutation.mutate({
                        clusterCode: quickJoinCode.trim(),
                      })
                    }
                  >
                    Gabung Pakai Kode
                  </Button>
                </div>

                {/* Pencarian Nama / Kode */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama komplek, pasar, kos, atau kode cluster..."
                    className="pl-9"
                  />
                </div>

                {loadingClusters ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Mencari daftar cluster...
                  </p>
                ) : clusters.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <p className="text-sm font-bold text-slate-700">
                      Cluster tidak ditemukan
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Coba kata kunci lain atau buat cluster baru untuk area
                      Anda.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clusters.map(
                      (c: {
                        id: string;
                        name: string;
                        code: string;
                        description: string;
                        centerAddress: string;
                        radiusKm: number;
                        pickupDays: string[];
                        pickupTimeWindows: string[];
                        minPackages: number;
                        minTotalWeightGram: number;
                        basePickupFee: number;
                        platformFeePercent: number;
                        adminName: string;
                        activeMemberCount: number;
                        myMembershipStatus: string | null;
                      }) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-slate-200 p-4 hover:border-teal-300 transition-colors space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-teal-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                                  {c.code}
                                </span>
                                <h4 className="font-bold text-slate-900">
                                  {c.name}
                                </h4>
                              </div>
                              <p className="mt-1 text-xs text-slate-600">
                                {c.description}
                              </p>
                            </div>

                            <div className="shrink-0">
                              {c.myMembershipStatus === "ACTIVE" ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Cluster Aktif Anda
                                </Badge>
                              ) : c.myMembershipStatus === "PENDING" ? (
                                <Badge variant="orange">
                                  Menunggu Persetujuan
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={
                                    !!activeMembership ||
                                    joinClusterMutation.isPending
                                  }
                                  onClick={() =>
                                    joinClusterMutation.mutate({
                                      clusterId: c.id,
                                    })
                                  }
                                >
                                  Request Gabung
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-700 border border-slate-100">
                            <div>
                              <span className="text-slate-400 block">
                                Radius & Anggota
                              </span>
                              <strong>
                                {c.radiusKm} km • {c.activeMemberCount} UMKM
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">
                                Syarat Minimum
                              </span>
                              <strong>
                                {c.minPackages} pkt /{" "}
                                {formatWeight(c.minTotalWeightGram)}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">
                                Biaya Pickup Dasar
                              </span>
                              <strong>
                                {formatRupiah(c.basePickupFee)} (+
                                {c.platformFeePercent}%)
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">
                                Admin Cluster
                              </span>
                              <strong>{c.adminName}</strong>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span> 📍 {c.centerAddress}</span>
                            <span>•</span>
                            <span>
                              Hari: {c.pickupDays.join(", ")} (
                              {c.pickupTimeWindows
                                .map(
                                  (w) =>
                                    PICKUP_WINDOW_LABELS[w]?.label || w
                                )
                                .join("/")}
                              )
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Buat Cluster Baru */}
            {showCreateCluster && (
              <Card className="border-2 border-teal-700">
                <CardHeader>
                  <CardTitle>Buat Cluster Area Baru</CardTitle>
                  <CardDescription>
                    Jadikan rumah/toko Anda sebagai titik konsolidasi pickup
                    untuk tetangga penjual UMKM di area Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleClusterSubmit((vals) =>
                      createClusterMutation.mutate(vals)
                    )}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Nama Cluster / Area</Label>
                        <Input
                          placeholder="Contoh: Pasar Modern BSD"
                          {...regCluster("name")}
                        />
                        {clusterErrors.name && (
                          <p className="text-xs text-red-600">
                            {clusterErrors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Kode Cluster Unik (Huruf Kapital & Angka)</Label>
                        <Input
                          placeholder="Contoh: PASARBSD01"
                          className="font-mono uppercase"
                          {...regCluster("code")}
                        />
                        {clusterErrors.code && (
                          <p className="text-xs text-red-600">
                            {clusterErrors.code.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Deskripsi Cluster</Label>
                      <Input
                        placeholder="Penjelasan singkat area cakupan dan prosedur kumpul paket"
                        {...regCluster("description")}
                      />
                      {clusterErrors.description && (
                        <p className="text-xs text-red-600">
                          {clusterErrors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label>Alamat Pusat / Titik Kumpul</Label>
                        <Input
                          placeholder="Jl. Raya Utama Blok A No. 1..."
                          {...regCluster("centerAddress")}
                        />
                        {clusterErrors.centerAddress && (
                          <p className="text-xs text-red-600">
                            {clusterErrors.centerAddress.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Radius Area (Km)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          {...regCluster("radiusKm", { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Hari Operasional Pickup</Label>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ALL_DAYS.map((day) => {
                          const active = selectedDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors ${
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
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ALL_WINDOWS.map((w) => {
                          const active = selectedWindows.includes(w);
                          return (
                            <button
                              key={w}
                              type="button"
                              onClick={() => toggleWindow(w)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                                active
                                  ? "bg-teal-700 text-white border-teal-700"
                                  : "bg-white text-slate-600 border-slate-300"
                              }`}
                            >
                              {PICKUP_WINDOW_LABELS[w].label} (
                              {PICKUP_WINDOW_LABELS[w].timeRange})
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
                          {...regCluster("minPackages", { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Min. Berat (Gram)</Label>
                        <Input
                          type="number"
                          step="500"
                          {...regCluster("minTotalWeightGram", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Biaya Pickup (Rp)</Label>
                        <Input
                          type="number"
                          step="1000"
                          {...regCluster("basePickupFee", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fee Platform (%)</Label>
                        <Input
                          type="number"
                          step="1"
                          {...regCluster("platformFeePercent", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="cta"
                      className="w-full"
                      disabled={createClusterMutation.isPending}
                    >
                      {createClusterMutation.isPending
                        ? "Membuat Cluster..."
                        : "Simpan & Aktifkan Cluster Baru"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
