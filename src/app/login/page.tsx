"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Package,
  LogIn,
  UserCheck,
  ShieldAlert,
  Users,
  Store,
  Globe,
} from "lucide-react";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("budi@umkm.id");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan saat mencoba masuk.");
      setLoading(false);
    }
  };

  const quickDemoLogin = async (
    demoEmail: string,
    targetRedirect = "/dashboard"
  ) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: demoEmail,
      password: "password123",
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    router.push(targetRedirect);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-6">
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
            Masuk untuk mengelola draft paket & jadwal pickup bersama
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Masuk ke Akun Anda</CardTitle>
            <CardDescription>
              Gunakan email & password terdaftar atau pilih tombol Akun Demo di
              bawah.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@toko.id"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading}
              >
                <LogIn className="h-4 w-4" />
                <span>{loading ? "Memproses..." : "Masuk Sekarang"}</span>
              </Button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400">
                  Atau masuk dengan OAuth
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 text-xs"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <Globe className="h-4 w-4 text-teal-700" />
              <span>Masuk dengan Google OAuth</span>
            </Button>

            {/* Quick Demo Switcher untuk menguji seluruh role */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Akun Demo Siap Pakai (Password: password123)
                </span>
                <Badge variant="teal">Klik 1x</Badge>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => quickDemoLogin("budi@umkm.id", "/dashboard")}
                  className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50/70 p-2.5 text-left text-xs hover:bg-teal-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-teal-700 shrink-0" />
                    <div>
                      <p className="font-bold text-teal-950">
                        Budi Santoso (Penjual UMKM — Griya Asri)
                      </p>
                      <p className="text-[11px] text-teal-700">
                        budi@umkm.id • Punya 2 paket J&T Siap Pickup (3 kg)
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-teal-800">Masuk →</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    quickDemoLogin("hendra@griyaasri.id", "/cluster-admin")
                  }
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/70 p-2.5 text-left text-xs hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600 shrink-0" />
                    <div>
                      <p className="font-bold text-orange-950">
                        Hendra Wijaya (Admin Cluster GRIYA01)
                      </p>
                      <p className="text-[11px] text-orange-800">
                        hendra@griyaasri.id • Konfirmasi Pickup & Anggota
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-orange-800">Masuk →</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    quickDemoLogin("admin@consolio.id", "/admin/settings")
                  }
                  className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-100/80 p-2.5 text-left text-xs hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-slate-700 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">
                        Bagus Pratama (Admin Aplikasi)
                      </p>
                      <p className="text-[11px] text-slate-600">
                        admin@consolio.id • Atur Tarif, Fee Platform & Statistik
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-800">Masuk →</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => quickDemoLogin("dedi@umkm.id", "/onboarding")}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-left text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-slate-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">
                        Dedi Kurnia (Penjual Baru • Menunggu ACC Cluster)
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-teal-700">Masuk →</span>
                </button>

                {/* Role Baru: B2B2C Kampus & Agent Kurir */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mode B2B2C & Kampus On-Demand
                  </p>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => quickDemoLogin("mahasiswa@campus.ac.id", "/campus")}
                  className="flex items-center justify-between rounded-lg border border-teal-300 bg-teal-50/90 p-2.5 text-left text-xs hover:bg-teal-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-teal-700 shrink-0" />
                    <div>
                      <p className="font-bold text-teal-950">
                        Rizky Pratama (Mahasiswa / Customer)
                      </p>
                      <p className="text-[11px] text-teal-700">
                        mahasiswa@campus.ac.id • Pesan Makanan Kantin & Tracking
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-teal-800">Masuk →</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => quickDemoLogin("kurir@campus.ac.id", "/campus/agent")}
                  className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50/80 p-2.5 text-left text-xs hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-700 shrink-0" />
                    <div>
                      <p className="font-bold text-purple-950">
                        Ahmad Dani (Agent Kurir Kampus)
                      </p>
                      <p className="text-[11px] text-purple-700">
                        kurir@campus.ac.id • Tugas Multi-Drop, Peta Rute & Fee
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-purple-800">Masuk →</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => quickDemoLogin("kantin@campus.ac.id", "/campus/kantin")}
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-left text-xs hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-amber-700 shrink-0" />
                    <div>
                      <p className="font-bold text-amber-950">
                        Ibu Slamet (Seller / Kantin Pusat)
                      </p>
                      <p className="text-[11px] text-amber-800">
                        kantin@campus.ac.id • Terima Pesanan & Tandai Siap Ambil
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-amber-800">Masuk →</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => quickDemoLogin("b2b@marketplace.id", "/marketplace/docs")}
                  className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/80 p-2.5 text-left text-xs hover:bg-indigo-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-700 shrink-0" />
                    <div>
                      <p className="font-bold text-indigo-950">
                        Admin B2B Marketplace Hub (Shopee / Tokopedia)
                      </p>
                      <p className="text-[11px] text-indigo-800">
                        b2b@marketplace.id • Webhook API & Manifest Pengambilan
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-indigo-800">Masuk →</span>
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-slate-600 pt-2">
              Belum punya akun penjual?{" "}
              <Link
                href="/register"
                className="font-bold text-teal-700 hover:underline"
              >
                Daftar Gratis di sini
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
