/**
 * REDIRECCIONES DE LAS URL HEREDADAS DE CATEGORÍA DE REPUESTOS.
 *
 * El rastreo (`docs/url-map.csv`) tiene, bajo
 * `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/`,
 * 35 URL vivas: el índice, las 10 categorías que ya tienen página y estas 21
 * heredadas (duplicadas con otro slug y subniveles). Decisión de dirección
 * (2026-10-13): cada una redirige con 301 a su categoría equivalente, y los
 * subniveles (`tren-de-rodaje-itr`…) a su categoría madre.
 *
 * ESTA LISTA ES LA FUENTE DE LA MIGRACIÓN `…_redirects_categorias_heredadas`, que
 * por regla (CLAUDE.md §3.5) no puede importar nada de `src/`: lleva una copia
 * literal, y `categoriasHeredadas.test.ts` exige que las dos coincidan.
 *
 * Rutas como las guarda la colección `redirects`: sin barra final.
 */
const RAIZ = "/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada";
const SUFIJO = "-para-maquinaria-pesada";

/** Las 10 categorías con página, por su slug de URL. */
export const CATEGORIAS_CON_PAGINA = [
  "tren-de-rodaje",
  "filtracion",
  "herramienta-de-corte-gets",
  "lubricantes",
  "miscelaneos",
  "componentes-mayores",
  "motor-diesel",
  "transmision",
  "componentes-hidraulicos",
  "llantas-y-rines",
].map((s) => `${s}${SUFIJO}`);

const categoria = (base: string) => `${RAIZ}/${base}${SUFIJO}`;
const desde = (resto: string) => `${RAIZ}/${resto}`;

/** Destinos que no son una de las 10 categorías (cada uno, con su motivo). */
export const OTROS_DESTINOS = {
  indice: RAIZ,
  /** «Servicio técnico»: tiene su propia página institucional. */
  servicioTecnico: "/servicio-tecnico",
  /** Los aditamentos viven como marca de la línea de maquinaria nueva. */
  aditamentos: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos",
} as const;

export const REDIRECTS_HEREDADAS: ReadonlyArray<readonly [desde: string, hacia: string]> = [
  [desde("aditamentos-para-maquinaria-pesada"), OTROS_DESTINOS.aditamentos],
  [desde("baldes-y-protectores"), categoria("herramienta-de-corte-gets")],
  [desde("baldes-y-protectores/baldes-para-excavadoras"), categoria("herramienta-de-corte-gets")],
  [desde("baldes-y-protectores/motores-nuevo"), categoria("herramienta-de-corte-gets")],
  [desde("componentes-electricos"), categoria("miscelaneos")],
  [desde("componentes-para-motores-diesel"), categoria("motor-diesel")],
  [desde("elementos-de-ajuste"), categoria("miscelaneos")],
  [desde("empaquetaduras"), categoria("motor-diesel")],
  [
    desde("filtracion-para-maquinaria-pesada/filtros-donaldson-maquinaria-pesada"),
    categoria("filtracion"),
  ],
  [desde("filtros-maquinaria-pesada"), categoria("filtracion")],
  [desde("filtros-maquinaria-pesada/filtros-fleetguard"), categoria("filtracion")],
  [desde("herramientas-de-corte"), categoria("herramienta-de-corte-gets")],
  [desde("llantas"), categoria("llantas-y-rines")],
  [desde("llantas/llantas-otr"), categoria("llantas-y-rines")],
  [desde("mangueras-para-maquinaria-pesada"), categoria("componentes-hidraulicos")],
  [desde("motores-diesel-completos"), categoria("motor-diesel")],
  [desde("productos"), OTROS_DESTINOS.indice],
  [desde("servicio-tecnico-para-maquinaria-pesada"), OTROS_DESTINOS.servicioTecnico],
  [desde("tren-de-rodaje"), categoria("tren-de-rodaje")],
  [desde("tren-de-rodaje/tren-de-rodaje-cf"), categoria("tren-de-rodaje")],
  [desde("tren-de-rodaje/tren-de-rodaje-itr"), categoria("tren-de-rodaje")],
];
