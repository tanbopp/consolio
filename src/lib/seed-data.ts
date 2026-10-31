import bcrypt from "bcryptjs";
import { calculateGroupPickupCosts } from "@/lib/cost-calculator";

export type RoleType = "SELLER" | "CLUSTER_ADMIN" | "PLATFORM_ADMIN";
export type MemberStatusType = "PENDING" | "ACTIVE" | "REJECTED";
export type CourierType = "JNE" | "JNT" | "SICEPAT" | "ANTERAJA" | "OTHER";
export type PickupWindowType = "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
export type DraftStatusType =
  | "DRAFT"
  | "QUEUED"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type GroupPickupStatusType =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type PaymentStatusType = "UNPAID" | "PAID" | "WAIVED";

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: RoleType;
  storeName: string;
  businessType: string;
  address: string;
  createdAt: string;
}

export interface ClusterEntity {
  id: string;
  name: string;
  code: string;
  description: string;
  centerAddress: string;
  radiusKm: number;
  pickupDays: string[];
  pickupTimeWindows: PickupWindowType[];
  minPackages: number;
  minTotalWeightGram: number;
  basePickupFee: number;
  platformFeePercent: number;
  adminId: string;
  createdAt: string;
}

export interface ClusterMemberEntity {
  id: string;
  clusterId: string;
  userId: string;
  status: MemberStatusType;
  joinedAt: string;
}

export interface ShipmentDraftEntity {
  id: string;
  userId: string;
  clusterId: string;
  recipientName: string;
  recipientPhone: string;
  destinationAddress: string;
  city: string;
  province: string;
  postalCode: string;
  weightGram: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  itemValue: number;
  notes: string;
  courier: CourierType;
  pickupDate: string; // YYYY-MM-DD
  pickupWindow: PickupWindowType;
  status: DraftStatusType;
  createdAt: string;
  updatedAt: string;
}

export interface GroupPickupEntity {
  id: string;
  code: string;
  clusterId: string;
  courier: CourierType;
  pickupDate: string; // YYYY-MM-DD
  pickupWindow: PickupWindowType;
  pickupTime: string;
  totalPackages: number;
  totalWeightGram: number;
  basePickupFee: number;
  platformFeePercent: number;
  totalCost: number;
  roundingDiff: number;
  forcedBelowMin: boolean;
  costLocked: boolean;
  status: GroupPickupStatusType;
  createdAt: string;
  completedAt?: string | null;
}

export interface PickupItemEntity {
  id: string;
  groupPickupId: string;
  shipmentDraftId: string;
  sellerId: string;
  weightGram: number;
  costShare: number;
  platformFee: number;
  totalCharge: number;
}

export interface PaymentRecordEntity {
  id: string;
  groupPickupId: string;
  sellerId: string;
  totalWeightGram: number;
  weightPercent: number;
  costShare: number;
  platformFee: number;
  roundingAdjust: number;
  amount: number;
  status: PaymentStatusType;
  paidAt?: string | null;
  createdAt: string;
}

export interface NotificationEntity {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING";
  link?: string;
  isRead: boolean;
  whatsappStatus: string;
  createdAt: string;
}

export interface ActivityLogEntity {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: RoleType;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  details?: string;
  createdAt: string;
}

export interface PlatformConfigEntity {
  id: string;
  defaultBasePickupFee: number;
  defaultPlatformFeePct: number;
  defaultMinPackages: number;
  defaultMinWeightGram: number;
  soloPickupEstimateRp: number;
  updatedAt: string;
}

export interface DatabaseState {
  users: UserEntity[];
  clusters: ClusterEntity[];
  clusterMembers: ClusterMemberEntity[];
  shipmentDrafts: ShipmentDraftEntity[];
  groupPickups: GroupPickupEntity[];
  pickupItems: PickupItemEntity[];
  paymentRecords: PaymentRecordEntity[];
  notifications: NotificationEntity[];
  activityLogs: ActivityLogEntity[];
  platformConfig: PlatformConfigEntity;
}

export function buildInitialSeedData(): DatabaseState {
  // Password default untuk semua akun demo: "password123"
  const passwordHash = bcrypt.hashSync("password123", 8);

  const now = new Date("2026-10-31T09:00:00.000Z");
  const tomorrow = "2026-11-01";
  const dayAfter = "2026-11-02";
  const pastDate1 = "2026-10-25";
  const pastDate2 = "2026-10-27";
  const pastDate3 = "2026-10-29";

  // 1 Admin Aplikasi + 2 Admin Cluster + 10 Penjual = 13 User
  const users: UserEntity[] = [
    {
      id: "usr-admin-platform",
      name: "Bagus Pratama (Admin Consolio)",
      email: "admin@consolio.id",
      passwordHash,
      phone: "081110002000",
      role: "PLATFORM_ADMIN",
      storeName: "Consolio HQ",
      businessType: "Manajemen Platform",
      address: "Jl. Jend. Sudirman Kav. 52, Jakarta Selatan",
      createdAt: "2026-10-01T08:00:00.000Z",
    },
    {
      id: "usr-admin-cluster-1",
      name: "Hendra Wijaya",
      email: "hendra@griyaasri.id",
      passwordHash,
      phone: "081211112222",
      role: "CLUSTER_ADMIN",
      storeName: "Posko UMKM Griya Asri",
      businessType: "Koordinator RW 08",
      address: "Komplek Griya Asri Blok A1 No. 1, Cimanggis, Depok",
      createdAt: "2026-10-02T08:00:00.000Z",
    },
    {
      id: "usr-admin-cluster-2",
      name: "Dewi Kartika",
      email: "dewi@kampusmargonda.id",
      passwordHash,
      phone: "081233334444",
      role: "CLUSTER_ADMIN",
      storeName: "Sentra Kos & UMKM Margonda",
      businessType: "Koordinator Komunitas Kampus",
      address: "Jl. Margonda Raya Gg. Kober No. 12, Pondok Cina, Depok",
      createdAt: "2026-10-02T09:00:00.000Z",
    },
    // 10 Penjual UMKM
    {
      id: "usr-seller-1",
      name: "Budi Santoso",
      email: "budi@umkm.id",
      passwordHash,
      phone: "081310010001",
      role: "SELLER",
      storeName: "Keripik Pedas Kang Budi",
      businessType: "Kuliner & Makanan Kering",
      address: "Komplek Griya Asri Blok B2 No. 5, Depok",
      createdAt: "2026-10-05T08:00:00.000Z",
    },
    {
      id: "usr-seller-2",
      name: "Sinta Maharani",
      email: "sinta@umkm.id",
      passwordHash,
      phone: "081310010002",
      role: "SELLER",
      storeName: "Sinta Hijab & Scarf",
      businessType: "Fashion & Hijab",
      address: "Komplek Griya Asri Blok C4 No. 11, Depok",
      createdAt: "2026-10-05T09:00:00.000Z",
    },
    {
      id: "usr-seller-3",
      name: "Rina Wulandari",
      email: "rina@umkm.id",
      passwordHash,
      phone: "081310010003",
      role: "SELLER",
      storeName: "Rina Craft Rajut",
      businessType: "Kerajinan Tangan (Craft)",
      address: "Komplek Griya Asri Blok D1 No. 8, Depok",
      createdAt: "2026-10-06T08:00:00.000Z",
    },
    {
      id: "usr-seller-4",
      name: "Agus Setiawan",
      email: "agus@umkm.id",
      passwordHash,
      phone: "081310010004",
      role: "SELLER",
      storeName: "Kopi Sangrai Mas Agus",
      businessType: "Kuliner & Makanan Kering",
      address: "Komplek Griya Asri Blok A3 No. 14, Depok",
      createdAt: "2026-10-06T10:00:00.000Z",
    },
    {
      id: "usr-seller-5",
      name: "Lestari Putri",
      email: "lestari@umkm.id",
      passwordHash,
      phone: "081310010005",
      role: "SELLER",
      storeName: "Tari Natural Skincare",
      businessType: "Kosmetik & Skincare",
      address: "Komplek Griya Asri Blok E2 No. 3, Depok",
      createdAt: "2026-10-07T08:00:00.000Z",
    },
    {
      id: "usr-seller-6",
      name: "Fajar Nugroho",
      email: "fajar@umkm.id",
      passwordHash,
      phone: "081310010006",
      role: "SELLER",
      storeName: "Fajar Gadget Casing",
      businessType: "Elektronik & Aksesoris HP",
      address: "Jl. Margonda Gg. Kober No. 22, Depok",
      createdAt: "2026-10-08T08:00:00.000Z",
    },
    {
      id: "usr-seller-7",
      name: "Nadia Safitri",
      email: "nadia@umkm.id",
      passwordHash,
      phone: "081310010007",
      role: "SELLER",
      storeName: "NadiaPreloved & Buku Kampus",
      businessType: "Buku & Alat Tulis",
      address: "Kos Putri Melati Kamar 104, Kober Margonda, Depok",
      createdAt: "2026-10-08T09:30:00.000Z",
    },
    {
      id: "usr-seller-8",
      name: "Reza Kurniawan",
      email: "reza@umkm.id",
      passwordHash,
      phone: "081310010008",
      role: "SELLER",
      storeName: "Sambal Roa Bang Reza",
      businessType: "Kuliner & Makanan Kering",
      address: "Gg. Sawo No. 9, Pondok Cina, Margonda, Depok",
      createdAt: "2026-10-09T08:00:00.000Z",
    },
    {
      id: "usr-seller-9",
      name: "Maya Anggraini",
      email: "maya@umkm.id",
      passwordHash,
      phone: "081310010009",
      role: "SELLER",
      storeName: "Maya Tote Bag Kanvas",
      businessType: "Fashion & Hijab",
      address: "Jl. Kapuk No. 15, Margonda Raya, Depok",
      createdAt: "2026-10-10T08:00:00.000Z",
    },
    {
      id: "usr-seller-10",
      name: "Dedi Kurnia",
      email: "dedi@umkm.id",
      passwordHash,
      phone: "081310010010",
      role: "SELLER",
      storeName: "Dedi Herbal Nusantara",
      businessType: "Kebutuhan Rumah Tangga",
      address: "Komplek Griya Asri Blok F1 No. 9, Depok",
      createdAt: "2026-10-12T08:00:00.000Z",
    },
  ];

  // 2 Cluster
  const clusters: ClusterEntity[] = [
    {
      id: "cls-griya-01",
      name: "Komplek Griya Asri",
      code: "GRIYA01",
      description:
        "Konsolidasi pengiriman UMKM warga Perumahan Griya Asri RW 08 & sekitarnya. Titik kumpul di Balai Warga Blok A1.",
      centerAddress: "Balai Warga Griya Asri Blok A1 No. 1, Cimanggis, Depok",
      radiusKm: 2.5,
      pickupDays: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
      pickupTimeWindows: ["MORNING", "AFTERNOON", "EVENING"],
      minPackages: 10,
      minTotalWeightGram: 10000, // 10 kg
      basePickupFee: 25000,
      platformFeePercent: 10,
      adminId: "usr-admin-cluster-1",
      createdAt: "2026-10-02T10:00:00.000Z",
    },
    {
      id: "cls-margonda-02",
      name: "Zona Kos & Kampus Margonda",
      code: "KAMPUS02",
      description:
        "Komunitas seller mahasiswa & UMKM seputar Gg. Kober, Sawo, dan Kapuk Margonda. Hemat ongkir jemput kurir harian.",
      centerAddress: "Posko Co-Working Kober No. 12, Pondok Cina, Depok",
      radiusKm: 1.8,
      pickupDays: ["Senin", "Rabu", "Jumat", "Sabtu"],
      pickupTimeWindows: ["AFTERNOON", "EVENING", "NIGHT"],
      minPackages: 8,
      minTotalWeightGram: 8000, // 8 kg
      basePickupFee: 20000,
      platformFeePercent: 10,
      adminId: "usr-admin-cluster-2",
      createdAt: "2026-10-03T10:00:00.000Z",
    },
  ];

  // Anggota Cluster (9 ACTIVE, 1 PENDING request untuk di-approve admin cluster)
  const clusterMembers: ClusterMemberEntity[] = [
    { id: "cm-1", clusterId: "cls-griya-01", userId: "usr-seller-1", status: "ACTIVE", joinedAt: "2026-10-05T10:00:00.000Z" },
    { id: "cm-2", clusterId: "cls-griya-01", userId: "usr-seller-2", status: "ACTIVE", joinedAt: "2026-10-05T11:00:00.000Z" },
    { id: "cm-3", clusterId: "cls-griya-01", userId: "usr-seller-3", status: "ACTIVE", joinedAt: "2026-10-06T10:00:00.000Z" },
    { id: "cm-4", clusterId: "cls-griya-01", userId: "usr-seller-4", status: "ACTIVE", joinedAt: "2026-10-06T12:00:00.000Z" },
    { id: "cm-5", clusterId: "cls-griya-01", userId: "usr-seller-5", status: "ACTIVE", joinedAt: "2026-10-07T10:00:00.000Z" },
    { id: "cm-6", clusterId: "cls-margonda-02", userId: "usr-seller-6", status: "ACTIVE", joinedAt: "2026-10-08T10:00:00.000Z" },
    { id: "cm-7", clusterId: "cls-margonda-02", userId: "usr-seller-7", status: "ACTIVE", joinedAt: "2026-10-08T11:00:00.000Z" },
    { id: "cm-8", clusterId: "cls-margonda-02", userId: "usr-seller-8", status: "ACTIVE", joinedAt: "2026-10-09T10:00:00.000Z" },
    { id: "cm-9", clusterId: "cls-margonda-02", userId: "usr-seller-9", status: "ACTIVE", joinedAt: "2026-10-10T10:00:00.000Z" },
    // Dedi Kurnia sedang request gabung ke Komplek Griya Asri (status PENDING)
    { id: "cm-10", clusterId: "cls-griya-01", userId: "usr-seller-10", status: "PENDING", joinedAt: "2026-10-30T15:00:00.000Z" },
  ];

  // Kita buat 30 ShipmentDraft dengan variasi lengkap:
  // - Grup A (12 draft): Cluster GRIYA01, besok (2026-11-01), EVENING (Sore), kurir JNT -> Total 12 paket, 15.000 gram (15 kg) -> Status READY_FOR_PICKUP (Sesuai contoh alur Bagian 9: Budi 2 paket 3kg, Sinta 5 paket 6kg, Rina 5 paket 6kg!)
  // - Grup B (4 draft): Cluster GRIYA01, besok (2026-11-01), MORNING (Pagi), kurir JNE -> Total 4 paket, 4.800 gram -> Status QUEUED (Menuju syarat 10 paket / 10 kg)
  // - Grup C (3 draft): Cluster KAMPUS02, lusa (2026-11-02), EVENING (Sore), kurir SICEPAT -> Total 3 paket, 3.600 gram -> Status QUEUED
  // - Grup D (1 draft): Budi memiliki 1 draft berstatus DRAFT
  // - Grup E (10 draft masa lalu yang sudah masuk ke 3 GroupPickup COMPLETED):
  //   - Pickup 1 (CSL-PCK-000101): 4 draft di GRIYA01 (DELIVERED)
  //   - Pickup 2 (CSL-PCK-000102): 3 draft di GRIYA01 (DELIVERED)
  //   - Pickup 3 (CSL-PCK-000103): 3 draft di KAMPUS02 (SHIPPED / DELIVERED)
  // Total = 12 + 4 + 3 + 1 + 10 = 30 draft pengiriman!

  const shipmentDrafts: ShipmentDraftEntity[] = [];

  // --- GRUP A: 12 Draft READY_FOR_PICKUP (Contoh Alur Budi, Sinta, Rina di Griya Asri besok sore J&T, 15 kg) ---
  // Budi: 2 paket, total 3.000 gram (1.500g + 1.500g)
  const groupAData = [
    { sellerId: "usr-seller-1", recipient: "Andi Wijaya", city: "Bandung", prov: "Jawa Barat", weight: 1500, value: 120000, notes: "Keripik Pedas 6 bungkus (Fragile)" },
    { sellerId: "usr-seller-1", recipient: "Riko Pratama", city: "Surabaya", prov: "Jawa Timur", weight: 1500, value: 135000, notes: "Keripik Seblak Kering 6 pcs" },
    // Sinta: 5 paket, total 6.000 gram (5 x 1.200g)
    { sellerId: "usr-seller-2", recipient: "Ayu Tingkir", city: "Semarang", prov: "Jawa Tengah", weight: 1200, value: 250000, notes: "Pashmina Silk 6 pcs" },
    { sellerId: "usr-seller-2", recipient: "Nisa Rahma", city: "Yogyakarta", prov: "DI Yogyakarta", weight: 1200, value: 240000, notes: "Hijab Voal Motif 5 pcs" },
    { sellerId: "usr-seller-2", recipient: "Putri Amelia", city: "Malang", prov: "Jawa Timur", weight: 1200, value: 260000, notes: "Bergo Harian Paket Bundling" },
    { sellerId: "usr-seller-2", recipient: "Dina Mariana", city: "Tangerang", prov: "Banten", weight: 1200, value: 210000, notes: "Scarf Satin Premium" },
    { sellerId: "usr-seller-2", recipient: "Siti Nurhaliza", city: "Bekasi", prov: "Jawa Barat", weight: 1200, value: 230000, notes: "Khimar Syari Set" },
    // Rina: 5 paket, total 6.000 gram (5 x 1.200g)
    { sellerId: "usr-seller-3", recipient: "Lina Kusuma", city: "Jakarta Selatan", prov: "DKI Jakarta", weight: 1200, value: 320000, notes: "Tas Rajut Macrame" },
    { sellerId: "usr-seller-3", recipient: "Vina Pandu", city: "Bogor", prov: "Jawa Barat", weight: 1200, value: 290000, notes: "Cardigan Rajut Handmade" },
    { sellerId: "usr-seller-3", recipient: "Tika Bravani", city: "Solo", prov: "Jawa Tengah", weight: 1200, value: 310000, notes: "Dompet & Slingbag Rajut" },
    { sellerId: "usr-seller-3", recipient: "Gita Gutawa", city: "Denpasar", prov: "Bali", weight: 1200, value: 350000, notes: "Taplak Meja Rajut Custom" },
    { sellerId: "usr-seller-3", recipient: "Hesti Purwadinata", city: "Jakarta Barat", prov: "DKI Jakarta", weight: 1200, value: 280000, notes: "Boneka Amigurumi Set" },
  ];

  groupAData.forEach((item, idx) => {
    shipmentDrafts.push({
      id: `drf-ready-${idx + 1}`,
      userId: item.sellerId,
      clusterId: "cls-griya-01",
      recipientName: item.recipient,
      recipientPhone: `0812900010${String(idx + 1).padStart(2, "0")}`,
      destinationAddress: `Jl. Merdeka Raya No. ${idx + 10}, Kec. Pusat`,
      city: item.city,
      province: item.prov,
      postalCode: `401${String(idx + 10)}`,
      weightGram: item.weight,
      lengthCm: 25,
      widthCm: 20,
      heightCm: 12,
      itemValue: item.value,
      notes: item.notes,
      courier: "JNT",
      pickupDate: tomorrow,
      pickupWindow: "EVENING",
      status: "READY_FOR_PICKUP",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  // --- GRUP B: 4 Draft QUEUED di GRIYA01 (Besok Pagi, JNE -> 4 dari 10 paket, 5,2 kg dari 10 kg) ---
  const groupBData = [
    { sellerId: "usr-seller-1", recipient: "Hendra Gunawan", city: "Jakarta Timur", prov: "DKI Jakarta", weight: 1300, value: 110000, notes: "Keripik Singkong Balado" },
    { sellerId: "usr-seller-4", recipient: "Bambang Pamungkas", city: "Semarang", prov: "Jawa Tengah", weight: 1500, value: 185000, notes: "Biji Kopi Arabika Gayo 1kg" },
    { sellerId: "usr-seller-4", recipient: "Evan Dimas", city: "Surabaya", prov: "Jawa Timur", weight: 1200, value: 160000, notes: "Kopi Robusta Temanggung" },
    { sellerId: "usr-seller-5", recipient: "Citra Kirana", city: "Bandung", prov: "Jawa Barat", weight: 1200, value: 275000, notes: "Paket Sabun & Toner Organik" },
  ];

  groupBData.forEach((item, idx) => {
    shipmentDrafts.push({
      id: `drf-queued-b-${idx + 1}`,
      userId: item.sellerId,
      clusterId: "cls-griya-01",
      recipientName: item.recipient,
      recipientPhone: `0813800020${String(idx + 1).padStart(2, "0")}`,
      destinationAddress: `Jl. Pahlawan No. ${idx + 21}, Komplek Melati`,
      city: item.city,
      province: item.prov,
      postalCode: `132${String(idx + 10)}`,
      weightGram: item.weight,
      lengthCm: 22,
      widthCm: 18,
      heightCm: 10,
      itemValue: item.value,
      notes: item.notes,
      courier: "JNE",
      pickupDate: tomorrow,
      pickupWindow: "MORNING",
      status: "QUEUED",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  // --- GRUP C: 3 Draft QUEUED di KAMPUS02 (Lusa Sore, SiCepat -> 3 dari 8 paket, 3,6 kg dari 8 kg) ---
  const groupCData = [
    { sellerId: "usr-seller-6", recipient: "Kevin Sanjaya", city: "Jakarta Utara", prov: "DKI Jakarta", weight: 800, value: 95000, notes: "Casing Anti-Crack & Tempered Glass" },
    { sellerId: "usr-seller-7", recipient: "Maudy Ayunda", city: "Tangerang Selatan", prov: "Banten", weight: 1600, value: 220000, notes: "Buku Referensi Ekonomi & Hukum" },
    { sellerId: "usr-seller-8", recipient: "Chef Juna", city: "Denpasar", prov: "Bali", weight: 1200, value: 150000, notes: "Sambal Roa 4 Botol Segel Plastik" },
  ];

  groupCData.forEach((item, idx) => {
    shipmentDrafts.push({
      id: `drf-queued-c-${idx + 1}`,
      userId: item.sellerId,
      clusterId: "cls-margonda-02",
      recipientName: item.recipient,
      recipientPhone: `0815700030${String(idx + 1).padStart(2, "0")}`,
      destinationAddress: `Jl. Diponegoro No. ${idx + 5}, Blok C`,
      city: item.city,
      province: item.prov,
      postalCode: `154${String(idx + 10)}`,
      weightGram: item.weight,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      itemValue: item.value,
      notes: item.notes,
      courier: "SICEPAT",
      pickupDate: dayAfter,
      pickupWindow: "EVENING",
      status: "QUEUED",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  // --- GRUP D: 1 Draft masih berstatus DRAFT milik Budi ---
  shipmentDrafts.push({
    id: "drf-draft-only-1",
    userId: "usr-seller-1",
    clusterId: "cls-griya-01",
    recipientName: "Surya Saputra",
    recipientPhone: "081299887766",
    destinationAddress: "Jl. Asia Afrika No. 88, Kec. Sumur Bandung",
    city: "Bandung",
    province: "Jawa Barat",
    postalCode: "40111",
    weightGram: 1000,
    lengthCm: 20,
    widthCm: 20,
    heightCm: 10,
    itemValue: 90000,
    notes: "Menunggu konfirmasi varian rasa dari pembeli",
    courier: "JNT",
    pickupDate: dayAfter,
    pickupWindow: "AFTERNOON",
    status: "DRAFT",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  // --- GRUP E: 10 Draft Masa Lalu yang tergabung dalam 3 Pickup Bersama yang sudah COMPLETED ---
  // Pickup 1 (CSL-PCK-000101): 4 draft di GRIYA01 (2026-10-25, JNT, EVENING) -> Total 12.000g (12 kg)
  const pastPickup1Drafts = [
    { id: "drf-past-101-1", sellerId: "usr-seller-1", recipient: "Robby Purba", city: "Jakarta Pusat", prov: "DKI Jakarta", weight: 3000, value: 240000 },
    { id: "drf-past-101-2", sellerId: "usr-seller-2", recipient: "Nagita Slavina", city: "Depok", prov: "Jawa Barat", weight: 3000, value: 450000 },
    { id: "drf-past-101-3", sellerId: "usr-seller-3", recipient: "Raffi Ahmad", city: "Bandung", prov: "Jawa Barat", weight: 3600, value: 520000 },
    { id: "drf-past-101-4", sellerId: "usr-seller-4", recipient: "Deddy Corbuzier", city: "Tangerang", prov: "Banten", weight: 2400, value: 310000 },
  ];
  pastPickup1Drafts.forEach((d, idx) => {
    shipmentDrafts.push({
      id: d.id,
      userId: d.sellerId,
      clusterId: "cls-griya-01",
      recipientName: d.recipient,
      recipientPhone: `0811600010${idx + 1}`,
      destinationAddress: `Jl. Kebon Jeruk Raya No. ${idx + 12}`,
      city: d.city,
      province: d.prov,
      postalCode: "11530",
      weightGram: d.weight,
      lengthCm: 30,
      widthCm: 25,
      heightCm: 15,
      itemValue: d.value,
      notes: "Pengiriman kolektif batch #101",
      courier: "JNT",
      pickupDate: pastDate1,
      pickupWindow: "EVENING",
      status: "DELIVERED",
      createdAt: "2026-10-24T10:00:00.000Z",
      updatedAt: "2026-10-26T14:00:00.000Z",
    });
  });

  // Pickup 2 (CSL-PCK-000102): 3 draft di GRIYA01 (2026-10-27, JNE, AFTERNOON) -> Total 10.000g (10 kg)
  const pastPickup2Drafts = [
    { id: "drf-past-102-1", sellerId: "usr-seller-1", recipient: "Desta Mahendra", city: "Jakarta Selatan", prov: "DKI Jakarta", weight: 4000, value: 320000 },
    { id: "drf-past-102-2", sellerId: "usr-seller-2", recipient: "Vincent Rompies", city: "Bogor", prov: "Jawa Barat", weight: 3500, value: 490000 },
    { id: "drf-past-102-3", sellerId: "usr-seller-5", recipient: "Enzy Storia", city: "Bekasi", prov: "Jawa Barat", weight: 2500, value: 380000 },
  ];
  pastPickup2Drafts.forEach((d, idx) => {
    shipmentDrafts.push({
      id: d.id,
      userId: d.sellerId,
      clusterId: "cls-griya-01",
      recipientName: d.recipient,
      recipientPhone: `0811600020${idx + 1}`,
      destinationAddress: `Jl. Kemang Selatan No. ${idx + 30}`,
      city: d.city,
      province: d.prov,
      postalCode: "12730",
      weightGram: d.weight,
      lengthCm: 28,
      widthCm: 22,
      heightCm: 14,
      itemValue: d.value,
      notes: "Pengiriman kolektif batch #102",
      courier: "JNE",
      pickupDate: pastDate2,
      pickupWindow: "AFTERNOON",
      status: "DELIVERED",
      createdAt: "2026-10-26T09:00:00.000Z",
      updatedAt: "2026-10-28T16:00:00.000Z",
    });
  });

  // Pickup 3 (CSL-PCK-000103): 3 draft di KAMPUS02 (2026-10-29, SICEPAT, EVENING) -> Total 8.500g (8,5 kg)
  const pastPickup3Drafts = [
    { id: "drf-past-103-1", sellerId: "usr-seller-6", recipient: "Jerome Polin", city: "Surabaya", prov: "Jawa Timur", weight: 2500, value: 270000 },
    { id: "drf-past-103-2", sellerId: "usr-seller-8", recipient: "Nex Carlos", city: "Medan", prov: "Sumatera Utara", weight: 3500, value: 410000 },
    { id: "drf-past-103-3", sellerId: "usr-seller-9", recipient: "Ria SW", city: "Yogyakarta", prov: "DI Yogyakarta", weight: 2500, value: 330000 },
  ];
  pastPickup3Drafts.forEach((d, idx) => {
    shipmentDrafts.push({
      id: d.id,
      userId: d.sellerId,
      clusterId: "cls-margonda-02",
      recipientName: d.recipient,
      recipientPhone: `0811600030${idx + 1}`,
      destinationAddress: `Jl. Malioboro Raya No. ${idx + 45}`,
      city: d.city,
      province: d.prov,
      postalCode: "55213",
      weightGram: d.weight,
      lengthCm: 26,
      widthCm: 20,
      heightCm: 12,
      itemValue: d.value,
      notes: "Pengiriman kolektif batch #103",
      courier: "SICEPAT",
      pickupDate: pastDate3,
      pickupWindow: "EVENING",
      status: "DELIVERED",
      createdAt: "2026-10-28T11:00:00.000Z",
      updatedAt: "2026-10-30T15:00:00.000Z",
    });
  });

  // Bangun 3 GroupPickup COMPLETED beserta PickupItem dan PaymentRecord menggunakan rumus calculateGroupPickupCosts
  const groupPickups: GroupPickupEntity[] = [];
  const pickupItems: PickupItemEntity[] = [];
  const paymentRecords: PaymentRecordEntity[] = [];

  const completedConfigs = [
    {
      id: "gp-101",
      code: "CSL-PCK-000101",
      clusterId: "cls-griya-01",
      courier: "JNT" as CourierType,
      pickupDate: pastDate1,
      pickupWindow: "EVENING" as PickupWindowType,
      pickupTime: "16:00",
      basePickupFee: 25000,
      platformFeePercent: 10,
      drafts: pastPickup1Drafts,
      completedAt: "2026-10-25T16:45:00.000Z",
    },
    {
      id: "gp-102",
      code: "CSL-PCK-000102",
      clusterId: "cls-griya-01",
      courier: "JNE" as CourierType,
      pickupDate: pastDate2,
      pickupWindow: "AFTERNOON" as PickupWindowType,
      pickupTime: "13:30",
      basePickupFee: 25000,
      platformFeePercent: 10,
      drafts: pastPickup2Drafts,
      completedAt: "2026-10-27T14:15:00.000Z",
    },
    {
      id: "gp-103",
      code: "CSL-PCK-000103",
      clusterId: "cls-margonda-02",
      courier: "SICEPAT" as CourierType,
      pickupDate: pastDate3,
      pickupWindow: "EVENING" as PickupWindowType,
      pickupTime: "17:00",
      basePickupFee: 20000,
      platformFeePercent: 10,
      drafts: pastPickup3Drafts,
      completedAt: "2026-10-29T17:30:00.000Z",
    },
  ];

  completedConfigs.forEach((cfg) => {
    const sellerInputs = cfg.drafts.map((d) => {
      const seller = users.find((u) => u.id === d.sellerId)!;
      return {
        sellerId: d.sellerId,
        sellerName: seller.name,
        storeName: seller.storeName,
        weightGram: d.weight,
        packageCount: 1,
        draftIds: [d.id],
      };
    });

    const calc = calculateGroupPickupCosts({
      basePickupFee: cfg.basePickupFee,
      platformFeePercent: cfg.platformFeePercent,
      sellers: sellerInputs,
    });

    groupPickups.push({
      id: cfg.id,
      code: cfg.code,
      clusterId: cfg.clusterId,
      courier: cfg.courier,
      pickupDate: cfg.pickupDate,
      pickupWindow: cfg.pickupWindow,
      pickupTime: cfg.pickupTime,
      totalPackages: calc.totalPackages,
      totalWeightGram: calc.totalWeightGram,
      basePickupFee: cfg.basePickupFee,
      platformFeePercent: cfg.platformFeePercent,
      totalCost: calc.exactTotalCeiling,
      roundingDiff: calc.roundingDiscrepancy,
      forcedBelowMin: false,
      costLocked: true,
      status: "COMPLETED",
      createdAt: cfg.completedAt,
      completedAt: cfg.completedAt,
    });

    calc.allocations.forEach((alloc, idx) => {
      const draftId = alloc.draftIds[0];
      pickupItems.push({
        id: `pi-${cfg.id}-${idx + 1}`,
        groupPickupId: cfg.id,
        shipmentDraftId: draftId,
        sellerId: alloc.sellerId,
        weightGram: alloc.weightGram,
        costShare: alloc.costBeforeFee,
        platformFee: alloc.platformFee,
        totalCharge: alloc.finalTotalCharge,
      });

      paymentRecords.push({
        id: `pay-${cfg.id}-${idx + 1}`,
        groupPickupId: cfg.id,
        sellerId: alloc.sellerId,
        totalWeightGram: alloc.weightGram,
        weightPercent: alloc.weightPercentage,
        costShare: alloc.costBeforeFee,
        platformFee: alloc.platformFee,
        roundingAdjust: alloc.roundingAdjustment,
        amount: alloc.finalTotalCharge,
        status: "PAID",
        paidAt: cfg.completedAt,
        createdAt: cfg.completedAt,
      });
    });
  });

  const notifications: NotificationEntity[] = [
    {
      id: "notif-1",
      userId: "usr-seller-1",
      title: "Kuota Pickup Besok Sore Tercapai!",
      message:
        "Grup pengiriman J&T Express untuk besok Sore di Komplek Griya Asri telah mencapai 12 paket (15 kg). Status draft Anda kini SIAP PICKUP.",
      type: "SUCCESS",
      link: "/pickups/next",
      isRead: false,
      whatsappStatus: "QUEUED_FOR_WA_GATEWAY",
      createdAt: now.toISOString(),
    },
    {
      id: "notif-2",
      userId: "usr-admin-cluster-1",
      title: "1 Grup Siap Dijadwalkan Pickup Bersama",
      message:
        "Ada 12 paket (15 kg) kurir J&T Express untuk jadwal besok Sore yang sudah memenuhi kuota minimum dan siap dibuatkan jadwal Pickup Bersama.",
      type: "INFO",
      link: "/cluster-admin",
      isRead: false,
      whatsappStatus: "QUEUED_FOR_WA_GATEWAY",
      createdAt: now.toISOString(),
    },
    {
      id: "notif-3",
      userId: "usr-admin-cluster-1",
      title: "Permintaan Gabung Cluster Baru",
      message:
        "Dedi Kurnia (Dedi Herbal Nusantara) mengajukan permintaan bergabung ke cluster Komplek Griya Asri.",
      type: "WARNING",
      link: "/cluster-admin/manage",
      isRead: false,
      whatsappStatus: "QUEUED_FOR_WA_GATEWAY",
      createdAt: now.toISOString(),
    },
  ];

  const activityLogs: ActivityLogEntity[] = [
    {
      id: "log-1",
      actorId: "usr-seller-1",
      actorName: "Budi Santoso",
      actorRole: "SELLER",
      action: "CREATE_DRAFT",
      entityType: "ShipmentDraft",
      entityId: "drf-ready-1",
      summary: "Budi Santoso menambahkan 2 draft paket J&T (total 3 kg) untuk Sore",
      details: "Kuota cluster Komplek Griya Asri tercapai (12 paket / 15 kg). Status berubah menjadi READY_FOR_PICKUP.",
      createdAt: now.toISOString(),
    },
    {
      id: "log-2",
      actorId: "usr-admin-cluster-1",
      actorName: "Hendra Wijaya",
      actorRole: "CLUSTER_ADMIN",
      action: "COMPLETE_PICKUP",
      entityType: "GroupPickup",
      entityId: "gp-102",
      summary: "Admin Cluster mengonfirmasi Pickup Bersama CSL-PCK-000102 selesai",
      details: "Biaya pickup Rp25.000 + fee 10% (Rp2.500) dibagi otomatis ke 3 penjual dan dikunci.",
      createdAt: "2026-10-27T14:15:00.000Z",
    },
    {
      id: "log-3",
      actorId: "usr-admin-cluster-2",
      actorName: "Dewi Kartika",
      actorRole: "CLUSTER_ADMIN",
      action: "COMPLETE_PICKUP",
      entityType: "GroupPickup",
      entityId: "gp-103",
      summary: "Admin Cluster mengonfirmasi Pickup Bersama CSL-PCK-000103 selesai",
      details: "Biaya pickup Rp20.000 + fee 10% (Rp2.000) dibagi otomatis ke 3 penjual di Zona Kos & Kampus Margonda.",
      createdAt: "2026-10-29T17:30:00.000Z",
    },
  ];

  return {
    users,
    clusters,
    clusterMembers,
    shipmentDrafts,
    groupPickups,
    pickupItems,
    paymentRecords,
    notifications,
    activityLogs,
    platformConfig: {
      id: "default",
      defaultBasePickupFee: 25000,
      defaultPlatformFeePct: 10,
      defaultMinPackages: 10,
      defaultMinWeightGram: 10000,
      soloPickupEstimateRp: 15000,
      updatedAt: now.toISOString(),
    },
  };
}

