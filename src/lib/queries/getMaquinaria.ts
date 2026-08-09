import config from "@payload-config";
import { getPayload } from "payload";

import type {
  CategoriasMaquinaria,
  CategoriasUsada,
  EquiposNuevo,
  EquiposUsado,
  MarcasMaquinaria,
  TiposMaquinaria,
} from "@/payload-types";

/**
 * Acceso a datos de la sección maquinaria (API local de Payload, CLAUDE.md §3.2).
 * Separado de las consultas de repuestos porque son colecciones distintas
 * (ADR 0007).
 */

// --- Marcas -----------------------------------------------------------------
export async function getMarcasMaquinaria(): Promise<MarcasMaquinaria[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "marcas-maquinaria",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
}

export async function getMarcaMaquinariaPorSlug(slug: string): Promise<MarcasMaquinaria | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "marcas-maquinaria",
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  });
  return docs[0] ?? null;
}

// --- Tipos ------------------------------------------------------------------
export async function getTiposMaquinaria(): Promise<TiposMaquinaria[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "tipos-maquinaria",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
}

export async function getTiposDeMarcaMaquinaria(marcaId: number): Promise<TiposMaquinaria[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "tipos-maquinaria",
    where: { marca: { equals: marcaId } },
    depth: 0,
    limit: 0,
    sort: "nombre",
  });
  return docs;
}

/**
 * Un tipo por slug DENTRO de una marca. La unicidad es compuesta (marca+slug),
 * así que buscar solo por slug devolvería el tipo de otra marca.
 */
export async function getTipoMaquinariaPorSlug(
  marcaId: number,
  slug: string,
): Promise<TiposMaquinaria | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "tipos-maquinaria",
    where: { and: [{ marca: { equals: marcaId } }, { slug: { equals: slug } }] },
    depth: 1,
    limit: 1,
  });
  return docs[0] ?? null;
}

// --- Equipos nuevos ---------------------------------------------------------
export async function getEquiposNuevos(): Promise<EquiposNuevo[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "equipos-nuevos",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
}

export async function getEquiposDeTipo(tipoId: number): Promise<EquiposNuevo[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "equipos-nuevos",
    where: { tipo: { equals: tipoId } },
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
}

/** Un equipo por slug DENTRO de un tipo. `depth: 2` puebla galería y marca. */
export async function getEquipoNuevoPorSlug(
  tipoId: number,
  slug: string,
): Promise<EquiposNuevo | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "equipos-nuevos",
    where: { and: [{ tipo: { equals: tipoId } }, { slug: { equals: slug } }] },
    depth: 2,
    limit: 1,
  });
  return docs[0] ?? null;
}

/** Equipos de varios tipos a la vez: alimenta las categorías transversales. */
export async function getEquiposDeTipos(tipoIds: number[]): Promise<EquiposNuevo[]> {
  if (tipoIds.length === 0) return [];
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "equipos-nuevos",
    where: { tipo: { in: tipoIds } },
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
}

// --- Categorías de la línea nueva -------------------------------------------
export async function getCategoriasMaquinaria(): Promise<CategoriasMaquinaria[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-maquinaria",
    depth: 1,
    limit: 0,
    sort: "nombre",
  });
  return docs;
}

export async function getCategoriaMaquinariaPorSlug(
  slug: string,
): Promise<CategoriasMaquinaria | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-maquinaria",
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  });
  return docs[0] ?? null;
}

// --- Línea usada ------------------------------------------------------------
export async function getCategoriasUsada(): Promise<CategoriasUsada[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-usada",
    depth: 0,
    limit: 0,
    sort: "nombre",
  });
  return docs;
}

export async function getCategoriaUsadaPorSlug(slug: string): Promise<CategoriasUsada | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categorias-usada",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  });
  return docs[0] ?? null;
}

/** Unidades DISPONIBLES de una categoría. Las vendidas no se listan. */
export async function getEquiposUsadosDeCategoria(categoriaId: number): Promise<EquiposUsado[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "equipos-usados",
    where: {
      and: [{ categoria: { equals: categoriaId } }, { disponible: { equals: true } }],
    },
    depth: 1,
    limit: 0,
    sort: "-anio",
  });
  return docs;
}
