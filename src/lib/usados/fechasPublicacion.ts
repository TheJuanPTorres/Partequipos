/**
 * Plan de la fecha de publicación de las unidades usadas importadas de
 * WordPress (`scripts/usados/fechas-publicacion.ts`): lógica pura, sin base
 * de datos. La fecha ordena la portada y los listados (2026-10-17).
 */
import { fechaDeWordPress } from "./wordpress";

export type EntradaFecha = {
  /** Id de WordPress (en aditamentos, el de la primera foto). */
  idWp: number;
  /** Id de la unidad en la base, del manifiesto de su importación. */
  id: number;
  /** `post_date_gmt` de WordPress. */
  fechaGmt: string | null | undefined;
};

/** Lo que hay hoy en la base de una unidad; `undefined` si ya no existe. */
export type Actual = { fechaPublicacion?: string | null; createdAt: string } | undefined;

export type Accion =
  | { idWp: number; id: number; tipo: "cambiar"; hacia: string; antes: string | null }
  | { idWp: number; id: number; tipo: "igual" }
  | { idWp: number; id: number; tipo: "sin-fecha" }
  | { idWp: number; id: number; tipo: "no-existe" };

const mismo = (a: string | null | undefined, b: string) =>
  Boolean(a) && Date.parse(a!) === Date.parse(b);

/** Qué hay que hacer con cada unidad para que lleve la fecha original de WordPress. */
export function planDeFechas(entradas: EntradaFecha[], actuales: Map<number, Actual>): Accion[] {
  return entradas.map(({ idWp, id, fechaGmt }) => {
    const actual = actuales.get(id);
    if (!actual) return { idWp, id, tipo: "no-existe" };
    const hacia = fechaDeWordPress(fechaGmt);
    if (!hacia) return { idWp, id, tipo: "sin-fecha" };
    if (mismo(actual.fechaPublicacion, hacia)) return { idWp, id, tipo: "igual" };
    return { idWp, id, tipo: "cambiar", hacia, antes: actual.fechaPublicacion ?? null };
  });
}

/** La retirada devuelve cada unidad a su fecha de creación (el valor por defecto). */
export function planDeRetirada(
  ids: number[],
  actuales: Map<number, Actual>,
): { id: number; tipo: "cambiar" | "igual" | "no-existe"; hacia?: string }[] {
  return ids.map((id) => {
    const actual = actuales.get(id);
    if (!actual) return { id, tipo: "no-existe" };
    if (mismo(actual.fechaPublicacion, actual.createdAt)) return { id, tipo: "igual" };
    return { id, tipo: "cambiar", hacia: actual.createdAt };
  });
}
