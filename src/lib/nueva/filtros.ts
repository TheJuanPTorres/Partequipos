import { compararNumeros } from "../filtros/aplicar";
import type { Catalogo, Faceta, Opcion } from "../filtros/tipos";
import { TRAMOS_PESO } from "../usados/filtros";

/**
 * ADAPTADOR de la maquinaria NUEVA al módulo común de filtros
 * (`src/lib/filtros/`, del agente C). Es lo único propio de la línea nueva: qué
 * facetas tiene y cómo se lee cada una en un equipo. El mecanismo (leer la
 * URL, contar, ordenar, paginar, SEO) es el del módulo.
 *
 * Facetas aprobadas por dirección (2026-10-14, plantilla «Categoría
 * secundaria» de ux-9): marca, peso operativo, tipo de equipo y modelo. Sin
 * «Año»: los equipos nuevos no lo tienen.
 */

/** Lo que necesitan los filtros de un equipo nuevo. */
export type EquipoFiltrable = {
  id: number;
  nombre: string;
  /** Código del fabricante («ZX75US-7»): la faceta «Modelo». */
  codigo?: string | null;
  marcaRef: { slug: string; nombre: string } | null;
  tipoRef: { slug: string; nombre: string } | null;
  /** Peso operativo en KILOGRAMOS (`pesoOperativoKg`, #136). */
  pesoKg?: number | null;
};

/**
 * El peso en TONELADAS, para los tramos: los mismos de usados
 * (`TRAMOS_PESO`), así los dos listados se leen igual.
 */
export function toneladas(pesoKg: number | null | undefined): number | null {
  return typeof pesoKg === "number" && Number.isFinite(pesoKg) && pesoKg > 0 ? pesoKg / 1000 : null;
}

/** El modelo como opción: el código tal cual se lee, y como valor su forma de URL. */
export function opcionDeModelo(codigo: string | null | undefined): Opcion | null {
  const etiqueta = codigo?.trim();
  if (!etiqueta) return null;
  const valor = etiqueta
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return valor ? { valor, etiqueta } : null;
}

const ref = (r: { slug: string; nombre: string } | null): Opcion | null =>
  r ? { valor: r.slug, etiqueta: r.nombre } : null;

const FACETAS: Faceta<EquipoFiltrable>[] = [
  { tipo: "lista", clave: "marca", etiqueta: "Marcas", de: (e) => ref(e.marcaRef) },
  {
    tipo: "tramos",
    clave: "peso",
    etiqueta: "Peso operativo",
    tramos: TRAMOS_PESO,
    de: (e) => toneladas(e.pesoKg),
  },
  // Un tipo se llama igual en cada marca («Excavadoras» de Hitachi y de CASE):
  // su slug es la opción, así se juntan.
  { tipo: "lista", clave: "tipo", etiqueta: "Tipo de equipo", de: (e) => ref(e.tipoRef) },
  { tipo: "lista", clave: "modelo", etiqueta: "Modelo", de: (e) => opcionDeModelo(e.codigo) },
];

const porId = (a: EquipoFiltrable, b: EquipoFiltrable) => a.id - b.id;
const porNombre = (a: EquipoFiltrable, b: EquipoFiltrable) =>
  a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base", numeric: true });

/**
 * Órdenes aprobados: recomendados (el de alta en el panel, el primero y por
 * defecto), peso de menor a mayor y de mayor a menor (los que no tienen peso,
 * al final) y nombre A–Z. Todos desempatan por id: si no, la paginación
 * repetiría equipos.
 */
const ORDENES: Catalogo<EquipoFiltrable>["ordenes"] = [
  { valor: "recomendados", etiqueta: "Recomendados", comparar: porId },
  {
    valor: "menor-peso",
    etiqueta: "Peso: de menor a mayor",
    comparar: (a, b) => compararNumeros(a.pesoKg, b.pesoKg, "asc") || porId(a, b),
  },
  {
    valor: "mayor-peso",
    etiqueta: "Peso: de mayor a menor",
    comparar: (a, b) => compararNumeros(a.pesoKg, b.pesoKg, "desc") || porId(a, b),
  },
  {
    valor: "nombre",
    etiqueta: "Nombre: A–Z",
    comparar: (a, b) => porNombre(a, b) || porId(a, b),
  },
];

/** El catálogo de los listados de maquinaria nueva (índice y categorías). */
export const CATALOGO_NUEVA: Catalogo<EquipoFiltrable> = { facetas: FACETAS, ordenes: ORDENES };
