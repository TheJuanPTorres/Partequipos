import type { DatoDestacado, IconoDatoFicha } from "./fichaTecnica";

/**
 * ATRIBUTOS DE LA FICHA DE MAQUINARIA NUEVA, EDITABLES (2026-11-23, tanda 21 tarea 4, Juan Pablo).
 * Lógica pura, con pruebas.
 *
 * Hasta hoy los (hasta) 5 datos de la cabecera de la ficha salían de «Ficha técnica» y los elegía
 * el código por el TEXTO de su etiqueta (`datosDeCabecera`): nadie los encontraba en el panel.
 * Ahora hay un CATÁLOGO («Atributos de ficha»: nombre, icono, unidad y tipo de valor) y, en cada
 * máquina, «Atributos destacados»: hasta 5 filas que se ordenan arrastrando, con el atributo y
 * solo el valor. La web pinta icono, nombre, valor y unidad del catálogo.
 *
 * MIENTRAS UNA MÁQUINA NO TENGA «Atributos destacados», la ficha usa lo de siempre
 * (`datosDeCabecera`): lo publicado no cambia de aspecto. La siembra (`scripts/maquinaria/
 * atributos-ficha.ts`) copia exactamente lo que ese código elige hoy y no borra nada.
 */

export const MAX_ATRIBUTOS = 5;

export const TIPOS_VALOR = [
  { value: "numero", label: "Número" },
  { value: "texto", label: "Texto" },
] as const;
export type TipoValor = (typeof TIPOS_VALOR)[number]["value"];

/** Unidades de uso corriente: sirven de sugerencia en el panel; la unidad es texto libre. */
export const UNIDADES_SUGERIDAS = ["hp", "kW", "t", "kg", "mm", "m", "cm", "L", "km/h", "rpm"];

export type AtributoCatalogo = {
  nombre?: string | null;
  icono?: string | null;
  unidad?: string | null;
  tipoValor?: string | null;
};

export type FilaAtributo = {
  /** Poblado (objeto) o solo el id (número): un id suelto no se puede pintar. */
  atributo?: AtributoCatalogo | number | string | null;
  valor?: string | null;
};

const ICONOS = new Set<string>([
  "peso",
  "potencia",
  "motor",
  "capacidad",
  "alcance",
  "profundidad",
  "velocidad",
  "otro",
]);

const esCatalogo = (a: FilaAtributo["atributo"]): a is AtributoCatalogo =>
  typeof a === "object" && a !== null;

/** El valor con su unidad, como se pinta: «3658 mm» (la unidad vacía, el valor solo). */
export function valorConUnidad(valor: string, unidad: string | null | undefined): string {
  const v = valor.trim();
  const u = unidad?.trim();
  return u ? `${v} ${u}` : v;
}

/**
 * Los datos de la ficha desde las filas de «Atributos destacados»: hasta `max`, en el orden de las
 * filas. Una fila sin atributo poblado, sin nombre o sin valor no cuenta. Sin ninguna válida,
 * `null`: la ficha usa lo de siempre.
 */
export function datosDeAtributos(
  filas: FilaAtributo[] | null | undefined,
  max: number = MAX_ATRIBUTOS,
): DatoDestacado[] | null {
  const datos: DatoDestacado[] = [];
  for (const fila of filas ?? []) {
    if (datos.length >= max) break;
    const a = fila.atributo;
    if (!esCatalogo(a)) continue;
    const nombre = a.nombre?.trim();
    const valor = fila.valor?.trim();
    if (!nombre || !valor) continue;
    datos.push({
      etiqueta: nombre,
      valor: valorConUnidad(valor, a.unidad),
      icono: (ICONOS.has(a.icono ?? "") ? a.icono : "otro") as IconoDatoFicha,
    });
  }
  return datos.length > 0 ? datos : null;
}

/**
 * Para la SIEMBRA y la importación: separa «3658 mm» en valor «3658» y unidad «mm». Solo si es un
 * número seguido de una unidad corta (letras, `/`, `²`, `³`, `%`, `°`); lo demás («angulo 20 grds
 * derecha/izquierda», «Cummins 4B3.9», «1,2 m³ (SAE)») queda como TEXTO tal cual. Un número sin
 * unidad es número con unidad vacía. El valor no se reformatea: «20.500» sigue «20.500».
 */
export function separarValor(texto: string): {
  tipo: TipoValor;
  valor: string;
  unidad: string;
} {
  const t = texto.trim();
  const m = /^(-?\d[\d.,]*)\s*([A-Za-zµ°%²³/]{1,8})?$/.exec(t);
  if (!m) return { tipo: "texto", valor: t, unidad: "" };
  return { tipo: "numero", valor: m[1]!, unidad: m[2] ?? "" };
}

/** Validación del campo «Valor» de una fila: con un atributo numérico, tiene que ser un número. */
export function validarValor(
  valor: string | null | undefined,
  tipoValor: string | null | undefined,
): true | string {
  const v = valor?.trim();
  if (!v) return "Escribe el valor.";
  if (tipoValor === "numero" && !/^-?\d[\d.,]*$/.test(v)) {
    return "Este atributo es numérico: escribe solo el número (la unidad ya la pone el catálogo).";
  }
  return true;
}

/** Validación de la lista: como mucho `MAX_ATRIBUTOS` filas y ninguna repetida. */
export function validarLista(filas: FilaAtributo[] | null | undefined): true | string {
  const lista = filas ?? [];
  if (lista.length > MAX_ATRIBUTOS) {
    return `Caben ${MAX_ATRIBUTOS} atributos destacados y hay ${lista.length}. Quita ${lista.length - MAX_ATRIBUTOS}.`;
  }
  const vistos = new Set<string>();
  for (const f of lista) {
    const id = esCatalogo(f.atributo) ? null : f.atributo;
    if (id === null || id === undefined) continue;
    if (vistos.has(String(id))) return "Hay un atributo repetido: cada atributo solo una vez.";
    vistos.add(String(id));
  }
  return true;
}
