/**
 * TEXTOS ALTERNATIVOS DE LAS FOTOS DE MAQUINARIA NUEVA Y USADA (informe de QA externo del
 * 2026-11-17, punto 25). Muchos vinieron de WordPress con relleno o erratas: «Hitachi LANDCROS ZX20
 * partequipos» en la galería de una ZX200LC-5G, «Ezcabadora…». Regla de Juan Pablo: el alt es el
 * NOMBRE REAL del equipo, sin «partequipos» de relleno. Lógica pura; el acceso a datos está en
 * `scripts/media/alt-equipos.ts` (simular, aplicar y retirar, con runbook).
 */

/** Erratas vistas en los alt de las fichas (minúsculas, sin tildes). */
const ERRATAS = /\b(ezcabadora|exacavadora|excabadora|escavadora|exvacadora|excavdora)s?\b/i;

/** ¿Hay que corregir este alt? Lleva «partequipos» de relleno o una errata conocida. */
export function altACorregir(alt: string | null | undefined): boolean {
  const t = (alt ?? "").normalize("NFD").replace(/\p{M}/gu, "");
  return /\bpartequipos\b/i.test(t) || ERRATAS.test(t);
}

/** El alt nuevo: el nombre del equipo y, desde la segunda foto, «(foto N)» (todas distintas). */
export function altDeEquipo(nombre: string, indice: number): string {
  const n = nombre.replace(/\s+/g, " ").trim();
  return indice === 0 ? n : `${n} (foto ${indice + 1})`;
}

export type Uso = {
  coleccion: "equipos-nuevos" | "equipos-usados";
  id: number;
  nombre: string;
  indice: number;
};

export type Propuesta =
  | { mediaId: number; antes: string; despues: string; uso: Uso; decision: "cambiar" | "ya-estaba" }
  | { mediaId: number; antes: string; uso: Uso; decision: "compartida"; otros: string[] };

/**
 * Qué hacer con cada foto de alt malo: si la usa una sola ficha (o varias con el mismo nombre),
 * su alt nuevo; si la comparten fichas de distinto nombre, no se toca (no hay un nombre real único).
 */
export function propuestas(
  fotos: { mediaId: number; alt: string }[],
  usos: Map<number, Uso[]>,
): Propuesta[] {
  const salida: Propuesta[] = [];
  for (const f of fotos) {
    const suyos = usos.get(f.mediaId) ?? [];
    const uso = suyos[0];
    if (!uso || !altACorregir(f.alt)) continue;
    const nombres = [...new Set(suyos.map((u) => u.nombre.trim()))];
    if (nombres.length > 1) {
      salida.push({
        mediaId: f.mediaId,
        antes: f.alt,
        uso,
        decision: "compartida",
        otros: nombres,
      });
      continue;
    }
    const despues = altDeEquipo(uso.nombre, uso.indice);
    salida.push({
      mediaId: f.mediaId,
      antes: f.alt,
      despues,
      uso,
      decision: f.alt === despues ? "ya-estaba" : "cambiar",
    });
  }
  return salida;
}
