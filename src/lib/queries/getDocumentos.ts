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

/**
 * Varios documentos de una vez, con sus «Páginas como imágenes» pobladas: la
 * ficha de maquinaria nueva abre en el visor su PDF y el de cada tarjeta de
 * «Otras …» (2026-10-21). Una sola consulta en vez de una por documento.
 */
export const getDocumentosParaVisor = cache(async (ids: number[]): Promise<Documento[]> => {
  const unicos = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0);
  if (unicos.length === 0) return [];
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "documentos",
    where: { id: { in: unicos } },
    depth: 1,
    limit: unicos.length,
    pagination: false,
  });
  return docs;
});
