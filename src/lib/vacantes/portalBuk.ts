import { cargoLegible, ciudadDe } from "./cargo";
import type { Vacante } from "./tipos";

/**
 * LECTOR DEL PORTAL PÚBLICO DE BUK (2026-10-23, Juan Pablo): solución TEMPORAL
 * hasta tener la API oficial (`GET /recruiting/selection_processes`, con una
 * clave del cliente; informes/2026-10-23-buk-vacantes.md).
 *
 * Solo se lee la página del LISTADO, desde el servidor, como mucho cada 6 horas
 * (`fuente.ts`) y con un User-Agent que dice quién somos. Nunca desde el
 * navegador del visitante, y nunca las páginas de cada vacante (pesan 4,7 MB).
 *
 * El marcado es de Buk y puede cambiar sin aviso. Por eso el lector no adivina:
 * si no encuentra la lista, o una tarjeta sin cargo, ciudad o enlace de Buk,
 * LANZA `MarcadoCambiado` y `fuente.ts` sigue con la última copia buena. Una
 * lista que existe y está vacía SÍ es un resultado: «no hay vacantes».
 */
export const URL_PORTAL_BUK = "https://partequipos.buk.co/trabaja-con-nosotros";

/** Quién lee, y con qué frecuencia, para quien mire los registros de Buk. */
export const AGENTE_LECTOR =
  "PartequiposWeb/1.0 (+https://partequipos.com/nosotros/trabaja-con-nosotros/; lee el listado de vacantes como mucho cada 6 horas)";

const MAX_BYTES = 2_000_000;
const TIEMPO_MAXIMO_MS = 10_000;

export class MarcadoCambiado extends Error {
  constructor(motivo: string) {
    super(`el portal de Buk cambió de marcado: ${motivo}`);
    this.name = "MarcadoCambiado";
  }
}

/** Entidades HTML que salen en los títulos de Buk; el resto se deja tal cual. */
function texto(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

/** Solo enlaces https al propio subdominio de Buk del cliente. */
function enlaceDeBuk(href: string): string | null {
  try {
    const url = new URL(href.replace(/&amp;/g, "&"));
    return url.protocol === "https:" && url.hostname === "partequipos.buk.co" && !url.username
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/**
 * Las vacantes del HTML del listado. Lanza `MarcadoCambiado` si la lista no
 * está o una tarjeta no trae lo que esperamos.
 */
export function parsearPortalBuk(html: string): Vacante[] {
  // El contenedor de la lista (list.js de Buk). Sin él, no sabemos leer la página.
  const inicioLista = html.search(/data-paginate-list=/);
  if (inicioLista < 0) throw new MarcadoCambiado("no está la lista de vacantes");
  const lista = html.slice(inicioLista);
  if (!/class="list"/.test(lista)) throw new MarcadoCambiado("no está el contenedor «list»");

  const trozos = lista.split(/<div class="jobs__card[\s"]/).slice(1);
  const vacantes: Vacante[] = [];
  const vistos = new Set<string>();
  for (const [i, trozo] of trozos.entries()) {
    const titulo = trozo.match(/class="[^"]*job__card-name[^"]*">\s*<b[^>]*>([\s\S]*?)<\/b>/);
    const ubicacion = trozo.match(/class="jobs__card-info">\s*<span>([\s\S]*?)<\/span>/);
    const href = trozo.match(/href="(https:\/\/partequipos\.buk\.co\/[^"]+)"/);
    const cargoBuk = texto(titulo?.[1] ?? "");
    const lugar = texto(ubicacion?.[1] ?? "");
    const enlace = href?.[1] ? enlaceDeBuk(href[1]) : null;
    if (!cargoBuk || !lugar || !enlace) {
      throw new MarcadoCambiado(`la tarjeta ${i + 1} no trae cargo, ciudad o enlace`);
    }
    if (vistos.has(enlace)) continue;
    vistos.add(enlace);
    vacantes.push({ cargo: cargoLegible(cargoBuk, lugar), ciudad: ciudadDe(lugar), enlace });
  }
  return vacantes;
}

/**
 * Lee el listado y lo interpreta. Lanza ante cualquier fallo: red, tiempo
 * (10 s), un código que no sea 200, una redirección (no se siguen), algo que no
 * sea HTML, una página de más de 2 MB o el marcado cambiado.
 */
export async function leerPortalBuk(fetchImpl: typeof fetch = fetch): Promise<Vacante[]> {
  const respuesta = await fetchImpl(URL_PORTAL_BUK, {
    headers: { "User-Agent": AGENTE_LECTOR, Accept: "text/html" },
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
  });
  if (respuesta.status !== 200)
    throw new Error(`el portal de Buk respondió HTTP ${respuesta.status}`);
  const tipo = respuesta.headers.get("content-type") ?? "";
  if (!tipo.includes("text/html")) throw new Error(`el portal de Buk no devolvió HTML (${tipo})`);
  const html = await respuesta.text();
  if (html.length > MAX_BYTES) throw new Error(`el portal de Buk devolvió ${html.length} bytes`);
  return parsearPortalBuk(html);
}
