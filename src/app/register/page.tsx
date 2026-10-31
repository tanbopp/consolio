"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Package01Icon,
  UserGroupIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { registerSchema, RegisterInput } from "@/lib/validations";
import { BUSINESS_TYPES } from "@/lib/constants";
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
import { CustomSelect } from "@/components/ui/custom-select";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "0812",
      storeName: "",
      businessType: BUSINESS_TYPES[0],
      address: "",
      role: "SELLER",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal melakukan registrasi");
      }

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (loginRes?.error) {
        router.push("/login?registered=true");
      } else {
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Terjadi kesalahan saat pendaftaran");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const businessTypeOptions = BUSINESS_TYPES.map((bt) => ({
    value: bt,
    label: bt,
  }));

  const roleOptions = [
    {
      value: "SELLER",
      label: "Penjual UMKM",
      description: "Gabung ke cluster lokal dan hemat biaya pickup bersama",
    },
    {
      value: "CLUSTER_ADMIN",
      label: "Admin Cluster",
      description: "Buat, kelola anggota, dan koordinasi jadwal pickup cluster",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <HugeiconsIcon icon={Package01Icon} size={22} strokeWidth={2} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Consolio
          </span>
        </Link>
        <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Daftarkan Akun & Usaha Anda
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Mulai hemat biaya jemput kurir dengan konsolidasi satu area fisik.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base font-semibold text-slate-900">
              Formulir Pendaftaran
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Data akan digunakan untuk koordinasi pickup kurir bersama.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serverError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-medium text-slate-700">
                    Nama Lengkap Pemilik
                  </Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Budi Santoso"
                    className="rounded-lg border-slate-200"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-medium text-slate-700">
                    No. WhatsApp Aktif
                  </Label>
                  <Input
                    id="phone"
                    placeholder="081234567890"
                    className="rounded-lg border-slate-200"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                    Alamat Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@toko.com"
                    className="rounded-lg border-slate-200"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                    Password Akun
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    className="rounded-lg border-slate-200"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-[11px] text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <Label htmlFor="storeName" className="text-xs font-medium text-slate-700">
                    Nama Toko / Usaha
                  </Label>
                  <Input
                    id="storeName"
                    placeholder="Contoh: Keripik Pedas Budi"
                    className="rounded-lg border-slate-200"
                    {...register("storeName")}
                  />
                  {errors.storeName && (
                    <p className="text-[11px] text-red-600">{errors.storeName.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="businessType" className="text-xs font-medium text-slate-700">
                    Jenis Usaha
                  </Label>
                  <Controller
                    name="businessType"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        options={businessTypeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pilih jenis usaha..."
                      />
                    )}
                  />
                  {errors.businessType && (
                    <p className="text-[11px] text-red-600">{errors.businessType.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="address" className="text-xs font-medium text-slate-700">
                  Alamat Lengkap Lokasi Usaha
                </Label>
                <Input
                  id="address"
                  placeholder="Contoh: Komplek Griya Asri Blok B2 No. 5, Cimanggis, Depok"
                  className="rounded-lg border-slate-200"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-[11px] text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="role" className="text-xs font-medium text-slate-700">
                  Daftar Sebagai
                </Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      options={roleOptions}
                      value={field.value}
                      onChange={(val) =>
                        field.onChange(val as "SELLER" | "CLUSTER_ADMIN")
                      }
                      placeholder="Pilih peran..."
                    />
                  )}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs hover:shadow-sm transition-all gap-2 mt-3"
                disabled={submitting}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={2} />
                <span>
                  {submitting
                    ? "Mendaftarkan Akun..."
                    : "Daftar & Lanjut Pilih Cluster"}
                </span>
              </Button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Masuk di sini
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
