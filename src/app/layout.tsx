import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ToastProvider } from "@/components/Toast";
import BottomNav from "@/components/BottomNav";
import PushTracker from "@/components/PushTracker";
import NearbyNotifier from "@/components/NearbyNotifier";

export const metadata: Metadata = {
  title: "Love is Coffee — Кофейня для команд",
  description: "Заказывай кофе, копи монеты, получай каждый 8-й бесплатно.",
  keywords: ["кофе", "кофейня", "love is coffee", "заказ"],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Love is Coffee",
    statusBarStyle: "black-translucent",
  },
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
      <body className="font-sans antialiased bg-neutral-100 text-brand-text">
        <div className="mx-auto max-w-[480px] min-h-screen bg-brand-bg shadow-[0_0_40px_rgba(0,0,0,0.08)] relative" id="app-shell">
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <PushTracker />
                <NearbyNotifier />
                {children}
                <BottomNav />
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
