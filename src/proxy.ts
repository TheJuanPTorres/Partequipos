import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { resumenDeRuta, type EntradaMapa } from "@/lib/redirects/mapaConClave";
import { aRutaCanonica, normalizarRuta, separarAncla } from "@/lib/redirects/normalizar";

/**
 * Redirecciones 301/302 en el borde de la aplicación (ADR 0005).
 *
 * En Next 16 `middleware.ts` está deprecado y renombrado a `proxy.ts`; el proxy
 * corre en runtime Node por defecto.
 *
 * ESTRATEGIA DE CACHÉ (justificada en el ADR 0005):
 *  1. El proxy NO importa Payload: haría enorme el bundle y lento el arranque en
 *     frío. Solo hace `fetch` a la ruta interna `/api/redirects-map`.
 *  2. El mapa se guarda en memoria del proceso con un TTL de 60 s. Mientras el
 *     módulo viva, las peticiones se resuelven SIN ninguna E/S. En el peor caso
 *     (arranque en frío o TTL vencido) se hace UNA petición interna, no una por
 *     visita.
 *  3. La documentación advierte que el proxy podría desplegarse aparte y no
 *     conviene depender de globales; por eso el diseño es correcto en ambos
 *     escenarios: si el global sobrevive, coste ~0; si no, una petición cacheable.
 *  4. Si el mapa no se puede cargar, se deja pasar la petición. Un fallo del
 *     sistema de redirects nunca puede tumbar el sitio.
 */

/*
 * Cada entrada va por el RESUMEN con clave de su ruta antigua, no por la ruta
 * (`mapaConClave`, 2026-10-17): el mapa no lleva las URL antiguas.
 */
type RedirectEntry = EntradaMapa;

const TTL_MS = 60_000;

let cache: { mapa: Map<string, RedirectEntry>; expiraEn: number } | null = null;
let cargaEnCurso: Promise<Map<string, RedirectEntry>> | null = null;

async function cargarMapa(origin: string): Promise<Map<string, RedirectEntry>> {
  /*
   * DOS DETALLES QUE PARECEN COSMÉTICOS Y NO LO SON. Ver CLAUDE.md §10.22.
   *
   * 1. La barra final es OBLIGATORIA. El proyecto usa `trailingSlash: true`,
   *    así que `/api/redirects-map` responde 308 hacia `/api/redirects-map/`.
   *    Pedirla sin barra funcionaba solo porque `fetch` seguía la redirección:
   *    era una ida y vuelta de más en cada refresco del mapa, y volvía
   *    incompatible con el punto 2.
   *
   * 2. `redirect: "manual"` para NO seguir redirecciones. En un despliegue con
   *    la protección de Vercel activada (todos los preview), esta petición
   *    recibe un 302 hacia `vercel.com/sso-api`; siguiéndolo se llega a la
   *    página de login, que responde **200 con HTML**. Es decir: `respuesta.ok`
   *    salía `true` y el fallo se manifestaba mucho después como
   *    `SyntaxError: Unexpected token '<'` de `JSON.parse`, que no dice nada de
   *    la causa. Sin seguir la redirección, el 302 se ve tal cual.
   */
  const respuesta = await fetch(`${origin}/api/redirects-map/`, {
    headers: { "x-proxy-internal": "1" },
    cache: "no-store",
    redirect: "manual",
  });
  if (!respuesta.ok) throw new Error(`mapa de redirects: HTTP ${respuesta.status}`);

  /*
   * Cinturón además del tirante: si algún día la protección responde 200 con
   * HTML en vez de redirigir, esto lo dice con su nombre en vez de estallar en
   * el parseo.
   */
  const tipo = respuesta.headers.get("content-type") ?? "";
  if (!tipo.includes("application/json")) {
    throw new Error(
      `mapa de redirects: respuesta no-JSON (${tipo || "sin content-type"}); ` +
        "probablemente la proteccion de despliegue de Vercel",
    );
  }

  const datos = (await respuesta.json()) as { redirects?: RedirectEntry[] };
  const mapa = new Map<string, RedirectEntry>();
  for (const entrada of datos.redirects ?? []) {
    if (entrada.clave) mapa.set(entrada.clave, entrada);
  }
  return mapa;
}

async function obtenerMapa(origin: string): Promise<Map<string, RedirectEntry>> {
  const ahora = Date.now();
  if (cache && cache.expiraEn > ahora) return cache.mapa;

  // Evita una estampida de peticiones si varias llegan con la caché vencida.
  cargaEnCurso ??= cargarMapa(origin)
    .then((mapa) => {
      cache = { mapa, expiraEn: Date.now() + TTL_MS };
      return mapa;
    })
    .finally(() => {
      cargaEnCurso = null;
    });

  return cargaEnCurso;
}

export async function proxy(request: NextRequest) {
  const ruta = normalizarRuta(request.nextUrl.pathname);

  try {
    const mapa = await obtenerMapa(request.nextUrl.origin);
    if (mapa.size === 0) return NextResponse.next();
    const entrada = mapa.get(await resumenDeRuta(ruta, process.env.PAYLOAD_SECRET));
    if (!entrada) return NextResponse.next();

    // El destino se emite en su forma CANÓNICA (con barra final, ADR 0006).
    // Guardado va normalizado sin barra para que el emparejamiento sea estable;
    // si se emitiera así, Next encadenaría un 308 detrás del 301.
    // El ancla del destino (una sección de la página) se separa y se añade al
    // final: la forma canónica se calcula solo con la ruta.
    const [rutaDestino, ancla] = separarAncla(entrada.hacia);
    const destino = /^https?:\/\//i.test(entrada.hacia)
      ? new URL(entrada.hacia)
      : new URL(aRutaCanonica(rutaDestino), request.nextUrl.origin);

    // Conserva la query original: no debe perderse al redirigir.
    destino.search = request.nextUrl.search;
    if (ancla && !/^https?:\/\//i.test(entrada.hacia)) destino.hash = ancla;

    const status = entrada.tipo === "302" ? 302 : 301;
    return NextResponse.redirect(destino, status);
  } catch (error) {
    // Degradación elegante: sin mapa, la petición sigue su curso normal.
    console.error("[proxy] redirects no disponibles:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Todas las rutas EXCEPTO:
     *  - api        (incluida /api/redirects-map: evita recursión infinita)
     *  - admin      (panel de Payload)
     *  - _next/*    (estáticos y optimizador de imágenes)
     *  - archivos con extensión (favicon.ico, robots.txt, sitemap.xml, .png…)
     */
    "/((?!api|admin|_next/static|_next/image|.*\\.[\\w]+$).*)",
  ],
};
