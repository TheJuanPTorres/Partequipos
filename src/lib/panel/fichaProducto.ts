import type { Insignia } from "./insignias";
import {
  PARTES_FICHA as PARTES_USADA,
  insigniaUsada,
  type Completitud,
  type DatosUsada,
} from "./fichaUsada";

/**
 * EDICIÓN FÁCIL DE LAS FICHAS DE PRODUCTO (tanda 21, tarea 3, fase 2, punto 1): lo del prototipo de
 * usadas (#533) llevado al resto de productos. Por colección: qué cuenta para «ficha completa» y
 * cómo se dice su estado en la web. Lógica pura, con pruebas; la usan el resumen de arriba de la
 * ficha (`ResumenWeb`) y la celda «Estado» de la lista.
 */

export type ParteFicha = {
  campo: string;
  texto: string;
  peso: number;
  /** Cuántos elementos hacen falta (fotos, filas). */
  minimo?: number;
};

export type DatosFicha = Record<string, unknown>;

const lleno = (v: unknown): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.length > 0;
  // Texto enriquecido de Lexical: lleno si tiene algún texto.
  if (typeof v === "object" && "root" in v) return /"text":"[^"]*[^"\s]/.test(JSON.stringify(v));
  return true;
};

export function completitud(partes: ReadonlyArray<ParteFicha>, d: DatosFicha): Completitud {
  let total = 0;
  let hecho = 0;
  const faltan: string[] = [];
  for (const p of partes) {
    total += p.peso;
    const v = d[p.campo];
    if (p.minimo !== undefined) {
      const n = Array.isArray(v) ? v.length : 0;
      hecho += p.peso * Math.min(1, n / p.minimo);
      if (n < p.minimo) faltan.push(p.texto);
    } else if (lleno(v)) {
      hecho += p.peso;
    } else {
      faltan.push(p.texto);
    }
  }
  return { porcentaje: total ? Math.round((hecho / total) * 100) : 100, faltan };
}

/** Publicada u Oculta, según «Mostrar en la web» (sin valor cuenta como marcado). */
export function insigniaWeb(d: { mostrarEnWeb?: unknown }): Insignia {
  return d.mostrarEnWeb === false
    ? { texto: "Oculta", tono: "aviso" }
    : { texto: "Publicada", tono: "exito" };
}

export type ConfigFicha = {
  partes: ReadonlyArray<ParteFicha>;
  insignia: (d: DatosFicha) => Insignia;
  /** Los campos que el resumen lee del formulario (las partes y el estado). */
  campos: string[];
};

const config = (
  partes: ReadonlyArray<ParteFicha>,
  insignia: ConfigFicha["insignia"],
  estado: string[],
) => ({
  partes,
  insignia,
  campos: [...new Set([...partes.map((p) => p.campo), ...estado])],
});

/**
 * Nuevas y aditamentos (los dos son `equipos-nuevos`): lo que pinta la ficha 4036. La ficha técnica
 * da las características de la cabecera (hasta 5), así que pide 5 filas.
 */
export const PARTES_NUEVA: ReadonlyArray<ParteFicha> = [
  { campo: "nombre", texto: "Nombre", peso: 1 },
  { campo: "marca", texto: "Marca", peso: 1 },
  { campo: "tipo", texto: "Tipo de equipo", peso: 1 },
  { campo: "codigo", texto: "Código / referencia", peso: 1 },
  { campo: "entradilla", texto: "Entradilla", peso: 1 },
  { campo: "descripcion", texto: "Descripción comercial", peso: 1 },
  { campo: "imagenes", texto: "Fotos (al menos 3)", peso: 3, minimo: 3 },
  { campo: "fichaTecnica", texto: "Ficha técnica (al menos 5 filas)", peso: 2, minimo: 5 },
  { campo: "fichaTecnicaPdf", texto: "Ficha técnica en PDF", peso: 1 },
];

/** Modelos de repuestos: lo que pinta su página (plantilla 4086). */
export const PARTES_MODELO: ReadonlyArray<ParteFicha> = [
  { campo: "nombre", texto: "Nombre", peso: 1 },
  { campo: "marca", texto: "Marca", peso: 1 },
  { campo: "tipo", texto: "Tipo de equipo", peso: 1 },
  { campo: "codigo", texto: "Código", peso: 1 },
  { campo: "descripcion", texto: "Descripción", peso: 1 },
  { campo: "imagenes", texto: "Foto", peso: 2, minimo: 1 },
];

export const FICHAS: Record<string, ConfigFicha> = {
  "equipos-usados": config(
    PARTES_USADA as ReadonlyArray<ParteFicha>,
    (d) => insigniaUsada(d as DatosUsada),
    ["mostrarEnWeb", "disponible"],
  ),
  "equipos-nuevos": config(PARTES_NUEVA, insigniaWeb, ["mostrarEnWeb"]),
  "modelos-repuesto": config(PARTES_MODELO, insigniaWeb, ["mostrarEnWeb"]),
};

/** Valores distintos, sin vacíos, ordenados, para las sugerencias de un campo de texto. */
export function valoresSugeridos(valores: unknown[]): string[] {
  const vistos = new Map<string, string>();
  for (const v of valores) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (t && !vistos.has(t.toLowerCase())) vistos.set(t.toLowerCase(), t);
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, "es"));
}
