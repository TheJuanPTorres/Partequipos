import config from "@payload-config";
import { getPayload } from "payload";

import type { Marca } from "@/payload-types";

/**
 * Devuelve todas las marcas usando la API LOCAL de Payload (no HTTP).
 * Se ejecuta en el servidor (Server Components / build). `depth: 1` puebla
 * la relación `logo` con el documento de Media.
 */
export async function getMarcas(): Promise<Marca[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "marcas",
    depth: 1,
    limit: 100,
    sort: "nombre",
  });

  return docs;
}
