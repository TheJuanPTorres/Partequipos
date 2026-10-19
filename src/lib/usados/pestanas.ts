import { rutas } from "../routes";

import { SIN_UNIDADES } from "./vacia";

export type PestanaListado = {
  href: string;
  texto: string;
  activa: boolean;
  /** Marca discreta bajo el texto: «Sin unidades por ahora». */
  nota?: string;
};

/**
 * Las pestañas del listado de una categoría de usada (la plantilla
 * «Categoría secundaria», como en nueva): TODAS las categorías, en el orden
 * recibido (por nombre), con la actual marcada. Las vacías también salen
 * (petición del cliente, 2026-10-18), con «Sin unidades por ahora».
 */
export function pestanasDeCategorias(
  categorias: { id: number; slug: string; nombre: string }[],
  conUnidades: Set<number>,
  actual: number,
): PestanaListado[] {
  return categorias.map((c) => ({
    href: `${rutas.categoriaUsada(c.slug)}/`,
    texto: c.nombre,
    activa: c.id === actual,
    ...(conUnidades.has(c.id) ? {} : { nota: SIN_UNIDADES }),
  }));
}
