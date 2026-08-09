import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { TiposEquipo } from "@/payload-types";

/*
 * Las consultas de este módulo van envueltas en `cache()` de React.
 *
 * Sin ello cada página resolvía DOS VECES la misma cadena: una en
 * `generateMetadata` y otra en el componente, que no comparten resultado por
 * sí solos. `cache()` memoiza por petición y elimina esa duplicación. El coste
 * medido está en CLAUDE.md §10.10.
 *
 * Transparente para quien llama: las firmas no cambian. No memoiza cuando el
 * argumento es un array (identidad distinta en cada llamada); no empeora nada
 * respecto de antes, simplemente no ayuda ahí.
 */

/** Todos los tipos de equipo, con su marca poblada. Para generateStaticParams. */
export const getTipos = cache(async (): Promise<TiposEquipo[]> => {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "tipos-equipo",
    depth: 1,
    limit: 0, // sin límite: el catálogo completo
    sort: "nombre",
  });

  return docs;
});

/** Tipos de una marca concreta, buscados por el id de la marca. */
export const getTiposDeMarca = cache(async (marcaId: number): Promise<TiposEquipo[]> => {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "tipos-equipo",
    where: { marca: { equals: marcaId } },
    depth: 0,
    limit: 0,
    sort: "nombre",
  });

  return docs;
});

/**
 * Un tipo por su slug DENTRO de una marca. La unicidad del slug de tipo es
 * compuesta (marca + slug), así que ambos son necesarios: buscar solo por slug
 * devolvería el tipo de otra marca.
 */
export const getTipoPorSlug = cache(
  async (marcaId: number, tipoSlug: string): Promise<TiposEquipo | null> => {
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
  },
);
