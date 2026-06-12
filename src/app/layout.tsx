import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notsen — Ücretsiz To-Do List & Hızlı Görev Takip Uygulaması",
  description:
    "Notsen ile görevlerini, projelerini ve notlarını ücretsiz yönet. Reklamsız yapılacaklar listesi, Kanban board ve hızlı görev takip uygulaması. Ücretsiz kayıt ol.",
  keywords: [
    "ücretsiz to-do list",
    "hızlı görev takip uygulaması",
    "reklamsız yapılacaklar listesi",
    "görev yönetim uygulaması",
    "kanban board ücretsiz",
    "to do list türkçe",
    "proje takip uygulaması",
    "ücretsiz kanban",
    "yapılacaklar listesi uygulaması",
    "görev planlayıcı",
  ],
  openGraph: {
    title: "Notsen — Ücretsiz To-Do List & Hızlı Görev Takip",
    description:
      "Reklamsız, ücretsiz Kanban board ve görev takip uygulaması. Projelerini ve notlarını kolayca yönet.",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Notsen",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

import QueryProvider from "@/providers/QueryProvider";
import ToastContainer from "@/components/Toast/ToastContainer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <QueryProvider>
          {children}
          <ToastContainer />
        </QueryProvider>
      </body>
    </html>
  );
}
