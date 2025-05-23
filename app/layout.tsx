import React from 'react';
import "@/app/globals.css";
import "nprogress/nprogress.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/app/components/providers";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white min-w-[360px]`} suppressHydrationWarning>
        <Providers>
          <Header />
          <div className="flex flex-col min-h-screen pt-8">
            <main className="flex-1 flex flex-col items-center px-4">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster position="top-center" theme="dark" />
        </Providers>
      </body>
    </html>
  );
} 