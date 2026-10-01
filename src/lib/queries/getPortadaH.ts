import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { PreguntasFrecuente, Testimonio } from "@/payload-types";

/**
 * Testimonios y preguntas frecuentes de la portada (fase H).
 *
 * La API local SALTA el control de acceso: el filtro de publicado va en la
 * consulta (y otra vez en `seccionesH.ts`). Sin él, la portada enseñaría
 * testimonios sin autorización de uso (L4, CLAUDE.md §10.15).
 */
export const getTestimoniosDePortada = cache(async (): Promise<Testimonio[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "testimonios",
    where: { publicado: { equals: true } },
    depth: 1,
    limit: 8,
    sort: "orden",
  });
  return docs;
});

export const getPreguntasDePortada = cache(async (): Promise<PreguntasFrecuente[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "preguntas-frecuentes",
    where: { publicada: { equals: true } },
    depth: 0,
    limit: 20,
    sort: "orden",
  });
  return docs;
});
