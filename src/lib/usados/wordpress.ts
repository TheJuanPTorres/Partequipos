/**
 * Funciones puras de la importación de maquinaria usada desde WordPress
 * (`scripts/usados/importar-usados.ts`). Detalle y decisiones en
 * `docs/usados-importacion.md`.
 *
 * El número de serie de cada unidad NO se publica (decisión de dirección,
 * 2026-10-07): sale del nombre, de la descripción, del texto alternativo y del
 * nombre del fichero de cada foto. Estas funciones lo quitan y
 * `contieneSerial` comprueba que no quede.
 */
import { textoPlano } from "../blog/wordpress";

/** Categoría de WordPress → la nuestra (slug de `categorias-usada`) y el tipo en singular. */
const EXCAVADORA = { slug: "excavadoras", tipo: "Excavadora" };
const MINIEXCAVADORA = { slug: "miniexcavadoras", tipo: "Miniexcavadora" };
const CATEGORIAS: Record<string, { slug: string; tipo: string }> = {
  excavadoras: EXCAVADORA,
  miniexcavadora: MINIEXCAVADORA,
};

/**
 * Por encima de este peso (t), una unidad SIN categoría es una excavadora; por
 * debajo, una miniexcavadora. En WordPress las miniexcavadoras van de 1,7 a 4 t.
 */
export const PESO_MAXIMO_MINI = 6;

export type Categoria = { slug: string; tipo: string; deducida: boolean };

/**
 * La categoría nuestra de una unidad. Sin categoría en WordPress (hay una), se
 * deduce de su peso; sin peso tampoco, `null`.
 */
export function categoriaDeUnidad(
  categoriaWp: string | null,
  peso: number | null,
): Categoria | null {
  const clave = (categoriaWp ?? "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").trim();
  const directa = CATEGORIAS[clave];
  if (directa) return { ...directa, deducida: false };
  if (clave) return null;
  if (peso === null) return null;
  const deducida = peso < PESO_MAXIMO_MINI ? MINIEXCAVADORA : EXCAVADORA;
  return { ...deducida, deducida: true };
}

/** Nombre de la marca como se escribe («HITACHI» → «Hitachi», «LIUGONG» → «LiuGong»). */
export function nombreDeMarca(marcaWp: string | null): string | null {
  const m = (marcaWp ?? "").trim();
  if (!m) return null;
  const conocidas: Record<string, string> = { liugong: "LiuGong" };
  const k = m.toLowerCase();
  return conocidas[k] ?? k.charAt(0).toUpperCase() + k.slice(1);
}

/** La referencia del modelo, sin espacios sobrantes ni la marca delante («HITACHI ZX40U-5 »). */
export function limpiarReferencia(referencia: string, marca: string | null): string | null {
  let r = referencia.replace(/\s+/g, " ").trim();
  if (marca) r = r.replace(new RegExp(`^${marca}\\s+`, "i"), "");
  return r || null;
}

/** Peso en toneladas: «7,5» y «7.5» → 7,5. Lo que no sea un número, `null`. */
export function normalizarPeso(peso: string): number | null {
  const p = peso.trim().replace(",", ".");
  return /^\d+(\.\d+)?$/.test(p) ? Number(p) : null;
}

/** Año: cuatro cifras entre 1950 y 2100, o `null`. */
export function normalizarAnio(anio: string | null): number | null {
  const a = (anio ?? "").trim();
  if (!/^\d{4}$/.test(a)) return null;
  const n = Number(a);
  return n >= 1950 && n <= 2100 ? n : null;
}

/**
 * Año de la unidad: el de la taxonomía y, si falta, el de la descripción
 * («año 2003»), como el horómetro. Hay una unidad así.
 */
export function anioDeUnidad(
  anioWp: string | null,
  descripcionHtml: string,
): { valor: number | null; origen: "campo" | "descripcion" | "sin dato" } {
  const delCampo = normalizarAnio(anioWp);
  if (delCampo !== null) return { valor: delCampo, origen: "campo" };
  const enTexto = textoPlano(descripcionHtml).match(/\ba[ñn]o\s*:?\s*(\d{4})\b/i)?.[1];
  const valor = normalizarAnio(enTexto ?? null);
  return valor !== null ? { valor, origen: "descripcion" } : { valor: null, origen: "sin dato" };
}

/** Horas escritas como entero («6313») o con punto de miles («4.219», «12.500»). */
function horasDeTexto(t: string): number | null {
  const h = t.replace(/\s+/g, "");
  if (/^\d+$/.test(h)) return Number(h);
  if (/^\d{1,3}(\.\d{3})+$/.test(h)) return Number(h.replace(/\./g, ""));
  return null;
}

export type Horas = {
  valor: number | null;
  /** De dónde sale el valor; «pendiente» y «sin dato» dejan el campo vacío. */
  origen: "campo" | "descripcion" | "pendiente" | "sin dato";
};

/**
 * Horómetro de la unidad. El campo manda; si no se entiende («4.92», con un
 * dígito de menos), se toma el número de la descripción («4.926 horas»).
 * «PENDIENTE» es vacío (decisión de dirección), y no se busca en la descripción.
 */
export function normalizarHoras(campo: string, descripcionHtml: string): Horas {
  if (/pendiente/i.test(campo)) return { valor: null, origen: "pendiente" };
  const delCampo = horasDeTexto(campo);
  if (delCampo !== null) return { valor: delCampo, origen: "campo" };
  const enTexto = textoPlano(descripcionHtml).match(/([\d.]+)\s*horas/i);
  const deDescripcion = enTexto?.[1] ? horasDeTexto(enTexto[1].replace(/\.$/, "")) : null;
  if (deDescripcion !== null) return { valor: deDescripcion, origen: "descripcion" };
  return { valor: null, origen: "sin dato" };
}

/** «Excavadora Hitachi ZX350H-5B 2016»: tipo, marca, modelo y año (lo que haya). */
export function nombreCompuesto(
  tipo: string,
  marca: string | null,
  modelo: string | null,
  anio: number | null,
): string {
  return [tipo, marca, modelo, anio].filter((p) => p !== null && p !== "").join(" ");
}

/**
 * El serial como patrón: tolera espacios entre caracteres («X 9876», «X9876»)
 * y mayúsculas. Un serial vacío no casa con nada.
 */
export function patronSerial(serial: string, banderas = "gi"): RegExp | null {
  const letras = serial.replace(/\s+/g, "");
  if (!letras) return null;
  const escapar = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Bordes: que no sea parte de otra palabra o número más largo.
  return new RegExp(
    `(?<![A-Za-z0-9])${letras.split("").map(escapar).join("\\s*")}(?![A-Za-z0-9])`,
    banderas,
  );
}

/** ¿Queda el serial en el texto? (también pegado: «snx9876», «-x9876-»). */
export function contieneSerial(texto: string, serial: string): boolean {
  const letras = serial.replace(/\s+/g, "").toLowerCase();
  if (!letras) return false;
  return texto.replace(/\s+/g, "").toLowerCase().includes(letras);
}

/**
 * Quita el serial y lo que lo presenta: «y serial X9876», «, serial X 9876»,
 * «SN X9876», «-SN X9876-», «S/N X1». Deja la puntuación limpia.
 */
export function quitarSerial(texto: string, serial: string): string {
  const p = patronSerial(serial);
  if (!p) return texto;
  const presentacion = new RegExp(
    // «, y serial», «con serial», «y con serial»: los enlaces se van con el serial.
    `(?:\\s*,)?(?:\\s+y\\b)?(?:\\s+con\\b)?(?:\\s*-\\s*|\\s+)?(?:(?:n[uú]mero\\s+de\\s+)?serial|serie|s\\/?n)?\\s*[:#.]?\\s*-?\\s*${p.source}`,
    "gi",
  );
  return texto
    .replace(presentacion, "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/,\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Descripción en texto plano y sin el serial. Los emojis que WordPress pinta
 * como imagen (`s.w.org/images/core/emoji`) vuelven a ser su carácter; otras
 * imágenes se quitan (las fotos van en `imagenes`). `null` si el serial no se
 * pudo quitar: entonces la unidad se importa sin descripción.
 */
export function descripcionSinSerial(html: string, serial: string): string | null {
  const conEmojis = html.replace(/<img\b[^>]*>/gi, (img) => {
    if (!/s\.w\.org\/images\/core\/emoji/i.test(img)) return " ";
    return img.match(/\balt="([^"]*)"/i)?.[1] ?? " ";
  });
  // Cada bloque, una línea: así no se pegan frases de párrafos distintos.
  const texto = textoPlano(conEmojis.replace(/<\/(p|div|h\d|li)>|<br\s*\/?>/gi, " . "))
    .replace(/(\s*\.\s*){2,}/g, ". ")
    .replace(/^\s*\.\s*/, "")
    .replace(/\s*\.\s*$/, "");
  const limpio = quitarSerial(texto, serial).replace(/\s*\.\s*\./g, ".");
  if (contieneSerial(limpio, serial)) return null;
  return limpio || null;
}

/**
 * Texto alternativo de una foto: el de WordPress sin el serial ni los restos
 * de numeración del fichero («(1)», «-001»), seguido de «foto n de N» para que
 * las fotos de una misma unidad no se lean iguales. Si no queda nada útil, el
 * nombre compuesto de la unidad.
 */
export function altDeFoto(
  altWp: string,
  serial: string,
  nombre: string,
  n: number,
  total: number,
): string {
  const limpio = quitarSerial(altWp, serial)
    .replace(/\s*\(\d+\)\s*$/, "")
    // Solo con cero delante («-01», «-001»): «ZX200-6» es el modelo, no un número de foto.
    .replace(/[\s-]+0\d{1,2}$/, "")
    .replace(/[\s-]+$/, "")
    .trim();
  const util = limpio.replace(/[^\p{L}]/gu, "").length >= 5 && !contieneSerial(limpio, serial);
  const base = util ? limpio : nombre;
  return total > 1 ? `${base}, foto ${n} de ${total}` : base;
}

/** Extensiones de foto que admite `Media` (sin AVIF: aquí no hay). */
const EXTENSIONES: Record<string, string> = { jpg: "jpg", jpeg: "jpg", png: "png", webp: "webp" };

/**
 * Nombre determinista de una foto en `Media`, SIN el serial (los ficheros de
 * WordPress lo llevan: «Excavadora-HITACHI-ZX9876USR-6-SN-X9876-5.jpg»). Lleva
 * el id del adjunto, que es único y estable, y el nombre de la unidad para que
 * se reconozca en el panel. `null` si no es una foto (hay `.zip`).
 */
export function nombreDeFicheroUsado(
  urlWp: string,
  idAdjunto: number,
  nombre: string,
): string | null {
  const ext = EXTENSIONES[(urlWp.split(".").pop() ?? "").toLowerCase()];
  if (!ext) return null;
  const base = nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `wp-usado-${idAdjunto}-${base}.${ext}`;
}
