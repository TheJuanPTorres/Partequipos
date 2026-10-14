import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { CategoriasTecnica, RepuestosMarca, TiposEquipo } from "@/payload-types";

/**
 * Datos de la página de marca de repuestos (ux-9), con la API local
 * (CLAUDE.md §3.2). Memoizados por petición, como el resto de consultas.
 */

/** El global `repuestos-marca`: títulos y tarjetas comunes. `depth: 1` puebla las imágenes. */
export const getRepuestosMarca = cache(async (): Promise<RepuestosMarca> => {
  const payload = await getPayload({ config });
  return payload.findGlobal({ slug: "repuestos-marca", depth: 1 });
});

/**
 * Tipos de una marca CON su imagen poblada (la tarjeta). Aparte de
 * `getTiposDeMarca`, que va con `depth: 0` y lo usan otras rutas.
 */
export const getTiposDeMarcaConImagen = cache(async (marcaId: number): Promise<TiposEquipo[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "tipos-equipo",
    where: { marca: { equals: marcaId } },
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

/** Todas las categorías técnicas: son COMUNES a las marcas. El orden lo decide `ordenMarca`. */
export const getCategoriasParaMarca = cache(async (): Promise<CategoriasTecnica[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-tecnicas",
    depth: 0,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});
