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
    /*
     * CABECERAS DE SEGURIDAD.
     *
     * Se aplican las que no pueden romper nada. La política de contenido (CSP)
     * NO está aquí a propósito: ver la nota al final.
     */
    const seguridad = [
      /*
       * Impide que el navegador «adivine» el tipo de un fichero. Sin esto, un
       * fichero subido a Media que el navegador interprete como HTML podría
       * ejecutarse en nuestro dominio.
       */
      { key: "X-Content-Type-Options", value: "nosniff" },
      /*
       * Al salir del sitio se envía solo el origen, no la URL completa. Importa
       * porque hay URLs internas del panel y rutas de fichas que no tienen por
       * qué llegar a terceros.
       */
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      /*
       * El sitio no usa cámara, micrófono ni geolocalización. Declararlo cierra
       * la puerta a que lo haga un script de terceros que entre más adelante.
       */
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      },
      /*
       * Sustituye a X-Frame-Options, que está obsoleto. `SAMEORIGIN` en vez de
       * `DENY` porque el panel usa iframes para la vista previa de documentos.
       */
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      /*
       * HSTS. Solo tiene efecto sobre HTTPS, así que en local es inocuo.
       *
       * SIN `preload` y SIN `includeSubDomains` deliberadamente: los dos son
       * difíciles de revertir —el preload exige darse de baja en una lista de
       * navegadores y esperar meses— y el cliente todavía puede tener
       * subdominios sirviendo por HTTP que desconocemos. Un año de max-age da
       * la protección; ampliarlo es una decisión posterior e informada.
       */
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
    ];

    const indexable = process.env.NEXT_PUBLIC_PERMITIR_INDEXACION?.trim().toLowerCase() === "true";

    return [
      {
        source: "/:path*",
        headers: indexable
          ? seguridad
          : [...seguridad, { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default withPayload(nextConfig);
