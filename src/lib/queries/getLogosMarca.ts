import { cache } from "react";
import { unstable_cache } from "next/cache";
import config from "@payload-config";
import { getPayload } from "payload";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "@/lib/cacheDatos";
import type { MarcaDeRepuestos } from "@/lib/portada/kitCliente";
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

/**
 * Las marcas de repuestos con logo para la sección «Marcas de repuestos» de la portada: nombre,
 * dirección y el logo con la regla común. Misma caché del marco que los logos de arriba (la
 * invalidan los ganchos de `marcas`). En orden alfabético; la portada elige y ordena con «Marcas de la banda» (`marcasBanda.ts`).
 */
const marcasEnCache = unstable_cache(
  async (): Promise<MarcaDeRepuestos[]> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "marcas",
      depth: 1,
      limit: 0,
      pagination: false,
      sort: "nombre",
      select: { nombre: true, slug: true, logo: true, logoOscuroEnMenu: true },
      populate: { media: { url: true, filename: true, width: true, height: true } },
    });
    return docs.flatMap((m) => {
      const logo = logoPropio(m);
      return logo && m.slug ? [{ id: m.id, nombre: m.nombre, slug: m.slug, logo }] : [];
    });
  },
  ["marcas-repuestos-portada", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.marco] },
);

export const getMarcasRepuestosDePortada = cache(async (): Promise<MarcaDeRepuestos[]> =>
  marcasEnCache(),
);
