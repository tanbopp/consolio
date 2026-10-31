"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Package, UserPlus } from "lucide-react";
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

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
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
        setServerError(json.error || "Gagal melakukan registrasi");
        setSubmitting(false);
        return;
      }

      // Langsung auto-login setelah registrasi berhasil dan arahkan ke halaman Onboarding
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      router.push("/onboarding");
      router.refresh();
    } catch {
      setServerError("Terjadi kesalahan jaringan. Silakan coba kembali.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-teal-900">
              Consolio
            </span>
          </Link>
          <p className="mt-2 text-sm text-slate-600">
            Daftar gratis untuk mulai patungan ongkir pickup bersama penjual di
            area Anda
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registrasi Akun & Profil Usaha</CardTitle>
            <CardDescription>
              Lengkapi data diri dan profil toko UMKM Anda di bawah ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serverError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nama Lengkap Pemilik</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Budi Santoso"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Nomor WhatsApp Aktif</Label>
                  <Input
                    id="phone"
                    placeholder="081234567890"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@umkm.id"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <Label htmlFor="storeName">Nama Toko / Usaha</Label>
                  <Input
                    id="storeName"
                    placeholder="Contoh: Keripik Pedas Kang Budi"
                    {...register("storeName")}
                  />
                  {errors.storeName && (
                    <p className="text-xs text-red-600">
                      {errors.storeName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessType">Jenis Usaha</Label>
                  <select
                    id="businessType"
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    {...register("businessType")}
                  >
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt}
                      </option>
                    ))}
                  </select>
                  {errors.businessType && (
                    <p className="text-xs text-red-600">
                      {errors.businessType.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Alamat Lengkap Lokasi Usaha</Label>
                <Input
                  id="address"
                  placeholder="Contoh: Komplek Griya Asri Blok B2 No. 5, Cimanggis, Depok"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-xs text-red-600">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Daftar Sebagai</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  {...register("role")}
                >
                  <option value="SELLER">
                    Penjual UMKM (Gabung ke Cluster & Kirim Paket)
                  </option>
                  <option value="CLUSTER_ADMIN">
                    Admin Cluster / Koordinator Area (Buat & Kelola Cluster)
                  </option>
                </select>
              </div>

              <Button
                type="submit"
                variant="cta"
                size="lg"
                className="w-full gap-2 mt-2"
                disabled={submitting}
              >
                <UserPlus className="h-5 w-5" />
                <span>
                  {submitting
                    ? "Mendaftarkan Akun..."
                    : "Daftar & Lanjut Pilih Cluster"}
                </span>
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-600">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-bold text-teal-700 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

