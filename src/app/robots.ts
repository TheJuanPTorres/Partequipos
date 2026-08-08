import type { MetadataRoute } from "next";

import { absoluteUrl, getSiteUrl, indexacionPermitida } from "@/lib/seo/config";

/**
 * robots.txt.
 *
 * Dos modos, según `NEXT_PUBLIC_PERMITIR_INDEXACION`:
 *
 * - **Bloqueado** (por defecto, entorno de demostración): `Disallow: /` total y
 *   **sin** referencia al sitemap. El sitemap se sigue generando y sirviendo
 *   —hace falta para QA— pero no se anuncia: anunciarlo sería invitar al
 *   rastreador a la lista completa de URLs que justo intentamos ocultar.
 *
 * - **Abierto** (lanzamiento): catálogo público, solo se bloquean el panel del
 *   CMS y la API interna, y se anuncia el sitemap.
 *
 * No se bloquea `/_next/`: el rastreador necesita CSS, JS e imágenes
 * optimizadas para renderizar la página como la ve un usuario.
 */
export default function robots(): MetadataRoute.Robots {
  if (!indexacionPermitida()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      host: getSiteUrl(),
    };
  }

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
