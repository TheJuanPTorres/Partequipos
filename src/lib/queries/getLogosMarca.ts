import { cache } from "react";
import { unstable_cache } from "next/cache";
import config from "@payload-config";
import { getPayload } from "payload";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "@/lib/cacheDatos";
import { claveDeMarca, logoPropio, type IndiceLogos, type LogoMarca } from "@/lib/marca/logoMarca";

/**
 * Los logos de las marcas de REPUESTOS, la fuente única del logo de cualquier
 * marca (`src/lib/marca/logoMarca.ts`). Una consulta ligera —nombre, logo y la
 * casilla de tinta oscura; de la imagen, solo url y medidas— en la caché del
 * MARCO (`datos:marco`): la invalidan los ganchos de `marcas`, como al megamenú,
 * que pinta estos mismos logos.
 */
const logosEnCache = unstable_cache(
  async (): Promise<[string, LogoMarca][]> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "marcas",
      depth: 1,
      limit: 0,
      pagination: false,
      sort: "nombre",
      select: { nombre: true, logo: true, logoOscuroEnMenu: true },
      // `filename` hace falta: la `url` la calcula un gancho de lectura a partir de él.
      populate: { media: { url: true, filename: true, width: true, height: true } },
    });
    return docs.flatMap((m) => {
      const logo = logoPropio(m);
      const clave = claveDeMarca(m.nombre);
      return logo && clave ? [[clave, logo] as [string, LogoMarca]] : [];
    });
  },
  ["logos-marca", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.marco] },
);

/** El índice de logos por el nombre normalizado de la marca. */
export const getLogosMarca = cache(async (): Promise<IndiceLogos> => new Map(await logosEnCache()));
