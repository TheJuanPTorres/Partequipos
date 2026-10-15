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

/**
 * La fila de diapositiva del hero a la que pertenece un campo de esa fila, por
 * su ruta en el formulario (`hero.diapositivas.<n>.<campo>`): el prefijo para
 * leer sus campos hermanos y su posición (0 = la primera). `null` si la ruta no
 * es de una diapositiva.
 */
export function filaDeDiapositiva(ruta: string): { prefijo: string; indice: number } | null {
  const m = /^(.*\bdiapositivas\.(\d+))\.[^.]+$/.exec(ruta);
  return m ? { prefijo: m[1]!, indice: Number(m[2]) } : null;
}

/** ¿Tiene valor un campo de subida (id, documento poblado o nada)? */
export function tieneSubida(valor: unknown): boolean {
  if (typeof valor === "number") return valor > 0;
  if (typeof valor === "string") return valor.trim() !== "";
  return typeof valor === "object" && valor !== null;
}
