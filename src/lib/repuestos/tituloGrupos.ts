/**
 * Título de la sección de grupos («Qué incluye» en el panel) de las páginas de categoría técnica
 * de repuestos y de Filtros Donaldson (dirección, 2026-11-04): «Elige el repuesto de {categoría}
 * que necesitas». El nombre va como iba en el título de antes: en minúsculas en las categorías
 * («Qué incluye tren de rodaje») y tal cual en Filtros Donaldson («Nuestra línea de Filtros
 * Donaldson»). Espacios de sobra fuera; sin nombre, sin hueco doble.
 */
export function tituloEligeRepuesto(nombre: string, minusculas: boolean): string {
  const limpio = nombre.trim().replace(/\s+/g, " ");
  const n = minusculas ? limpio.toLowerCase() : limpio;
  return n ? `Elige el repuesto de ${n} que necesitas` : "Elige el repuesto que necesitas";
}
