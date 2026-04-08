import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Love is Coffee — Кофейня для команд",
  description: "Заказывай кофе, копи монеты, получай каждый 8-й бесплатно.",
  keywords: ["кофе", "кофейня", "love is coffee", "заказ"],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1a7a44",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased bg-brand-bg text-brand-text">
        <div className="mx-auto max-w-[480px] min-h-screen bg-brand-bg shadow-[0_0_40px_rgba(0,0,0,0.08)] relative">
          <AuthProvider>
            <ToastProvider>
              {children}
              <BottomNav />
            </ToastProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
