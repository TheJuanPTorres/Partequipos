import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { indexacionPermitida } from "@/lib/seo/config";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Partequipos",
  description: "Catálogo de maquinaria pesada, repuestos y servicios para el mercado colombiano.",
  /*
   * Bloqueo de indexación mientras el entorno sea una demostración.
   * `noindex` saca la página del índice; `nofollow` evita además que los enlaces
   * transmitan señal. Se hereda a todas las rutas de (site). Ver README §7.
   */
  robots: indexacionPermitida()
    ? undefined
    : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
