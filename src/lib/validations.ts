import { z } from "zod";

export const indonesianPhoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;

export const registerSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  phone: z
    .string()
    .regex(
      indonesianPhoneRegex,
      "Nomor WhatsApp Indonesia tidak valid (contoh: 081234567890)"
    ),
  storeName: z.string().min(2, "Nama toko minimal 2 karakter"),
  businessType: z.string().min(2, "Pilih jenis usaha"),
  address: z.string().min(10, "Alamat lengkap minimal 10 karakter"),
  role: z.enum(["SELLER", "CLUSTER_ADMIN"]),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  phone: z
    .string()
    .regex(
      indonesianPhoneRegex,
      "Nomor WhatsApp Indonesia tidak valid (contoh: 081234567890)"
    ),
  storeName: z.string().min(2, "Nama toko minimal 2 karakter"),
  businessType: z.string().min(2, "Jenis usaha wajib diisi"),
  address: z.string().min(10, "Alamat lengkap minimal 10 karakter"),
});

export const clusterSchema = z.object({
  name: z.string().min(4, "Nama cluster minimal 4 karakter"),
  code: z
    .string()
    .min(4, "Kode cluster minimal 4 karakter")
    .max(12, "Kode cluster maksimal 12 karakter")
    .regex(/^[A-Z0-9-]+$/, "Kode cluster hanya boleh huruf kapital, angka, atau strip"),
  description: z.string().min(10, "Deskripsi area minimal 10 karakter"),
  centerAddress: z.string().min(10, "Alamat titik kumpul/pusat minimal 10 karakter"),
  radiusKm: z
    .number()
    .min(0.5, "Radius minimal 0,5 km")
    .max(25, "Radius maksimal 25 km"),
  pickupDays: z.array(z.string()).min(1, "Pilih minimal 1 hari operasional"),
  pickupTimeWindows: z
    .array(z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT"]))
    .min(1, "Pilih minimal 1 jendela waktu pickup"),
  minPackages: z
    .number()
    .int()
    .min(2, "Minimum jumlah paket minimal 2 paket"),
  minTotalWeightGram: z
    .number()
    .int()
    .min(1000, "Minimum berat total minimal 1.000 gram (1 kg)"),
  basePickupFee: z
    .number()
    .int()
    .min(5000, "Biaya pickup dasar minimal Rp5.000"),
  platformFeePercent: z
    .number()
    .min(0, "Fee platform tidak boleh negatif")
    .max(30, "Fee platform maksimal 30%"),
});

export const shipmentDraftSchema = z.object({
  recipientName: z.string().min(2, "Nama penerima minimal 2 karakter"),
  recipientPhone: z
    .string()
    .regex(
      indonesianPhoneRegex,
      "Nomor telepon penerima harus nomor Indonesia yang valid (08xx / +628xx)"
    ),
  destinationAddress: z.string().min(10, "Alamat lengkap tujuan minimal 10 karakter"),
  city: z.string().min(3, "Kota/kabupaten tujuan wajib diisi"),
  province: z.string().min(3, "Provinsi tujuan wajib diisi"),
  postalCode: z
    .string()
    .regex(/^[0-9]{5}$/, "Kode pos harus 5 digit angka"),
  weightGram: z
    .number()
    .int("Berat harus bilangan bulat")
    .min(100, "Berat paket minimal 100 gram"),
  lengthCm: z
    .number()
    .positive("Panjang paket harus angka positif (> 0 cm)"),
  widthCm: z
    .number()
    .positive("Lebar paket harus angka positif (> 0 cm)"),
  heightCm: z
    .number()
    .positive("Tinggi paket harus angka positif (> 0 cm)"),
  itemValue: z
    .number()
    .int()
    .min(1000, "Nilai barang minimal Rp1.000"),
  notes: z.string(),
  courier: z.enum(["JNE", "JNT", "SICEPAT", "ANTERAJA", "OTHER"]),
  pickupDate: z.string().refine(
    (val) => {
      if (!val) return false;
      const inputDate = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(inputDate);
      target.setHours(0, 0, 0, 0);
      return target.getTime() >= today.getTime();
    },
    { message: "Tanggal pengiriman tidak boleh di masa lalu" }
  ),
  pickupWindow: z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT"]),
  saveAsDraftOnly: z.boolean(),
});

export const platformConfigSchema = z.object({
  defaultBasePickupFee: z
    .number()
    .int()
    .min(5000, "Biaya pickup dasar minimal Rp5.000"),
  defaultPlatformFeePct: z
    .number()
    .min(0, "Persentase fee minimal 0%")
    .max(30, "Persentase fee maksimal 30%"),
  defaultMinPackages: z
    .number()
    .int()
    .min(2, "Minimum jumlah paket minimal 2"),
  defaultMinWeightGram: z
    .number()
    .int()
    .min(1000, "Minimum berat minimal 1.000 gram (1 kg)"),
  soloPickupEstimateRp: z
    .number()
    .int()
    .min(5000, "Acuan biaya kirim sendiri minimal Rp5.000"),
  applyToAllClusters: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ClusterInput = z.infer<typeof clusterSchema>;
export type ShipmentDraftInput = z.infer<typeof shipmentDraftSchema>;
export type PlatformConfigInput = z.infer<typeof platformConfigSchema>;
