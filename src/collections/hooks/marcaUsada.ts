import type { CollectionBeforeChangeHook } from "payload";

import { formatSlug } from "../../lib/utils/formatSlug";

/**
 * MARCA DE UNA UNIDAD USADA: la relación y el texto, sincronizados
 * (paso b del marketplace, 2026-10-13).
 *
 * La marca era texto libre; ahora es una relación con `marcas-usada`, y cada
 * marca tiene su página. El texto se conserva hasta que se retire (con su
 * migración) porque lo escribe el importador de WordPress y lo usa el buscador
 * del panel. Este gancho mantiene los dos de acuerdo:
 *
 * - **Con relación:** el texto pasa a ser el nombre de esa marca.
 * - **Sin relación y con texto:** se busca la marca por su slug y, si no
 *   existe, SE CREA. Así una importación (o un editor que solo escribe el
 *   texto) no deja unidades fuera de su marca. Una marca nueva sin unidades
 *   disponibles no se indexa (D4), así que crearla no publica nada vacío.
 */

/** Lo que hay que hacer con la marca, decidido sin tocar la base. */
export type DecisionMarca =
  | { tipo: "nada" }
  /** Hay relación: el texto se iguala a su nombre (si se conoce). */
  | { tipo: "texto-desde-relacion"; id: number }
  /** No hay relación pero sí texto: buscar o crear la marca con este slug. */
  | { tipo: "relacion-desde-texto"; slug: string; nombre: string };

const idDe = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "id" in v && typeof (v as { id: unknown }).id === "number") {
    return (v as { id: number }).id;
  }
  return null;
};

export function decidirMarca(data: { marca?: unknown; marcaUsada?: unknown }): DecisionMarca {
  const id = idDe(data.marcaUsada);
  if (id !== null) return { tipo: "texto-desde-relacion", id };
  const nombre = typeof data.marca === "string" ? data.marca.trim().replace(/\s+/g, " ") : "";
  const slug = formatSlug(nombre);
  return nombre && slug ? { tipo: "relacion-desde-texto", slug, nombre } : { tipo: "nada" };
}

export const marcaUsadaSincronizada: CollectionBeforeChangeHook = async ({ data, req }) => {
  const decision = decidirMarca(data);
  if (decision.tipo === "nada") return data;

  if (decision.tipo === "texto-desde-relacion") {
    const marca = await req.payload.findByID({
      collection: "marcas-usada",
      id: decision.id,
      depth: 0,
      disableErrors: true,
      req,
    });
    return marca ? { ...data, marca: marca.nombre } : data;
  }

  const { docs } = await req.payload.find({
    collection: "marcas-usada",
    where: { slug: { equals: decision.slug } },
    depth: 0,
    limit: 1,
    req,
  });
  const marca =
    docs[0] ??
    (await req.payload.create({
      collection: "marcas-usada",
      data: { nombre: decision.nombre, slug: decision.slug },
      req,
    }));
  return { ...data, marcaUsada: marca.id, marca: marca.nombre };
};
