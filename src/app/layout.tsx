import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Mini CRM",
  description: "A Kanban-style CRM board for managing sales leads",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body
        className="font-sans antialiased text-gray-900 bg-[#f8f9fa] overflow-hidden"
      >
        {children}
      </body>
    </html>
  );
}
