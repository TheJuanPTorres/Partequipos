import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { Sede } from "@/payload-types";

/** Sedes de la portada (sección 9, fase G), en su orden. `depth: 1` puebla la foto. */
export const getSedesDePortada = cache(async (): Promise<Sede[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: "sedes", depth: 1, limit: 30, sort: "orden" });
  return docs;
});
