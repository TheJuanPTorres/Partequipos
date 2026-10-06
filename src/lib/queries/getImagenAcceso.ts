import { getPayload } from "payload";
import { cache } from "react";

import config from "@payload-config";

import { esImagenAcceso, PREFIJO_IMAGEN_ACCESO } from "../panel/acceso";

export type ImagenAcceso = { url: string; width: number; height: number };

/**
 * Imagen del panel visual de la pantalla de acceso: el registro de `Media` más
 * reciente cuyo fichero se llama `acceso-panel` (con el sufijo aleatorio que
 * añade el almacén, `esImagenAcceso`). No hay campo en ningún global para
 * elegirla (sin esquema): se sube con ese nombre y basta.
 *
 * Si no existe, o falla la consulta, devuelve `null` y la pantalla pinta un
 * degradado: el acceso al panel nunca puede depender de una imagen.
 */
export const getImagenAcceso = cache(async (): Promise<ImagenAcceso | null> => {
  try {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "media",
      where: { filename: { contains: PREFIJO_IMAGEN_ACCESO } },
      sort: "-createdAt",
      limit: 20,
      depth: 0,
      overrideAccess: true,
      select: { filename: true, url: true, width: true, height: true },
    });
    const media = docs.find((d) => esImagenAcceso(d.filename));
    if (!media?.url || !media.width || !media.height) return null;
    return { url: media.url, width: media.width, height: media.height };
  } catch (error) {
    console.error("[acceso] no se pudo leer la imagen del panel de acceso:", error);
    return null;
  }
});
