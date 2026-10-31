"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PackagePlus,
  MapPin,
  Calculator,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
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
import { shipmentDraftSchema, ShipmentDraftInput } from "@/lib/validations";
import {
  COURIER_LABELS,
  PICKUP_WINDOW_LABELS,
  INDONESIAN_PROVINCES,
} from "@/lib/constants";
import { formatRupiah, formatWeight } from "@/lib/utils";

export default function NewDraftPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const activeCluster = profileData?.activeMembership?.cluster;

  // Default tanggal pengiriman = besok
  const defaultTomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShipmentDraftInput>({
    resolver: zodResolver(shipmentDraftSchema),
    defaultValues: {
      recipientName: "",
      recipientPhone: "0812",
      destinationAddress: "",
      city: "",
      province: "Jawa Barat",
      postalCode: "40115",
      weightGram: 1200,
      lengthCm: 25,
      widthCm: 20,
      heightCm: 12,
      itemValue: 150000,
      notes: "",
      courier: "JNT",
      pickupDate: defaultTomorrow,
      pickupWindow: "EVENING",
      saveAsDraftOnly: false,
    },
  });

  const watchedWeight = Number(watch("weightGram") || 0);
  const watchedCourier = watch("courier");
  const watchedWindow = watch("pickupWindow");

  const onSubmit = async (values: ShipmentDraftInput) => {
    setServerError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || "Gagal menyimpan draft pengiriman");
        setSubmitting(false);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pickups"] });

      router.push("/drafts?created=1");
    } catch {
      setServerError("Terjadi kesalahan koneksi saat menyimpan draft.");
      setSubmitting(false);
    }
  };

  // Estimasi simulasi cepat biaya jika kuota minimum cluster tercapai
  const minWeightCluster = activeCluster?.minTotalWeightGram || 10000;
  const baseFeeCluster = activeCluster?.basePickupFee || 25000;
  const feePctCluster = activeCluster?.platformFeePercent || 10;
  const simulatedTotalWeight = Math.max(minWeightCluster, watchedWeight * 4);
  const simulatedShare =
    watchedWeight > 0
      ? Math.round(
          (watchedWeight / simulatedTotalWeight) *
            baseFeeCluster *
            (1 + feePctCluster / 100)
        )
      : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/drafts"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Daftar Draft Saya
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Buat Draft Pengiriman Baru
            </h1>
            <p className="text-sm text-slate-600">
              Masukkan detail penerima, dimensi & berat paket, serta pilih
              jadwal pickup kurir untuk digabung dengan penjual satu cluster.
            </p>
          </div>
        </div>

        {!loadingProfile && !activeCluster && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-950">
                  Wajib Tergabung di Cluster Terlebih Dahulu
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Draft pengiriman harus masuk ke cluster sebelum bisa digabung.
                  Silakan pilih atau bergabung ke cluster di halaman Onboarding.
                </p>
              </div>
            </div>
            <Link href="/onboarding">
              <Button variant="cta" size="sm">
                Ke Halaman Cluster
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackagePlus className="h-5 w-5 text-teal-700" />
                  Formulir Data Paket & Jadwal Pickup
                </CardTitle>
                <CardDescription>
                  Semua input divalidasi di sisi client dan server sesuai aturan
                  pengiriman Indonesia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {serverError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {serverError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Bagian 1: Data Penerima */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 border-b border-slate-100 pb-1.5">
                      1. Data & Alamat Penerima
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="recipientName">Nama Penerima *</Label>
                        <Input
                          id="recipientName"
                          placeholder="Contoh: Andi Wijaya"
                          {...register("recipientName")}
                        />
                        {errors.recipientName && (
                          <p className="text-xs text-red-600">
                            {errors.recipientName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="recipientPhone">
                          Nomor Telepon Penerima (Indonesia) *
                        </Label>
                        <Input
                          id="recipientPhone"
                          placeholder="081234567890"
                          {...register("recipientPhone")}
                        />
                        {errors.recipientPhone && (
                          <p className="text-xs text-red-600">
                            {errors.recipientPhone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="destinationAddress">
                        Alamat Lengkap Tujuan *
                      </Label>
                      <Input
                        id="destinationAddress"
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                        {...register("destinationAddress")}
                      />
                      {errors.destinationAddress && (
                        <p className="text-xs text-red-600">
                          {errors.destinationAddress.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="city">Kota / Kabupaten *</Label>
                        <Input
                          id="city"
                          placeholder="Contoh: Bandung"
                          {...register("city")}
                        />
                        {errors.city && (
                          <p className="text-xs text-red-600">
                            {errors.city.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="province">Provinsi *</Label>
                        <select
                          id="province"
                          className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                          {...register("province")}
                        >
                          {INDONESIAN_PROVINCES.map((prov) => (
                            <option key={prov} value={prov}>
                              {prov}
                            </option>
                          ))}
                        </select>
                        {errors.province && (
                          <p className="text-xs text-red-600">
                            {errors.province.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="postalCode">Kode Pos (5 Digit) *</Label>
                        <Input
                          id="postalCode"
                          placeholder="40115"
                          maxLength={5}
                          {...register("postalCode")}
                        />
                        {errors.postalCode && (
                          <p className="text-xs text-red-600">
                            {errors.postalCode.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bagian 2: Spesifikasi Paket */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 border-b border-slate-100 pb-1.5">
                      2. Berat, Dimensi & Nilai Barang
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="weightGram">
                          Berat (Gram) *{" "}
                          <span className="text-[11px] font-normal text-teal-700">
                            ({formatWeight(watchedWeight)})
                          </span>
                        </Label>
                        <Input
                          id="weightGram"
                          type="number"
                          min={100}
                          step={50}
                          {...register("weightGram", { valueAsNumber: true })}
                        />
                        {errors.weightGram && (
                          <p className="text-xs text-red-600">
                            {errors.weightGram.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="lengthCm">Panjang (cm) *</Label>
                        <Input
                          id="lengthCm"
                          type="number"
                          step="1"
                          {...register("lengthCm", { valueAsNumber: true })}
                        />
                        {errors.lengthCm && (
                          <p className="text-xs text-red-600">
                            {errors.lengthCm.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="widthCm">Lebar (cm) *</Label>
                        <Input
                          id="widthCm"
                          type="number"
                          step="1"
                          {...register("widthCm", { valueAsNumber: true })}
                        />
                        {errors.widthCm && (
                          <p className="text-xs text-red-600">
                            {errors.widthCm.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="heightCm">Tinggi (cm) *</Label>
                        <Input
                          id="heightCm"
                          type="number"
                          step="1"
                          {...register("heightCm", { valueAsNumber: true })}
                        />
                        {errors.heightCm && (
                          <p className="text-xs text-red-600">
                            {errors.heightCm.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="itemValue">Nilai Barang (Rp) *</Label>
                        <Input
                          id="itemValue"
                          type="number"
                          step={5000}
                          {...register("itemValue", { valueAsNumber: true })}
                        />
                        {errors.itemValue && (
                          <p className="text-xs text-red-600">
                            {errors.itemValue.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="notes">Catatan Pengiriman</Label>
                        <Input
                          id="notes"
                          placeholder="Contoh: Jangan dibanting / Makanan kering"
                          {...register("notes")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Kurir & Jadwal Pickup */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 border-b border-slate-100 pb-1.5">
                      3. Kurir Pilihan & Jendela Waktu Pickup
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="courier">Kurir Pilihan *</Label>
                        <select
                          id="courier"
                          className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                          {...register("courier")}
                        >
                          {Object.entries(COURIER_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                        {errors.courier && (
                          <p className="text-xs text-red-600">
                            {errors.courier.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="pickupDate">Tanggal Pengiriman *</Label>
                        <Input
                          id="pickupDate"
                          type="date"
                          {...register("pickupDate")}
                        />
                        {errors.pickupDate && (
                          <p className="text-xs text-red-600">
                            {errors.pickupDate.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="pickupWindow">
                          Jendela Waktu Pickup *
                        </Label>
                        <select
                          id="pickupWindow"
                          className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                          {...register("pickupWindow")}
                        >
                          {Object.entries(PICKUP_WINDOW_LABELS).map(
                            ([k, val]) => (
                              <option key={k} value={k}>
                                {val.label} ({val.timeRange})
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Submit */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={submitting || !activeCluster}
                      onClick={() => setValue("saveAsDraftOnly", true)}
                    >
                      Simpan Sebagai Draft Sementara (DRAFT)
                    </Button>
                    <Button
                      type="submit"
                      variant="cta"
                      disabled={submitting || !activeCluster}
                      onClick={() => setValue("saveAsDraftOnly", false)}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {submitting
                          ? "Menyimpan..."
                          : "Masukkan ke Antrean Gabung Pickup (QUEUED)"}
                      </span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Panel Kanan: Info Cluster & Simulasi Rumus Biaya */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-teal-900 text-white border-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-orange-500 text-white border-none">
                    Simulasi Biaya Transparan
                  </Badge>
                  <Calculator className="h-5 w-5 text-teal-300" />
                </div>
                <CardTitle className="text-white text-base mt-2">
                  Estimasi Patungan Pickup Anda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="rounded-lg bg-teal-800/80 p-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-teal-200">Berat Paket Ini:</span>
                    <span className="font-bold text-white">
                      {formatWeight(watchedWeight)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-200">Kurir & Jendela:</span>
                    <span className="font-bold text-white">
                      {COURIER_LABELS[watchedCourier]} •{" "}
                      {PICKUP_WINDOW_LABELS[watchedWindow]?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-200">Biaya Pickup Cluster:</span>
                    <span className="font-bold text-white">
                      {formatRupiah(baseFeeCluster)} (+Fee {feePctCluster}%)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-teal-700/70">
                  <p className="text-teal-200">
                    Estimasi tagihan jika terkumpul{" "}
                    {formatWeight(simulatedTotalWeight)}:
                  </p>
                  <p className="text-2xl font-extrabold text-orange-400 mt-1">
                    {formatRupiah(simulatedShare)}
                  </p>
                  <p className="text-[11px] text-teal-100 mt-1 leading-relaxed">
                    Rumus: (Berat Anda / Total Berat Grup) × Biaya Pickup × (1 +
                    Fee Platform).
                  </p>
                </div>
              </CardContent>
            </Card>

            {activeCluster && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-teal-700" />
                    Aturan Penggabungan Cluster
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-600">
                  <p>
                    • <strong>Cluster Aktif:</strong> {activeCluster.name} (
                    {activeCluster.code})
                  </p>
                  <p>
                    • <strong>Syarat Minimum:</strong>{" "}
                    {activeCluster.minPackages} paket atau{" "}
                    {formatWeight(activeCluster.minTotalWeightGram)}.
                  </p>
                  <p>
                    • Draft hanya digabung apabila{" "}
                    <strong>cluster, tanggal, jendela waktu, dan kurir</strong>{" "}
                    sama persis.
                  </p>
                  <p>
                    • Anda dapat mengedit atau membatalkan draft selama statusnya
                    belum berubah menjadi{" "}
                    <span className="font-semibold text-amber-800">
                      Siap Pickup (READY_FOR_PICKUP)
                    </span>
                    .
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
