/**
 * LA PÁGINA DE GARANTÍAS (`/politica-de-garantia-de-repuestos/`, dirección, 2026-10-23): sus
 * mejoras, cada una INDEPENDIENTE; este objeto es su interruptor. Una en `false` desaparece del
 * todo, sin tocar las demás. En un preview se prueban con `?anim=V1,V3` (`?anim=no`, ninguna),
 * con las utilidades del listado de usados (#320, `activasDe`, y `ZonaAnimada`); en el sitio
 * publicado el parámetro no hace nada.
 *
 * - V1: el título de cada visor se revela por palabras, como los títulos de sección del sitio.
 * - V2: cada visor entra con un fundido y una subida suave al llegar a él.
 * - V3: el selector «Garantía · Devolución» bajo la cabecera (la barra de series de repuestos,
 *   `BarraSeries`): lleva a cada visor con desplazamiento suave y su resaltado se desliza según
 *   la sección que se ve. Sustituye al índice «En esta página».
 * - V4: cada visor en un marco con el fondo suave del sitio, y el icono de «Descargar PDF» baja
 *   un poco al pasar el ratón.
 *
 * Todas: solo `transform` y `opacity` (el marco no se mueve), apagadas con «reducir movimiento»
 * y, sin JavaScript, la página se ve entera.
 */
export const ANIMACIONES_POLITICA = {
  V1: true,
  V2: true,
  V3: true,
  V4: true,
} as const satisfies Record<string, boolean>;

/** La página que usa esta plantilla. Las demás institucionales siguen como estaban. */
export const SLUG_POLITICA_GARANTIA = "politica-de-garantia-de-repuestos";

/**
 * El nombre corto de una sección para la pastilla del selector: «Política de garantía de
 * repuestos» → «Garantía». Si el título no tiene esa forma, el título tal cual.
 */
export function etiquetaCorta(titulo: string): string {
  const m = /^pol[ií]tica de (.+?)(?: de repuestos)?$/i.exec(titulo.trim());
  if (!m?.[1]) return titulo.trim();
  const nucleo = m[1].trim();
  return nucleo.charAt(0).toLocaleUpperCase("es") + nucleo.slice(1);
}
