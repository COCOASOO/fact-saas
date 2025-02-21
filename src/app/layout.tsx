import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import GuestNavbar from "@/components/GuestNavbar"
import Footer from "@/components/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FacturaFácil - Facturación Electrónica Simplificada",
  description:
    "Crea y gestiona tus facturas electrónicas de forma fácil y segura, cumpliendo con la normativa de Hacienda.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <GuestNavbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}

