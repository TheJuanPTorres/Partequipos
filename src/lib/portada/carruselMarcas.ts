/**
 * CARRUSEL DE MARCAS DE LA PORTADA (Home V2 de Andrés, 2026-10-15) — lógica pura.
 *
 * Como el Swiper de la referencia: avanza solo cada 5 s, en bucle y una
 * tarjeta cada vez. El bucle se hace con una COPIA de las tarjetas detrás de
 * las originales: la pista avanza hasta la copia de la primera y, al acabar la
 * transición, salta sin animar a la original, que se ve igual. Por eso el
 * índice puede valer `total` un instante.
 */

/** Cada cuánto avanza solo (el `autoplay.delay` de la referencia). */
export const INTERVALO_MS = 5000;
/** Lo que dura el paso de una tarjeta a la siguiente (su `speed`). */
export const TRANSICION_MS = 500;

/** El índice siguiente: llega hasta `total` (la copia de la primera). */
export function siguiente(indice: number, total: number): number {
  if (total <= 1) return 0;
  return Math.min(indice + 1, total);
}

/** La tarjeta real que hay al frente: la copia de la primera cuenta como la primera. */
export function alFrente(indice: number, total: number): number {
  if (total <= 0) return 0;
  return ((indice % total) + total) % total;
}

/** ¿Hay que saltar sin animar a la original? Solo cuando la pista está en la copia. */
export function hayQueVolver(indice: number, total: number): boolean {
  return total > 1 && indice >= total;
}

/**
 * ¿Avanza solo ahora? No, si hay una sola tarjeta, si está pausado (por el
 * botón o por «reducir movimiento»), si el puntero está encima o el foco
 * dentro (WCAG 2.2.2), o si la sección no se ve.
 */
export function avanzaSolo(estado: {
  total: number;
  pausado: boolean;
  dentro: boolean;
  visible: boolean;
}): boolean {
  return estado.total > 1 && !estado.pausado && !estado.dentro && estado.visible;
}
