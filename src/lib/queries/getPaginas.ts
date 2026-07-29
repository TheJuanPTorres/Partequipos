import config from "@payload-config";
import { getPayload } from "payload";

import type { Pagina } from "@/payload-types";

/** Slug reservado para la portada: no cuelga de una ruta propia. */
export const SLUG_PORTADA = "inicio";

/** Todas las páginas institucionales. Para generateStaticParams. */
export async function getPaginas(): Promise<Pagina[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "paginas",
    depth: 1,
    limit: 0,
    sort: "titulo",
  });

  return docs;
}

/** Una página por su slug (ruta completa, sin barras). */
export async function getPaginaPorSlug(slug: string): Promise<Pagina | null> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "paginas",
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  });

  return docs[0] ?? null;
}
