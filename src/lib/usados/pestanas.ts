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
 * Desde el 2026-10-21 (cliente) van primero las que tienen unidades, de más a
 * menos y, a igual número, por nombre (como en «Otros»), con su número; las
 * vacías, después, en el orden recibido y con «Sin unidades por ahora».
 */
export function pestanasDeCategorias(
  categorias: { id: number; slug: string; nombre: string }[],
  unidadesPorCategoria: Map<number, number>,
  actual: number,
): PestanaListado[] {
  const n = (id: number) => unidadesPorCategoria.get(id) ?? 0;
  const con = categorias
    .filter((c) => n(c.id) > 0)
    .sort((a, b) => n(b.id) - n(a.id) || a.nombre.localeCompare(b.nombre, "es"));
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
