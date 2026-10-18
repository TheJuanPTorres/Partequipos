/**
 * ADITAMENTOS de WordPress (2026-10-16, decisiones de dirección en
 * `docs/aditamentos-importacion.md`). Módulo puro: lo usan el importador
 * (`scripts/aditamentos/importar.ts`) y las pruebas.
 *
 * - NUEVOS: las 12 tarjetas del catálogo de 2025, a `equipos-nuevos` de la
 *   marca «aditamentos» (tipos «excavadoras» y «minicargadores»).
 * - USADOS: las 4 unidades de `…/aditamentos/aditamentos/`, a `equipos-usados`
 *   en la categoría nueva «Aditamentos», marcadas para la pestaña de la portada.
 *
 * El serial no llega aquí: el extractor descarta esas líneas.
 */
import { nombreCompuesto } from "../usados/wordpress";
import { formatSlug } from "../utils/formatSlug";

export const SLUG_MARCA_ADITAMENTOS = "aditamentos";
export const SLUG_CATEGORIA_USADA_ADITAMENTOS = "aditamentos";
export const NOMBRE_CATEGORIA_USADA_ADITAMENTOS = "Aditamentos";
export type TipoAditamento = "excavadoras" | "minicargadores";

/**
 * Texto de WordPress TAL CUAL, con sus mayúsculas y sus erratas («ACOPLE
 * RAPIDO»), solo con los espacios plegados (decisión del cliente, 2026-10-18;
 * hasta entonces se pasaba a mayúscula inicial y se corregía «rapido»).
 */
const talCual = (texto: string) => texto.replace(/\s+/g, " ").trim();

/**
 * Nombre de un aditamento nuevo: «MARTILLO PARA MAQUINARIA PESADA» en el tipo
 * «minicargadores» → «MARTILLO PARA MINICARGADORES». En WordPress todos los
 * títulos acaban en «para maquinaria pesada» y dos se repiten (martillo y
 * brazo) entre los dos tipos; con el tipo en el nombre se distinguen en el
 * panel, en el buscador y en la pestaña del navegador. El resto, tal cual
 * (en mayúsculas, como en WordPress).
 */
export function nombreDeAditamentoNuevo(titulo: string, tipo: TipoAditamento): string {
  const base = talCual(titulo.replace(/\s*para\s+maquinaria\s+pesada\s*$/i, ""));
  return `${base} PARA ${tipo.toLocaleUpperCase("es")}`;
}

/** Marcas de los aditamentos usados, con su forma escrita. */
const MARCAS: Record<string, string> = { okada: "Okada", npk: "NPK" };
/** Rótulos de WordPress que no son una marca ni un tipo: el aditamento es genérico. */
const SIN_MARCA = new Set(["after market"]);

export type DatosUsado = {
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
};

/**
 * Tipo, marca y modelo de una unidad a partir de sus dos títulos de WordPress
 * (el primero es la categoría o la marca; el segundo, el modelo):
 *
 * - «OKADA» / «OKADA TOP 100» → marca Okada, modelo «TOP 100»;
 * - «MARTILLO» / «NPK» → tipo Martillo, marca NPK;
 * - «CRUSHER» / «NPK G-17» → tipo Crusher, marca NPK, modelo «G-17»;
 * - «AFTER MARKET» / «ACOPLE RÁPIDO PARA EXCAVADORA» → solo el tipo.
 *
 * Tipo y modelo, tal cual (en mayúsculas); la marca, con su forma escrita.
 */
export function datosDeTitulos(categoria: string, modelo: string): DatosUsado {
  const cat = categoria.replace(/\s+/g, " ").trim();
  const mod = modelo.replace(/\s+/g, " ").trim();
  if (SIN_MARCA.has(cat.toLowerCase())) return { tipo: talCual(mod), marca: null, modelo: null };
  const marcaCat = MARCAS[cat.toLowerCase()];
  const primera = mod.split(" ")[0]!.toLowerCase();
  const marcaMod = MARCAS[primera];
  const resto = (s: string) => s.split(" ").slice(1).join(" ") || null;
  if (marcaCat) {
    // «OKADA» / «OKADA TOP 100»: el modelo repite la marca.
    return {
      tipo: null,
      marca: marcaCat,
      modelo: primera === cat.toLowerCase() ? resto(mod) : mod,
    };
  }
  if (marcaMod) return { tipo: talCual(cat), marca: marcaMod, modelo: resto(mod) };
  return { tipo: talCual(cat), marca: null, modelo: mod };
}

/** El nombre, en mayúsculas como en WordPress («OKADA TOP 100»); la marca enlazada sigue «Okada». */
export function nombreDeAditamentoUsado(d: DatosUsado, anio: number | null): string {
  return nombreCompuesto(d.tipo ?? "", d.marca?.toLocaleUpperCase("es") ?? null, d.modelo, anio);
}

export type FichaUsado = {
  pesoOperativo: number | null;
  anio: number | null;
  horometro: number | null;
  /** Lo que no es peso, horas ni año («Para maquinaria de 20 toneladas.»). */
  descripcion: string | null;
};

const numero = (s: string) => Number(s.replace(",", "."));

/**
 * Los datos de la lista de WordPress («Peso: 1.1 toneladas», «Horas: N/A»,
 * «Año: 2015», «Para maquinaria de: 20 toneladas»). «N/A», «-» y «0
 * toneladas» son «sin dato»: no se publican como valor.
 */
export function fichaDeUsado(lineas: string[]): FichaUsado {
  const ficha: FichaUsado = { pesoOperativo: null, anio: null, horometro: null, descripcion: null };
  const otras: string[] = [];
  for (const cruda of lineas) {
    const linea = cruda.replace(/\s+/g, " ").trim();
    const [, clave = "", valor = ""] = linea.match(/^([^:]+):\s*(.*)$/) ?? [];
    const c = clave.trim().toLowerCase();
    if (c === "peso") {
      const t = valor.match(/^(\d+(?:[.,]\d+)?)\s*toneladas?$/i);
      if (t && numero(t[1]!) > 0) ficha.pesoOperativo = numero(t[1]!);
    } else if (c === "horas") {
      const h = valor.replace(/\./g, "").match(/^(\d+)/);
      if (h && Number(h[1]) > 0) ficha.horometro = Number(h[1]);
    } else if (c === "año") {
      if (/^\d{4}$/.test(valor.trim())) ficha.anio = Number(valor.trim());
    } else if (/serial/.test(c)) {
      // Nunca se publica (el extractor ya lo descarta; esto es la segunda barrera).
    } else {
      otras.push(linea);
    }
  }
  // Las demás líneas, tal cual (decisión del cliente, 2026-10-18).
  const frases = otras.filter((o) => o.length > 1);
  ficha.descripcion = frases.length ? frases.join(" ") : null;
  return ficha;
}

const EXTENSIONES: Record<string, string> = { jpg: "jpg", jpeg: "jpg", png: "png", webp: "webp" };

/** `wp-aditamento-<id del adjunto>-<nombre>.jpg`; `null` si no es una foto. */
export function nombreDeFicheroAditamento(
  urlWp: string,
  idAdjunto: number,
  nombre: string,
): string | null {
  const ext = EXTENSIONES[(urlWp.split(".").pop() ?? "").toLowerCase()];
  return ext ? `wp-aditamento-${idAdjunto}-${formatSlug(nombre)}.${ext}` : null;
}

/** Texto alternativo propio: los de WordPress son genéricos o faltan. */
export function altDeAditamento(nombre: string, n: number, total: number): string {
  return total > 1 ? `${nombre}, foto ${n} de ${total}` : nombre;
}

/**
 * FOTOS REPETIDAS DE UN CARRUSEL. WordPress repite una misma foto en varios
 * tamaños o con dos nombres («OKADA-1-1.jpg» y «OKADA-1-2.jpg» son el mismo
 * fichero, y «OKADA-1-768x576-1.jpg» es su versión pequeña). Se agrupan por su
 * huella visual (64 bits de una miniatura de 8 × 8 en grises, que calcula el
 * importador) y de cada grupo queda la de más píxeles.
 */
export type HuellaFoto = { clave: string; bits: number[]; pixeles: number };

export function distancia(a: number[], b: number[]): number {
  let d = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) d++;
  return d;
}

/** Las claves que se quedan, en el orden original; `umbral` = bits distintos tolerados. */
export function fotosDistintas(fotos: HuellaFoto[], umbral = 6): string[] {
  const grupos: HuellaFoto[][] = [];
  for (const f of fotos) {
    const g = grupos.find((x) => distancia(x[0]!.bits, f.bits) <= umbral);
    if (g) g.push(f);
    else grupos.push([f]);
  }
  const elegidas = new Set(
    grupos.map((g) => g.reduce((m, f) => (f.pixeles > m.pixeles ? f : m)).clave),
  );
  return fotos.filter((f) => elegidas.has(f.clave)).map((f) => f.clave);
}
