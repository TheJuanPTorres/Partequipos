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
 * Una página por marca, con una tarjeta por línea, y una página por línea con
 * sus productos (desde el 2026-10-22; antes, secciones de la de la marca).
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

/** Las líneas de una marca, en el orden del panel («Orden») y, sin orden, por nombre. */
export const getCategoriasDeMarcaLubricante = cache(
  async (marcaId: number): Promise<CategoriasLubricante[]> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-lubricante",
      where: { marca: { equals: marcaId } },
      depth: 1,
      limit: 0,
      sort: ["orden", "nombre"],
    });
    return docs;
  },
);

/**
 * Una línea con sus productos, para su página (desde el 2026-10-22). `depth: 2`
 * para las «Páginas como imágenes» de cada ficha técnica (el visor).
 */
export const getCategoriaLubricante = cache(
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

/** Todas las líneas con el slug de su marca: las rutas estáticas y el sitemap. */
export const getCategoriasLubricante = cache(
  async (): Promise<{ slug: string; marcaSlug: string; updatedAt: string }[]> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "categorias-lubricante",
      depth: 1,
      limit: 0,
      pagination: false,
      select: { slug: true, marca: true, updatedAt: true },
    });
    return docs.flatMap((c) =>
      typeof c.marca === "object" && c.marca?.slug
        ? [{ slug: c.slug, marcaSlug: c.marca.slug, updatedAt: c.updatedAt }]
        : [],
    );
  },
);
