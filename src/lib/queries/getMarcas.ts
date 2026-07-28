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
    limit: 0, // sin límite: el catálogo completo
    sort: "nombre",
  });

  return docs;
}

/** Una marca por su slug (único a nivel global). */
export async function getMarcaPorSlug(slug: string): Promise<Marca | null> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "marcas",
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  });

  return docs[0] ?? null;
}
