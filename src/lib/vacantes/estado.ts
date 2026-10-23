import type { ResultadoVacantes, Vacante } from "./tipos";

/**
 * Cuándo se vuelve a leer Buk y qué se pinta con lo guardado: lógica pura, sin
 * red ni base, para probarla sin las dos (`estado.test.ts`).
 */

/** Como mucho una lectura cada 6 horas (Juan Pablo), también si falla. */
export const INTERVALO_LECTURA_MS = 6 * 60 * 60 * 1000;

/** Lo guardado en el global «Vacantes de Buk». */
export type Guardado = {
  /** El interruptor «Leer vacantes de Buk». */
  leer: boolean;
  /** La última copia buena; `null`, nunca hubo una. */
  vacantes: Vacante[] | null;
  /** Fecha (ISO) de la última lectura buena. */
  copiaEl: string | null;
  /** Fecha (ISO) del último intento, bueno o malo. */
  ultimoIntento: string | null;
  /** El error del último intento; vacío, salió bien. */
  ultimoError: string | null;
};

/**
 * ¿Toca leer Buk ahora? Solo con el interruptor marcado y pasadas 6 horas del
 * último intento (un fallo también cuenta: no se reintenta en cada visita). Una
 * fecha ilegible cuenta como «nunca».
 */
export function tocaLeer(guardado: Guardado, ahora: number): boolean {
  if (!guardado.leer) return false;
  const ultimo = guardado.ultimoIntento ? Date.parse(guardado.ultimoIntento) : Number.NaN;
  return Number.isNaN(ultimo) || ahora - ultimo >= INTERVALO_LECTURA_MS || ultimo > ahora;
}

/** Lo que se pinta con lo guardado, sin leer Buk. */
export function resultadoGuardado(guardado: Guardado): ResultadoVacantes {
  if (!guardado.leer) return { origen: "apagado", vacantes: [], leidoEl: null };
  if (!guardado.vacantes) return { origen: "sinDatos", vacantes: [], leidoEl: null };
  return {
    origen: guardado.ultimoError ? "copia" : "vivo",
    vacantes: guardado.vacantes,
    leidoEl: guardado.copiaEl,
  };
}

/** Comprueba que lo que viene de la base tiene la forma de una lista de vacantes. */
export function vacantesGuardadas(valor: unknown): Vacante[] | null {
  if (!Array.isArray(valor)) return null;
  const buenas = valor.filter(
    (v): v is Vacante =>
      !!v &&
      typeof v === "object" &&
      typeof (v as Vacante).cargo === "string" &&
      typeof (v as Vacante).ciudad === "string" &&
      typeof (v as Vacante).enlace === "string" &&
      (v as Vacante).enlace.startsWith("https://partequipos.buk.co/"),
  );
  return buenas.length === valor.length ? buenas : null;
}
