import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";

import { revalidarRutas, rutasDeMarcaLubricante } from "@/lib/revalidation";
import { poblado } from "@/lib/utils/relations";

/**
 * Hooks de revalidación de lubricantes (ISR).
 *
 * Desde el 2026-10-14 las categorías son secciones de la página de su marca:
 * cualquier cambio de marca o de categoría caduca solo esa página.
 *
 * Como en el resto del proyecto, nada de esto puede romper un guardado: todo va
 * en try/catch y no se relanza nunca.
 */

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

function revalidarMarcaCore(doc: { id: number; slug: string }) {
  try {
    revalidarRutas(rutasDeMarcaLubricante(doc.slug), `marca lubricante ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de MarcaLubricante falló:", error);
  }
  return doc;
}

export const revalidarMarcaLubricante: CollectionAfterChangeHook = ({ doc }) =>
  revalidarMarcaCore(doc);

export const revalidarMarcaLubricanteBorrada: CollectionAfterDeleteHook = ({ doc }) =>
  revalidarMarcaCore(doc);

async function revalidarCategoriaCore(doc: { slug: string; marca: unknown }, req: PayloadRequest) {
  try {
    const marcaSlug = await slugDeMarca(req, doc.marca);
    if (!marcaSlug) return doc;

    revalidarRutas(rutasDeMarcaLubricante(marcaSlug), `categoría lubricante ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de CategoriaLubricante falló:", error);
  }
  return doc;
}

export const revalidarCategoriaLubricante: CollectionAfterChangeHook = ({ doc, req }) =>
  revalidarCategoriaCore(doc, req);

export const revalidarCategoriaLubricanteBorrada: CollectionAfterDeleteHook = ({ doc, req }) =>
  revalidarCategoriaCore(doc, req);
