/**
 * TÍTULOS QUE NO CABEN (tanda 21, tarea 7, 2026-11-23): cuánto ocupa la palabra más larga de un
 * título, en `em` de Inter, para que el CSS baje el tamaño SOLO si esa palabra no cabe en su
 * contenedor (`.texto-ajustado`, `globals.css`). Se calcula en el servidor: el tamaño correcto
 * llega en el HTML y no hay desplazamiento (CLS) al cargar.
 *
 * Es una estimación por letra con los anchos de Inter en peso medio-seminegrita (el de los
 * títulos), algo holgada: un título que cabe por poco puede bajar un pelo, nunca quedarse cortado.
 */

// Anchos aproximados de Inter (avance en em, peso 500–600).
const ESTRECHAS = new Set([..."iIjlíìï1!|.,:;'’"]);
const ANCHAS_MAYUS = new Set([..."MWÑ"]);
const ANCHAS_MINUS = new Set([..."mw"]);

function anchoLetra(c: string): number {
  if (ESTRECHAS.has(c)) return 0.3;
  if (c === "-" || c === "‑" || c === "/" || c === "(" || c === ")") return 0.42;
  if (/[0-9]/.test(c)) return 0.64;
  if (ANCHAS_MAYUS.has(c)) return 0.92;
  if (ANCHAS_MINUS.has(c)) return 0.86;
  if (c !== c.toLowerCase()) return 0.72; // mayúscula
  if (c !== c.toUpperCase()) return 0.58; // minúscula
  return 0.62;
}

/** Ancho en `em` de la palabra más larga (sin contar espacios). 0 si no hay texto. */
export function anchoPalabraMasLarga(
  texto: string,
  opciones: { mayusculas?: boolean } = {},
): number {
  const t = opciones.mayusculas ? texto.toLocaleUpperCase("es") : texto;
  let max = 0;
  for (const palabra of t.split(/\s+/)) {
    let ancho = 0;
    for (const c of palabra) ancho += anchoLetra(c);
    if (ancho > max) max = ancho;
  }
  // Holgura del 4 % por el interletrado y el redondeo.
  return Math.round(max * 1.04 * 100) / 100;
}

/** Tamaño mínimo legible por nivel, en px (los escala la escala proporcional como todo px). */
export const MINIMO_POR_NIVEL = { grande: 22, medio: 18, pequeno: 15 } as const;
export type NivelTitulo = keyof typeof MINIMO_POR_NIVEL;

/**
 * ¿Hace falta el guion de último recurso? Solo si la palabra no cabe ni al mínimo en el
 * contenedor más estrecho de la web (unos 340 px a 390 de ventana). Así el resto de títulos no
 * se parte con guiones: `hyphens: auto` también parte palabras que cabrían en la línea siguiente.
 */
export function necesitaGuion(
  anchoEm: number,
  nivel: NivelTitulo,
  contenedorMinimo = 340,
): boolean {
  return anchoEm * MINIMO_POR_NIVEL[nivel] > contenedorMinimo;
}
