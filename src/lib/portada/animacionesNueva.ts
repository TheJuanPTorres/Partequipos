/**
 * Las animaciones de «Maquinaria pesada nueva» de la portada (diseño del cliente, 2026-10-27),
 * cada una con su interruptor, con las utilidades del listado de usados (#320, `ZonaAnimada`):
 *
 * - N1: al llegar a la sección, las tarjetas de marca entran escalonadas y la máquina, con un
 *   fundido (la entrada de `ZonaAnimada`, una sola por zona).
 * - N2: al pasar el ratón, zoom lento de la foto de la marca (el del prototipo).
 *
 * En un preview se prueban con `?anim=N1` o `?anim=N2`; en el sitio publicado el parámetro no hace nada.
 * Solo `opacity` y `transform`, nada con «reducir movimiento» y, sin JavaScript, todo quieto.
 */
export const ANIMACIONES_NUEVA = {
  N1: true,
  N2: true,
} as const satisfies Record<string, boolean>;
