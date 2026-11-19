import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "@/lib/cacheDatos";

import { cargarDocumentos } from "./catalogo";
import type { DocBusqueda } from "./motor";

/**
 * LOS DATOS DEL BUSCADOR (2026-11-18): los documentos del catálogo y los sinónimos del panel, en la
 * caché de datos con la etiqueta `datos:busqueda` (la que invalidan `revalidarIndices` y los ganchos
 * del panel) y una vigencia de una hora como red.
 *
 * Los lee `servidor.ts` solo cuando no puede tomarlos de la ruta estática `/api/buscar/precalentar/`
 * (que los publica ya calculados, sin arrancar Payload en una instancia fría).
 */

const VIGENCIA = 3600;

export type DatosBuscador = { docs: DocBusqueda[]; sinonimos: string };

export const datosDelBuscador = unstable_cache(
  async (): Promise<DatosBuscador> => {
    const payload = await getPayload({ config });
    const [docs, ajustes] = await Promise.all([
      cargarDocumentos(),
      payload.findGlobal({ slug: "buscador", depth: 0 }),
    ]);
    return { docs, sinonimos: ajustes.sinonimos ?? "" };
  },
  ["buscador-datos", CLAVE_DESPLIEGUE],
  { revalidate: VIGENCIA, tags: [ETIQUETAS_DATOS.busqueda] },
);
