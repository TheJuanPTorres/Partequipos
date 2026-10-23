/**
 * Las animaciones del índice de categorías técnicas de repuestos (dirección, 2026-10-22), cada
 * una INDEPENDIENTE: este objeto es su interruptor. Una en `false` desaparece del todo, sin
 * tocar las demás. En un preview se prueban con `?anim=C1,C3` (`?anim=no`, ninguna), con las
 * utilidades del listado de usados (#320, `activasDe`); en el sitio publicado el parámetro no
 * hace nada.
 *
 * - C1: las baldosas entran escalonadas al llegar a la sección.
 * - C2: al pasar el ratón, la baldosa sube con más sombra, la foto se acerca dentro de su marco,
 *   el borde pasa al rojo de marca y la flecha de «Ver productos» se desplaza.
 * - C3: la foto de la cabecera se acerca muy despacio (1 → 1,05 en 12 s), solo `transform`.
 *
 * Todas: la curva y la duración del listado (`CURVA`, `DURACION_MS`), solo `transform` y
 * `opacity`, apagadas con «reducir movimiento» y, sin JavaScript, la página como siempre.
 */
export const ANIMACIONES_CATEGORIAS = {
  C1: true,
  C2: true,
  C3: true,
} as const satisfies Record<string, boolean>;

export type AnimacionCategorias = keyof typeof ANIMACIONES_CATEGORIAS;
