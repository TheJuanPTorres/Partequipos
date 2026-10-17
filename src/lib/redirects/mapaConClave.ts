import { normalizarRuta } from "./normalizar";

/**
 * EL MAPA DE REDIRECTS SIN LAS DIRECCIONES ANTIGUAS (2026-10-17, decisión de
 * dirección). 86 de las URL antiguas de usados llevan el número de serie en el
 * slug, y `/api/redirects-map/` se lee con una cabecera que no es secreta.
 *
 * El mapa lleva, en lugar de `desde`, un RESUMEN CON CLAVE (HMAC-SHA256) de la
 * ruta normalizada. El proxy calcula el mismo resumen de cada petición y lo
 * busca: ningún 301 se pierde. Sin clave no bastaría: las direcciones siguen un
 * patrón (modelo + serial) y un SHA-256 a secas se adivina probando.
 *
 * La clave se deriva de `PAYLOAD_SECRET`, que la ruta y el proxy ya tienen en
 * el mismo despliegue. Si cambia, el proxy recarga el mapa en un minuto.
 *
 * Web Crypto (no `node:crypto`): el proxy puede correr en cualquier runtime.
 */

const codificador = new TextEncoder();
const clavesHmac = new Map<string, Promise<CryptoKey>>();

function claveHmac(secreto: string): Promise<CryptoKey> {
  let clave = clavesHmac.get(secreto);
  if (!clave) {
    clave = crypto.subtle.importKey(
      "raw",
      // Separación de dominio: esta clave no sirve para nada más que el mapa.
      codificador.encode(`partequipos:redirects-map:${secreto}`),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    clavesHmac.set(secreto, clave);
  }
  return clave;
}

/** Resumen hexadecimal (64 caracteres) de la ruta normalizada. */
export async function resumenDeRuta(ruta: string, secreto: string | undefined): Promise<string> {
  if (!secreto) throw new Error("sin secreto para el mapa de redirects (PAYLOAD_SECRET)");
  const firma = await crypto.subtle.sign(
    "HMAC",
    await claveHmac(secreto),
    codificador.encode(normalizarRuta(ruta)),
  );
  return [...new Uint8Array(firma)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type RedirectGuardado = { desde: string; hacia: string; tipo?: string | null };
export type EntradaMapa = { clave: string; hacia: string; tipo: string };

/** El mapa que sirve `/api/redirects-map/`: destino y tipo, nunca el origen. */
export async function mapaConClave(
  redirects: RedirectGuardado[],
  secreto: string | undefined,
): Promise<EntradaMapa[]> {
  return Promise.all(
    redirects.map(async (r) => ({
      clave: await resumenDeRuta(r.desde, secreto),
      hacia: r.hacia,
      tipo: r.tipo ?? "301",
    })),
  );
}

/** Máximo de rutas por consulta: las ~650 de `url-map.csv` caben de sobra. */
export const MAX_RUTAS_CONSULTA = 2000;

/**
 * Para el comprobador de lanzamiento: el destino de cada ruta QUE YA CONOCE
 * quien pregunta. No revela ninguna dirección que no se le haya dado.
 */
export function destinosDe(
  redirects: RedirectGuardado[],
  rutas: string[],
): { ruta: string; hacia: string; tipo: string }[] {
  const porDesde = new Map(redirects.map((r) => [normalizarRuta(r.desde), r]));
  return rutas.flatMap((ruta) => {
    const r = porDesde.get(normalizarRuta(ruta));
    return r ? [{ ruta, hacia: r.hacia, tipo: r.tipo ?? "301" }] : [];
  });
}
