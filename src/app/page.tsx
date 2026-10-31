import React from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  Users,
  Calculator,
  CheckCircle2,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-teal-900">
                Consolio
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 border border-teal-200">
                Gabung Ongkir Penjual Kecil
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold">
                Masuk Akun
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="cta" size="sm" className="gap-1.5">
                <span>Mulai Gratis</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 text-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <Badge className="bg-teal-700/80 text-teal-100 border-teal-500/40 px-3 py-1 text-xs">
                Solusi Logistik Komunitas UMKM Indonesia
              </Badge>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Gabung Paket Satu Komplek,{" "}
                <span className="text-orange-400">
                  Biaya Pickup Turun Drastis!
                </span>
              </h1>
              <p className="text-base sm:text-lg text-teal-100 leading-relaxed max-w-2xl">
                Consolio membantu penjual kecil di satu area—komplek perumahan,
                kos, pasar, kampus, atau desa—menggabungkan paket menjadi{" "}
                <strong>satu jadwal pickup kurir bersama</strong>. Kurir tidak
                perlu bolak-balik, dan biaya pickup dibagi adil sesuai proporsi
                berat paket.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link href="/register">
                  <Button
                    variant="cta"
                    size="lg"
                    className="w-full sm:w-auto gap-2 text-base shadow-lg"
                  >
                    <span>Mulai Gratis Sekarang</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-teal-400/50 bg-teal-800/40 text-white hover:bg-teal-800 hover:text-white"
                  >
                    Coba Akun Demo (Budi / Admin)
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-teal-700/60 text-left">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-orange-400">
                    Hemat 75%
                  </p>
                  <p className="text-xs text-teal-200 mt-0.5">
                    Biaya jemput kurir per penjual
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">
                    100% Adil
                  </p>
                  <p className="text-xs text-teal-200 mt-0.5">
                    Rumus proporsi berat transparan
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                    1x Jemput
                  </p>
                  <p className="text-xs text-teal-200 mt-0.5">
                    Kurir tidak datang berulang kali
                  </p>
                </div>
              </div>
            </div>

            {/* Simulasi Perhitungan Real-Time */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-white p-5 sm:p-6 text-slate-900 shadow-2xl border border-teal-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      Contoh Simulasi Nyata
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Cluster Komplek Griya Asri (GRIYA01)
                    </h3>
                  </div>
                  <Badge variant="orange">J&T • Sore 16.00</Badge>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-800">
                        Total Paket Terkumpul
                      </p>
                      <p className="text-slate-500">
                        Budi (3 kg), Sinta (6 kg), Rina (6 kg)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-teal-800">
                        12 Paket • 15 kg
                      </p>
                      <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        SIAP PICKUP
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-slate-700">
                      Rincian Pembagian Biaya Pickup ({formatRupiah(25000)} + Fee
                      10%):
                    </p>
                    <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3">
                      <div className="flex items-center justify-between font-bold text-teal-950">
                        <span>Kang Budi (2 paket • 3,0 kg / 20%)</span>
                        <span className="text-sm text-teal-800">
                          {formatRupiah(5500)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-teal-700">
                        Rumus: (3 kg / 15 kg) × Rp25.000 × 1,10 ={" "}
                        <strong>Rp5.500</strong> (Hemat Rp19.500 dibanding
                        pickup sendiri!)
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-slate-700">
                      <span>Sinta Hijab (5 paket • 6,0 kg / 40%)</span>
                      <span className="font-bold">{formatRupiah(11000)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-slate-700">
                      <span>Rina Craft (5 paket • 6,0 kg / 40%)</span>
                      <span className="font-bold">{formatRupiah(11000)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Total Biaya + Fee Terkunci:
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatRupiah(27500)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manfaat Utama */}
      <section className="py-14 sm:py-20 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Mengapa UMKM Memilih Consolio?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Dirancang khusus untuk penjual kecil dengan pengiriman 1–5 paket per
            hari agar tetap mendapat kemudahan jemput kurir dengan biaya super
            ringan.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-t-4 border-t-teal-700">
            <CardContent className="pt-6 space-y-3">
              <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Cluster Berbasis Area Fisik
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gabung ke cluster komplek perumahan, kos, pasar, atau kampus
                terdekat menggunakan kode unik seperti{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-teal-800">
                  GRIYA01
                </code>
                .
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-orange-500">
            <CardContent className="pt-6 space-y-3">
              <div className="h-11 w-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Penggabungan Jadwal Otomatis
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sistem otomatis mengelompokkan draft paket dengan tanggal,
                jendela waktu (Pagi/Siang/Sore/Malam), dan kurir yang sama
                hingga kuota minimum tercapai.
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-600">
            <CardContent className="pt-6 space-y-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Calculator className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Pembagian Biaya Transparan
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tanpa tebak-tebakan. Tagihan dihitung proporsional dari berat
                paket Anda, dibulatkan ke Rupiah terdekat, dan dikunci permanen
                saat pickup selesai.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cara Kerja 4 Langkah */}
      <section className="bg-white border-y border-slate-200 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Cara Kerja Consolio
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Alur sederhana dari pendaftaran hingga kurir menjemput paket
              bersama-sama.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Daftar & Pilih Cluster",
                desc: "Buat profil toko UMKM Anda, lalu cari atau bergabung ke cluster area fisik terdekat.",
                icon: MapPin,
              },
              {
                step: "2",
                title: "Buat Draft Pengiriman",
                desc: "Masukkan alamat penerima, berat (gram), dimensi, kurir pilihan, dan jendela waktu pickup.",
                icon: Package,
              },
              {
                step: "3",
                title: "Kuota Tercapai → Siap Pickup",
                desc: "Saat total paket atau berat grup melewati batas minimum, status otomatis menjadi Siap Pickup.",
                icon: Clock,
              },
              {
                step: "4",
                title: "Pickup Selesai & Bagi Biaya",
                desc: "Kurir datang sekali mengambil semua paket. Sistem membagi biaya secara adil & mengunci laporan.",
                icon: CheckCircle2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative rounded-xl border border-slate-200 bg-slate-50/60 p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-extrabold text-white">
                      {item.step}
                    </span>
                    <Icon className="h-5 w-5 text-teal-700" />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link href="/register">
              <Button variant="cta" size="lg" className="gap-2">
                <span>Mulai Gratis Sekarang</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <span className="font-bold text-white">Consolio</span> — Aplikasi
            Konsolidasi Pengiriman & Patungan Pickup UMKM
          </div>
          <p>
            100% Deterministik & Berbasis Aturan Transparan • Bahasa Indonesia
          </p>
        </div>
      </footer>
    </div>
  );
}
