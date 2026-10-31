"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  InformationCircleIcon,
  Package01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/custom-select";
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
    control,
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat draft paket");
      }

      await queryClient.invalidateQueries({ queryKey: ["drafts"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.push("/drafts");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Terjadi kesalahan saat memproses draft");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const simulatedShare = Math.round(
    ((watchedWeight / 1000) / 10) * 20000 * 1.1
  );

  const provinceOptions = INDONESIAN_PROVINCES.map((prov) => ({
    value: prov,
    label: prov,
  }));

  const courierOptions = Object.entries(COURIER_LABELS).map(([k, v]) => ({
    value: k,
    label: v,
    badge: k,
  }));

  const windowOptions = Object.entries(PICKUP_WINDOW_LABELS).map(
    ([k, val]) => ({
      value: k,
      label: val.label,
      description: val.timeRange,
    })
  );

  return (
    <AppShell
      breadcrumbs={[
        { label: "Draft Paket", href: "/drafts" },
        { label: "Buat Draft Baru" },
      ]}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Buat Draft Paket
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Input tujuan, dimensi paket, dan tentukan jendela waktu pickup
              bersama.
            </p>
          </div>
          <Link href="/drafts">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 rounded-lg border-slate-200"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2} />
              <span>Kembali ke Daftar</span>
            </Button>
          </Link>
        </div>

        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
            {serverError}
          </div>
        )}

        {/* Cluster indicator bar */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <HugeiconsIcon icon={Package01Icon} size={14} strokeWidth={2} />
            </div>
            <div>
              <span className="font-semibold text-slate-900">
                Cluster Pengirim:{" "}
              </span>
              <span>
                {activeCluster ? (
                  <>
                    {activeCluster.name} ({activeCluster.code})
                  </>
                ) : (
                  "Tidak terhubung ke cluster aktif"
                )}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            Penjemputan terkoordinasi di hub pickup cluster
          </span>
        </div>

        {/* Operational Form Container */}
        <div className="max-w-4xl">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 space-y-6 shadow-xs"
          >
            {/* Section 1: Informasi Penerima */}
            <div className="space-y-3.5">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                1. Alamat & Kontak Penerima
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Nama Penerima *
                  </Label>
                  <Input
                    placeholder="Contoh: Siti Aisyah"
                    className="rounded-lg border-slate-200"
                    {...register("recipientName")}
                  />
                  {errors.recipientName && (
                    <p className="text-[11px] text-red-600">
                      {errors.recipientName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    No. WhatsApp / HP Penerima *
                  </Label>
                  <Input
                    placeholder="081234567890"
                    className="rounded-lg border-slate-200"
                    {...register("recipientPhone")}
                  />
                  {errors.recipientPhone && (
                    <p className="text-[11px] text-red-600">
                      {errors.recipientPhone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Alamat Lengkap Tujuan *
                </Label>
                <Input
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan"
                  className="rounded-lg border-slate-200"
                  {...register("destinationAddress")}
                />
                {errors.destinationAddress && (
                  <p className="text-[11px] text-red-600">
                    {errors.destinationAddress.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Kota / Kabupaten *
                  </Label>
                  <Input
                    placeholder="Bandung"
                    className="rounded-lg border-slate-200"
                    {...register("city")}
                  />
                  {errors.city && (
                    <p className="text-[11px] text-red-600">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Provinsi *
                  </Label>
                  <Controller
                    name="province"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        options={provinceOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pilih Provinsi..."
                      />
                    )}
                  />
                  {errors.province && (
                    <p className="text-[11px] text-red-600">
                      {errors.province.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Kode Pos (5 Digit) *
                  </Label>
                  <Input
                    maxLength={5}
                    placeholder="40115"
                    className="rounded-lg border-slate-200"
                    {...register("postalCode")}
                  />
                  {errors.postalCode && (
                    <p className="text-[11px] text-red-600">
                      {errors.postalCode.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Spesifikasi Paket */}
            <div className="space-y-3.5 pt-2">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                2. Dimensi & Berat Paket
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Berat (Gram) *
                  </Label>
                  <Input
                    type="number"
                    min={100}
                    step={50}
                    className="rounded-lg border-slate-200"
                    {...register("weightGram", { valueAsNumber: true })}
                  />
                  {errors.weightGram && (
                    <p className="text-[11px] text-red-600">
                      {errors.weightGram.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Panjang (cm) *
                  </Label>
                  <Input
                    type="number"
                    step={1}
                    className="rounded-lg border-slate-200"
                    {...register("lengthCm", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Lebar (cm) *
                  </Label>
                  <Input
                    type="number"
                    step={1}
                    className="rounded-lg border-slate-200"
                    {...register("widthCm", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Tinggi (cm) *
                  </Label>
                  <Input
                    type="number"
                    step={1}
                    className="rounded-lg border-slate-200"
                    {...register("heightCm", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Nilai Barang (Rp) *
                  </Label>
                  <Input
                    type="number"
                    step={5000}
                    className="rounded-lg border-slate-200"
                    {...register("itemValue", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Catatan Khusus
                  </Label>
                  <Input
                    placeholder="Fragile / Makanan kering"
                    className="rounded-lg border-slate-200"
                    {...register("notes")}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Kurir & Jadwal Pickup */}
            <div className="space-y-3.5 pt-2">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                3. Kurir & Jadwal Pickup
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Kurir Pilihan *
                  </Label>
                  <Controller
                    name="courier"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        options={courierOptions}
                        value={field.value}
                        onChange={(val) =>
                          field.onChange(
                            val as
                              | "JNT"
                              | "SICEPAT"
                              | "ANTERAJA"
                              | "JNE"
                              | "SHOPEE_EXPRESS"
                              | "GOSEND_SAMEDAY"
                          )
                        }
                        placeholder="Pilih Kurir..."
                      />
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Tanggal Pickup *
                  </Label>
                  <Input
                    type="date"
                    className="rounded-lg border-slate-200"
                    {...register("pickupDate")}
                  />
                  {errors.pickupDate && (
                    <p className="text-[11px] text-red-600">
                      {errors.pickupDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Jendela Waktu *
                  </Label>
                  <Controller
                    name="pickupWindow"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        options={windowOptions}
                        value={field.value}
                        onChange={(val) =>
                          field.onChange(
                            val as "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT"
                          )
                        }
                        placeholder="Pilih Jendela Waktu..."
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Estimasi Ringkas */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs text-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    size={16}
                    strokeWidth={2}
                  />
                </span>
                <span>
                  Estimasi porsi tagihan paket ({formatWeight(watchedWeight)}{" "}
                  via {COURIER_LABELS[watchedCourier]}{" "}
                  {PICKUP_WINDOW_LABELS[watchedWindow]?.label}):
                </span>
              </div>
              <span className="font-bold tabular-nums text-emerald-800 text-sm">
                ~{formatRupiah(simulatedShare)}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              <Link href="/drafts">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 rounded-lg border-slate-200 text-slate-700"
                >
                  Batal
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs hover:shadow-sm transition-all gap-1.5"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={16}
                  strokeWidth={2}
                />
                <span>
                  {submitting ? "Menyimpan..." : "Simpan & Gabungkan Draft"}
                </span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
