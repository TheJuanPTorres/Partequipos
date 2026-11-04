import { cache } from "react";
import { unstable_cache } from "next/cache";
import config from "@payload-config";
import { getPayload } from "payload";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "@/lib/cacheDatos";
import { claveDeMarca, logoPropio } from "@/lib/marca/logoMarca";
import type { BaldosaDeRepuestos } from "@/lib/nueva/indiceMarcas";

/**
 * La BALDOSA de cada marca de REPUESTOS (#417): su «Color de la baldosa» y su «Logo para la
 * baldosa», por el nombre normalizado. Las marcas de maquinaria nueva con el mismo nombre las
 * usan (regla «una marca, un solo logo», dirección 2026-11-04). Misma caché del marco que los
 * logos: la invalidan los ganchos de `marcas`.
 */
const baldosasEnCache = unstable_cache(
  async (): Promise<[string, BaldosaDeRepuestos][]> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "marcas",
      depth: 1,
      limit: 0,
      pagination: false,
      sort: "nombre",
      select: { nombre: true, colorBaldosa: true, logoBaldosa: true },
      populate: { media: { url: true, filename: true, width: true, height: true } },
    });
    return docs.flatMap((m) => {
      const logo = logoPropio({ logo: m.logoBaldosa });
      const color = m.colorBaldosa?.trim();
      const clave = claveDeMarca(m.nombre);
      return logo && color && clave
        ? [[clave, { color, logo }] as [string, BaldosaDeRepuestos]]
        : [];
    });
  },
  ["baldosas-marca", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.marco] },
);

export const getBaldosasMarca = cache(
  async (): Promise<ReadonlyMap<string, BaldosaDeRepuestos>> => new Map(await baldosasEnCache()),
);
