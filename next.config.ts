import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

import { REDIRECTS_FIJOS } from "./src/lib/redirects/fijos";

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
    /*
     * AVIF primero, WebP para quien no lo acepte (decisión de dirección,
     * fase 4, por el LCP del hero en móvil: ~40 % menos que WebP). Es solo la
     * SALIDA: `Media` sigue sin admitir AVIF de entrada, que es lo que tocaba el
     * CVE (CLAUDE.md §10.28). El formato entra en la clave de caché del
     * optimizador (cabecera `Accept`), así que cada imagen se transforma una
     * vez más; las del Blob se cachean un año (`max-age` del Blob). Coste en
     * el límite de Hobby, en docs/diseno/decisiones-home-ux9.md §17.
     */
    formats: ["image/avif", "image/webp"],
    /*
     * 75 para todo; 90 SOLO para el render grande de «Maquinaria pesada nueva» de la portada
     * (dirección, 2026-11-13: «con la calidad de la referencia», que lo pinta a 90). Next 16 solo
     * acepta las calidades de esta lista.
     */
    qualities: [75, 90],
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
  /*
   * Redirects fijos que no son datos de la colección `Redirects`: viven en
   * `src/lib/redirects/fijos.ts` (allí el porqué de cada uno), que comparte
   * con `npm run lanzamiento:urls` para que los dé por esperados.
   */
  async redirects() {
    return REDIRECTS_FIJOS.map((r) => ({ ...r, statusCode: 301 as const }));
  },
  async headers() {
    /*
     * CABECERAS DE SEGURIDAD.
     *
     * Se aplican las que no pueden romper nada. La política de contenido (CSP)
     * NO está aquí a propósito: ver la nota al final.
     */
    // Un preview de Vercel: lleva su barra de comentarios (nota 10 de la política).
    const enPreview = process.env.VERCEL_ENV === "preview";
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
       * POLÍTICA DE CONTENIDO. DESDE EL 2026-11-24 TAMBIÉN SE APLICA (ver «FASE
       * 2» al final de esta función). Lo que sigue se escribió para la fase 1 y
       * se conserva porque explica cada directiva.
       *
       * FASE 1: SOLO OBSERVA, NO BLOQUEA.
       *
       * `Report-Only` significa exactamente eso: el navegador avisa por consola
       * de lo que la política prohibiría, pero **no impide nada**. En esta fase
       * la CSP no protege: sirve para descubrir qué se rompería antes de
       * activarla de verdad, que es la parte que puede tumbar el panel o dejar
       * los formularios sin enviar sin que nadie se entere.
       *
       * Para pasar a fase 2 basta renombrar la cabecera a
       * `Content-Security-Policy`… pero NO con el criterio de «unos días sin
       * violaciones nuevas», porque ESTA POLÍTICA NO REPORTA A NINGÚN SITIO: no
       * declara `report-uri` ni `report-to`, y el proyecto no emite `Report-To`
       * ni `Reporting-Endpoints`. Sin endpoint, el navegador no envía nada a
       * ningún servidor: el aviso sale solo en la consola de devtools DEL
       * VISITANTE. Así que el silencio no es evidencia de nada. Ver CLAUDE.md
       * §10.16 y §10.31 (el destino natural era Sentry, que tampoco está).
       *
       * TRES AVISOS, registrados también en CLAUDE.md §10.16:
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
       * 4. Portada (fases F y H): `media-src` para los vídeos, que se sirven
       *    directos desde el Blob, y `frame-src` para YouTube, SOLO el dominio
       *    sin cookies y solo cuando el visitante pulsa «reproducir».
       * 5. Portada (fase G): el globo de sedes carga Mapbox GL desde su CDN
       *    (`api.mapbox.com`: script y hoja de estilos), pide teselas y
       *    estilos a `api.mapbox.com` y envía telemetría a `events.mapbox.com`,
       *    y crea sus workers desde `blob:`. Solo si hay token de Mapbox.
       * 6. Nosotros: las animaciones Lottie se piden con `fetch` al Blob
       *    (`connect-src`), solo cuando el bloque se acerca a la pantalla.
       * 7. Hero: las fuentes propias del título (colección «Fuentes») se
       *    sirven desde el Blob (`font-src`).
       * 8. Analítica (2026-11-20): Google Analytics 4, solo con `NEXT_PUBLIC_GA4_ID`
       *    y solo tras aceptar las cookies: el script de `googletagmanager.com`
       *    y sus envíos a `google-analytics.com` y `analytics.google.com`.
       * 9. Panel, subida directa (tanda 22, 2026-11-23): el navegador sube las
       *    imágenes y los documentos a `https://vercel.com/api/blob/` (leído en
       *    `@vercel/blob`, la subida de cliente de §10.39). Faltaba en
       *    `connect-src`: con la política aplicada, el panel no podría subir.
       *    CON LA BARRA FINAL: una fuente con ruta y sin barra solo casa con
       *    esa ruta exacta, y el navegador pide `/api/blob/?pathname=…` (lo
       *    vio el agente C subiendo una imagen y un PDF en un preview).
       * 10. Previews (tanda 22): Vercel inyecta su barra de comentarios
       *    (`vercel.live`) SOLO en los previews. Se admite solo ahí, para que
       *    la consola de un preview enseñe únicamente lo que también fallaría
       *    en el sitio publicado. Lista de la documentación de Vercel.
       */
      {
        key: "Content-Security-Policy-Report-Only",
        value: [
          "default-src 'self'",
          `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://api.mapbox.com https://www.googletagmanager.com${enPreview ? " https://vercel.live" : ""}`,
          `style-src 'self' 'unsafe-inline' https://api.mapbox.com${enPreview ? " https://vercel.live" : ""}`,
          `img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.google-analytics.com https://*.googletagmanager.com${enPreview ? " https://vercel.live https://vercel.com" : ""}`,
          `font-src 'self' data: https://*.public.blob.vercel-storage.com${enPreview ? " https://vercel.live https://assets.vercel.com" : ""}`,
          "media-src 'self' https://*.public.blob.vercel-storage.com",
          `frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com${enPreview ? " https://vercel.live" : ""}`,
          `connect-src 'self' https://challenges.cloudflare.com https://api.mapbox.com https://events.mapbox.com https://*.public.blob.vercel-storage.com https://vercel.com/api/blob/ https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com${enPreview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
          "worker-src 'self' blob:",
          "child-src blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
        ].join("; "),
      },
    ];

    const indexable = process.env.NEXT_PUBLIC_PERMITIR_INDEXACION?.trim().toLowerCase() === "true";

    /*
     * FASE 2: LA POLÍTICA SE APLICA (Juan Pablo, tanda 22, 2026-11-24). La
     * MISMA política de arriba va además como `Content-Security-Policy`, así
     * que el navegador SÍ bloquea lo que no admite. Primero entró solo en
     * `/admin` (#573) y después en todo el sitio.
     *
     * Qué se probó antes, con la consola delante:
     * - Panel, con sesión (agente C): inicio, listas, fichas, subida de imagen
     *   y de PDF, vista previa de un documento, texto enriquecido y guardar.
     * - Sitio público, en un preview a 390 y 1440 (agente A): portada, Contáctanos,
     *   Servicio técnico, Nosotros y una ficha de usada, con el mapa de Mapbox,
     *   un vídeo de YouTube, los vídeos y animaciones del Blob, Turnstile con
     *   las claves de prueba y un envío del formulario.
     *
     * SIN PROBAR: Google Analytics. Ni el preview ni producción tenían
     * `NEXT_PUBLIC_GA4_ID`, así que nada de Google se cargó. EL DÍA QUE SE PONGA
     * EL IDENTIFICADOR hay que aceptar las cookies con la consola abierta y
     * comprobar que no sale ningún «Refused to…» (nota 8 de la política).
     * Tampoco Turnstile con claves reales, que aún no existen.
     *
     * SI ALGO DEJA DE CARGAR tras un cambio de esta política, de Payload o de un
     * servicio de terceros, lo primero es la consola: un bloqueo sale como
     * «Refused to…». Para volver atrás basta quitar esta regla: la de solo
     * informe sigue en todo el sitio.
     */
    const politica = seguridad.find((c) => c.key === "Content-Security-Policy-Report-Only")?.value;

    return [
      {
        source: "/:path*",
        headers: indexable
          ? seguridad
          : [...seguridad, { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      ...(politica
        ? [
            {
              source: "/:path*",
              headers: [{ key: "Content-Security-Policy", value: politica }],
            },
          ]
        : []),
    ];
  },
};

export default withPayload(nextConfig);
