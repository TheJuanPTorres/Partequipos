import config from "@payload-config";
import { getPayload } from "payload";

import type { TiposEquipo } from "@/payload-types";

/** Todos los tipos de equipo, con su marca poblada. Para generateStaticParams. */
export async function getTipos(): Promise<TiposEquipo[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "tipos-equipo",
    depth: 1,
    limit: 0, // sin límite: el catálogo completo
    sort: "nombre",
  });

  return docs;
}

/** Tipos de una marca concreta, buscados por el id de la marca. */
export async function getTiposDeMarca(marcaId: number): Promise<TiposEquipo[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "tipos-equipo",
    where: { marca: { equals: marcaId } },
    depth: 0,
    limit: 0,
    sort: "nombre",
  });

  return docs;
}

/**
 * Un tipo por su slug DENTRO de una marca. La unicidad del slug de tipo es
 * compuesta (marca + slug), así que ambos son necesarios: buscar solo por slug
 * devolvería el tipo de otra marca.
 */
export async function getTipoPorSlug(
  marcaId: number,
  tipoSlug: string,
): Promise<TiposEquipo | null> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "tipos-equipo",
    where: {
      and: [{ marca: { equals: marcaId } }, { slug: { equals: tipoSlug } }],
    },
    depth: 1,
    limit: 1,
  });

  return docs[0] ?? null;
}
