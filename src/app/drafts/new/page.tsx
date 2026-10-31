"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Info,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const activeCluster = profileData?.activeMembership?.cluster;

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

      router.push("/drafts");
    } catch {
      setServerError("Terjadi kesalahan koneksi saat menyimpan draft.");
      setSubmitting(false);
    }
  };

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
      <div className="space-y-5">
        <div className="space-y-1">
          <Link
            href="/drafts"
            className="inline-flex items-center gap-1.5 text-xs text-[#626E76] hover:text-[#182126] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke draft paket
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#182126]">
            Buat Draft Paket
          </h1>
          <p className="text-xs text-[#626E76]">
            Masukkan data penerima, dimensi paket, dan jadwal pickup untuk dikonsolidasikan.
          </p>
        </div>

        {/* Form Container dengan Lebar Internal 720-880px agar nyaman dibaca */}
        <div className="max-w-[800px] space-y-4">
          {serverError && (
            <div className="rounded border border-[#F8D2CF] bg-[#FDF2F1] p-3 text-xs font-medium text-[#911D13]">
              {serverError}
            </div>
          )}

          <div className="rounded border border-[#E3E7EA] bg-white p-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Section 1: Penerima */}
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-[#182126] uppercase tracking-wider border-b border-[#E3E7EA] pb-1.5">
                  1. Alamat Penerima
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nama Penerima *</Label>
                    <Input
                      placeholder="Contoh: Budi Santoso"
                      {...register("recipientName")}
                    />
                    {errors.recipientName && (
                      <p className="text-[11px] text-[#B42318]">{errors.recipientName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nomor Telepon (Indonesia) *</Label>
                    <Input
                      placeholder="081234567890"
                      {...register("recipientPhone")}
                    />
                    {errors.recipientPhone && (
                      <p className="text-[11px] text-[#B42318]">{errors.recipientPhone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Alamat Lengkap Tujuan *</Label>
                  <Input
                    placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan"
                    {...register("destinationAddress")}
                  />
                  {errors.destinationAddress && (
                    <p className="text-[11px] text-[#B42318]">{errors.destinationAddress.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Kota / Kabupaten *</Label>
                    <Input placeholder="Bandung" {...register("city")} />
                    {errors.city && (
                      <p className="text-[11px] text-[#B42318]">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Provinsi *</Label>
                    <select
                      className="flex h-9 w-full rounded border border-[#E3E7EA] bg-white px-2 py-1 text-xs text-[#182126]"
                      {...register("province")}
                    >
                      {INDONESIAN_PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kode Pos (5 Digit) *</Label>
                    <Input maxLength={5} placeholder="40115" {...register("postalCode")} />
                    {errors.postalCode && (
                      <p className="text-[11px] text-[#B42318]">{errors.postalCode.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Spesifikasi Paket */}
              <div className="space-y-3 pt-2">
                <h2 className="text-xs font-semibold text-[#182126] uppercase tracking-wider border-b border-[#E3E7EA] pb-1.5">
                  2. Dimensi & Berat Paket
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Berat (Gram) *</Label>
                    <Input
                      type="number"
                      min={100}
                      step={50}
                      {...register("weightGram", { valueAsNumber: true })}
                    />
                    {errors.weightGram && (
                      <p className="text-[11px] text-[#B42318]">{errors.weightGram.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Panjang (cm) *</Label>
                    <Input
                      type="number"
                      step={1}
                      {...register("lengthCm", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Lebar (cm) *</Label>
                    <Input
                      type="number"
                      step={1}
                      {...register("widthCm", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tinggi (cm) *</Label>
                    <Input
                      type="number"
                      step={1}
                      {...register("heightCm", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nilai Barang (Rp) *</Label>
                    <Input
                      type="number"
                      step={5000}
                      {...register("itemValue", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Catatan Khusus</Label>
                    <Input placeholder="Fragile / Makanan kering" {...register("notes")} />
                  </div>
                </div>
              </div>

              {/* Section 3: Kurir & Jadwal Pickup */}
              <div className="space-y-3 pt-2">
                <h2 className="text-xs font-semibold text-[#182126] uppercase tracking-wider border-b border-[#E3E7EA] pb-1.5">
                  3. Kurir & Jadwal Pickup
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Kurir Pilihan *</Label>
                    <select
                      className="flex h-9 w-full rounded border border-[#E3E7EA] bg-white px-2 py-1 text-xs text-[#182126]"
                      {...register("courier")}
                    >
                      {Object.entries(COURIER_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Tanggal Pickup *</Label>
                    <Input type="date" {...register("pickupDate")} />
                    {errors.pickupDate && (
                      <p className="text-[11px] text-[#B42318]">{errors.pickupDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Jendela Waktu *</Label>
                    <select
                      className="flex h-9 w-full rounded border border-[#E3E7EA] bg-white px-2 py-1 text-xs text-[#182126]"
                      {...register("pickupWindow")}
                    >
                      {Object.entries(PICKUP_WINDOW_LABELS).map(([k, val]) => (
                        <option key={k} value={k}>
                          {val.label} ({val.timeRange})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Estimasi Ringkas */}
              <div className="rounded border border-[#E3E7EA] bg-[#F8FAFA] p-3 text-xs text-[#182126] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-[#17685F] shrink-0" />
                  <span>
                    Estimasi porsi tagihan paket ({formatWeight(watchedWeight)} via {COURIER_LABELS[watchedCourier]} {PICKUP_WINDOW_LABELS[watchedWindow]?.label}):
                  </span>
                </div>
                <span className="font-bold tabular-nums text-[#17685F]">
                  ~{formatRupiah(simulatedShare)}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-[#E3E7EA] flex flex-wrap items-center justify-end gap-2.5">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={submitting}
                  onClick={() => setValue("saveAsDraftOnly", true)}
                >
                  Simpan Draft Saja
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-semibold"
                  disabled={submitting}
                  onClick={() => setValue("saveAsDraftOnly", false)}
                >
                  {submitting ? "Menyimpan..." : "Masukkan ke Antrean Pickup"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
