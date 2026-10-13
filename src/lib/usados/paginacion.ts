/**
 * PAGINACIÓN DEL LISTADO DE USADOS (2026-10-13).
 *
 * Con 112 unidades en una sola página, el HTML de «Excavadoras» ya pesaba
 * 437 kB; con las ~500 previstas pasaría de 1,9 MB. Se pagina así:
 *
 * - La página 1 sigue en la URL de siempre de la categoría (no cambia nada de
 *   lo indexado).
 * - Las siguientes, en `<categoría>/pagina/<n>/`: rutas estáticas, con canónica
 *   propia y enlazadas desde la página anterior. `/pagina/1/` redirige a la
 *   categoría.
 * - Un segmento de ruta y no `?pagina=`: con parámetros de búsqueda la página
 *   dejaría de ser estática, y los filtros del marketplace (mapa de navegación,
 *   sección 01) quedan libres para usar la query.
 */

/** Unidades por página: par, para que la rejilla de dos columnas cierre. */
export const POR_PAGINA = 24;

/** Páginas que hacen falta para `total` unidades (al menos 1, aunque no haya). */
export function totalPaginas(total: number, porPagina: number = POR_PAGINA): number {
  return Math.max(1, Math.ceil(total / porPagina));
}

/**
 * El número de página de la URL, o null si no es un entero positivo escrito
 * sin adornos ("2", no "02", "2.0" ni "+2"): así cada página tiene una sola URL.
 */
export function numeroDePagina(segmento: string): number | null {
  if (!/^[1-9]\d{0,3}$/.test(segmento)) return null;
  return Number(segmento);
}

/** Los números que se enlazan en la navegación: primera, última y vecinas de la actual. */
export function paginasVisibles(actual: number, total: number): (number | "…")[] {
  const set = new Set(
    [1, total, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= total),
  );
  const orden = [...set].sort((a, b) => a - b);
  const salida: (number | "…")[] = [];
  for (const n of orden) {
    const anterior = salida.at(-1);
    if (typeof anterior === "number" && n - anterior > 1) salida.push("…");
    salida.push(n);
  }
  return salida;
}
