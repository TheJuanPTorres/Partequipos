/**
 * Reglas puras del importador de «Qué incluye» de las categorías técnicas
 * (`scripts/repuestos/importar-grupos-categorias.ts`, docs/repuestos-importacion.md §8).
 */

/** Prefijo de las fotos que sube el importador: así se reconocen sin repetirlas. */
export const PREFIJO_GRUPO = "wp-grupo-";

/** Fuente: lo que saca `scripts/repuestos/extraer-categorias-grupos.py` del XML. */
export type FuenteGrupos = {
  categorias: {
    slug: string;
    grupos: { nombre: string; imagen: { url: string; alt: string }; productos: string[] }[];
  }[];
};

export type GrupoEscrito = {
  nombre: string;
  imagen?: number | null;
  productos: { texto: string }[];
};

/** Nombre del fichero en el Blob: prefijo, categoría, posición y extensión del de WordPress. */
export function ficheroGrupo(slugCategoria: string, posicion: number, urlWp: string): string {
  const ext = (urlWp.match(/\.(jpe?g|png|webp)(?:\?|$)/i)?.[1] ?? "jpg").toLowerCase();
  const corto = slugCategoria
    .replace(/-para-maquinaria-pesada$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return `${PREFIJO_GRUPO}${corto}-${posicion + 1}.${ext}`;
}

/** Huella de los textos de unos grupos (sin fotos): sirve para saber si alguien los tocó. */
export function firmaDeGrupos(
  grupos:
    { nombre?: string | null; productos?: { texto?: string | null }[] | null }[] | null | undefined,
): string {
  return JSON.stringify(
    (grupos ?? []).map((g) => [g.nombre ?? "", (g.productos ?? []).map((p) => p.texto ?? "")]),
  );
}

/**
 * ¿Se escribe «Qué incluye» en una categoría? Solo si está vacío o si es lo que
 * escribió esta misma importación (la huella coincide con la del manifiesto):
 * entonces se vuelve a escribir sin duplicar. Si no, lo cargó o lo cambió alguien
 * en el panel y NO se pisa (decisión de dirección, 2026-10-16: lo elegido en el
 * panel se respeta).
 */
export function accionGrupos(
  actual: Parameters<typeof firmaDeGrupos>[0],
  firmaEscrita: string | null,
): "escribir" | "conservar" {
  if (!actual || actual.length === 0) return "escribir";
  return firmaEscrita !== null && firmaDeGrupos(actual) === firmaEscrita ? "escribir" : "conservar";
}
