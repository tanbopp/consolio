export const COURIER_LABELS: Record<string, string> = {
  JNE: "JNE Express",
  JNT: "J&T Express",
  SICEPAT: "SiCepat",
  ANTERAJA: "AnterAja",
  OTHER: "Kurir Lainnya",
};

export const PICKUP_WINDOW_LABELS: Record<string, { label: string; timeRange: string }> = {
  MORNING: { label: "Pagi", timeRange: "08.00 - 11.00 WIB" },
  AFTERNOON: { label: "Siang", timeRange: "12.00 - 15.00 WIB" },
  EVENING: { label: "Sore", timeRange: "15.00 - 18.00 WIB" },
  NIGHT: { label: "Malam", timeRange: "18.30 - 21.00 WIB" },
};

export const DRAFT_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; description: string }
> = {
  DRAFT: {
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    description: "Disimpan sementara, belum masuk antrean penggabungan",
  },
  QUEUED: {
    label: "Antre Gabung",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-300",
    description: "Menunggu kuota paket/berat minimum cluster tercapai",
  },
  READY_FOR_PICKUP: {
    label: "Siap Pickup",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    description: "Kuota tercapai! Menunggu konfirmasi & jadwal kurir bersama",
  },
  PICKED_UP: {
    label: "Sudah Dipickup",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
    description: "Paket telah dijemput kurir dalam Pickup Bersama",
  },
  SHIPPED: {
    label: "Dalam Pengiriman",
    badgeClass: "bg-indigo-900 text-white border-indigo-950",
    description: "Paket sedang dalam perjalanan ke kota tujuan",
  },
  DELIVERED: {
    label: "Terkirim",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    description: "Paket telah diterima oleh pembeli",
  },
  CANCELLED: {
    label: "Dibatalkan",
    badgeClass: "bg-red-100 text-red-700 border-red-300",
    description: "Pengiriman paket dibatalkan",
  },
};

export const GROUP_PICKUP_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  SCHEDULED: {
    label: "Terjadwal",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
  IN_PROGRESS: {
    label: "Sedang Dijemput",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  COMPLETED: {
    label: "Selesai & Biaya Terkunci",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  CANCELLED: {
    label: "Dibatalkan",
    badgeClass: "bg-red-100 text-red-700 border-red-300",
  },
};

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: "Menunggu Konfirmasi",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
  },
  PREPARING: {
    label: "Sedang Dimasak",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  READY: {
    label: "Siap Diambil",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
  ON_DELIVERY: {
    label: "Sedang Diantar",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
  },
  COMPLETED: {
    label: "Selesai",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  CANCELLED: {
    label: "Dibatalkan",
    badgeClass: "bg-red-100 text-red-700 border-red-300",
  },
};

export const ROLE_LABELS: Record<string, string> = {
  SELLER: "Penjual UMKM / Kantin",
  CLUSTER_ADMIN: "Admin Cluster",
  PLATFORM_ADMIN: "Admin Aplikasi",
  CUSTOMER: "Mahasiswa / Pembeli",
  AGENT_COURIER: "Agent Kurir Kampus",
  ADMIN_ORGANIZATION: "Admin Organisasi",
};

export const CAMPUS_DELIVERY_WINDOWS = [
  { value: "12:00", label: "Makan Siang (12:00 WIB)", description: "Batch Pengantaran Siang" },
  { value: "17:00", label: "Sore (17:00 WIB)", description: "Batch Pengantaran Sore" },
];

export const CAMPUS_BUILDINGS = [
  { value: "Gedung A - Rektorat", label: "Gedung A - Rektorat & Administrasi" },
  { value: "Gedung B - Fakultas Teknik", label: "Gedung B - Fakultas Teknik & Lab" },
  { value: "Gedung C - Fakultas Ekonomi", label: "Gedung C - Fakultas Ekonomi & Bisnis" },
  { value: "Gedung D - Perpustakaan Pusat", label: "Gedung D - Perpustakaan Pusat" },
  { value: "Asrama Mahasiswa Putra", label: "Asrama Mahasiswa Putra (Lobby)" },
  { value: "Asrama Mahasiswa Putri", label: "Asrama Mahasiswa Putri (Lobby)" },
];

export const BUSINESS_TYPES = [
  "Kuliner & Makanan Kering",
  "Fashion & Hijab",
  "Kerajinan Tangan (Craft)",
  "Kosmetik & Skincare",
  "Elektronik & Aksesoris HP",
  "Buku & Alat Tulis",
  "Kebutuhan Rumah Tangga",
  "Lainnya",
];

export const INDONESIAN_PROVINCES = [
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Banten",
  "Bali",
  "Sumatera Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Lampung",
  "Kalimantan Timur",
  "Kalimantan Selatan",
  "Sulawesi Selatan",
  "Lainnya",
];
