import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";

import {
  revalidarRutas,
  rutasDeCategoriaLubricante,
  rutasDeMarcaLubricante,
} from "@/lib/revalidation";
import { poblado } from "@/lib/utils/relations";

/**
 * Hooks de revalidación de lubricantes (ISR).
 *
 * Grafo de dependencias, de dos niveles:
 *   marca      -> su página + la de todas sus categorías (el listado cambia)
 *   categoría  -> su página + la de su marca (que la lista)
 *
 * Como en el resto del proyecto, nada de esto puede romper un guardado: todo va
 * en try/catch y no se relanza nunca.
 */

async function categoriasDeMarca(req: PayloadRequest, marcaId: number): Promise<string[]> {
  const { docs } = await req.payload.find({
    collection: "categorias-lubricante",
    where: { marca: { equals: marcaId } },
    depth: 0,
    limit: 0,
  });
  return docs.map((d) => d.slug);
}

async function slugDeMarca(req: PayloadRequest, rel: unknown): Promise<string | null> {
  const doc = poblado<{ id: number; slug: string }>(rel as number | { id: number; slug: string });
  if (doc?.slug) return doc.slug;
  if (typeof rel !== "number") return null;

  const encontrado = await req.payload.findByID({
    collection: "marcas-lubricante",
    id: rel,
    depth: 0,
    disableErrors: true,
  });
  return encontrado?.slug ?? null;
}

async function revalidarMarcaCore(doc: { id: number; slug: string }, req: PayloadRequest) {
  try {
    const categorias = await categoriasDeMarca(req, doc.id).catch(() => []);
    revalidarRutas(rutasDeMarcaLubricante(doc.slug, categorias), `marca lubricante ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de MarcaLubricante falló:", error);
  }
  return doc;
}

export const revalidarMarcaLubricante: CollectionAfterChangeHook = ({ doc, req }) =>
  revalidarMarcaCore(doc, req);

export const revalidarMarcaLubricanteBorrada: CollectionAfterDeleteHook = ({ doc, req }) =>
  revalidarMarcaCore(doc, req);

async function revalidarCategoriaCore(doc: { slug: string; marca: unknown }, req: PayloadRequest) {
  try {
    const marcaSlug = await slugDeMarca(req, doc.marca);
    if (!marcaSlug) return doc;

    revalidarRutas(
      rutasDeCategoriaLubricante(marcaSlug, doc.slug),
      `categoría lubricante ${doc.slug}`,
    );
  } catch (error) {
    console.error("[revalidación] hook de CategoriaLubricante falló:", error);
  }
  return doc;
}

export const revalidarCategoriaLubricante: CollectionAfterChangeHook = ({ doc, req }) =>
  revalidarCategoriaCore(doc, req);

export const revalidarCategoriaLubricanteBorrada: CollectionAfterDeleteHook = ({ doc, req }) =>
  revalidarCategoriaCore(doc, req);
