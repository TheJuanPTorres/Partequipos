/**
 * Lógica pura del importador del contenido de las páginas de MODELO de
 * WordPress (`scripts/repuestos/importar-modelos-wp.ts`, 2026-10-19).
 * Detalle en docs/repuestos-importacion.md §13.
 */

/** Una página de modelo, tal como la saca `scripts/repuestos/extraer-modelos-wp.py`. */
export type PaginaModeloWp = {
  ruta: string;
  tituloWp: string;
  antetitulo: string;
  titulo: string;
  parrafo: string;
  disponibles: string;
  piezas: string[];
  piezasVisibles: boolean;
  /** Ids de las plantillas de Elementor incrustadas (sin la del formulario). */
  plantillas: string[];
};

/** Texto alternativo de la foto propia de WordPress de la tarjeta «Estamos aquí para ayudarlo». */
export const ALT_FOTO_AYUDA =
  "Excavadora Hitachi LANDCROS naranja sobre un montón de tierra, bajo un cielo con nubes";

const CATEGORIAS = {
  rodaje: "tren-de-rodaje-para-maquinaria-pesada",
  filtracion: "filtracion-para-maquinaria-pesada",
  corte: "herramienta-de-corte-gets-para-maquinaria-pesada",
  lubricantes: "lubricantes-para-maquinaria-pesada",
  llantas: "llantas-y-rines-para-maquinaria-pesada",
  miscelaneos: "miscelaneos-para-maquinaria-pesada",
  mayores: "componentes-mayores-para-maquinaria-pesada",
  diesel: "motor-diesel-para-maquinaria-pesada",
  transmision: "transmision-para-maquinaria-pesada",
  hidraulicos: "componentes-hidraulicos-para-maquinaria-pesada",
} as const;
const SIN_RODAJE = [
  CATEGORIAS.filtracion,
  CATEGORIAS.corte,
  CATEGORIAS.lubricantes,
  CATEGORIAS.llantas,
  CATEGORIAS.miscelaneos,
  CATEGORIAS.mayores,
  CATEGORIAS.diesel,
  CATEGORIAS.transmision,
  CATEGORIAS.hidraulicos,
];

/**
 * Las categorías de cada plantilla de WordPress, en su orden, leídas de sus
 * botones «VER TODOS» en el XML (2026-10-19). Las plantillas que no son de
 * categorías (testimonios 43433, «Triada» 43429, sedes 35576) no cuentan.
 */
export const CATEGORIAS_DE_PLANTILLA: Record<string, readonly string[]> = {
  // «Repuestos BULLDOZER EXCAVADORA (Todos)»
  "43095": [CATEGORIAS.rodaje, ...SIN_RODAJE],
  // «Repuestos MINIEXCAVADORA (Todos)»
  "43283": [CATEGORIAS.rodaje, CATEGORIAS.filtracion, CATEGORIAS.corte, CATEGORIAS.lubricantes],
  // «Repuestos CARGADOR MOTONIVELADORA (Todos)», «RETROCARGADOR (todos)», «MINICARGADOR (todos)»
  "43307": SIN_RODAJE,
  "43363": SIN_RODAJE,
  "43404": SIN_RODAJE,
  // «Martillos OKADA (Puntas)»: «Misceláneos y PUNTAS de martillo»
  "45834": [CATEGORIAS.miscelaneos],
};

/**
 * Las categorías de un tipo, a partir de las plantillas de sus modelos: las
 * de la plantilla MÁS USADA (en WordPress, la plantilla iba por página, pero es
 * la misma en todos los modelos de un tipo salvo excepciones, que se avisan en
 * `mezcla`). Sin plantilla de categorías, ninguna.
 */
export function categoriasDePlantillas(listas: string[][]): {
  slugs: readonly string[];
  mezcla: string | null;
} {
  const cuenta = new Map<string, number>();
  for (const lista of listas) {
    const deCategorias = lista.filter((id) => id in CATEGORIAS_DE_PLANTILLA);
    const clave = deCategorias[0] ?? "";
    cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1);
  }
  const conPlantilla = [...cuenta].filter(([k]) => k);
  if (conPlantilla.length === 0) return { slugs: [], mezcla: null };
  conPlantilla.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const [ganadora] = conPlantilla[0]!;
  const mezcla =
    cuenta.size > 1
      ? [...cuenta]
          .map(([k, n]) => `${k || "ninguna"}×${n}`)
          .sort()
          .join(", ")
      : null;
  return { slugs: CATEGORIAS_DE_PLANTILLA[ganadora] ?? [], mezcla };
}

/**
 * ¿Los dos textos son el mismo salvo espacios? Es la huella del defecto del
 * importador anterior, que cambiaba una etiqueta interna de una palabra por un
 * espacio («E xcavadora» donde WordPress pinta «Excavadora»).
 */
export function mismoTextoSalvoEspacios(a: string, b: string): boolean {
  const sin = (t: string) => t.replace(/\s+/g, "");
  return sin(a) === sin(b);
}
