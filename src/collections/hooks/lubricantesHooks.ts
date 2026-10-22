import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";

import {
  revalidarMarcasDeLubricante,
  revalidarRutas,
  rutasDeMarcaLubricante,
} from "@/lib/revalidation";
import { poblado } from "@/lib/utils/relations";

/**
 * Hooks de revalidación de lubricantes (ISR).
 *
 * Cada línea (categoría) tiene su página desde el 2026-10-22 y una tarjeta en la de su
 * marca: un cambio de línea caduca las dos (y su URL vieja si cambia la dirección); un
 * cambio de marca, la suya y las de todas las líneas, que pintan su logo y su nombre.
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
    revalidarMarcasDeLubricante(`marca lubricante ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de MarcaLubricante falló:", error);
  }
  return doc;
}

export const revalidarMarcaLubricante: CollectionAfterChangeHook = ({ doc }) =>
  revalidarMarcaCore(doc);

export const revalidarMarcaLubricanteBorrada: CollectionAfterDeleteHook = ({ doc }) =>
  revalidarMarcaCore(doc);

async function revalidarCategoriaCore(
  doc: { slug: string; marca: unknown },
  req: PayloadRequest,
  anterior?: { slug?: string | null } | null,
) {
  try {
    const marcaSlug = await slugDeMarca(req, doc.marca);
    if (!marcaSlug) return doc;

    const slugs = [doc.slug, anterior?.slug].filter((s): s is string => Boolean(s));
    revalidarRutas(rutasDeMarcaLubricante(marcaSlug, slugs), `categoría lubricante ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de CategoriaLubricante falló:", error);
  }
  return doc;
}

export const revalidarCategoriaLubricante: CollectionAfterChangeHook = ({
  doc,
  req,
  previousDoc,
}) => revalidarCategoriaCore(doc, req, previousDoc);

export const revalidarCategoriaLubricanteBorrada: CollectionAfterDeleteHook = ({ doc, req }) =>
  revalidarCategoriaCore(doc, req);
