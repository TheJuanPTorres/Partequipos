import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { CategoriasTecnica } from "@/payload-types";

/**
 * Categorías técnicas de la sección 5 de la portada (fase E): las que tienen
 * posición en la portada. El orden fino lo hace `tarjetasDeRepuestos`.
 * `depth: 1` puebla la imagen de la tarjeta.
 */
export const getCategoriasTecnicasDePortada = cache(async (): Promise<CategoriasTecnica[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-tecnicas",
    where: { ordenPortada: { exists: true } },
    depth: 1,
    limit: 0,
    sort: "ordenPortada",
  });
  return docs;
});
