/**
 * EL SECRETO DE DERIVACIÓN DEL PREVIEW SOLO VIAJA AL PREVIEW.
 *
 * `VERCEL_AUTOMATION_BYPASS_SECRET` abre los despliegues protegidos. Va en la
 * cabecera `x-vercel-protection-bypass`, y SOLO en peticiones cuyo origen sea
 * EXACTAMENTE el del preview que se mide: nunca a Mapbox, al CDN del Blob, a
 * Google Fonts, a producción ni a nadie más.
 *
 * INCIDENTE (2026-10-06): un script de medición usó `extraHTTPHeaders` de
 * Playwright, que añade la cabecera a TODAS las peticiones de la página. La
 * página carga el globo de sedes y el secreto llegó a `api.mapbox.com`. Hubo
 * que rotarlo. De ahí este módulo y su prueba (`derivacion.test.ts`), que falla
 * si la cabecera puede llegar a otro host.
 *
 * Es JavaScript (con tipos en JSDoc) para que lo usen igual los scripts `.ts` y
 * los `.mjs` que se lanzan con `node` (`panel:revision`, `qa:vuelo-pie`).
 *
 * REGLAS DE USO, todas en este fichero:
 * - Playwright: `instalarDerivacion(contexto, origen, secreto)`. Nunca
 *   `extraHTTPHeaders` ni `setExtraHTTPHeaders` (el guardarraíl lo prohíbe).
 * - Puppeteer: en la intercepción, `q.continue({ headers: conDerivacion(...) })`.
 * - `fetch`: `fetchAlPreview(url, origen, secreto)`, que NO sigue
 *   redirecciones (un 302 de la protección iría a `vercel.com` con el secreto).
 */

export const CABECERA_DERIVACION = "x-vercel-protection-bypass";

/** Un despliegue del proyecto en Vercel, nunca el dominio de producción. */
const HOST_PREVIEW = /^partequipos-[a-z0-9-]+\.vercel\.app$/;

/**
 * El origen de un preview del proyecto (`https://partequipos-…vercel.app`), o
 * `null` si la URL no es uno.
 * @param {string} url
 * @returns {string | null}
 */
export function origenDePreview(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
  return HOST_PREVIEW.test(u.hostname) ? u.origin : null;
}

/**
 * ¿Puede esta petición llevar el secreto? Solo si su origen es EXACTAMENTE el
 * del preview (mismo esquema, host y puerto) y ese origen es un preview.
 * @param {string} urlPeticion
 * @param {string} origen
 * @returns {boolean}
 */
export function puedeLlevarDerivacion(urlPeticion, origen) {
  const propio = origenDePreview(origen);
  if (!propio) return false;
  try {
    return new URL(urlPeticion).origin === propio;
  } catch {
    return false;
  }
}

/**
 * Las cabeceras de una petición con el secreto si va al preview, y SIN él (se
 * quita si viniera) si va a cualquier otro sitio.
 * @param {Record<string, string>} cabeceras
 * @param {string} urlPeticion
 * @param {string} origen
 * @param {string | undefined} secreto
 * @returns {Record<string, string>}
 */
export function conDerivacion(cabeceras, urlPeticion, origen, secreto) {
  const limpias = Object.fromEntries(
    Object.entries(cabeceras).filter(([k]) => k.toLowerCase() !== CABECERA_DERIVACION),
  );
  if (!secreto || !puedeLlevarDerivacion(urlPeticion, origen)) return limpias;
  return { ...limpias, [CABECERA_DERIVACION]: secreto };
}

/**
 * Playwright: el secreto, solo en las peticiones al origen del preview. Solo se
 * intercepta ESE origen: interceptarlo todo hacía fallar las imágenes
 * del Blob con ERR_BLOCKED_BY_ORB. Dentro se vuelve a comprobar la regla.
 * Si el origen no es un preview, no se instala nada.
 * @param {{ route: (patron: string, fn: (ruta: any) => unknown) => Promise<unknown> }} contexto
 * @param {string} origen
 * @param {string | undefined} secreto
 */
export async function instalarDerivacion(contexto, origen, secreto) {
  const propio = origenDePreview(origen);
  if (!propio || !secreto) return;
  await contexto.route(`${propio}/**`, (ruta) => {
    const peticion = ruta.request();
    return ruta.continue({
      headers: conDerivacion(peticion.headers(), peticion.url(), origen, secreto),
    });
  });
}

/**
 * `fetch` al preview con el secreto. Se niega si la URL no es de ese origen, y
 * NO sigue redirecciones: la respuesta 3xx vuelve tal cual.
 * @param {string} url
 * @param {string} origen
 * @param {string | undefined} secreto
 * @param {RequestInit} [opciones]
 * @returns {Promise<Response>}
 */
export function fetchAlPreview(url, origen, secreto, opciones = {}) {
  if (!puedeLlevarDerivacion(url, origen)) {
    throw new Error(
      `[derivación] ${new URL(url).host} no es el origen del preview: no se envía el secreto.`,
    );
  }
  const cabeceras = Object.fromEntries(new Headers(opciones.headers ?? {}).entries());
  return fetch(url, {
    ...opciones,
    redirect: "manual",
    headers: conDerivacion(cabeceras, url, origen, secreto),
  });
}
