import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Office is Coffee — Социальная кофе-платформа для команд",
  description:
    "OiC объединяет офисных сотрудников через любовь к кофе. Заказывайте вместе, открывайте новые бленды и стройте кофе-культуру команды.",
  keywords: ["кофе", "офис", "социальная", "команда", "заказ", "coffee", "office"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
      </body>
    </html>
  );
}
