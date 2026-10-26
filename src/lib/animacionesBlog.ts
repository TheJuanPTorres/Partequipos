/**
 * Las mejoras del ÍNDICE DEL BLOG (dirección, 2026-10-26), cada una con su interruptor, como las
 * del listado de usados (#320, `lib/listado/animaciones.ts`, de donde sale `activasDe`). Una en
 * `false` no se pinta ni corre su código.
 *
 * - N1: el artículo más reciente, como tarjeta destacada grande arriba (solo en la primera página
 *   y sin búsqueda ni filtros).
 * - N2: al pasar el ratón, la tarjeta sube un poco y la foto hace un zoom leve.
 * - N3: las tarjetas entran escalonadas.
 * - N4: la etiqueta de la categoría, sobre la foto.
 *
 * N2 y N3 se apagan con «reducir movimiento»; N3 solo cambia `opacity` y `transform` (CLS 0).
 * En un preview se prueban con `?anim=N1,N4` (`?anim=no`, ninguna); en el sitio publicado, la URL
 * no cuenta.
 */
export const ANIMACIONES_BLOG = {
  N1: true,
  N2: true,
  N3: true,
  N4: true,
} as const satisfies Record<string, boolean>;

export type AnimacionBlog = keyof typeof ANIMACIONES_BLOG;
