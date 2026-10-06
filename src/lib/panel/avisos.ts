/**
 * Decisiones de los avisos del panel (F4, decisiones-panel.md §22), aparte de
 * los componentes para poder probarlas.
 */

/**
 * Cuántas filas tiene un campo con varias entradas (galería, array, bloques)
 * tal como lo da el formulario de Payload 3.89: según el campo y el momento
 * llega como número de filas o como lista. Cualquier otra cosa cuenta 0.
 */
export function cuantasFilas(valor: unknown): number {
  if (typeof valor === "number") return valor > 0 ? valor : 0;
  if (Array.isArray(valor)) return valor.length;
  return 0;
}
