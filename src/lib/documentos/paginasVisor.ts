/**
 * QUÉ PÁGINAS SE VEN EN EL VISOR DE PDF Y HACIA DÓNDE SE PUEDE PASAR (`VisorLibro`, 2026-10-27).
 * Lógica pura: el componente solo le da el ancho, el índice y el total.
 *
 * Antes de este arreglo, el estado «dos páginas a la vez» empezaba en `true` y solo se corregía al
 * montar el libro (con la primera interacción): en un ancho pequeño, con un PDF de 2 páginas, el
 * visor creía ver la 1 y la 2 y dejaba «Página siguiente» deshabilitada hasta que se movía la
 * página a mano.
 */

/** Por debajo de este ancho de página, una sola página (y deslizar). */
export const ANCHO_MIN_PAGINA = 320;

/**
 * ¿Caben dos páginas en un visor de este ancho? El mismo umbral que usa `page-flip` (dos páginas
 * de `ANCHO_MIN_PAGINA`) y el CSS del visor (`@container (max-width: 639px)`).
 */
export const dosPaginasCaben = (anchoVisor: number): boolean => anchoVisor >= 2 * ANCHO_MIN_PAGINA;

/** Las páginas que se ven: la actual y, con dos a la vez, la siguiente (si existe). */
export function paginasVisibles(indice: number, total: number, dobles: boolean): number[] {
  return (dobles ? [indice, indice + 1] : [indice]).filter((i) => i >= 0 && i < total);
}

/** ¿Hay página anterior? */
export const hayAnterior = (indice: number): boolean => indice > 0;

/** ¿Hay página siguiente, más allá de las que ya se ven? */
export function haySiguiente(indice: number, total: number, dobles: boolean): boolean {
  const ultima = paginasVisibles(indice, total, dobles).at(-1);
  return ultima !== undefined && ultima < total - 1;
}
