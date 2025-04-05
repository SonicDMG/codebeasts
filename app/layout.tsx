import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "../components/providers";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CodeBeasts - Transform Your Code Into a Beast!",
  description: "Generate unique AI creatures based on your GitHub profile.",
};

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
          <div className="flex flex-col min-h-screen pt-12">
            <main className="flex-1 flex flex-col items-center justify-center px-4">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
} 