import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";

import { revalidarRutas, rutasDeArticulo, rutasDeCategoriaBlog } from "@/lib/revalidation";
import { poblado } from "@/lib/utils/relations";

/**
 * Hooks de revalidación del blog (ISR).
 *
 * Grafo de dependencias:
 *   artículo   -> su página + el índice + el archivo de su categoría
 *                 (los dos lo listan, así que cambian cuando cambia él)
 *   categoría  -> su archivo + el índice + la página de cada artículo suyo
 *                 (que muestra el nombre de la categoría en las migas)
 *
 * Como en el resto del proyecto: nada de esto puede romper un guardado.
 */

async function slugDeCategoria(req: PayloadRequest, rel: unknown): Promise<string | null> {
  const doc = poblado<{ id: number; slug: string }>(rel as number | { id: number; slug: string });
  if (doc?.slug) return doc.slug;
  if (typeof rel !== "number") return null;

  const encontrado = await req.payload.findByID({
    collection: "categorias-blog",
    id: rel,
    depth: 0,
    disableErrors: true,
  });
  return encontrado?.slug ?? null;
}

async function revalidarArticuloCore(
  doc: { slug: string; categoria: unknown },
  req: PayloadRequest,
) {
  try {
    const categoriaSlug = await slugDeCategoria(req, doc.categoria);
    revalidarRutas(rutasDeArticulo(doc.slug, categoriaSlug), `artículo ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de Articulo falló:", error);
  }
  return doc;
}

export const revalidarArticulo: CollectionAfterChangeHook = ({ doc, req }) =>
  revalidarArticuloCore(doc, req);

export const revalidarArticuloBorrado: CollectionAfterDeleteHook = ({ doc, req }) =>
  revalidarArticuloCore(doc, req);

async function revalidarCategoriaBlogCore(doc: { id: number; slug: string }, req: PayloadRequest) {
  try {
    const { docs } = await req.payload.find({
      collection: "articulos",
      where: { categoria: { equals: doc.id } },
      depth: 0,
      limit: 0,
    });
    revalidarRutas(
      rutasDeCategoriaBlog(
        doc.slug,
        docs.map((d) => d.slug),
      ),
      `categoría de blog ${doc.slug}`,
    );
  } catch (error) {
    console.error("[revalidación] hook de CategoriaBlog falló:", error);
  }
  return doc;
}

export const revalidarCategoriaBlog: CollectionAfterChangeHook = ({ doc, req }) =>
  revalidarCategoriaBlogCore(doc, req);

export const revalidarCategoriaBlogBorrada: CollectionAfterDeleteHook = ({ doc, req }) =>
  revalidarCategoriaBlogCore(doc, req);
