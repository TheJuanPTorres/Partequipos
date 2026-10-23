import { filasCompletas, type DatoDestacado, type FilaFicha } from "./fichaTecnica";

/**
 * Lógica pura de la FICHA DE MAQUINARIA NUEVA con la plantilla de Andrés
 * («Ficha maquinaria nueva», elementor 4036, 2026-10-21): la usan los equipos
 * nuevos y los aditamentos nuevos. La unidad usada sigue con la ficha V2.
 * Detalle en docs/diseno/decisiones-ficha-nueva.md.
 */

/**
 * REGLA DEL CLIENTE (2026-10-21): MÁXIMO 5 CARACTERÍSTICAS POR PRODUCTO, las de
 * la cabecera de la plantilla. No hay tabla de especificaciones aparte. Por
 * prioridad:
 *
 *   1. Potencia neta · 2. Peso operativo · 3. Motor ·
 *   4. Fuerza de tracción máxima · 5. Ancho de la zapata
 *
 * Si falta alguna, se completa hasta 5 con OTRAS filas reales de su ficha
 * técnica, en el orden en que están guardadas; con menos de 5 filas, las que
 * tenga. Nunca se inventa nada.
 *
 * ETIQUETAS (dirección, 2026-10-21): los 5 de prioridad se enseñan con su
 * nombre uniforme («Potencia neta», «Peso operativo», «Motor», «Fuerza de
 * tracción máxima», «Ancho de la zapata»), venga como venga de WordPress; los
 * de relleno, con su etiqueta tal cual. Los VALORES no se tocan nunca, y lo
 * guardado no cambia: solo lo que se enseña.
 *
 * Las etiquetas llegan de WordPress escritas de muchas formas (mayúsculas,
 * tildes, «Potencia» frente a «Potencia neta», «(SAE J1349)»…): se comparan
 * normalizadas (`normalizar`) contra los patrones de cada prioridad, en orden
 * de preferencia. La potencia BRUTA no cuenta como neta: si es lo único que
 * hay, entra como dato de relleno, con su propia etiqueta.
 */
export const PRIORIDADES: {
  nombre: string;
  icono: DatoDestacado["icono"];
  patrones: RegExp[];
}[] = [
  {
    nombre: "Potencia neta",
    icono: "potencia",
    patrones: [/^potencia neta/, /^potencia nominal del volante neta/, /^potencia$/],
  },
  {
    nombre: "Peso operativo",
    icono: "peso",
    patrones: [/^peso (operativo|operacional|de operacion|en funcionamiento)/],
  },
  {
    nombre: "Motor",
    icono: "motor",
    patrones: [/^motor$/, /^(marca y )?modelo del motor$/],
  },
  {
    nombre: "Fuerza de tracción máxima",
    icono: "otro",
    // «Barra de tracción parada» es la misma medida (dirección, 2026-10-21).
    patrones: [
      /^fuerza de traccion maxima/,
      /^fuerza (maxima )?de traccion/,
      /^barra de traccion parada/,
    ],
  },
  {
    nombre: "Ancho de la zapata",
    icono: "alcance",
    patrones: [/^ancho de (la )?zapata/],
  },
];

/** Cuántas características se enseñan como mucho. */
export const MAX_CARACTERISTICAS = 5;

/** Minúsculas, sin tildes, sin «:» final y con un solo espacio: para comparar etiquetas. */
export function normalizar(etiqueta: string): string {
  return etiqueta
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/:\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * El nombre corto y uniforme de una característica prioritaria («Potencia neta», «Peso
 * operativo», «Motor»…) si su etiqueta empareja con uno de los patrones de `PRIORIDADES`; si no,
 * `null` (la etiqueta va tal cual). La misma regla que la cabecera de la ficha nueva (#309), para
 * las tarjetas de equipo (dirección, 2026-10-23).
 */
export function nombreUniforme(etiqueta: string): string | null {
  const e = normalizar(etiqueta);
  return PRIORIDADES.find((p) => p.patrones.some((r) => r.test(e)))?.nombre ?? null;
}

/** El icono de un dato de relleno, por su etiqueta; sin parecido, «otro». */
export function iconoPorEtiqueta(etiqueta: string): DatoDestacado["icono"] {
  const e = normalizar(etiqueta);
  if (/^potencia|torque/.test(e)) return "potencia";
  if (/^peso/.test(e)) return "peso";
  if (/motor|cilindr|desplazamiento/.test(e)) return "motor";
  if (/profundidad|altura|alt\./.test(e)) return "profundidad";
  if (/capacidad|caudal|flujo|tanque/.test(e)) return "capacidad";
  if (/velocidad/.test(e)) return "velocidad";
  if (/alcance|ancho|largo|largura|longitud|radio/.test(e)) return "alcance";
  return "otro";
}

/**
 * Las características de la ficha (cabecera y, las 3 primeras, sus tarjetas):
 * las de prioridad que tenga, en su orden, y después otras filas reales en el
 * orden guardado, hasta `max`.
 */
export function datosDeCabecera(
  filas: FilaFicha[] | null | undefined,
  max: number = MAX_CARACTERISTICAS,
): DatoDestacado[] {
  const completas = filasCompletas(filas);
  const normal = completas.map((f) => normalizar(f.etiqueta!));
  const usadas = new Set<number>();
  const elegidas: { i: number; icono: DatoDestacado["icono"]; nombre?: string }[] = [];
  for (const { nombre, icono, patrones } of PRIORIDADES) {
    let encontrada = -1;
    for (const patron of patrones) {
      encontrada = normal.findIndex((e, i) => !usadas.has(i) && patron.test(e));
      if (encontrada >= 0) break;
    }
    if (encontrada >= 0) {
      usadas.add(encontrada);
      elegidas.push({ i: encontrada, icono, nombre });
    }
  }
  for (let i = 0; i < completas.length && elegidas.length < max; i++) {
    if (usadas.has(i)) continue;
    usadas.add(i);
    elegidas.push({ i, icono: iconoPorEtiqueta(completas[i]!.etiqueta!) });
  }
  return elegidas.slice(0, max).map(({ i, icono, nombre }) => ({
    // Prioridad: el nombre uniforme. Relleno: la etiqueta tal cual.
    etiqueta: nombre ?? completas[i]!.etiqueta!.trim(),
    valor: completas[i]!.valor!.trim(),
    icono,
  }));
}

/**
 * El título de las otras referencias del mismo tipo (dirección, 2026-10-23): «Otros modelos de
 * Excavadora», sin género, así vale con el nombre en singular y en plural. Antes, «Otras
 * Excavadoras» / «Otros Bulldozers», que con un nombre en singular decía «Otros Excavadora».
 */
export function tituloOtras(tipo: string): string {
  return `Otros modelos de ${tipo.trim()}`;
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
