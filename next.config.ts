import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `turbopack: {}` evita el warning de configuración webpack/Turbopack que
  // introduce withPayload (CLAUDE.md: Turbopack es el bundler por defecto en Next 16).
  turbopack: {},
  /*
   * Las 648 URLs del sitio actual terminan en barra. Con esto las rutas del
   * sitio nuevo quedan IDÉNTICAS a las indexadas: desaparece el 308 de
   * `/ruta/` → `/ruta` que se pagaba en cada visita. Ver ADR 0006.
   */
  trailingSlash: true,
  images: {
    // Permite a next/image cargar imágenes servidas desde el CDN de Vercel Blob.
    // El id del store es un subdominio variable, por eso el comodín.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  /*
   * Bloqueo de indexación por cabecera HTTP.
   *
   * Es la tercera vía, junto a la metadata y robots.txt. Cubre lo que las otras
   * dos no alcanzan: respuestas que no son HTML (el XML del sitemap, imágenes,
   * ficheros) y cualquier rastreador que ignore la etiqueta del documento.
   *
   * Se lee la variable en tiempo de build, igual que las otras dos vías: las
   * tres se activan y desactivan juntas con el mismo valor.
   */
  async headers() {
    if (process.env.NEXT_PUBLIC_PERMITIR_INDEXACION?.trim().toLowerCase() === "true") {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default withPayload(nextConfig);
