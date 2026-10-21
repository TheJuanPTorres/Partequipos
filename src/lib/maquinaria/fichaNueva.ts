import {
  destacadas,
  filasCompletas,
  MAX_DESTACADAS,
  type DatoDestacado,
  type FilaFicha,
} from "./fichaTecnica";

/**
 * Lógica pura de la FICHA DE MAQUINARIA NUEVA con la plantilla de Andrés
 * («Ficha maquinaria nueva», elementor 4036, 2026-10-21): la usan los equipos
 * nuevos y los aditamentos nuevos. La unidad usada sigue con la ficha V2.
 * Detalle en docs/diseno/decisiones-ficha-nueva.md.
 */

/**
 * Los cinco datos de la cabecera de la plantilla, en su orden. NO son campos
 * nuevos: salen de las filas de «Ficha técnica» del equipo, reconocidas por su
 * etiqueta (con las variantes y erratas que trae WordPress, p. ej. «ALANCE
 * MAXIMO EN EL SUELO»). Se pinta la etiqueta y el valor tal cual estén en la
 * fila: si el equipo no tiene el dato, no sale (nunca se inventa).
 */
const DATOS_PLANTILLA: { icono: DatoDestacado["icono"]; patrones: RegExp[] }[] = [
  {
    icono: "potencia",
    // Primero la neta; si el fabricante solo da otra, esa, con su propia etiqueta.
    patrones: [/potencia\s+neta|potência\s+neta|volante\s+neta/i, /^potencia\b/i],
  },
  {
    icono: "peso",
    patrones: [/^peso\s+(operativo|operacional|de\s+operaci[oó]n|en\s+funcionamiento)/i],
  },
  { icono: "alcance", patrones: [/^alc?ance\s+m[aá]ximo/i] },
  { icono: "profundidad", patrones: [/profundidad.*excavaci|excavaci.*profundidad/i] },
  { icono: "motor", patrones: [/^motor$/i, /^(marca\s+y\s+)?modelo\s+del\s+motor$/i] },
];

/** La primera fila completa cuya etiqueta casa con un patrón, por orden de preferencia. */
function filaPorPatrones<T extends FilaFicha>(filas: T[], patrones: RegExp[]): T | undefined {
  for (const patron of patrones) {
    const fila = filas.find((f) => patron.test(f.etiqueta!.trim()));
    if (fila) return fila;
  }
  return undefined;
}

export type DatoConFila = DatoDestacado & { fila: number };

/**
 * Los datos de la cabecera: si el editor marcó «Destacar» en alguna fila, esas
 * (hasta 4, con su icono); si no, los cinco de la plantilla que el equipo tenga.
 * `fila` es la posición en la ficha, para no repetirla en «Más especificaciones».
 */
export function datosDeCabecera(filas: FilaFicha[] | null | undefined): DatoConFila[] {
  const completas = filasCompletas(filas);
  if (completas.some((f) => f.destacar)) {
    const marcadas = destacadas(completas, MAX_DESTACADAS);
    return marcadas.map((d) => ({
      ...d,
      fila: completas.findIndex((f) => f.destacar && f.etiqueta!.trim() === d.etiqueta),
    }));
  }
  const usadas = new Set<number>();
  return DATOS_PLANTILLA.flatMap(({ icono, patrones }) => {
    const libres = completas.filter((_, i) => !usadas.has(i));
    const fila = filaPorPatrones(libres, patrones);
    if (!fila) return [];
    const i = completas.indexOf(fila);
    usadas.add(i);
    return [{ etiqueta: fila.etiqueta!.trim(), valor: fila.valor!.trim(), icono, fila: i }];
  });
}

/** Las filas de la ficha técnica que la cabecera no enseña ya («Más especificaciones»). */
export function filasRestantes<T extends FilaFicha>(
  filas: T[] | null | undefined,
  enCabecera: readonly { fila: number }[],
): T[] {
  const ya = new Set(enCabecera.map((d) => d.fila));
  return filasCompletas(filas).filter((_, i) => !ya.has(i));
}

/**
 * «Otras Excavadoras», «Otros Minicargadores»: el adjetivo concuerda con la
 * PRIMERA palabra del tipo (el sustantivo), no con la última como `concuerda`
 * («Pavimentadoras Dynapac» es femenino).
 */
export function tituloOtras(tipo: string): string {
  const t = tipo.trim();
  const primera = t.split(/\s+/)[0]?.toLowerCase() ?? "";
  return `${primera.endsWith("as") ? "Otras" : "Otros"} ${t}`;
}

/**
 * El título en escritorio, en dos líneas como la plantilla («YANMAR» /
 * «ViO50-6a»): la marca y la referencia del fabricante. Sin referencia (los
 * aditamentos), `null`: se pinta el nombre completo, como en móvil.
 */
export function tituloEscritorio(
  marca: string,
  codigo: string | null | undefined,
): { marca: string; modelo: string } | null {
  const m = marca.trim();
  const c = codigo?.trim();
  return m && c ? { marca: m, modelo: c } : null;
}

/**
 * «Ver en vista 360»: el enlace a la vista 360 del equipo (Matterport, Kuula,
 * un visor propio…), que se abre en una ventana emergente. Solo `https` y sin
 * usuario ni contraseña en la URL. Vacío, no hay botón.
 */
export function validarVista360(valor: unknown): true | string {
  if (valor === null || valor === undefined || valor === "") return true;
  if (typeof valor !== "string") return "Escribe un enlace.";
  let url: URL;
  try {
    url = new URL(valor.trim());
  } catch {
    return "No es un enlace válido. Cópialo entero, empezando por https://";
  }
  if (url.protocol !== "https:") return "El enlace tiene que empezar por https://";
  if (url.username || url.password) return "El enlace no puede llevar usuario ni contraseña.";
  return true;
}

/** El enlace ya validado, o `null` (vacío o inválido: sin botón). */
export function enlaceVista360(valor: string | null | undefined): string | null {
  const v = valor?.trim();
  return v && validarVista360(v) === true ? v : null;
}
