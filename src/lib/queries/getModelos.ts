import config from "@payload-config";
import { getPayload } from "payload";

import type { ModelosRepuesto } from "@/payload-types";

/**
 * Todos los modelos con marca y tipo poblados. Para generateStaticParams:
 * de aquí salen las tres partes del path de cada ficha.
 */
export async function getModelos(): Promise<ModelosRepuesto[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "modelos-repuesto",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });

  return docs;
}

/** Modelos de un tipo concreto. */
export async function getModelosDeTipo(tipoId: number): Promise<ModelosRepuesto[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "modelos-repuesto",
    where: { tipo: { equals: tipoId } },
    depth: 1,
    limit: 0,
    sort: "nombre",
  });

  return docs;
}

/**
 * Un modelo por su slug DENTRO de un tipo (unicidad compuesta tipo + slug).
 * `depth: 2` para traer las imágenes y la marca del tipo pobladas.
 */
export async function getModeloPorSlug(
  tipoId: number,
  modeloSlug: string,
): Promise<ModelosRepuesto | null> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "modelos-repuesto",
    where: {
      and: [{ tipo: { equals: tipoId } }, { slug: { equals: modeloSlug } }],
    },
    depth: 2,
    limit: 1,
  });

  return docs[0] ?? null;
}
