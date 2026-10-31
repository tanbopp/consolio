"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  LayoutDashboard,
  PlusCircle,
  Truck,
  History,
  Users,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  MapPin,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { cn, formatDateId } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const user = session?.user as
    | { id?: string; name?: string; email?: string; role?: string; storeName?: string }
    | undefined;
  const role = user?.role || "SELLER";

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!session?.user,
  });

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return { notifications: [] };
      return res.json();
    },
    enabled: !!session?.user,
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifications.filter(
    (n: { isRead: boolean }) => !n.isRead
  ).length;

  const activeCluster = profileData?.activeMembership?.cluster;

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard Penjual",
      icon: LayoutDashboard,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/drafts/new",
      label: "Buat Draft Paket",
      icon: PlusCircle,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
      highlight: true,
    },
    {
      href: "/drafts",
      label: "Draft Saya",
      icon: Package,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/pickups/next",
      label: "Pickup Berikutnya",
      icon: Truck,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/history",
      label: "Riwayat & Laporan",
      icon: History,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/onboarding",
      label: "Profil & Pilih Cluster",
      icon: MapPin,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/cluster-admin",
      label: "Dashboard Admin Cluster",
      icon: Users,
      roles: ["CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/cluster-admin/manage",
      label: "Manajemen Cluster",
      icon: ShieldCheck,
      roles: ["CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/admin/settings",
      label: "Admin Aplikasi (Tarif)",
      icon: Settings,
      roles: ["PLATFORM_ADMIN"],
    },
  ].filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-teal-900">
                  Consolio
                </span>
                <span className="hidden sm:inline-block ml-2 rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-200">
                  Gabung Ongkir UMKM
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {activeCluster ? (
              <Link
                href="/onboarding"
                className="hidden md:flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-medium text-teal-800 hover:bg-teal-100"
              >
                <MapPin className="h-3.5 w-3.5 text-teal-700" />
                <span>
                  Cluster: <strong>{activeCluster.name}</strong> ({activeCluster.code})
                </span>
              </Link>
            ) : (
              session?.user && (
                <Link
                  href="/onboarding"
                  className="hidden md:flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-800 hover:bg-orange-100"
                >
                  <MapPin className="h-3.5 w-3.5 text-orange-600" />
                  <span>Belum Gabung Cluster — Klik untuk Pilih</span>
                </Link>
              )
            )}

            {/* In-App Notifications */}
            {session?.user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Notifikasi"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Notifikasi In-App
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Siap dihubungkan ke WhatsApp API Gateway
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markReadMutation.mutate()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          Belum ada notifikasi baru.
                        </div>
                      ) : (
                        notifications.map(
                          (n: {
                            id: string;
                            title: string;
                            message: string;
                            isRead: boolean;
                            link?: string;
                            createdAt: string;
                          }) => (
                            <div
                              key={n.id}
                              className={cn(
                                "p-3.5 text-xs transition-colors hover:bg-slate-50",
                                !n.isRead && "bg-teal-50/50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-bold text-slate-900">
                                  {n.title}
                                </p>
                                {!n.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="mt-1 text-slate-600 leading-relaxed">
                                {n.message}
                              </p>
                              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                <span>{formatDateId(n.createdAt)}</span>
                                {n.link && (
                                  <Link
                                    href={n.link}
                                    onClick={() => setNotifOpen(false)}
                                    className="font-semibold text-teal-700 hover:underline"
                                  >
                                    Lihat detail →
                                  </Link>
                                )}
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {session?.user ? (
              <div className="flex items-center gap-2.5 pl-1 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-900 leading-none">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-teal-700 font-medium mt-0.5">
                    {ROLE_LABELS[role] || role}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="gap-1.5 text-slate-700"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="cta" size="sm">
                    Daftar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout with Sidebar */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {session?.user && (
              <div className="mb-3 rounded-lg bg-teal-900 p-3.5 text-white">
                <div className="flex items-center justify-between">
                  <Badge className="bg-orange-500 text-white border-none text-[10px]">
                    {ROLE_LABELS[role]}
                  </Badge>
                </div>
                <p className="mt-2 font-bold text-sm truncate">
                  {profileData?.user?.storeName || user?.storeName || user?.name}
                </p>
                <p className="text-xs text-teal-100 truncate">{user?.email}</p>
              </div>
            )}

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    item.href !== "/cluster-admin" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-teal-700 text-white shadow-sm"
                        : item.highlight
                        ? "bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive
                          ? "text-white"
                          : item.highlight
                          ? "text-orange-600"
                          : "text-slate-500"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Info Card Rumus Transparan */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-900">
            <p className="font-bold text-teal-950 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              Rumus Biaya Adil 100%
            </p>
            <p className="mt-1.5 text-teal-800 leading-relaxed">
              Biaya pickup dibagi proporsional sesuai berat paket Anda terhadap
              total berat cluster. Tanpa prediksi acak, transparan & terkunci
              saat pickup selesai.
            </p>
          </div>
        </aside>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 lg:hidden">
            <div className="h-full w-72 bg-white p-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <span className="font-extrabold text-teal-900 text-lg">
                    Menu Consolio
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="mt-4 space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold",
                          isActive
                            ? "bg-teal-700 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              {session?.user && (
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4" />
                  Keluar dari Akun
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 min-w-0 pb-16 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Quick Bar */}
      {session?.user && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 lg:hidden">
          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center gap-1 text-[11px] font-semibold",
              pathname === "/dashboard" ? "text-teal-700" : "text-slate-500"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/drafts"
            className={cn(
              "flex flex-col items-center gap-1 text-[11px] font-semibold",
              pathname === "/drafts" ? "text-teal-700" : "text-slate-500"
            )}
          >
            <Package className="h-5 w-5" />
            <span>Draft Saya</span>
          </Link>
          <Link
            href="/drafts/new"
            className="flex flex-col items-center justify-center -mt-5 h-12 w-12 rounded-full bg-orange-600 text-white shadow-lg"
            aria-label="Buat Draft"
          >
            <PlusCircle className="h-6 w-6" />
          </Link>
          <Link
            href="/pickups/next"
            className={cn(
              "flex flex-col items-center gap-1 text-[11px] font-semibold",
              pathname === "/pickups/next" ? "text-teal-700" : "text-slate-500"
            )}
          >
            <Truck className="h-5 w-5" />
            <span>Pickup</span>
          </Link>
          <Link
            href="/history"
            className={cn(
              "flex flex-col items-center gap-1 text-[11px] font-semibold",
              pathname === "/history" ? "text-teal-700" : "text-slate-500"
            )}
          >
            <History className="h-5 w-5" />
            <span>Riwayat</span>
          </Link>
        </div>
      )}
    </div>
  );
}

