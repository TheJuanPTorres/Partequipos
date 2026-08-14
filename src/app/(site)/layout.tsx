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
        {/*
         * Enlace de salto al contenido (WCAG 2.4.1, nivel A).
         *
         * Sin él, quien navega con teclado o lector de pantalla tiene que
         * recorrer la cabecera entera —logo, seis enlaces y el teléfono— ANTES
         * de llegar al contenido, y en CADA página del sitio.
         *
         * Está oculto hasta que recibe el foco: es la única forma de que sirva
         * sin ocupar espacio visual. `id="contenido"` lo pone la envoltura de
         * abajo, no cada plantilla, para que ninguna se olvide.
         */}
        <a
          href="#contenido"
          className="sr-only rounded bg-gray-900 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Saltar al contenido
        </a>
        <Header />
        <div id="contenido" className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
