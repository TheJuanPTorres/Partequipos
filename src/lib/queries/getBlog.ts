import config from "@payload-config";
import { getPayload } from "payload";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "@/lib/cacheDatos";
import { extracto, minutosDeLectura, normalizar, type ArticuloLista } from "@/lib/blog/indice";
import { textoPlanoLexical } from "@/lib/maquinaria/reservaTexto";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
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

/** Un artículo como lo pinta una tarjeta del índice (y del bloque «relacionados»). */
export function aArticuloLista(a: Articulo): ArticuloLista {
  const categoria = poblado<CategoriasBlog>(a.categoria);
  const cuerpo = textoPlanoLexical(a.contenido);
  const entradilla = a.entradilla?.trim() ?? "";
  return {
    id: a.id,
    slug: a.slug,
    titulo: a.titulo,
    fecha: a.fechaPublicacion,
    extracto: extracto(entradilla || cuerpo, 100),
    imagen: imagenDeMedia(a.imagenDestacada, a.titulo),
    categoria: categoria ? { slug: categoria.slug, nombre: categoria.nombre } : null,
    // Título, entradilla, categoría y el principio del cuerpo: lo que busca el campo «Buscar…».
    indice: normalizar(
      [a.titulo, entradilla, categoria?.nombre ?? "", cuerpo.slice(0, 3000)].join(" "),
    ),
    minutos: minutosDeLectura(cuerpo),
  };
}

async function leerIndiceBlog(): Promise<{
  articulos: ArticuloLista[];
  categorias: { slug: string; nombre: string }[];
}> {
  const [articulos, categorias] = await Promise.all([getArticulos(), getCategoriasBlog()]);
  return {
    articulos: articulos.map(aArticuloLista),
    categorias: categorias.map((c) => ({ slug: c.slug, nombre: c.nombre })),
  };
}

/**
 * Los artículos del índice y las categorías, en la caché de datos con la
 * etiqueta `datos:blog`: el índice se pinta en cada petición (lee la query de
 * la URL) y no debe consultar la base cada vez.
 */
export const getIndiceBlog = unstable_cache(leerIndiceBlog, ["blog-indice", CLAVE_DESPLIEGUE], {
  tags: [ETIQUETAS_DATOS.blog],
});
