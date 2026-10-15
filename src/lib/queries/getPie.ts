import { cache } from "react";
import { unstable_cache } from "next/cache";
import config from "@payload-config";
import { getPayload } from "payload";

import type { Pie } from "@/payload-types";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "../cacheDatos";

/**
 * El global `pie`, con la API local (CLAUDE.md §3.2). `depth: 1` puebla la
 * imagen decorativa. En la caché de datos del MARCO (`datos:marco`).
 */
const pieEnCache = unstable_cache(
  async (): Promise<Pie> => {
    const payload = await getPayload({ config });
    return payload.findGlobal({ slug: "pie", depth: 1 });
  },
  ["pie", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.marco] },
);

export const getPie = cache(() => pieEnCache());
