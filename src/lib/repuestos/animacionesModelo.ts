/**
 * Las animaciones de la CABECERA de la página de modelo de repuestos (plantilla 4086,
 * dirección 2026-10-26), cada una INDEPENDIENTE: este objeto es su interruptor, como las del
 * listado de usados (#320, `activasDe`). Van en la misma `ZonaAnimada` que C1–C3 del índice de
 * categorías, así que en un preview se prueban juntas con `?anim=H1,C3` (`?anim=no`, ninguna);
 * en el sitio publicado la URL no cuenta.
 *
 * - H1: el texto de la cabecera (migas, antetítulo, título, datos y descripción) entra
 *   escalonado al cargar, con una animación de CSS desde el primer pintado (sin parpadeo).
 * - H2: las pastillas de Código, Tipo y Marca suben un poco al pasar el ratón (solo
 *   `transform`: el resto no se mueve).
 * - H3: la foto de la izquierda aparece con un fundido (además del zoom lento C3).
 *
 * Todas: solo `opacity` y `transform` (CLS 0) y apagadas con «reducir movimiento».
 */
export const ANIMACIONES_MODELO = {
  H1: true,
  H2: true,
  H3: true,
} as const satisfies Record<string, boolean>;
