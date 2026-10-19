import { rutas } from "../routes";

export type PestanaListado = { href: string; texto: string; activa: boolean };

/**
 * Las pestañas del listado de una categoría de usada (la plantilla
 * «Categoría secundaria», como en nueva): las categorías con unidades
 * disponibles, en el orden recibido (por nombre), y la actual aunque esté
 * vacía, marcada.
 */
export function pestanasDeCategorias(
  categorias: { id: number; slug: string; nombre: string }[],
  conUnidades: Set<number>,
  actual: number,
): PestanaListado[] {
  return categorias
    .filter((c) => c.id === actual || conUnidades.has(c.id))
    .map((c) => ({
      href: `${rutas.categoriaUsada(c.slug)}/`,
      texto: c.nombre,
      activa: c.id === actual,
    }));
}
