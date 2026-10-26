/**
 * Las mejoras del ARTÍCULO DEL BLOG (dirección, 2026-10-26), cada una con su
 * interruptor, como las del índice (`lib/animacionesBlog.ts`) y las del listado
 * de usados (#320, `activasDe`). Una en `false` no se pinta.
 *
 * - A1: los botones de compartir suben un poco al pasar el ratón y toman el color de su red.
 * - A2: «Post recientes» se queda fijo al bajar (escritorio) y la miniatura hace un zoom leve
 *   al pasar el ratón.
 * - A3: el contenido entra con un fundido suave.
 *
 * Las tres se apagan con «reducir movimiento» (A2 conserva el «fijo», que no es movimiento);
 * A3 solo cambia `opacity` (CLS 0). En un preview se prueban con `?anim=A1,A3` (`?anim=no`,
 * ninguna); en el sitio publicado, la URL no cuenta.
 */
export const ANIMACIONES_ARTICULO = {
  A1: true,
  A2: true,
  A3: true,
} as const satisfies Record<string, boolean>;

export type AnimacionArticulo = keyof typeof ANIMACIONES_ARTICULO;
