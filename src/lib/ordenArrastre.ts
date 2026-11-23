/**
 * EL ORDEN POR ARRASTRE DEL PANEL EN LA WEB (2026-11-19, dirección; informe del panel §6.3).
 *
 * Las colecciones ordenables (`orderable`) guardan su orden en `_order`; las que se ordenan DENTRO
 * de otra (un join ordenable: los tipos de una marca, los equipos de un tipo, las líneas de una
 * marca de lubricante) lo guardan en `_<hija>_<join>_order`, que solo tiene sentido entre filas
 * del mismo padre. Las consultas públicas ordenan con `ordenDe(<colección>)` y no con «Orden» ni
 * con el nombre: lo vigila `ordenArrastre.test.ts`.
 *
 * Las claves son de indexación fraccionaria (letras y números ASCII) y Postgres las ordena por
 * bytes porque la base es `C.UTF-8` (medido en el preview, 2026-11-19): comparar en JavaScript
 * con `<` da lo mismo (`porClave`). Con otra intercalación, `porClave` dejaría de coincidir.
 */
export const ORDEN_ARRASTRE = {
  "marcas-maquinaria": "_order",
  "categorias-maquinaria": "_order",
  // Dentro de su marca (join `tipos` de `marcas-maquinaria`).
  "tipos-maquinaria": "_tipos-maquinaria_tipos_order",
  // Dentro de su tipo (join `equipos` de `tipos-maquinaria`).
  "equipos-nuevos": "_equipos-nuevos_equipos_order",
  "categorias-usada": "_order",
  "marcas-usada": "_order",
  "marcas-lubricante": "_order",
  // Dentro de su marca (join `lineas` de `marcas-lubricante`).
  "categorias-lubricante": "_categorias-lubricante_lineas_order",
  marcas: "_order",
  "categorias-tecnicas": "_order",
  // Dentro de su marca (join `tipos` de `marcas`).
  "tipos-equipo": "_tipos-equipo_tipos_order",
  // Dentro de su tipo (join `modelos` de `tipos-equipo`).
  "modelos-repuesto": "_modelos-repuesto_modelos_order",
  sedes: "_order",
  testimonios: "_order",
  "preguntas-frecuentes": "_order",
  "atributos-ficha": "_order",
} as const;

export type ColeccionOrdenable = keyof typeof ORDEN_ARRASTRE;

/** El `sort` de una consulta pública: el orden por arrastre de la colección. */
export const ordenDe = <C extends ColeccionOrdenable>(coleccion: C): (typeof ORDEN_ARRASTRE)[C] =>
  ORDEN_ARRASTRE[coleccion];

/**
 * El mismo orden en JavaScript, para lo que se agrupa después de leer (los grupos de una
 * categoría de nueva por marca y tipo). Sin clave (una fila anterior a la migración), al final.
 */
export function porClave(a: string | null | undefined, b: string | null | undefined): number {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a < b ? -1 : 1;
}
