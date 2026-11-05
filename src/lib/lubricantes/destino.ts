import type { Where } from "payload";

import { normalizarEnlaceExterno } from "../nueva/enlaceExterno";

/**
 * MARCA DE LUBRICANTES SIN PÁGINA PROPIA (2026-11-04, dirección: Dispel). El campo «Destino» de
 * `marcas-lubricante`:
 *
 * - «Su página en este sitio» (por defecto, Eni): la marca tiene su página y sus líneas.
 * - «Otra web»: la marca NO tiene página aquí, nunca, tenga o no el enlace. Su URL da 404 y no
 *   sale en el sitemap ni como marca destacada de `/lubricantes/`. En el menú sale como un enlace
 *   a su «Enlace externo», en pestaña nueva, y SOLO si ese enlace es válido: con el enlace vacío,
 *   la marca no sale (sin enlaces rotos); en cuanto se rellena en el panel, aparece.
 *
 * El enlace sigue la misma regla que el de las marcas de maquinaria nueva (#412): solo https y a
 * otro sitio (`normalizarEnlaceExterno`).
 */
export const DESTINO_PAGINA = "pagina";
export const DESTINO_EXTERNO = "externo";

export type ConDestino = { destino?: string | null; enlaceExterno?: string | null };

/** ¿Tiene la marca su página en este sitio? Vacío cuenta como «su página» (las de antes). */
export const tienePaginaPropiaLubricante = (m: ConDestino | null | undefined): boolean =>
  !!m && m.destino !== DESTINO_EXTERNO;

/**
 * El enlace del menú de una marca de «Otra web», o `null`: si tiene página propia, o si su enlace
 * está vacío o no es válido (entonces no sale en el menú).
 */
export function enlaceExternoLubricante(m: ConDestino | null | undefined): string | null {
  if (!m || m.destino !== DESTINO_EXTERNO) return null;
  return normalizarEnlaceExterno(m.enlaceExterno);
}

/** Para las consultas públicas: solo las marcas con página en este sitio. */
export const LUBRICANTE_CON_PAGINA: Where = {
  or: [{ destino: { exists: false } }, { destino: { not_equals: DESTINO_EXTERNO } }],
};
