"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DeliveryTruck01Icon,
  CheckmarkCircle02Icon,
  ShoppingBag01Icon,
  Location01Icon,
  Coins01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Dynamic import Leaflet map (karena butuh object `window`)
const RouteMap = dynamic(() => import("@/components/campus/route-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
      Memuat Peta Rute Multi-Drop Kampus...
    </div>
  ),
});

interface CourierTask {
  id: string;
  batchId: string;
  type: "PICKUP" | "DELIVERY";
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  targetName: string;
  address: string;
  orderCount: number;
  feeEarned: number;
  sequence: number;
}

export default function CampusAgentPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["campus-agent-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/campus/courier");
      if (!res.ok) throw new Error("Gagal mengambil data tugas kurir");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const activeTasks: CourierTask[] = data?.activeTasks || [];
  const completedTasks: CourierTask[] = data?.completedTasks || [];
  const totalFeeEarned: number = data?.totalFeeEarned || 0;
  const potentialFee: number = data?.potentialFee || 0;

  const taskActionMutation = useMutation({
    mutationFn: async ({ taskId, action }: { taskId: string; action: string }) => {
      const res = await fetch("/api/campus/courier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action }),
      });
      if (!res.ok) throw new Error("Gagal mengupdate tugas");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-agent-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const allMapTasks = [...activeTasks, ...completedTasks].sort((a, b) => a.sequence - b.sequence);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Consolio Kampus", href: "/campus/agent" },
        { label: "Dashboard Agent Kurir" },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Banner Pendapatan & Ringkasan Kurir */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-teal-200 bg-gradient-to-br from-teal-50 to-white shadow-xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-700 text-white shadow-sm">
                <HugeiconsIcon icon={Coins01Icon} size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Pendapatan Hari Ini</p>
                <p className="text-xl font-black text-teal-950 mt-0.5">
                  Rp{totalFeeEarned.toLocaleString("id-ID")}
                </p>
                <span className="text-[11px] text-teal-700 font-semibold">
                  +{data?.completedCount || 0} tugas selesai
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <HugeiconsIcon icon={DeliveryTruck01Icon} size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Tugas Dalam Antrean</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  {activeTasks.length} Tugas
                </p>
                <span className="text-[11px] text-blue-700 font-semibold">
                  Potensi Fee: Rp{potentialFee.toLocaleString("id-ID")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Jadwal Pengantaran</p>
                <p className="text-base font-extrabold text-slate-800 mt-0.5">
                  Batch Siang (12:00)
                </p>
                <span className="text-[11px] text-slate-500">Kantin Pusat ➔ Fakultas</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Peta Rute Multi-Drop Sederhana */}
        <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <HugeiconsIcon icon={Location01Icon} size={18} className="text-teal-700" />
                Peta Rute Multi-Drop Kampus (Leaflet Map)
              </CardTitle>
              <CardDescription>
                Rute berurutan dari Kantin pengambilan makanan menuju gedung-gedung mahasiswa.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {allMapTasks.length} Titik Stop
            </Badge>
          </CardHeader>
          <CardContent className="p-4">
            <RouteMap tasks={allMapTasks} />
          </CardContent>
        </Card>

        {/* Daftar Tugas Hari Ini */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Daftar Tugas Berurutan (Smart Multi-Drop Routing)
            </h3>
            <span className="text-xs text-slate-500">Sistem otomatis mengurutkan titik singgah terdekat</span>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Memuat tugas...</div>
          ) : activeTasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} />
              </div>
              <p className="font-bold text-slate-800 text-sm">Semua Tugas Sudah Selesai!</p>
              <p className="text-xs text-slate-500 mt-1">
                Kerja bagus! Seluruh pesanan di batch ini telah diambil dari kantin dan diantar ke mahasiswa.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((task) => {
                const isPickup = task.type === "PICKUP";
                return (
                  <div
                    key={task.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex flex-col items-center">
                        <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                          {task.sequence}
                        </span>
                        <div className="w-0.5 h-6 bg-slate-200 mt-1 hidden sm:block" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isPickup ? "teal" : "orange"}>
                            {isPickup ? "AMBIL DI KANTIN" : "ANTAR KE MAHASISWA"}
                          </Badge>
                          <span className="text-xs font-bold text-slate-900">{task.targetName}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <HugeiconsIcon icon={Location01Icon} size={13} className="text-slate-400" />
                          {task.address}
                        </p>
                        <p className="text-[11px] text-teal-800 font-semibold mt-1">
                          📦 {task.orderCount} Pesanan Mahasiswa • Fee Kurir: Rp
                          {task.feeEarned.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isPickup ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            taskActionMutation.mutate({
                              taskId: task.id,
                              action: "COMPLETE_PICKUP",
                            })
                          }
                          disabled={taskActionMutation.isPending}
                          className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl gap-1.5"
                        >
                          <HugeiconsIcon icon={ShoppingBag01Icon} size={14} />
                          Saya Sudah Ambil Semua
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            taskActionMutation.mutate({
                              taskId: task.id,
                              action: "COMPLETE_DELIVERY",
                            })
                          }
                          disabled={taskActionMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5"
                        >
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                          Saya Sudah Antar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
