import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { Media, ModelosRepuesto } from "@/payload-types";

import { conProductoVisible } from "../nueva/visibilidad";
import { conPrimeraImagen, idsDePrimeraImagen } from "../usados/primeraImagen";

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
    where: conProductoVisible(),
    depth: 1,
    limit: 0,
    sort: "nombre",
  });

  return docs;
});

/**
 * Los modelos de una marca, para los paneles «Ver todo» de su página: una sola consulta
 * para todos sus tipos, sin poblar nada y solo con lo que pinta la lista. Desde el 2026-10-25
 * el panel pinta la foto de cada modelo: se pide aparte SOLO la primera de cada uno (no todas,
 * como haría `depth: 1`), en una consulta más.
 */
export const getModelosDeMarca = cache(async (marcaId: number): Promise<ModelosRepuesto[]> => {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "modelos-repuesto",
    where: conProductoVisible({ marca: { equals: marcaId } }),
    depth: 0,
    limit: 0,
    sort: "nombre",
    select: { nombre: true, slug: true, codigo: true, serie: true, tipo: true, imagenes: true },
  });
  const modelos = docs as ModelosRepuesto[];
  const ids = idsDePrimeraImagen(modelos);
  if (ids.length === 0) return modelos;
  const { docs: fotos } = await payload.find({
    collection: "media",
    where: { id: { in: ids } },
    depth: 0,
    limit: 0,
    pagination: false,
    // Con `select`, la URL sale null si no se pide `filename` (Payload la calcula con él).
    select: {
      url: true,
      filename: true,
      alt: true,
      width: true,
      height: true,
      focalX: true,
      focalY: true,
    },
  });

  return conPrimeraImagen(modelos, fotos as Media[]);
});

/** Modelos de un tipo concreto. */
export const getModelosDeTipo = cache(async (tipoId: number): Promise<ModelosRepuesto[]> => {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "modelos-repuesto",
    where: conProductoVisible({ tipo: { equals: tipoId } }),
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
      // Trae también el oculto (producto-oculto-ok): la ficha lo redirige a su tipo.
      where: {
        and: [{ tipo: { equals: tipoId } }, { slug: { equals: modeloSlug } }],
      },
      depth: 2,
      limit: 1,
    });

    return docs[0] ?? null;
  },
);

/**
 * Modelos por id, con marca y tipo poblados (para construir su URL): las fichas
 * a las que enlazan las «otras entradas» de la lista de un tipo. Lista vacía,
 * sin consulta.
 */
export async function getModelosPorIds(ids: number[]): Promise<ModelosRepuesto[]> {
  if (ids.length === 0) return [];
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "modelos-repuesto",
    where: conProductoVisible({ id: { in: ids } }),
    depth: 1,
    limit: 0,
  });
  return docs;
}
