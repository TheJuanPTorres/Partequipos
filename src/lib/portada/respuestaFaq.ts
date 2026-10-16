import { validarEnlace } from "../fields/reglasPortada";

/**
 * ENLACES EN LA RESPUESTA DE UNA PREGUNTA FRECUENTE (2026-10-16).
 *
 * La respuesta es texto plano (alimenta el JSON-LD `FAQPage`, que pide texto).
 * Para enlazar a otra página se escribe `[texto](/ruta/)` o
 * `[texto](https://…)`: nada más. Solo se reconocen enlaces con el destino que
 * admite `validarEnlace` (ruta interna o `https://`), así que ni `javascript:`
 * ni `//otro.com` llegan a pintarse como enlace.
 */
export type ParteRespuesta = string | { texto: string; href: string };

const ENLACE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/** La respuesta partida en texto y enlaces, en orden. Un destino no válido queda como texto. */
export function partesDeRespuesta(respuesta: string): ParteRespuesta[] {
  const partes: ParteRespuesta[] = [];
  let desde = 0;
  for (const m of respuesta.matchAll(ENLACE)) {
    const [entero, texto, href] = m as unknown as [string, string, string];
    if (validarEnlace(href) !== true) continue;
    if (m.index > desde) partes.push(respuesta.slice(desde, m.index));
    partes.push({ texto, href });
    desde = m.index + entero.length;
  }
  if (desde < respuesta.length) partes.push(respuesta.slice(desde));
  return partes;
}

/** La respuesta sin la sintaxis de enlace (para el JSON-LD y los resúmenes). */
export function respuestaEnTextoPlano(respuesta: string): string {
  return partesDeRespuesta(respuesta)
    .map((p) => (typeof p === "string" ? p : p.texto))
    .join("");
}

/** Validación del campo en el panel: todo `](destino)` tiene que ser un destino válido. */
export function validarRespuestaFaq(valor: unknown): true | string {
  if (typeof valor !== "string" || !valor.trim()) return "Escribe la respuesta.";
  for (const m of valor.matchAll(/\]\(([^)]*)\)/g)) {
    const destino = (m[1] ?? "").trim();
    if (!destino || validarEnlace(destino) !== true)
      return `El enlace «${destino}» no vale: usa una ruta del sitio que empiece por «/» o una dirección https://.`;
  }
  return true;
}
