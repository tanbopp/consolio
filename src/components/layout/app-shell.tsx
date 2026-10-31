"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Package01Icon,
  LayoutDashboardIcon,
  Add01Icon,
  DeliveryTruck01Icon,
  HistoryIcon,
  UserGroupIcon,
  Settings01Icon,
  Notification01Icon,
  Logout01Icon,
  Menu01Icon,
  Cancel01Icon,
  Location01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/constants";
import { cn, formatDateId } from "@/lib/utils";

export function AppShell({
  children,
  breadcrumbs,
}: {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const user = session?.user as
    | {
        id?: string;
        name?: string;
        email?: string;
        role?: string;
        storeName?: string;
      }
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
      icon: LayoutDashboardIcon,
      exact: true,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/drafts",
      label: "Draft Paket",
      icon: Package01Icon,
      exact: false,
      matchPrefixes: ["/drafts"],
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/pickups/next",
      label: "Pickup Berikutnya",
      icon: DeliveryTruck01Icon,
      exact: true,
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/history",
      label: "Riwayat & Laporan",
      icon: HistoryIcon,
      exact: false,
      matchPrefixes: ["/history", "/pickups"],
      excludePrefixes: ["/pickups/next"],
      roles: ["SELLER", "CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/cluster-admin",
      label: "Operasional Cluster",
      icon: UserGroupIcon,
      exact: true,
      roles: ["CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/cluster-admin/manage",
      label: "Manajemen Cluster",
      icon: Settings01Icon,
      exact: true,
      roles: ["CLUSTER_ADMIN", "PLATFORM_ADMIN"],
    },
    {
      href: "/admin/settings",
      label: "Tarif & Fee Global",
      icon: Settings01Icon,
      exact: true,
      roles: ["PLATFORM_ADMIN"],
    },
  ].filter((item) => item.roles.includes(role));

  const accountItems = [
    {
      href: "/onboarding",
      label: "Profil & Cluster",
      icon: Location01Icon,
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* App Header (Full Width, 56px height) */}
      <header className="sticky top-0 z-40 h-14 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Buka Menu"
            >
              <HugeiconsIcon
                icon={mobileMenuOpen ? Cancel01Icon : Menu01Icon}
                size={20}
                strokeWidth={2}
              />
            </button>

            {/* Logo ringkas */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <HugeiconsIcon icon={Package01Icon} size={18} strokeWidth={2} />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                Consolio
              </span>
            </Link>

            {/* Breadcrumbs or Cluster Status */}
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <div className="hidden sm:flex items-center gap-1.5 pl-3 ml-2 border-l border-slate-200 text-xs text-slate-500">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.label}>
                    {idx > 0 && <span className="text-slate-300">/</span>}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-slate-900 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-800">
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : activeCluster ? (
              <div className="hidden md:flex items-center pl-3 ml-2 border-l border-slate-200">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  title="Pindah atau lihat cluster"
                >
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={14}
                    strokeWidth={2}
                    className="text-emerald-700"
                  />
                  <span>
                    Cluster:{" "}
                    <strong className="text-slate-900 font-semibold">
                      {activeCluster.name}
                    </strong>{" "}
                    ({activeCluster.code})
                  </span>
                </Link>
              </div>
            ) : (
              session?.user && (
                <div className="hidden md:flex items-center pl-3 ml-2 border-l border-slate-200">
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <HugeiconsIcon
                      icon={Location01Icon}
                      size={13}
                      strokeWidth={2}
                    />
                    <span>Belum terdaftar di cluster</span>
                  </Link>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick action: Buat Draft */}
            {session?.user && (
              <Link href="/drafts/new">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
                  <span className="hidden sm:inline">Draft Paket</span>
                </Button>
              </Link>
            )}

            {/* Notifikasi Popover */}
            {session?.user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  aria-label="Notifikasi"
                >
                  <HugeiconsIcon
                    icon={Notification01Icon}
                    size={18}
                    strokeWidth={2}
                  />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white shadow-lg z-50 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          Notifikasi
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markReadMutation.mutate()}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium hover:underline"
                        >
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={12}
                            strokeWidth={2}
                          />
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-5 text-center text-xs text-slate-400">
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
                                "p-3.5 text-xs transition-colors",
                                !n.isRead
                                  ? "bg-emerald-50/40"
                                  : "hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-slate-900">
                                  {n.title}
                                </p>
                                {!n.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">
                                {n.message}
                              </p>
                              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                <span>{formatDateId(n.createdAt)}</span>
                                {n.link && (
                                  <Link
                                    href={n.link}
                                    onClick={() => setNotifOpen(false)}
                                    className="font-medium text-emerald-700 hover:underline"
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

            {/* Menu Akun */}
            {session?.user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-slate-900 leading-none">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {ROLE_LABELS[role] || role}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                  title="Keluar dari akun"
                >
                  <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={2} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-slate-200"
                  >
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Daftar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Grid Layout: Sidebar 224px + Content fluid */}
      <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-[224px_minmax(0,1fr)]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-slate-200/80 bg-white sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <div className="p-3 space-y-5">
            <div>
              <p className="px-2.5 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Operasional
              </p>
              <nav className="space-y-1">
                {operationalItems.map((item) => {
                  const active = isNavActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                        active
                          ? "bg-emerald-50 text-emerald-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={16}
                        strokeWidth={active ? 2.2 : 1.8}
                        className={active ? "text-emerald-700" : "text-slate-400"}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="px-2.5 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Akun
              </p>
              <nav className="space-y-1">
                {accountItems.map((item) => {
                  const active = isNavActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                        active
                          ? "bg-emerald-50 text-emerald-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={16}
                        strokeWidth={active ? 2.2 : 1.8}
                        className={active ? "text-emerald-700" : "text-slate-400"}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Profil Toko Ringkas */}
          {session?.user && (
            <div className="border-t border-slate-100 p-3.5 bg-slate-50/60">
              <div className="px-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {profileData?.user?.storeName ||
                    user?.storeName ||
                    user?.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user?.email}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span className="text-[10px] font-medium text-slate-500">
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden">
            <div className="h-full w-64 bg-white p-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-slate-900 text-sm">
                    Menu Navigasi
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={18}
                      strokeWidth={2}
                    />
                  </button>
                </div>
                <nav className="mt-3 space-y-1">
                  {[...operationalItems, ...accountItems].map((item) => {
                    const active = isNavActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium",
                          active
                            ? "bg-emerald-50 text-emerald-900 font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <HugeiconsIcon
                          icon={item.icon}
                          size={16}
                          strokeWidth={active ? 2.2 : 1.8}
                          className={
                            active ? "text-emerald-700" : "text-slate-400"
                          }
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              {session?.user && (
                <div className="border-t border-slate-100 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-2 text-xs rounded-lg border-slate-200"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <HugeiconsIcon
                      icon={Logout01Icon}
                      size={14}
                      strokeWidth={2}
                    />
                    Keluar Akun
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="min-w-0 px-4 py-5 md:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
