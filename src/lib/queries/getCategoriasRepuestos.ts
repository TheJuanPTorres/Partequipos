import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { CategoriasTecnica } from "@/payload-types";

/**
 * Categorías técnicas de repuestos, con la API local (CLAUDE.md §3.2): las del
 * índice, las páginas de categoría y el sitemap. `depth: 1` puebla su imagen.
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

/** Una categoría por su slug (el último segmento de su URL). */
export const getCategoriaRepuestosPorSlug = cache(
  async (slug: string): Promise<CategoriasTecnica | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-tecnicas",
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);
