import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { ModelosRepuesto } from "@/payload-types";

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

/**
 * Todos los modelos con marca y tipo poblados. Para generateStaticParams:
 * de aquí salen las tres partes del path de cada ficha.
 */
export const getModelos = cache(async (): Promise<ModelosRepuesto[]> => {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "modelos-repuesto",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });

  return docs;
});

/** Modelos de un tipo concreto. */
export const getModelosDeTipo = cache(async (tipoId: number): Promise<ModelosRepuesto[]> => {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "modelos-repuesto",
    where: { tipo: { equals: tipoId } },
    depth: 1,
    limit: 0,
    sort: "nombre",
  });

  return docs;
});

/**
 * Un modelo por su slug DENTRO de un tipo (unicidad compuesta tipo + slug).
 * `depth: 2` para traer las imágenes y la marca del tipo pobladas.
 */
export const getModeloPorSlug = cache(
  async (tipoId: number, modeloSlug: string): Promise<ModelosRepuesto | null> => {
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
  },
);
