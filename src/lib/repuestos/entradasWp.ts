/**
 * LAS «OTRAS ENTRADAS» DE LAS LISTAS DE WORDPRESS (2026-10-17, decisión del
 * cliente: se migra todo como está, erratas incluidas). Inventario: las listas
 * desplegables de modelos de las 13 páginas de marca y las 33 de tipo
 * publicadas, comparadas por código con las páginas de modelo de la
 * extracción. Lo que nombran y NO es un modelo de su tipo:
 *
 * - 4 modelos SIN página propia: van como texto, sin enlace.
 * - «EX450LC-5» en la serie EX de miniexcavadora de Hitachi: no existe; la
 *   página real es la excavadora ZX450LC-5, y a ella enlaza (errata anotada
 *   para el cliente, docs/repuestos-importacion.md §12).
 *
 * El resto de diferencias de texto son erratas de modelos que SÍ tienen página
 * («ZX75US-3» por ZX75U-3, «HX340SL» por HX34OSL…): salen con su ficha.
 * Las usa `scripts/repuestos/entradas-wp.ts`.
 */

export type EntradaWp = {
  marca: string;
  tipo: string;
  texto: string;
  /** Solo en un tipo con series. */
  serie?: string;
  /** La ficha a la que enlaza: tipo y slug del modelo (de la misma marca). */
  enlace?: { tipo: string; modelo: string };
};

const M = "repuestos-para-maquinaria-pesada-";

export const ENTRADAS_WP: EntradaWp[] = [
  {
    marca: `${M}caterpillar`,
    tipo: `${M}buldozer-caterpillar`,
    texto: "Bulldozer Caterpillar D6D",
  },
  {
    marca: `${M}caterpillar`,
    tipo: `${M}excavadora-caterpillar`,
    texto: "Excavadora Caterpillar 326D2",
  },
  {
    marca: `${M}caterpillar`,
    tipo: `${M}retrocargador-caterpillar`,
    texto: "Retrocargadora Caterpillar 426B",
  },
  {
    marca: `${M}yanmar`,
    tipo: `${M}miniexcavadora-yanmar`,
    texto: "Miniexcavadora YANMAR VIO 70-3",
  },
  {
    marca: `${M}hitachi`,
    tipo: `${M}miniexcavadora-hitachi`,
    texto: "Miniexcavadora Hitachi LANDCROS EX450LC-5",
    serie: "EX",
    enlace: { tipo: `${M}excavadora-hitachi`, modelo: "repuestos-excavadora-hitachi-zx450lc-5" },
  },
];
