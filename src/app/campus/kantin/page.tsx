"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LayoutDashboardIcon,
  CheckmarkCircle02Icon,
  ShoppingBag01Icon,
  Time01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { formatDateId } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  qty: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  status: string;
  totalPrice: number;
  deliveryWindow: string;
  dropoffLocation: string;
  customerNotes?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function CampusKantinPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["campus-store-orders"],
    queryFn: async () => {
      const res = await fetch("/api/campus/orders?action=store-orders");
      if (!res.ok) throw new Error("Gagal mengambil pesanan kantin");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const store = data?.store;
  const orders: Order[] = data?.orders || [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch("/api/campus/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) throw new Error("Gagal update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-store-orders"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY");
  const completedOrders = orders.filter((o) => o.status === "ON_DELIVERY" || o.status === "COMPLETED");

  return (
    <AppShell
      breadcrumbs={[
        { label: "Consolio Kantin", href: "/campus/kantin" },
        { label: "Kelola Pesanan Masuk" },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <HugeiconsIcon icon={LayoutDashboardIcon} size={22} className="text-teal-700" />
              {store?.name || "Kantin Bu Slamet"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Lokasi: {store?.location || "Kantin Pusat Lt. 1"} • Kelola masakan dan tandai saat siap diambil kurir mahasiswa.
            </p>
          </div>
          <Badge variant="teal" className="self-start text-xs font-bold">
            Kantin Buka & Menerima Pesanan
          </Badge>
        </div>

        {/* Statistik Ringkas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <HugeiconsIcon icon={Time01Icon} size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Perlu Dimasak</p>
                <p className="text-xl font-black text-slate-900">{pendingOrders.length} Pesanan</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <HugeiconsIcon icon={ShoppingBag01Icon} size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Siap Diambil Kurir</p>
                <p className="text-xl font-black text-blue-950">{readyOrders.length} Pesanan</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Selesai Hari Ini</p>
                <p className="text-xl font-black text-emerald-950">{completedOrders.length} Pesanan</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daftar Pesanan Masuk */}
        <div className="space-y-4">
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Antrean Pesanan Masuk ({orders.length})
          </h3>

          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Memuat pesanan...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm font-bold text-slate-800">Belum ada pesanan masuk</p>
              <p className="text-xs text-slate-500 mt-1">
                Pesanan mahasiswa akan langsung muncul di sini secara real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => {
                const statusCfg = ORDER_STATUS_CONFIG[ord.status] || {
                  label: ord.status,
                  badgeClass: "bg-slate-100 text-slate-800",
                };

                return (
                  <Card key={ord.id} className="rounded-2xl border-slate-200 overflow-hidden shadow-xs">
                    <CardHeader className="bg-slate-50/70 p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {ord.customerName}
                        </span>
                        <span className="text-xs text-slate-400">({ord.customerPhone})</span>
                        <span className="text-xs text-slate-500">• {formatDateId(ord.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 font-semibold">
                          Batch: {ord.deliveryWindow} WIB
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusCfg.badgeClass}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
                        {ord.items.map((it) => (
                          <div key={it.id} className="flex justify-between items-center text-slate-800">
                            <span className="font-medium">
                              {it.qty}x <strong>{it.productName}</strong>
                              {it.notes && (
                                <span className="text-slate-500 block italic text-[11px]">
                                  Catatan pembeli: {it.notes}
                                </span>
                              )}
                            </span>
                            <span className="font-bold">
                              Rp{(it.price * it.qty).toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                        <p className="text-xs text-slate-600">
                          Tujuan Pengantaran: <strong>{ord.dropoffLocation}</strong>
                          {ord.customerNotes && (
                            <span className="text-slate-400 block text-[11px]">
                              Info: {ord.customerNotes}
                            </span>
                          )}
                        </p>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {ord.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  orderId: ord.id,
                                  status: "PREPARING",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="text-xs font-bold rounded-xl"
                            >
                              Mulai Memasak
                            </Button>
                          )}

                          {(ord.status === "PENDING" || ord.status === "PREPARING") && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  orderId: ord.id,
                                  status: "READY",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl gap-1.5"
                            >
                              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                              Tandai Siap Diambil
                            </Button>
                          )}

                          {ord.status === "READY" && (
                            <Badge variant="orange" className="text-xs py-1 px-3">
                              Menunggu kurir mengambil pesanan
                            </Badge>
                          )}

                          {(ord.status === "ON_DELIVERY" || ord.status === "COMPLETED") && (
                            <Badge variant="teal" className="text-xs py-1 px-3">
                              Sudah diserahkan ke kurir
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
