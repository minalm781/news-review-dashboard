import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { QueryProvider } from "@/components/providers/query-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NextGen A360 — News Review Screen",
  description:
    "Internal Campaign Operations dashboard for news article review and Meta campaign launch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
