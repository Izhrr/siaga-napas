import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Plus Jakarta Sans: dirancang desainer Indonesia untuk identitas kota Jakarta, cocok untuk produk layanan publik Indonesia.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "SIAGA NAPAS · Dashboard Udara & Kesehatan",
  description: "SIAGA NAPAS: Sistem Intelijen Antisipasi Gangguan Napas. PM2.5 dari 27 stasiun AQMS dan rawat inap di 27 RS rujukan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-theme="light" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
