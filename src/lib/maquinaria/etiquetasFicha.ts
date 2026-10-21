/**
 * CORRECCIÓN DE LAS ETIQUETAS de la ficha técnica de los equipos nuevos
 * (dirección, 2026-10-21): minúsculas normales, tildes y erratas, según la
 * tabla aprobada `informes/2026-10-21-etiquetas-fichas-nuevas.md` (fuera del
 * repositorio). SOLO la etiqueta de cada fila: el valor nunca se toca. Lo usa
 * `scripts/maquinaria/etiquetas-fichas.ts`.
 */

export type FilaFicha = { id?: string | null; etiqueta?: string | null; valor?: string | null };

/** Un cambio hecho: con él se deshace (`retirar`). */
export type CambioEtiqueta = { equipo: number; fila: string; antes: string; despues: string };

const SIN_CAMBIO = "_sin cambio_";

/** Una celda de la tabla Markdown: sin espacios de los lados y con `\|` como `|`. */
const celda = (c: string) => c.trim().replace(/\\\|/g, "|");

/**
 * Las correcciones de la tabla (etiqueta actual → propuesta), solo las filas con
 * propuesta. La tabla es la que lleva la cabecera «Etiqueta actual | Propuesta».
 */
export function leerTabla(markdown: string): Map<string, string> {
  const lineas = markdown.split(/\r?\n/);
  const inicio = lineas.findIndex((l) => /^\|\s*Etiqueta actual\s*\|\s*Propuesta\s*\|/.test(l));
  if (inicio < 0) throw new Error("la tabla no tiene la cabecera «Etiqueta actual | Propuesta»");
  const mapa = new Map<string, string>();
  for (const linea of lineas.slice(inicio + 2)) {
    if (!linea.startsWith("|")) break;
    const celdas = linea
      .slice(1, -1)
      .split(/(?<!\\)\|/)
      .map(celda);
    if (celdas.length < 2) throw new Error(`fila de la tabla sin propuesta: ${linea}`);
    const [actual, propuesta] = celdas;
    if (!actual) throw new Error(`fila de la tabla sin etiqueta: ${linea}`);
    if (mapa.has(actual)) throw new Error(`etiqueta repetida en la tabla: «${actual}»`);
    if (propuesta === SIN_CAMBIO || propuesta === actual) continue;
    if (!propuesta) throw new Error(`propuesta vacía para «${actual}»`);
    mapa.set(actual, propuesta);
  }
  return mapa;
}

/**
 * Las filas con la etiqueta corregida, y la lista de cambios. Compara la
 * etiqueta EXACTA guardada (la de la tabla); el valor y el resto de la fila no
 * cambian. Repetirlo sobre el resultado no cambia nada.
 */
export function corregirFilas<F extends FilaFicha>(
  equipo: number,
  filas: F[],
  tabla: Map<string, string>,
): { filas: F[]; cambios: CambioEtiqueta[] } {
  const cambios: CambioEtiqueta[] = [];
  const nuevas = filas.map((f) => {
    const despues = f.etiqueta ? tabla.get(f.etiqueta) : undefined;
    if (!despues || !f.id) return f;
    cambios.push({ equipo, fila: f.id, antes: f.etiqueta!, despues });
    return { ...f, etiqueta: despues };
  });
  return { filas: nuevas, cambios };
}

/**
 * Deshacer: cada fila del manifiesto vuelve a su etiqueta de antes, solo si
 * sigue con la nuestra (si alguien la cambió en el panel, no se pisa).
 */
export function deshacerFilas<F extends FilaFicha>(
  equipo: number,
  filas: F[],
  manifiesto: CambioEtiqueta[],
): { filas: F[]; devueltas: CambioEtiqueta[]; saltadas: CambioEtiqueta[] } {
  const devueltas: CambioEtiqueta[] = [];
  const saltadas: CambioEtiqueta[] = [];
  const delEquipo = manifiesto.filter((c) => c.equipo === equipo);
  const nuevas = filas.map((f) => {
    const c = delEquipo.find((x) => x.fila === f.id);
    if (!c) return f;
    if (f.etiqueta !== c.despues) {
      saltadas.push(c);
      return f;
    }
    devueltas.push(c);
    return { ...f, etiqueta: c.antes };
  });
  for (const c of delEquipo) if (!devueltas.includes(c) && !saltadas.includes(c)) saltadas.push(c);
  return { filas: nuevas, devueltas, saltadas };
}
