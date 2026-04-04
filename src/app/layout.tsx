import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Office is Coffee — Social Coffee Platform for Teams",
  description:
    "OiC connects office workers through the love of coffee. Order together, discover new blends, and build your team's coffee culture.",
  keywords: ["coffee", "office", "social", "team", "ordering"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
