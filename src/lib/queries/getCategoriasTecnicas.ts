import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { CategoriasTecnica } from "@/payload-types";
import { ordenDe } from "../ordenArrastre";

/**
 * Categorías técnicas de «Venta de repuestos» de la portada: las de la casilla «En la portada»,
 * en el orden por arrastre del panel, el mismo de toda la web (tanda 24, Juan Pablo, 2026-11-25).
 * `depth: 1` puebla la imagen de la tarjeta.
 */
export const getCategoriasTecnicasDePortada = cache(async (): Promise<CategoriasTecnica[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-tecnicas",
    where: { enPortada: { equals: true } },
    depth: 1,
    limit: 0,
    // En el orden del panel (arrastrando), como el menú y el índice.
    sort: ordenDe("categorias-tecnicas"),
  });
  return docs;
});
