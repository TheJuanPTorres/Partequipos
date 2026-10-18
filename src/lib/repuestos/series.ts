import type { ArrayFieldValidation, TextFieldSingleValidation } from "payload";
import { text } from "payload/shared";

import type { TiposEquipo } from "@/payload-types";

import { formatSlug } from "../utils/formatSlug";

/**
 * SERIES DE UN TIPO DE REPUESTOS (2026-10-17, dirección): un tipo puede
 * repartir sus modelos por serie de fabricante, como Hitachi en WordPress
 * («excavadora HITACHI EX» y «… ZAXIS»). En WordPress eran tarjetas sin URL,
 * así que aquí tampoco tienen página: la tarjeta de la marca baja al ANCLA de
 * su serie en la página del tipo. Detalle en docs/repuestos-importacion.md §8.
 */

export type Serie = { nombre: string; ancla: string };

/** Mismo nombre de serie, con mayúsculas o espacios de más: «zaxis » = «ZAXIS». */
export const claveSerie = (nombre: string | null | undefined) =>
  (nombre ?? "").trim().toLocaleUpperCase("es");

/** Ancla de la serie en la página del tipo: «serie-ex», «serie-zaxis». */
export const anclaDeSerie = (nombre: string) => `serie-${formatSlug(nombre.trim())}`;

/** Las series de un tipo, en el orden del panel; sin nombre o repetidas no cuentan. */
export function seriesDeTipo(tipo: Pick<TiposEquipo, "series">): Serie[] {
  const vistas = new Set<string>();
  const series: Serie[] = [];
  for (const fila of tipo.series ?? []) {
    const nombre = fila.nombre?.trim() ?? "";
    const clave = claveSerie(nombre);
    if (!clave || vistas.has(clave)) continue;
    vistas.add(clave);
    series.push({ nombre, ancla: anclaDeSerie(nombre) });
  }
  return series;
}

/** Dos filas con el mismo nombre de serie no tienen sentido (dos tarjetas iguales). */
export const validarSeries: ArrayFieldValidation = (valor) => {
  if (!Array.isArray(valor)) return true;
  const vistas = new Set<string>();
  for (const fila of valor as { nombre?: string | null }[]) {
    const clave = claveSerie(fila?.nombre);
    if (!clave) continue;
    if (vistas.has(clave)) return `La serie «${fila.nombre?.trim()}» está repetida.`;
    vistas.add(clave);
  }
  return true;
};

/**
 * La serie de un modelo tiene que ser una de las de su tipo: si no, el modelo
 * acabaría en «Otros modelos» sin que el editor lo sepa.
 */
export const validarSerieDelModelo: TextFieldSingleValidation = async (valor, args) => {
  const base = text(valor, args);
  if (base !== true) return base;
  const clave = claveSerie(typeof valor === "string" ? valor : "");
  if (!clave) return true;

  const tipoId = idDe((args.siblingData as { tipo?: unknown } | undefined)?.tipo);
  if (tipoId === null) return "Elige primero el tipo de equipo.";
  const tipo = await args.req.payload
    .findByID({ collection: "tipos-equipo", id: tipoId, depth: 0, req: args.req })
    .catch(() => null);
  const series = tipo ? seriesDeTipo(tipo) : [];
  if (series.length === 0) return "Este tipo de equipo no tiene series: deja la serie vacía.";
  if (series.some((s) => claveSerie(s.nombre) === clave)) return true;
  return `La serie tiene que ser una de las de su tipo: ${series.map((s) => s.nombre).join(", ")}.`;
};

function idDe(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  if (v && typeof v === "object" && "id" in v) return idDe((v as { id: unknown }).id);
  return null;
}

/** Un grupo de la página del tipo: una serie, o «Otros modelos». */
export type GrupoDeModelos<T> = { ancla: string | null; titulo: string; modelos: T[] };

/**
 * Reparte los modelos por la serie de su tipo, en el orden de las series.
 * Una serie sin modelos no se pinta; los que no tienen serie (o una que el
 * tipo ya no tiene) van al final, en «Otros modelos». `null` si el tipo no
 * tiene series: la página pinta la lista de siempre.
 */
export function agruparPorSerie<T>(
  series: Serie[],
  modelos: T[],
  serieDe: (m: T) => string | null | undefined,
): GrupoDeModelos<T>[] | null {
  if (series.length === 0) return null;
  const porClave = new Map(series.map((s) => [claveSerie(s.nombre), [] as T[]]));
  const otros: T[] = [];
  for (const m of modelos) {
    const lista = porClave.get(claveSerie(serieDe(m)));
    if (lista) lista.push(m);
    else otros.push(m);
  }
  const grupos: GrupoDeModelos<T>[] = series
    .map((s) => ({
      ancla: s.ancla,
      titulo: `Serie ${s.nombre}`,
      modelos: porClave.get(claveSerie(s.nombre)) ?? [],
    }))
    .filter((g) => g.modelos.length > 0);
  if (otros.length > 0) grupos.push({ ancla: null, titulo: "Otros modelos", modelos: otros });
  return grupos;
}
