/**
 * Lógica pura de la cabecera (docs/diseno/decisiones-cabecera.md): el modo en
 * que se pinta y dónde acaba, para el panel del megamenú. La cabecera es SIEMPRE
 * visible y fija arriba: no existe ningún estado «oculta» (petición de Andrés,
 * 2026-10-14; `modo.test.ts` lo vigila).
 */

export type ModoCabecera = "solido" | "transparente" | "velo";

/**
 * Cómo se pinta la barra:
 * - `solido`: fondo blanco (todas las páginas menos la portada, y la portada con
 *   el menú móvil abierto).
 * - `transparente`: SOLO la portada y arriba del todo, sobre el fondo claro.
 * - `velo`: portada al bajar, y con un megamenú abierto en la portada. Era el
 *   vidrio esmerilado de ux-9; desde el 2026-10-17 es blanco sólido, sin filete
 *   (dirección), como el panel del megamenú.
 */
export function modoCabecera(estado: {
  esPortada: boolean;
  arriba: boolean;
  menuMovilAbierto: boolean;
  megaAbierto: boolean;
}): ModoCabecera {
  if (!estado.esPortada || estado.menuMovilAbierto) return "solido";
  return estado.arriba && !estado.megaAbierto ? "transparente" : "velo";
}

/** Alto de la barra encogida (escritorio), en px: lo que mide ux-9 al bajar. */
export const ALTO_ENCOGIDA = 70;

/**
 * Dónde empieza el panel del megamenú: justo donde acaba la barra. Con la barra
 * encogida son 70 px; si no, su alto MEDIDO (varía entre 70 y 100 según el
 * ancho). Sin medida todavía, `null`: el CSS usa su valor de reserva.
 */
export function inicioDelPanel(altoMedido: number | null, encogida: boolean): number | null {
  if (encogida) return ALTO_ENCOGIDA;
  return altoMedido !== null && altoMedido > 0 ? Math.round(altoMedido) : null;
}
