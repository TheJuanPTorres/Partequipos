import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import { ordenDe } from "@/lib/ordenArrastre";
import type { Sede } from "@/payload-types";

/**
 * Sedes de la portada (sección 9, fase G), en el orden del panel (arrastrando, 2026-11-19; el
 * inicial, «Orden»). `depth: 1` puebla la foto.
 */
export const getSedesDePortada = cache(async (): Promise<Sede[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "sedes",
    depth: 1,
    limit: 30,
    sort: ordenDe("sedes"),
  });
  return docs;
});
