import { cache } from "react";

import config from "@payload-config";
import { getPayload } from "payload";

import { ALT_AYUDA_MODELO } from "@/lib/repuestos/muestraModelo";
import type { Media } from "@/payload-types";

/**
 * MUESTRA del laboratorio (página de modelo de repuestos, 2026-10-19): la foto
 * de la tarjeta «ESTAMOS AQUÍ PARA AYUDARLO», buscada por su texto alternativo
 * exacto. Se borra con el laboratorio: en la página real será un campo del panel.
 */
export const getFotoAyudaModelo = cache(async (): Promise<Media | null> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "media",
    where: { alt: { equals: ALT_AYUDA_MODELO } },
    depth: 0,
    limit: 1,
  });
  return docs[0] ?? null;
});
