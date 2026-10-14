import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { PaginasIndice } from "@/payload-types";

/**
 * El global `paginas-indice` (textos y tarjetas de las páginas índice de
 * repuestos y de maquinaria, y de Contáctanos), con la API local (CLAUDE.md
 * §3.2). Memoizado por petición; `depth: 2` puebla las imágenes de las
 * tarjetas, que están dentro de un array de un grupo.
 */
export const getPaginasIndice = cache(async (): Promise<PaginasIndice> => {
  const payload = await getPayload({ config });
  return payload.findGlobal({ slug: "paginas-indice", depth: 2 });
});
