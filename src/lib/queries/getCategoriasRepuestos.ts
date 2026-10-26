import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { CategoriasTecnica } from "@/payload-types";

/**
 * Categorías técnicas de repuestos, con la API local (CLAUDE.md §3.2): las del
 * índice, las páginas de categoría y el sitemap. `depth: 1` puebla su imagen.
 * Vienen TODAS, también las que cuelgan de otra (Filtros Donaldson, 2026-10-26): quien
 * las pinta filtra con `esCategoriaPrincipal` y las enlaza con `rutaDeCategoriaTecnica`.
 * Memoizadas por petición, como el resto de consultas.
 */
export const getCategoriasRepuestos = cache(async (): Promise<CategoriasTecnica[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-tecnicas",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

/** Una categoría NORMAL por su slug (el último segmento de su URL): nunca una que cuelga de otra. */
export const getCategoriaRepuestosPorSlug = cache(
  async (slug: string): Promise<CategoriasTecnica | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-tecnicas",
      where: { and: [{ slug: { equals: slug } }, { padre: { exists: false } }] },
      depth: 1,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);

/**
 * Una página DENTRO de una categoría (2026-10-26): la de `slug` que cuelga de la categoría
 * `categoriaSlug`. Así una subpágina solo responde en su dirección, nunca bajo otra categoría.
 */
export const getSubcategoriaRepuestos = cache(
  async (categoriaSlug: string, slug: string): Promise<CategoriasTecnica | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-tecnicas",
      where: { and: [{ slug: { equals: slug } }, { "padre.slug": { equals: categoriaSlug } }] },
      depth: 1,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);
