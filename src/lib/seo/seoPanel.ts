import type { CollectionSlug } from "payload";

import { tituloPorDefecto } from "./porDefecto";

/**
 * Para el panel: de dónde saca cada página su título, su descripción y su
 * imagen social cuando el grupo «Buscadores y redes sociales» está vacío.
 * Refleja el `generateMetadata` de cada página (y usa sus mismas plantillas de
 * `porDefecto.ts`). Solo funciones puras: lo usa un componente de cliente.
 */

/** Nombres ya resueltos de las relaciones (marca, tipo) del documento. */
export type Nombres = { marca?: string | null; tipo?: string | null };

export type ReglaSeo = {
  /** Campo del documento con el nombre o el título. */
  campoNombre: "nombre" | "titulo";
  /** Relaciones cuyo nombre entra en el título por defecto. */
  relaciones?: { marca?: CollectionSlug; tipo?: CollectionSlug };
  /** Título por defecto; null si falta algún nombre. */
  titulo: (nombre: string, n: Nombres) => string | null;
  /** Campo cuyo texto es la descripción por defecto. */
  campoDescripcion: "descripcion" | "entradilla";
  /** Qué imagen gana a «Imagen al compartir en redes», dicho para el editor. */
  imagen: string | null;
};

const conMarca = (f: (nombre: string, marca: string) => string) => (nombre: string, n: Nombres) =>
  n.marca ? f(nombre, n.marca) : null;
const tal = (nombre: string) => nombre;

export const SEO_POR_COLECCION: Partial<Record<CollectionSlug, ReglaSeo>> = {
  "tipos-equipo": {
    campoNombre: "nombre",
    relaciones: { marca: "marcas" },
    titulo: conMarca(tituloPorDefecto.tipoRepuesto),
    campoDescripcion: "descripcion",
    imagen: null,
  },
  "modelos-repuesto": {
    campoNombre: "nombre",
    titulo: tituloPorDefecto.modeloRepuesto,
    campoDescripcion: "descripcion",
    imagen: "Si el modelo tiene imágenes, se usa la primera de la galería.",
  },
  "marcas-maquinaria": {
    campoNombre: "nombre",
    titulo: tituloPorDefecto.marcaMaquinaria,
    campoDescripcion: "descripcion",
    imagen: "Si la marca tiene logo, se usa el logo.",
  },
  "tipos-maquinaria": {
    campoNombre: "nombre",
    relaciones: { marca: "marcas-maquinaria" },
    titulo: conMarca(tituloPorDefecto.tipoMaquinaria),
    campoDescripcion: "descripcion",
    imagen: null,
  },
  "equipos-nuevos": {
    campoNombre: "nombre",
    titulo: tal,
    campoDescripcion: "entradilla",
    imagen: "Si el equipo tiene imágenes, se usa la primera de la galería.",
  },
  "categorias-maquinaria": {
    campoNombre: "nombre",
    titulo: tituloPorDefecto.categoriaNueva,
    campoDescripcion: "descripcion",
    imagen: null,
  },
  "categorias-usada": {
    campoNombre: "nombre",
    titulo: tituloPorDefecto.categoriaUsada,
    campoDescripcion: "descripcion",
    imagen: null,
  },
  "marcas-lubricante": {
    campoNombre: "nombre",
    titulo: tituloPorDefecto.marcaLubricante,
    campoDescripcion: "entradilla",
    imagen: "Si la marca tiene logo, se usa el logo.",
  },
  "categorias-lubricante": {
    campoNombre: "nombre",
    relaciones: { marca: "marcas-lubricante" },
    titulo: conMarca(tituloPorDefecto.categoriaLubricante),
    campoDescripcion: "entradilla",
    imagen: "Si la categoría tiene imagen, se usa esa.",
  },
  "categorias-blog": {
    campoNombre: "nombre",
    titulo: tal,
    campoDescripcion: "descripcion",
    imagen: null,
  },
  articulos: {
    campoNombre: "titulo",
    titulo: tal,
    campoDescripcion: "entradilla",
    imagen: "Si el artículo tiene imagen destacada, se usa esa.",
  },
  paginas: {
    campoNombre: "titulo",
    titulo: tal,
    campoDescripcion: "entradilla",
    imagen: null,
  },
};

/** Estado de una longitud frente a lo recomendado, para el contador. */
export function estadoLongitud(
  largo: number,
  rango: { min?: number; max: number },
): "vacio" | "corto" | "bien" | "largo" {
  if (largo === 0) return "vacio";
  if (largo > rango.max) return "largo";
  if (rango.min && largo < rango.min) return "corto";
  return "bien";
}
