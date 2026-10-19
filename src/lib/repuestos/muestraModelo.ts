/*
 * MUESTRA DEL LABORATORIO de la página de modelo de repuestos (2026-10-19).
 *
 * Los textos de WordPress que la base todavía NO tiene (antetítulo, título,
 * «repuestos disponibles para…» y la lista de piezas), copiados TAL CUAL de
 * los 3 modelos de la muestra, con sus erratas. Solo existe para que dirección
 * apruebe el aspecto antes de la migración: cuando estos textos sean campos
 * del modelo, este fichero y el laboratorio se borran.
 *
 * Las categorías de cada tipo son las de la plantilla de WordPress de ese tipo
 * de máquina (43095 «BULLDOZER EXCAVADORA»: 10; 43363 «RETROCARGADOR»: 9, sin
 * tren de rodaje). En la página real se eligen UNA VEZ POR TIPO en el panel.
 */

export type MuestraModelo = {
  /** Slug del modelo en la base. */
  slug: string;
  antetitulo: string;
  /** El título de WordPress: va como `<h1>`. */
  titulo: string;
  disponibles: string;
  /** La lista de piezas de WordPress, tal cual. */
  piezas: string[];
  /** `false`: WordPress la oculta en los tres tamaños (se guarda, no se pinta). */
  piezasVisibles: boolean;
  /** Slugs de las categorías técnicas de la plantilla de su tipo, en el orden de WordPress. */
  categorias: string[];
};

const PIEZAS = [
  "Filtros",
  "empaquetadura",
  "lubricantes",
  "componentes completos",
  "partes eléctricas",
  "tren de rodaje",
  "elemento de desgaste",
  "tren de rodaje",
  "herramienta de corte",
  "Baldes y protectores",
  "llantas",
  "componentes Motor diesel",
  "Motor diesel completos",
];

const piezasPara = (maquina: string) => PIEZAS.map((p) => `- ${p} para ${maquina}`);

/** Plantilla 43095 «BULLDOZER EXCAVADORA» de WordPress: las 10 categorías. */
const EXCAVADORA = [
  "tren-de-rodaje-para-maquinaria-pesada",
  "filtracion-para-maquinaria-pesada",
  "herramienta-de-corte-gets-para-maquinaria-pesada",
  "lubricantes-para-maquinaria-pesada",
  "llantas-y-rines-para-maquinaria-pesada",
  "miscelaneos-para-maquinaria-pesada",
  "componentes-mayores-para-maquinaria-pesada",
  "motor-diesel-para-maquinaria-pesada",
  "transmision-para-maquinaria-pesada",
  "componentes-hidraulicos-para-maquinaria-pesada",
];

/** Plantilla 43363 «RETROCARGADOR»: las mismas sin tren de rodaje. */
const RETROCARGADOR = EXCAVADORA.filter((s) => !s.startsWith("tren-de-rodaje"));

export const MUESTRAS_MODELO: Record<string, MuestraModelo> = {
  ex100: {
    slug: "repuestos-excavadora-hitachi-ex100",
    antetitulo: "Repuestos para Maquinaria Pesada",
    titulo: "HITACHI Excavadora EX100",
    disponibles: "repuestos disponibles para excavadora hitachi EX100",
    piezas: piezasPara("excavadora hitachi EX100"),
    piezasVisibles: true,
    categorias: EXCAVADORA,
  },
  zx200: {
    slug: "repuestos-excavadora-hitachi-zx-200",
    antetitulo: "Repuestos para Maquinaria Pesada",
    titulo: "HITACHI Excavadora ZX200",
    disponibles: "repuestos disponibles para excavadora hitachi zx200",
    piezas: piezasPara("excavadora hitachi zx200"),
    piezasVisibles: false,
    categorias: EXCAVADORA,
  },
  "580sn": {
    slug: "repuestos-retrocargadora-case-construction-580sn",
    antetitulo: "Repuestos para Maquinaria Pesada",
    titulo: "CASE CONSTRUCTION RETROCARGADORA 580SN",
    disponibles: "repuestos disponibles para retrocargadora 580sn",
    piezas: piezasPara("RETROCARGADORA CASE CONSTRUCTION 580SN"),
    piezasVisibles: false,
    categorias: RETROCARGADOR,
  },
};

/**
 * Texto alternativo exacto de la foto propia de WordPress de la tarjeta «ESTAMOS
 * AQUÍ PARA AYUDARLO» (la misma en todas las marcas). Así la reconocen el script
 * que la sube al preview (`scripts/repuestos/ayuda-modelo-preview.ts`) y el
 * laboratorio; con la migración se elegirá en un campo del panel.
 */
export const ALT_AYUDA_MODELO =
  "Excavadora Hitachi naranja sobre un montón de tierra, bajo un cielo con nubes";
