import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Consolio — Gabung Ongkir & Pickup Bersama untuk UMKM",
  description:
    "Platform konsolidasi pengiriman berbasis komunitas area (komplek, kos, pasar, kampus, desa) untuk menekan biaya pickup kurir secara adil dan transparan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
