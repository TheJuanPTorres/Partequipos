import { compararNumeros } from "../filtros/aplicar";
import type { Catalogo, Faceta, Tramo } from "../filtros/tipos";
import { formatSlug } from "../utils/formatSlug";

/**
 * ADAPTADOR de la maquinaria USADA al módulo común de filtros
 * (`src/lib/filtros/`). Es el ejemplo para el de maquinaria nueva: declara
 * las facetas y cómo se lee cada una en una unidad.
 *
 * Las facetas son las del listado de WordPress y de ux-9 («Categoría
 * secundaria»): marca, año, horas y toneladas. Los tramos salen del
 * inventario del preview (2026-10-13, 143 unidades disponibles): ninguno queda
 * vacío salvo el de 40 t o más, que tiene una.
 */

/** Lo que necesitan los filtros de una unidad. */
export type UnidadFiltrable = {
  id: number;
  /** La marca de usada (relación), si la tiene. Gana al texto. */
  marcaRef?: { slug: string; nombre: string } | null;
  /** La categoría, para filtrar por ella en las páginas de marca. */
  categoriaRef?: { slug: string; nombre: string } | null;
  marca?: string | null;
  anio?: number | null;
  horometro?: number | null;
  pesoOperativo?: number | null;
};

/**
 * La marca como opción a partir del TEXTO: el valor es su slug, así «LiuGong»
 * y «Liugong» caen en la misma opción. Es el respaldo de las unidades sin la
 * relación con su marca (paso b): el slug coincide con el de la marca que
 * crearía el gancho `marcaUsadaSincronizada`.
 */
export function marcaDeUnidad(marca: string | null | undefined) {
  const etiqueta = marca?.trim();
  if (!etiqueta) return null;
  const valor = formatSlug(etiqueta);
  return valor ? { valor, etiqueta } : null;
}

export const TRAMOS_HORAS: readonly Tramo[] = [
  { valor: "0-2000", etiqueta: "Menos de 2.000 h", hasta: 2000 },
  { valor: "2000-4000", etiqueta: "De 2.000 a 4.000 h", desde: 2000, hasta: 4000 },
  { valor: "4000-6000", etiqueta: "De 4.000 a 6.000 h", desde: 4000, hasta: 6000 },
  { valor: "6000-8000", etiqueta: "De 6.000 a 8.000 h", desde: 6000, hasta: 8000 },
  { valor: "8000-mas", etiqueta: "8.000 h o más", desde: 8000 },
];

export const TRAMOS_PESO: readonly Tramo[] = [
  { valor: "0-6", etiqueta: "Menos de 6 t", hasta: 6 },
  { valor: "6-10", etiqueta: "De 6 a 10 t", desde: 6, hasta: 10 },
  { valor: "10-20", etiqueta: "De 10 a 20 t", desde: 10, hasta: 20 },
  { valor: "20-30", etiqueta: "De 20 a 30 t", desde: 20, hasta: 30 },
  { valor: "30-40", etiqueta: "De 30 a 40 t", desde: 30, hasta: 40 },
  { valor: "40-mas", etiqueta: "40 t o más", desde: 40 },
];

const porId = (a: UnidadFiltrable, b: UnidadFiltrable) => a.id - b.id;

/** La marca de una unidad: la de la relación o, sin ella, la del texto. */
export function opcionDeMarca(u: UnidadFiltrable) {
  return u.marcaRef
    ? { valor: u.marcaRef.slug, etiqueta: u.marcaRef.nombre }
    : marcaDeUnidad(u.marca);
}

const FACETA_MARCA: Faceta<UnidadFiltrable> = {
  tipo: "lista",
  clave: "marca",
  etiqueta: "Marca",
  de: opcionDeMarca,
};

const FACETA_CATEGORIA: Faceta<UnidadFiltrable> = {
  tipo: "lista",
  clave: "categoria",
  etiqueta: "Tipo de máquina",
  de: (u) =>
    u.categoriaRef ? { valor: u.categoriaRef.slug, etiqueta: u.categoriaRef.nombre } : null,
};

const FACETAS_COMUNES: Faceta<UnidadFiltrable>[] = [
  {
    tipo: "lista",
    clave: "anio",
    etiqueta: "Año",
    ordenOpciones: "valor-desc",
    de: (u) =>
      typeof u.anio === "number" && Number.isInteger(u.anio)
        ? { valor: String(u.anio), etiqueta: String(u.anio) }
        : null,
  },
  {
    tipo: "tramos",
    clave: "horas",
    etiqueta: "Horas de uso",
    tramos: TRAMOS_HORAS,
    de: (u) => u.horometro ?? null,
  },
  {
    tipo: "tramos",
    clave: "peso",
    etiqueta: "Peso operativo",
    tramos: TRAMOS_PESO,
    de: (u) => u.pesoOperativo ?? null,
  },
];

// El primero es el de siempre del listado (año descendente, el id desempata).
const ORDENES: Catalogo<UnidadFiltrable>["ordenes"] = [
  {
    valor: "recientes",
    etiqueta: "Más recientes",
    comparar: (a, b) => compararNumeros(a.anio, b.anio, "desc") || porId(a, b),
  },
  {
    valor: "menos-horas",
    etiqueta: "Menos horas de uso",
    comparar: (a, b) => compararNumeros(a.horometro, b.horometro, "asc") || porId(a, b),
  },
  {
    valor: "menor-peso",
    etiqueta: "Menor peso",
    comparar: (a, b) => compararNumeros(a.pesoOperativo, b.pesoOperativo, "asc") || porId(a, b),
  },
  {
    valor: "mayor-peso",
    etiqueta: "Mayor peso",
    comparar: (a, b) => compararNumeros(a.pesoOperativo, b.pesoOperativo, "desc") || porId(a, b),
  },
];

/** Listados de una CATEGORÍA de usada: se filtra por marca. */
export const CATALOGO_USADOS: Catalogo<UnidadFiltrable> = {
  facetas: [FACETA_MARCA, ...FACETAS_COMUNES],
  ordenes: ORDENES,
};

/** Listados de una MARCA de usada: se filtra por tipo de máquina (la categoría). */
export const CATALOGO_USADOS_MARCA: Catalogo<UnidadFiltrable> = {
  facetas: [FACETA_CATEGORIA, ...FACETAS_COMUNES],
  ordenes: ORDENES,
};
