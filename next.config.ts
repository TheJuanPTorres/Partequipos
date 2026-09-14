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
   * TRAZADO DE FICHEROS — mete la biblioteca nativa de sharp en el lambda.
   *
   * INCIDENTE 2026-09-13 (CLAUDE.md §10.18). Sin esto, /admin, la API REST, el
   * sitemap y el mapa de redirects devuelven 500 en producción con:
   *
   *   ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object file
   *
   * POR QUÉ EL TRAZADO NO LO VE SOLO. Next traza con `@vercel/nft`, que analiza
   * de forma estática `import`, `require` y `fs`. El binario
   * `@img/sharp-linux-x64/lib/sharp-linux-x64.node` NO requiere su libvips desde
   * JavaScript: lo enlaza el enlazador dinámico del sistema operativo por rpath.
   * Ninguno de los tres mecanismos que nft inspecciona puede verlo, así que el
   * binario entra en el paquete y su biblioteca se queda fuera.
   *
   * Verificado contra Next 16.2.11: `outputFileTracingIncludes` es de PRIMER
   * NIVEL (no va bajo `experimental`); la clave se empareja con picomatch en
   * modo `contains`, así que "/*" cubre todas las rutas con trazado; y los globs
   * de valor se resuelven desde la raíz del proyecto.
   *
   * SOLO glibc-x64 a propósito: los lambda de Vercel son Amazon Linux x64, y
   * añadir musl (18 MB) y wasm32 (9 MB) engordaría el paquete sin usarse. Los
   * docs piden globs estrechos. CONTRAPARTIDA: si algún día el runtime pasa a
   * arm64 o a musl, ESTO VUELVE A FALLAR IGUAL, con el mismo error. No es
   * silencioso —tumba /admin— pero que quede escrito dónde mirar.
   *
   * En Windows el glob no encuentra nada y no pasa nada: el build local no usa
   * estos paquetes.
   */
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/sharp/**/*",
      "node_modules/@img/sharp-linux-x64/**/*",
      "node_modules/@img/sharp-libvips-linux-x64/**/*",
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
      /*
       * POLÍTICA DE CONTENIDO — FASE 1: SOLO OBSERVA, NO BLOQUEA.
       *
       * `Report-Only` significa exactamente eso: el navegador avisa por consola
       * de lo que la política prohibiría, pero **no impide nada**. En esta fase
       * la CSP no protege: sirve para descubrir qué se rompería antes de
       * activarla de verdad, que es la parte que puede tumbar el panel o dejar
       * los formularios sin enviar sin que nadie se entere.
       *
       * Para pasar a fase 2 basta renombrar la cabecera a
       * `Content-Security-Policy`, tras unos días sin violaciones nuevas.
       *
       * TRES AVISOS, registrados también en CLAUDE.md §10.15:
       *
       * 1. `'unsafe-inline'` en `script-src` es HOY inevitable — Next inyecta
       *    scripts en línea para la hidratación y Payload también. Con él, la
       *    CSP protege bastante menos de lo que aparenta. Es deuda técnica
       *    consciente, no un descuido.
       * 2. Turnstile necesita TRES directivas (`script-src`, `frame-src` y
       *    `connect-src`). Es el punto donde más fácil se rompe el formulario
       *    sin que nadie lo note hasta que un cliente no pueda enviarlo.
       * 3. `blob:` y `data:` en `img-src` los necesitan el panel (vistas previas
       *    de subida) y el optimizador de imágenes.
       */
      {
        key: "Content-Security-Policy-Report-Only",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
          "font-src 'self' data:",
          "frame-src https://challenges.cloudflare.com",
          "connect-src 'self' https://challenges.cloudflare.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
        ].join("; "),
      },
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
