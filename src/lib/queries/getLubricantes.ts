import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

import type { CategoriasLubricante, MarcasLubricante } from "@/payload-types";

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
 * Acceso a datos de lubricantes (API local de Payload, CLAUDE.md §3.2).
 *
 * Jerarquía de dos niveles: marca -> categoría de aplicación. No hay fichas de
 * producto porque el sitio actual no publica ninguna.
 */

export const getMarcasLubricante = cache(async (): Promise<MarcasLubricante[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "marcas-lubricante",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

export const getMarcaLubricantePorSlug = cache(
  async (slug: string): Promise<MarcasLubricante | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "marcas-lubricante",
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);

export const getCategoriasLubricante = cache(async (): Promise<CategoriasLubricante[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-lubricante",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

export const getCategoriasDeMarcaLubricante = cache(
  async (marcaId: number): Promise<CategoriasLubricante[]> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-lubricante",
      where: { marca: { equals: marcaId } },
      depth: 1,
      limit: 0,
      sort: "nombre",
    });
    return docs;
  },
);

/**
 * Una categoría por slug DENTRO de una marca. La unicidad es compuesta
 * (marca + slug), así que buscar solo por slug devolvería la de otra marca.
 */
export const getCategoriaLubricantePorSlug = cache(
  async (marcaId: number, slug: string): Promise<CategoriasLubricante | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-lubricante",
      where: { and: [{ marca: { equals: marcaId } }, { slug: { equals: slug } }] },
      depth: 2,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);
