import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { FichaProducto } from "@/payload-types";

/**
 * El global `ficha-producto` (lo común a las fichas de equipo nuevo), con la
 * API local (CLAUDE.md §3.2). Memoizado por petición; `depth: 1` puebla la
 * imagen de la llamada a contactar.
 */
export const getFichaProducto = cache(async (): Promise<FichaProducto> => {
  const payload = await getPayload({ config });
  return payload.findGlobal({ slug: "ficha-producto", depth: 1 });
});
