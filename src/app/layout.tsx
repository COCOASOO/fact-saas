import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { AuthProvider } from "./contexts/authContext";
import { LoadingIndicator } from "@/components/loading-indicator";
import { ThemeProvider } from "@/context/theme-context";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FacturaFácil - Facturación Electrónica Simplificada",
  description:
    "Crea y gestiona tus facturas electrónicas de forma fácil y segura, cumpliendo con la normativa de Hacienda.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <LoadingIndicator />
        <AuthProvider>
          <ThemeProvider>
            <div className="relative flex min-h-screen flex-col">
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
