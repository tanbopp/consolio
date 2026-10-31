# Consolio — Gabung Ongkir & Pickup Bersama untuk Penjual Kecil (UMKM)

**Consolio** adalah aplikasi web full-stack untuk membantu penjual kecil/UMKM yang berada di satu area fisik—misalnya komplek perumahan, kos, pasar, kampus, atau desa—untuk **menggabungkan paket yang akan dikirim menjadi satu jadwal pickup kurir bersama**.

Seluruh logika penggabungan kuota dan pembagian biaya bersifat **100% deterministik dan berbasis aturan transparan** (tanpa AI/machine learning/prediksi).

---

## ✨ Fitur Utama

1. **Autentikasi & Role-Based Access Control (NextAuth.js)**
   - Mendukung **Email/Password** (dengan hashing `bcryptjs`) dan **Google OAuth**.
   - Tiga peran pengguna: `SELLER` (Penjual UMKM), `CLUSTER_ADMIN` (Admin Cluster), dan `PLATFORM_ADMIN` (Admin Aplikasi).
   - Dilengkapi tombol **Akun Demo 1-Klik** di halaman `/login` untuk menguji setiap peran secara langsung.
2. **Manajemen Cluster Berbasis Area Fisik**
   - Buat cluster dengan kode unik (mis. `GRIYA01`, `KAMPUS02`), alamat titik kumpul, radius (km), hari & jendela waktu operasional, minimum jumlah paket, minimum berat total, biaya pickup dasar, dan fee platform.
   - Satu penjual hanya boleh aktif di satu cluster pada satu waktu.
   - Admin cluster menyetujui (`ACTIVE`) atau menolak (`REJECTED`) permintaan bergabung penjual.
3. **Draft Pengiriman & Validasi Ketat (React Hook Form + Zod)**
   - Validasi client & server: berat minimal 100 gram, dimensi positif, nomor telepon Indonesia valid (`08xx` / `+628xx`), tanggal pengiriman tidak boleh di masa lalu.
   - Draft hanya dapat diedit atau dibatalkan sebelum status berubah menjadi `READY_FOR_PICKUP`.
4. **Penggabungan Pickup Otomatis**
   - Sistem mengelompokkan draft berdasarkan: **Cluster + Tanggal Pickup + Jendela Waktu (Pagi/Siang/Sore/Malam) + Kurir Pilihan**.
   - Menampilkan progress bar jumlah paket dan total berat menuju kuota minimum.
   - Saat syarat minimum tercapai, seluruh draft dalam grup otomatis berubah menjadi `READY_FOR_PICKUP`.
   - Admin cluster juga dapat memaksa membuat Pickup Bersama di bawah syarat minimum dengan peringatan biaya per penjual lebih tinggi.
5. **Rumus Pembagian Biaya Transparan & Penguncian Biaya**
   - Rumus proporsional berdasarkan berat:
     $$\text{biaya\_penjual} = \left(\frac{\text{berat\_penjual}}{\text{total\_berat}}\right) \times \text{biaya\_pickup} \times (1 + \text{fee\_platform})$$
   - Pembulatan ke Rupiah terdekat dengan jaminan total tagihan tidak melebihi plafon total biaya pickup + fee platform; selisih pembulatan ditampilkan secara eksplisit untuk Admin Cluster.
   - Saat Admin Cluster menandai pickup `COMPLETED`, pembagian biaya **dikunci permanen** (`costLocked = true`).
6. **Laporan, Ekspor CSV & Link Berbagi (Shareable Pickup Detail)**
   - Filter riwayat berdasarkan tanggal, cluster, kurir, dan status.
   - Ekspor laporan lengkap ke **CSV**.
   - Halaman detail setiap Pickup Bersama (`/pickups/[id]`) dapat dibagikan melalui link.

---

## 🛠️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router)
- **Bahasa:** TypeScript
- **Styling & UI:** Tailwind CSS + Komponen shadcn/ui + Lucide Icons
- **Database & ORM:** PostgreSQL + Prisma ORM (dilengkapi fallback otomatis ke `prisma/local-db.json` apabila service PostgreSQL lokal belum dinyalakan, sehingga aplikasi langsung dapat dijalankan kapan saja)
- **Autentikasi:** NextAuth.js
- **Data Fetching:** TanStack Query v5
- **Form Validation:** React Hook Form + Zod

---

## 🚀 Cara Instalasi & Menjalankan Aplikasi Secara Lokal

### 1. Clone / Buka Direktori Proyek & Instal Dependensi

```bash
npm install
```

### 2. Konfigurasi Environment Variable

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi konfigurasi di `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/consolio?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="consolio-super-secret-jwt-key-2026-umkm-indonesia"
```

### 3. Setup Database, Migrasi Prisma & Seed Data

Generate Prisma Client:

```bash
npm run db:generate
```

Jika Anda menjalankan server PostgreSQL lokal di port `5432`, jalankan migrasi skema:

```bash
npm run db:push
# atau:
npm run db:migrate
```

Jalankan script **Seed Data**:

```bash
npm run db:seed
```

> **Catatan:** Script `npm run db:seed` mengisi data dummy lengkap (1 Admin Aplikasi, 2 Admin Cluster, 10 Penjual UMKM, 2 Cluster `GRIYA01` & `KAMPUS02`, 30 Draft Pengiriman, serta 3 Pickup Bersama yang sudah selesai beserta rincian pembagian biaya) ke PostgreSQL sekaligus menyimpannya ke `prisma/local-db.json` agar aplikasi tetap berjalan lancar meskipun tanpa server PostgreSQL aktif.

### 4. Jalankan Server Development

```bash
npm run dev
```

Buka **[http://localhost:3000](http://localhost:3000)** di browser Anda.

---

## 🔑 Akun Demo (Seed Data)

Semua akun demo menggunakan password: **`password123`** (atau cukup klik tombol **Akun Demo 1x Klik** di halaman `/login`):

| Peran | Nama | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Penjual UMKM** | Budi Santoso | `budi@umkm.id` | `password123` | Anggota aktif `GRIYA01`, punya 2 paket J&T (3 kg) berstatus `READY_FOR_PICKUP` |
| **Penjual UMKM** | Sinta Maharani | `sinta@umkm.id` | `password123` | Anggota aktif `GRIYA01`, punya 5 paket J&T (6 kg) |
| **Penjual UMKM** | Rina Wulandari | `rina@umkm.id` | `password123` | Anggota aktif `GRIYA01`, punya 5 paket J&T (6 kg) |
| **Penjual Baru** | Dedi Kurnia | `dedi@umkm.id` | `password123` | Sedang request gabung ke `GRIYA01` (`PENDING`) |
| **Admin Cluster 1** | Hendra Wijaya | `hendra@griyaasri.id` | `password123` | Mengelola Cluster **Komplek Griya Asri (`GRIYA01`)** |
| **Admin Cluster 2** | Dewi Kartika | `dewi@kampusmargonda.id` | `password123` | Mengelola Cluster **Zona Kos & Kampus Margonda (`KAMPUS02`)** |
| **Admin Aplikasi** | Bagus Pratama | `admin@consolio.id` | `password123` | Mengatur tarif dasar, kuota minimum, fee platform & role semua user |
