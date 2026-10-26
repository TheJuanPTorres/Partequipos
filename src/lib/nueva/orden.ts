/**
 * ORDEN DE LOS TIPOS Y EQUIPOS DE MAQUINARIA NUEVA (2026-10-26, cliente): el campo «Orden» del
 * panel. El número más bajo va primero; los que no lo tienen, después y por nombre. Lo usan las
 * secciones de la página de marca (y su píldora y su cinta), las páginas de marca y tipo, la
 * página general del tipo y el menú.
 */

/** Para `payload.find`: Postgres pone los vacíos al final en orden ascendente. */
export const SORT_POR_ORDEN: string[] = ["orden", "nombre"];

type ConOrden = { orden?: number | null; nombre: string };

/** El mismo orden en JavaScript: por «Orden» (vacío, al final) y, a igualdad, por nombre. */
export function porOrden(a: ConOrden, b: ConOrden): number {
  const oa = typeof a.orden === "number" ? a.orden : Number.POSITIVE_INFINITY;
  const ob = typeof b.orden === "number" ? b.orden : Number.POSITIVE_INFINITY;
  if (oa !== ob) return oa < ob ? -1 : 1;
  return a.nombre.localeCompare(b.nombre, "es");
}
