"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  LayoutDashboard,
  Plus,
  Truck,
  History,
  Users,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  MapPin,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Navigasi dikelompokkan: Operasional & Pengaturan
  const operationalItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/drafts",
      label: "Draft Paket",
      icon: Package,
      exact: false,
      matchPrefixes: ["/drafts"],
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/pickups/next",
      label: "Pickup Berikutnya",
      icon: Truck,
      exact: true,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/history",
      label: "Riwayat & Laporan",
      icon: History,
      exact: false,
      matchPrefixes: ["/history", "/pickups"],
      excludePrefixes: ["/pickups/next"],
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/cluster-admin",
      label: "Operasional Cluster",
      icon: Users,
      exact: true,
      roles: ["CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/cluster-admin/manage",
      label: "Manajemen Cluster",
      icon: Settings,
      exact: true,
      roles: ["CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/admin/settings",
      label: "Tarif & Fee Global",
      icon: Settings,
      exact: true,
      roles: ["PLATFORM_ADMIN"],
    },
  ].filter((item) => item.roles.includes(role));

  const accountItems = [
    {
      href: "/onboarding",
      label: "Profil & Cluster",
      icon: MapPin,
      exact: true,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
  ].filter((item) => item.roles.includes(role));

  const isNavActive = (item: {
    href: string;
    exact?: boolean;
    matchPrefixes?: string[];
    excludePrefixes?: string[];
  }) => {
    if (item.excludePrefixes?.some((p) => pathname.startsWith(p))) {
      return false;
    }
    if (item.exact) {
      return pathname === item.href;
    }
    if (item.matchPrefixes) {
      return item.matchPrefixes.some((p) => pathname.startsWith(p));
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F8] text-[#182126]">
      {/* App Header (Full Width, 56px height) */}
      <header className="sticky top-0 z-40 h-14 border-b border-[#E3E7EA] bg-white">
        <div className="flex h-full w-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded p-1.5 text-[#626E76] hover:bg-[#F0F2F4] lg:hidden"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Logo ringkas tanpa badge tagline */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#17685F] text-white">
                <Package className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-[#182126]">
                Consolio
              </span>
            </Link>

            {/* Cluster Aktif sebagai status label faktual */}
            <div className="hidden md:flex items-center pl-3 ml-2 border-l border-[#E3E7EA]">
              {activeCluster ? (
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#626E76] hover:bg-[#F0F2F4] hover:text-[#182126] transition-colors"
                  title="Pindah atau lihat cluster"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#17685F]" />
                  <span>
                    Cluster: <strong className="text-[#182126]">{activeCluster.name}</strong> ({activeCluster.code})
                  </span>
                </Link>
              ) : (
                session?.user && (
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#9A6700] bg-[#FEF7E6] border border-[#F9E2B6] hover:bg-[#FEEFC3]"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Belum terdaftar di cluster</span>
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick action: Buat Draft */}
            {session?.user && (
              <Link href="/drafts/new">
                <Button size="sm" className="h-8 gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Draft Paket</span>
                </Button>
              </Link>
            )}

            {/* Notifikasi Popover Ringkas */}
            {session?.user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative rounded p-2 text-[#626E76] hover:bg-[#F0F2F4] hover:text-[#182126]"
                  aria-label="Notifikasi"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#17685F] px-1 text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-1.5 w-80 sm:w-96 rounded border border-[#E3E7EA] bg-white shadow-lg z-50">
                    <div className="flex items-center justify-between border-b border-[#E3E7EA] px-3.5 py-2.5 bg-[#FAFAFA]">
                      <div>
                        <p className="text-xs font-semibold text-[#182126]">
                          Notifikasi
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markReadMutation.mutate()}
                          className="inline-flex items-center gap-1 text-[11px] text-[#17685F] hover:underline"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#E3E7EA]">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#8D98A0]">
                          Tidak ada notifikasi baru
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
                                "p-3 text-xs transition-colors",
                                !n.isRead ? "bg-[#F0F7F6]" : "hover:bg-[#FAFAFA]"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-[#182126]">
                                  {n.title}
                                </p>
                                {!n.isRead && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#17685F] shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="mt-1 text-[#626E76] leading-relaxed text-[11px]">
                                {n.message}
                              </p>
                              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#8D98A0]">
                                <span>{formatDateId(n.createdAt)}</span>
                                {n.link && (
                                  <Link
                                    href={n.link}
                                    onClick={() => setNotifOpen(false)}
                                    className="font-medium text-[#17685F] hover:underline"
                                  >
                                    Buka →
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

            {/* Menu Akun Ringkas */}
            {session?.user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E3E7EA]">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-[#182126] leading-none">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-[#626E76] mt-0.5">
                    {ROLE_LABELS[role] || role}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="h-8 px-2 text-[#626E76] hover:text-[#B42318]"
                  title="Keluar dari akun"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="h-8">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="h-8">
                    Daftar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Grid Layout: Sidebar 224px + Content fluid min-width: 0 */}
      <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-[224px_minmax(0,1fr)]">
        {/* Desktop Sidebar (Sticky, Surface Putih, Border Kanan) */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-[#E3E7EA] bg-white sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <div className="p-3 space-y-4">
            <div>
              <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-[#8D98A0] uppercase">
                Operasional
              </p>
              <nav className="space-y-0.5">
                {operationalItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded px-2.5 py-2 text-xs font-medium transition-colors",
                        active
                          ? "bg-[#EDF5F4] text-[#10534C] font-semibold"
                          : "text-[#626E76] hover:bg-[#F6F7F8] hover:text-[#182126]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-[#17685F]" : "text-[#8D98A0]"
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-[#8D98A0] uppercase">
                Akun
              </p>
              <nav className="space-y-0.5">
                {accountItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded px-2.5 py-2 text-xs font-medium transition-colors",
                        active
                          ? "bg-[#EDF5F4] text-[#10534C] font-semibold"
                          : "text-[#626E76] hover:bg-[#F6F7F8] hover:text-[#182126]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-[#17685F]" : "text-[#8D98A0]"
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Profil Toko Ringkas di Bagian Bawah Sidebar */}
          {session?.user && (
            <div className="border-t border-[#E3E7EA] p-3 bg-[#FAFAFA]">
              <div className="px-1">
                <p className="text-xs font-semibold text-[#182126] truncate">
                  {profileData?.user?.storeName || user?.storeName || user?.name}
                </p>
                <p className="text-[11px] text-[#626E76] truncate">
                  {user?.email}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#20734D]" />
                  <span className="text-[10px] font-medium text-[#626E76]">
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-[#182126]/40 lg:hidden">
            <div className="h-full w-64 bg-white p-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EA]">
                  <span className="font-bold text-[#182126] text-sm">
                    Menu Navigasi
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded p-1 text-[#626E76] hover:bg-[#F0F2F4]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <nav className="mt-3 space-y-1">
                  {[...operationalItems, ...accountItems].map((item) => {
                    const Icon = item.icon;
                    const active = isNavActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded px-3 py-2 text-xs font-medium",
                          active
                            ? "bg-[#EDF5F4] text-[#10534C] font-semibold"
                            : "text-[#626E76] hover:bg-[#F6F7F8]"
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
                <div className="border-t border-[#E3E7EA] pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-2 text-xs"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Keluar Akun
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Area fluid full-width dengan padding 28-32px di desktop */}
        <main className="min-w-0 px-4 py-5 md:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
