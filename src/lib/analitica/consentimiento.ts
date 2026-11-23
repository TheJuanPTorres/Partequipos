/**
 * LA DECISIÓN DEL VISITANTE SOBRE LAS COOKIES. Se guarda en su navegador (`localStorage`, no en
 * una cookie ni en el servidor): solo dice si aceptó la analítica y cuándo. Pasado un año se
 * vuelve a preguntar.
 */

export const CLAVE_CONSENTIMIENTO = "pq-cookies";
const VERSION = 1;
const VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;

export type Consentimiento = { analitica: boolean; fecha: string };

/** El texto que se guarda. */
export function serializar(analitica: boolean, ahora: Date): string {
  return JSON.stringify({ v: VERSION, analitica, fecha: ahora.toISOString() });
}

/** Lo guardado, si es nuestro, de esta versión y sigue vigente; si no, `null` (se pregunta). */
export function interpretar(crudo: string | null | undefined, ahora: Date): Consentimiento | null {
  if (!crudo) return null;
  let dato: unknown;
  try {
    dato = JSON.parse(crudo);
  } catch {
    return null;
  }
  if (!dato || typeof dato !== "object") return null;
  const { v, analitica, fecha } = dato as Record<string, unknown>;
  if (v !== VERSION || typeof analitica !== "boolean" || typeof fecha !== "string") return null;
  const cuando = Date.parse(fecha);
  if (Number.isNaN(cuando)) return null;
  const edad = ahora.getTime() - cuando;
  if (edad < 0 || edad > VIGENCIA_MS) return null;
  return { analitica, fecha };
}
