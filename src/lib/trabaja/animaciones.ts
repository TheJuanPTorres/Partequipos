/**
 * «TRABAJA CON NOSOTROS» (dirección, 2026-10-23): sus mejoras, cada una INDEPENDIENTE; este objeto
 * es su interruptor. Una en `false` desaparece del todo, sin tocar las demás. En un preview se
 * prueban con `?anim=T1,T3` (`?anim=no`, ninguna), con las utilidades del listado de usados
 * (#320, `activasDe`, y `ZonaAnimada`); en el sitio publicado el parámetro no hace nada.
 *
 * - T1: las tarjetas de las vacantes entran escalonadas (y las que llegan al cambiar de ciudad).
 * - T2: la tarjeta sube con sombra al pasar el ratón o enfocarla.
 * - T3: en el filtro de ciudades, el resaltado se desliza de una ciudad a otra.
 * - T4: el contador «N vacantes abiertas» sube hasta su cifra al aparecer.
 * - T5: la foto de la cabecera se acerca muy despacio (la C3 del índice de categorías técnicas).
 *
 * Todas: solo `transform` y `opacity` (CLS 0), apagadas con «reducir movimiento» y, sin
 * JavaScript, la página se ve entera.
 */
export const ANIMACIONES_TRABAJA = {
  T1: true,
  T2: true,
  T3: true,
  T4: true,
  T5: true,
} as const satisfies Record<string, boolean>;
