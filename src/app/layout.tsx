import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/ui/Navigation";
import { BoardProvider } from "@/context/BoardContext";
import { IntegrationProvider } from "@/context/IntegrationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Mini CRM Board",
  description: "A simple CRM for managing leads and contacts",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: [
      { url: '/favicon.svg' }
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className="font-sans antialiased text-gray-900 bg-[#f8f9fa]"
      >
        <BoardProvider>
          <IntegrationProvider>
            <Navigation />
            {children}
          </IntegrationProvider>
        </BoardProvider>
      </body>
    </html>
  );
}
