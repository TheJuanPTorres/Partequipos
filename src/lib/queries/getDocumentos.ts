import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { Documento } from "@/payload-types";

/**
 * Un documento por id con sus «Páginas como imágenes» pobladas (`depth: 1`),
 * para el bloque «Documento en visor». El bloque llega desde el texto
 * enriquecido o desde los bloques de una página con la relación sin poblar del
 * todo (las páginas se quedan en ids), así que el visor lo pide aparte.
 */
export const getDocumentoParaVisor = cache(async (id: number): Promise<Documento | null> => {
  const payload = await getPayload({ config });
  try {
    return await payload.findByID({ collection: "documentos", id, depth: 1 });
  } catch {
    return null;
  }
});
