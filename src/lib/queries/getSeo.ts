import { getPayload } from "payload";
import { cache } from "react";

import config from "@payload-config";

import { tramosValidos, type Tramo } from "../seo/horario";

/**
 * Horario de atención del global `seo` (fase 6), listo para usar. Memoizado
 * por petición, como el resto de consultas (§10.10).
 */
export const getHorario = cache(async (): Promise<Tramo[]> => {
  const payload = await getPayload({ config });
  const seo = await payload.findGlobal({ slug: "seo", depth: 0 });
  return tramosValidos(seo.horario);
});
