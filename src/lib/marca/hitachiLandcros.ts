/**
 * «HITACHI» PASA A «HITACHI LANDCROS» EN TODA LA WEB (decisión del cliente, 2026-10-26). Lógica pura
 * del script `scripts/marcas/hitachi-landcros.ts`, que cambia los DATOS del panel; las URL no cambian.
 *
 * Una sola forma, «Hitachi LANDCROS», en nombres y en textos, venga como venga: «Hitachi», «HITACHI»,
 * «hitachi», «Hitachi Landcros» o «HITACHI-LANDCROS». Lo que ya dice «Hitachi LANDCROS» no cambia, y
 * una repetición («Hitachi Hitachi LANDCROS») se queda en una.
 *
 * NUNCA dentro de una dirección, un fichero o un correo: «hitachi» pegado a una barra, un guion, un
 * guion bajo, un punto o una arroba («/marcas/hitachi/», «excavadora-hitachi-zx», «hitachi.jpg»,
 * «www.hitachi.com») se queda como está.
 */

export const HITACHI_LANDCROS = "Hitachi LANDCROS";

/**
 * Nombres de la EMPRESA, no de la marca: «Hitachi Construction Machinery» y «Hitachi, Ltd.» (la historia
 * del artículo del blog). «Hitachi LANDCROS, Ltd.» sería falso: se quedan y se avisan.
 */
const EMPRESA = String.raw`\s+Construction\s+Machinery|,\s*Ltd`;
const MARCA = new RegExp(
  String.raw`(?<![\p{L}\p{N}_/.@-])hitachi(?:[\s-]+landcros)?(?![\p{L}\p{N}_/@-]|\.[\p{L}\p{N}]|${EMPRESA})`,
  "giu",
);
/** Pegada a la referencia del modelo («HITACHIZX200-6», «Hitachi-ZX210LC-5»): con un espacio. */
const PEGADA = /(?<![\p{L}\p{N}_/.@-])hitachi-?(?=(?:zx|ex)\d)/giu;
const REPETIDA = /Hitachi LANDCROS(?:\s+Hitachi LANDCROS)+/gu;

/** ¿Nombra la marca fuera de una dirección o un fichero? */
export const nombraHitachi = (texto: string): boolean => {
  MARCA.lastIndex = 0;
  PEGADA.lastIndex = 0;
  return MARCA.test(texto) || PEGADA.test(texto);
};

/** Un texto o un nombre: cada «Hitachi» (con o sin «Landcros») pasa a «Hitachi LANDCROS». */
export function aHitachiLandcros(texto: string): string {
  return texto
    .replace(PEGADA, `${HITACHI_LANDCROS} `)
    .replace(MARCA, HITACHI_LANDCROS)
    .replace(REPETIDA, HITACHI_LANDCROS);
}

/** ¿Nombra a la EMPRESA («Hitachi Construction Machinery», «Hitachi, Ltd.»)? Se queda y se avisa. */
export const nombraEmpresaHitachi = (texto: string): boolean =>
  new RegExp(String.raw`hitachi(?:${EMPRESA})`, "iu").test(texto);

/**
 * Claves que nunca se tocan, aunque su valor nombre la marca: direcciones, ficheros y anclas. La regla
 * ya respeta lo que va pegado a «/», «-», «.»…; esto es una segunda red.
 */
const CLAVES_INTOCABLES =
  /^(slug|slugPadre|url|href|enlace|ruta|origen|destino|ancla|anchor|filename|mimeType|thumbnailURL|prefix|id|blockType|blockName|type|format|youtube|videoUrl|correo|email)$/i;

/** ¿Es un valor de texto que parece una dirección o un correo (no se toca)? */
const pareceDireccion = (v: string): boolean => /^\s*(https?:\/\/|\/|mailto:|www\.)/i.test(v);

/**
 * Copia de un valor cualquiera de Payload (un campo con sus grupos, filas y texto enriquecido) con
 * cada texto pasado por `aHitachiLandcros`, salvo las claves intocables y lo que parece una dirección.
 */
export function aHitachiLandcrosProfundo<T>(valor: T, clave?: string): T {
  if (typeof valor === "string") {
    if (clave && CLAVES_INTOCABLES.test(clave)) return valor;
    return (pareceDireccion(valor) ? valor : aHitachiLandcros(valor)) as T;
  }
  if (Array.isArray(valor)) return valor.map((v) => aHitachiLandcrosProfundo(v, clave)) as T;
  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [
        k,
        CLAVES_INTOCABLES.test(k) && typeof v === "string" ? v : aHitachiLandcrosProfundo(v, k),
      ]),
    ) as T;
  }
  return valor;
}

/**
 * Para el cliente (punto 3 del encargo): un modelo ANTIGUO de Hitachi, anterior a la marca LANDCROS
 * (2024), donde «LANDCROS» puede ser impreciso. Hoy, la serie EX de las excavadoras (y cualquier código
 * que no sea ZAXIS, «ZX…»). El cambio se le aplica igual.
 */
export function esModeloAntiguoHitachi(codigo: string | null | undefined): boolean {
  const c = (codigo ?? "").trim().toUpperCase();
  return c !== "" && !/^ZX/.test(c);
}
