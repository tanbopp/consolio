import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PackageIcon,
  DeliveryTruck01Icon,
  UserGroupIcon,
  Calculator01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  Location01Icon,
  Clock01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar with subtle backdrop-blur */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs transition-transform group-hover:scale-105">
              <HugeiconsIcon icon={PackageIcon} size={20} strokeWidth={1.8} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Consolio
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                Patungan Logistik UMKM
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900 font-medium px-3.5 h-9 rounded-lg"
              >
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs hover:shadow-sm px-4 h-9 rounded-lg gap-1.5 transition-all"
              >
                <span>Mulai Gratis</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-100">
        {/* Soft radial gradient background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(16,185,129,0.12),transparent_70%)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & Action */}
            <div className="lg:col-span-7 space-y-6">
              {/* Refined Micro-Badge with Pulse Dot */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span>Konsolidasi Pickup Penjual Komunitas</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                Kirim paket satu area,{" "}
                <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy decoration-1 underline-offset-4">
                  patungan ongkir kurir
                </span>{" "}
                secara adil.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Consolio membantu penjual kecil dalam satu komplek, sentra UMKM, atau
                kampus menyatukan jadwal jemput kurir. Kurir hanya perlu datang sekali,
                dan biaya pickup dibagi proporsional berdasarkan berat paket.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs hover:shadow-sm transition-all gap-2 text-base"
                  >
                    <span>Daftar Toko Sekarang</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={2} />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-12 px-6 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-base shadow-xs"
                  >
                    Masuk Akun Demo
                  </Button>
                </Link>
              </div>

              {/* Clean Metric Strip */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200/70">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Hemat 75%
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Rata-rata biaya jemput per penjual
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Proporsional
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Beban dihitung dari porsi berat paket
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700">
                    1x Pickup
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Kurir tidak mondar-mandir
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Simulation Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Simulasi Pickup Bersama
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                      Griya Asri Sentra (GRIYA01)
                    </h3>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium text-[11px] px-2.5 py-0.5 rounded-full">
                    J&T • Sore 16.00
                  </Badge>
                </div>

                {/* Aggregate Summary */}
                <div className="mt-4 rounded-xl bg-slate-50/80 border border-slate-200/70 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Status Kuota Pickup
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        3 penjual bergabung dalam jadwal
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">
                        12 Paket • 15,0 kg
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 mt-0.5">
                        Siap Dijemput
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seller Share Breakdown List */}
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                    <span>Partisipan Penjual</span>
                    <span>Beban Patungan</span>
                  </div>

                  {/* Seller 1 - Highlight */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-emerald-950">
                          Toko Budi (2 paket)
                        </p>
                        <p className="text-[11px] text-emerald-700/90 mt-0.5">
                          3,0 kg dari total 15 kg (porsi 20%)
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-800">
                          {formatRupiah(5500)}
                        </span>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          Hemat {formatRupiah(19500)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Seller 2 */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50/60 transition-colors">
                    <div>
                      <span className="font-medium text-slate-900">Sinta Hijab</span>
                      <span className="text-[11px] text-slate-500 ml-1.5">(5 paket • 6,0 kg / 40%)</span>
                    </div>
                    <span className="font-semibold text-slate-900">{formatRupiah(11000)}</span>
                  </div>

                  {/* Seller 3 */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50/60 transition-colors">
                    <div>
                      <span className="font-medium text-slate-900">Rina Craft</span>
                      <span className="text-[11px] text-slate-500 ml-1.5">(5 paket • 6,0 kg / 40%)</span>
                    </div>
                    <span className="font-semibold text-slate-900">{formatRupiah(11000)}</span>
                  </div>
                </div>

                {/* Footer Note & Locked Total */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 italic">
                    *Biaya dibagi proporsional berdasarkan berat paket
                  </span>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Total Kurir</span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatRupiah(27500)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section: Mengapa UMKM Memilih Consolio? */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Mengapa UMKM Memilih Consolio?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Dirancang untuk penjual kecil dengan volume 1–5 paket per hari agar
              tetap mendapatkan fasilitas jemput kurir tanpa terbebani biaya tinggi.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs hover:shadow-sm transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-5">
                <HugeiconsIcon icon={UserGroupIcon} size={24} strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 text-left">
                Cluster Berbasis Area Fisik
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed text-left">
                Bergabung ke kelompok perumahan, gang, atau ruko terdekat menggunakan kode unik cluster tanpa batas birokrasi rumit.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs hover:shadow-sm transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-5">
                <HugeiconsIcon icon={DeliveryTruck01Icon} size={24} strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 text-left">
                Penggabungan Jadwal Otomatis
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed text-left">
                Paket dengan tanggal kirim, sesi waktu, dan pilihan ekspedisi yang sama dihimpun otomatis hingga kuota minimum terpenuhi.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs hover:shadow-sm transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-5">
                <HugeiconsIcon icon={Calculator01Icon} size={24} strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 text-left">
                Kalkulasi Beban Terbuka
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed text-left">
                Tagihan dihitung proporsional dari gramatur paket yang Anda kirim, dibulatkan ke rupiah terdekat, dan tercatat permanen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cara Kerja 4 Langkah */}
      <section className="py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Alur Operasional Sederhana
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Empat langkah praktis dari registrasi paket hingga kurir mengambil barang.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Daftar & Pilih Cluster",
                desc: "Daftarkan profil toko Anda dan bergabung ke cluster lingkungan fisik terdekat.",
                icon: Location01Icon,
              },
              {
                step: "02",
                title: "Input Draft Paket",
                desc: "Masukkan detail penerima, bobot gram, ekspedisi, dan jendela jam jemput.",
                icon: PackageIcon,
              },
              {
                step: "03",
                title: "Kuota Terkumpul",
                desc: "Saat akumulasi paket memenuhi syarat minimum, status langsung beralih ke Siap Pickup.",
                icon: Clock01Icon,
              },
              {
                step: "04",
                title: "Penjemputan & Rekap",
                desc: "Kurir mengambil paket serentak. Sistem mengunci tagihan proporsional tiap penjual.",
                icon: CheckmarkCircle02Icon,
              },
            ].map((item) => {
              return (
                <div
                  key={item.step}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {item.step}
                      </span>
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.8} />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link href="/register">
              <Button
                size="lg"
                className="h-11 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-all gap-2"
              >
                <span>Mulai Gunakan Consolio</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <HugeiconsIcon icon={ShieldCheckIcon} size={16} strokeWidth={1.8} />
            </div>
            <span className="font-semibold text-white">Consolio</span>
            <span className="text-slate-500">•</span>
            <span>Platform Operasional Konsolidasi Logistik UMKM</span>
          </div>
          <p className="text-slate-500 text-center sm:text-right">
            Sistem deterministik & transparan untuk efisiensi logistik lokal.
          </p>
        </div>
      </footer>
    </div>
  );
}
