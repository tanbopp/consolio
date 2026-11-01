"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Location01Icon,
  ShoppingBag01Icon,
  Add01Icon,
  Remove01Icon,
  Time01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import { CAMPUS_DELIVERY_WINDOWS, CAMPUS_BUILDINGS } from "@/lib/constants";

interface Product {
  id: string;
  storeId: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
}

interface Store {
  id: string;
  name: string;
  location: string;
  isOpen: boolean;
}

export default function CampusCustomerPage() {
  const queryClient = useQueryClient();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [deliveryWindow, setDeliveryWindow] = useState<string>("12:00");
  const [dropoffLocation, setDropoffLocation] = useState<string>("Gedung B - Fakultas Teknik");
  const [notes, setNotes] = useState<string>("");
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  // Fetch Kantin & Menu
  const { data, isLoading } = useQuery({
    queryKey: ["campus-stores"],
    queryFn: async () => {
      const res = await fetch("/api/campus/orders?action=stores");
      if (!res.ok) throw new Error("Gagal mengambil daftar kantin");
      return res.json();
    },
  });

  const stores: Store[] = data?.stores || [];
  const products: Product[] = data?.products || [];

  // Default pilih toko pertama jika belum terpilih
  const currentStoreId = selectedStoreId || (stores[0]?.id ?? "");
  const currentStore = stores.find((s) => s.id === currentStoreId);
  const filteredProducts = products.filter((p) => p.storeId === currentStoreId);

  // Cart operations
  const addToCart = (productId: string) => {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const itemsSubtotal = Object.entries(cart).reduce((sum, [pId, qty]) => {
    const prod = products.find((p) => p.id === pId);
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  const deliveryFee = totalCartCount > 0 ? 3000 : 0;
  const grandTotal = itemsSubtotal + deliveryFee;

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const orderItems = Object.entries(cart).map(([productId, qty]) => ({
        productId,
        qty,
      }));

      const res = await fetch("/api/campus/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: currentStoreId,
          items: orderItems,
          deliveryWindow,
          dropoffLocation,
          customerNotes: notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat pesanan");
      }
      return res.json();
    },
    onSuccess: () => {
      setOrderSuccess(true);
      setCart({});
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["campus-my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <AppShell
      breadcrumbs={[
        { label: "Consolio Kampus", href: "/campus" },
        { label: "Pesan Makanan" },
      ]}
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Banner Header */}
        <div className="rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm mb-2">
              <HugeiconsIcon icon={ShoppingBag01Icon} size={14} />
              Consolio Instant Campus Delivery
            </div>
            <h1 className="text-2xl font-black tracking-tight">Kantin ke Mahasiswa</h1>
            <p className="text-sm text-teal-100 max-w-xl mt-1">
              Pesan makanan dari kantin favoritmu. Kurir mahasiswa paruh waktu akan mengantarkannya tepat di jam makan siang atau sore secara terjadwal.
            </p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-sm border border-white/20 text-xs text-teal-100 space-y-1">
            <p className="font-bold text-white flex items-center gap-1">
              <HugeiconsIcon icon={Time01Icon} size={14} className="text-amber-300" />
              Jadwal Batch Pengantaran:
            </p>
            <p>• Siang: Pukul 12:00 WIB</p>
            <p>• Sore: Pukul 17:00 WIB</p>
          </div>
        </div>

        {orderSuccess && (
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-200 rounded-lg text-emerald-900">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Pesanan Berhasil Dibuat!</p>
                <p className="text-xs text-emerald-700">
                  Pesananmu sudah masuk antrean kantin dan otomatis tergabung di Batch jam {deliveryWindow} WIB.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/campus/orders")}
              className="text-xs font-bold border-emerald-400 bg-white"
            >
              Lacak Pesanan →
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Pilihan Kantin & Menu Makanan */}
          <div className="lg:col-span-2 space-y-5">
            {/* Pilih Kantin */}
            <Card className="rounded-2xl border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HugeiconsIcon icon={Location01Icon} size={18} className="text-teal-700" />
                  Pilih Kantin Kampus
                </CardTitle>
                <CardDescription>Pilih kios kantin untuk melihat daftar menu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {stores.map((s) => {
                    const isSelected = s.id === currentStoreId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStoreId(s.id);
                          setCart({}); // Reset cart jika ganti kantin
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-teal-700 bg-teal-50/80 shadow-sm ring-2 ring-teal-700/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <p className={`font-bold text-sm ${isSelected ? "text-teal-950" : "text-slate-800"}`}>
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{s.location}</p>
                        <Badge
                          variant={isSelected ? "teal" : "neutral"}
                          className="mt-2 text-[10px] py-0 px-2"
                        >
                          {s.isOpen ? "Buka Sekarang" : "Tutup"}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Daftar Menu */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  Menu Tersedia di {currentStore?.name}
                </h3>
                <span className="text-xs text-slate-500">
                  {filteredProducts.length} pilihan menu
                </span>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Memuat daftar menu...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredProducts.map((prod) => {
                    const qtyInCart = cart[prod.id] || 0;
                    return (
                      <div
                        key={prod.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                            {prod.imageUrl || "🍲"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm line-clamp-1">{prod.name}</p>
                            <p className="text-xs font-semibold text-teal-700 mt-0.5">
                              Rp{prod.price.toLocaleString("id-ID")}
                            </p>
                            <span className="text-[10px] text-slate-400">{prod.category}</span>
                          </div>
                        </div>

                        {qtyInCart === 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(prod.id)}
                            className="h-8 px-3 rounded-lg text-xs font-bold text-teal-800 border-teal-200 bg-teal-50 hover:bg-teal-100 shrink-0"
                          >
                            <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1" />
                            Tambah
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => removeFromCart(prod.id)}
                              className="w-6 h-6 rounded bg-white flex items-center justify-center text-slate-700 hover:bg-slate-200"
                            >
                              <HugeiconsIcon icon={Remove01Icon} size={12} />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-slate-800">
                              {qtyInCart}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(prod.id)}
                              className="w-6 h-6 rounded bg-teal-700 text-white flex items-center justify-center hover:bg-teal-800"
                            >
                              <HugeiconsIcon icon={Add01Icon} size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Ringkasan Checkout & Alamat Pengantaran */}
          <div className="space-y-4">
            <Card className="rounded-2xl border-slate-200 sticky top-20 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <HugeiconsIcon icon={ShoppingBag01Icon} size={18} className="text-teal-700" />
                    Keranjang Pesanan
                  </span>
                  <Badge variant="teal">{totalCartCount} Item</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* List Item Cart */}
                {totalCartCount === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Keranjang masih kosong. Pilih menu di samping untuk mulai memesan.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(cart).map(([pId, qty]) => {
                      const prod = products.find((p) => p.id === pId);
                      if (!prod) return null;
                      return (
                        <div key={pId} className="flex items-center justify-between text-xs py-1">
                          <span className="text-slate-800 font-medium">
                            {qty}x {prod.name}
                          </span>
                          <span className="font-bold text-slate-900">
                            Rp{(prod.price * qty).toLocaleString("id-ID")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Form Pengantaran Berbasis CustomDropdown */}
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Waktu Pengantaran (Batch Jam):
                    </label>
                    <CustomSelect
                      options={CAMPUS_DELIVERY_WINDOWS}
                      value={deliveryWindow}
                      onChange={setDeliveryWindow}
                      placeholder="Pilih Waktu"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Lokasi Antar (Dropoff Gedung):
                    </label>
                    <CustomSelect
                      options={CAMPUS_BUILDINGS}
                      value={dropoffLocation}
                      onChange={setDropoffLocation}
                      placeholder="Pilih Gedung Tujuan"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Catatan Tambahan (Opsional):
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Titip di satpam lantai 2"
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                    />
                  </div>
                </div>

                {/* Rincian Biaya */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Menu</span>
                    <span>Rp{itemsSubtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Ongkir Kurir Kampus</span>
                    <span className="font-semibold text-teal-700">
                      {totalCartCount > 0 ? `Rp${deliveryFee.toLocaleString("id-ID")}` : "Rp0"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Pembayaran</span>
                    <span className="text-teal-800">Rp{grandTotal.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <Button
                  className="w-full rounded-xl gap-2 font-bold"
                  disabled={totalCartCount === 0 || checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate()}
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                  {checkoutMutation.isPending ? "Memproses..." : "Checkout & Masuk Batch"}
                </Button>
                <p className="text-[10px] text-center text-slate-400">
                  Pembayaran fleksibel (Tunai ke kurir atau QRIS saat diantar).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
