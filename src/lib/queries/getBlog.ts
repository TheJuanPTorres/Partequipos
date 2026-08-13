import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

import type { Articulo, CategoriasBlog } from "@/payload-types";

/*
 * Las consultas de este módulo van envueltas en `cache()` de React.
 *
 * Sin ello cada página resolvía DOS VECES la misma cadena: una en
 * `generateMetadata` y otra en el componente, que no comparten resultado por
 * sí solos. `cache()` memoiza por petición y elimina esa duplicación. El coste
 * medido está en CLAUDE.md §10.10.
 *
 * Transparente para quien llama: las firmas no cambian.
 */

/** Artículos, del más reciente al más antiguo. */
export const getArticulos = cache(async (): Promise<Articulo[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "articulos",
    depth: 1,
    limit: 0,
    sort: "-fechaPublicacion",
  });
  return docs;
});

/**
 * Un artículo por slug.
 *
 * `disableErrors` no aplica: se usa `find`, que devuelve lista vacía en vez de
 * lanzar. Devolver `null` deja que la ruta decida (404 o seguir buscando).
 */
export const getArticuloPorSlug = cache(async (slug: string): Promise<Articulo | null> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "articulos",
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  });
  return docs[0] ?? null;
});

export const getCategoriasBlog = cache(async (): Promise<CategoriasBlog[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-blog",
    depth: 0,
    limit: 0,
    sort: "nombre",
  });
  return docs;
});

export const getCategoriaBlogPorSlug = cache(
  async (slug: string): Promise<CategoriasBlog | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-blog",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
    });
    return docs[0] ?? null;
  },
);

export const getArticulosDeCategoria = cache(async (categoriaId: number): Promise<Articulo[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "articulos",
    where: { categoria: { equals: categoriaId } },
    depth: 1,
    limit: 0,
    sort: "-fechaPublicacion",
  });
  return docs;
});
