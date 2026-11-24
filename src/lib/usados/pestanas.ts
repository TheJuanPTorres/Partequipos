import { rutas } from "../routes";

import { SIN_UNIDADES } from "./vacia";

export type PestanaListado = {
  href: string;
  texto: string;
  activa: boolean;
  /** Marca discreta bajo el texto: «Sin unidades por ahora». */
  nota?: string;
  /** Unidades disponibles de la categoría (solo las que tienen). */
  cuenta?: number;
};

/**
 * Los botones de categoría del listado de una categoría de usada: TODAS las
 * categorías (petición del cliente, 2026-10-18), con la actual marcada.
 * Van primero las que tienen unidades, con su número, y después las vacías,
 * con «Sin unidades por ahora». Cada grupo, EN EL ORDEN DEL PANEL (el que
 * llega: arrastrando en «Categorías de usados», el mismo del índice y del
 * megamenú; Juan Pablo, tanda 21, H2). Antes, las de unidades iban de más a
 * menos (2026-10-21).
 */
export function pestanasDeCategorias(
  categorias: { id: number; slug: string; nombre: string }[],
  unidadesPorCategoria: Map<number, number>,
  actual: number,
): PestanaListado[] {
  const n = (id: number) => unidadesPorCategoria.get(id) ?? 0;
  const con = categorias.filter((c) => n(c.id) > 0);
  const vacias = categorias.filter((c) => n(c.id) === 0);
  return [...con, ...vacias].map((c) => ({
    href: `${rutas.categoriaUsada(c.slug)}/`,
    texto: c.nombre,
    activa: c.id === actual,
    ...(n(c.id) > 0 ? { cuenta: n(c.id) } : { nota: SIN_UNIDADES }),
  }));
}

/** Unidades disponibles por categoría, a partir del inventario. */
export function unidadesPorCategoria(inventario: { categoria: number }[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const u of inventario) m.set(u.categoria, (m.get(u.categoria) ?? 0) + 1);
  return m;
}
