import type { BasePayload, CollectionSlug, DataFromCollectionSlug, Where } from "payload";

/**
 * Búsqueda de lo que sembró un script por su MARCA («PRUEBA FASE F —»…), para
 * que cada script encuentre SOLO lo suyo.
 *
 * POR QUÉ EXISTE (2026-10-03). Los scripts buscaban con `like`, y en Payload
 * `like` parte el texto en palabras y exige cada una por separado: «PRUEBA
 * FASE F —» casaba con las marcas de TODAS las fases (la «F» está dentro de
 * «FASE»). Con un `limit` pequeño, el resultado se cortaba antes del filtro y
 * la retirada de la fase F dejó su póster huérfano en el preview. Y la de la
 * fase H borraba testimonios sin filtrar por prefijo.
 *
 * Aquí: `contains` (la marca entera como subcadena), SIN paginación (no se
 * corta nada) y, además, prefijo exacto. La prueba estática de
 * `porMarca.test.ts` impide volver a buscar por marca a mano en los scripts.
 */
export function deLaMarca<T>(docs: T[], valor: (d: T) => unknown, marca: string): T[] {
  if (!marca.trim()) throw new Error("marca vacía: casaría con todo");
  return docs.filter((d) => {
    const v = valor(d);
    return typeof v === "string" && v.startsWith(marca);
  });
}

export async function buscarPorMarca<S extends CollectionSlug>(
  payload: Pick<BasePayload, "find">,
  collection: S,
  campo: string,
  marca: string,
): Promise<DataFromCollectionSlug<S>[]> {
  if (!marca.trim()) throw new Error("marca vacía: casaría con todo");
  const where: Where = { [campo]: { contains: marca } };
  const r = await payload.find({
    collection,
    where,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  return deLaMarca(
    r.docs as DataFromCollectionSlug<S>[],
    (d) => (d as unknown as Record<string, unknown>)[campo],
    marca,
  );
}
