import type { MetadataRoute } from "next";

import { absoluteUrl, getSiteUrl } from "@/lib/seo/config";

/**
 * robots.txt.
 *
 * Se bloquean únicamente el panel del CMS y la API interna. El catálogo público
 * queda **totalmente abierto**: es el contenido que debe posicionar (CLAUDE.md §1).
 *
 * No se bloquea `/_next/`: el rastreador necesita el CSS, el JS y las imágenes
 * optimizadas para renderizar la página como la ve un usuario.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin", // panel de Payload
          "/api/", // API REST/GraphQL y rutas internas
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
