import type { Catalogo } from "../filtros/tipos";
import type { ImagenLista } from "../utils/relations";

/**
 * Piezas PURAS del índice del blog (plantilla «Blog» de Andrés, 2026-10-21):
 * la fila que pinta cada tarjeta, el catálogo de filtros del módulo común
 * (`src/lib/filtros/`: una faceta, «categoría»), el extracto de unos 100
 * caracteres y la búsqueda por texto. Sin Payload ni React: se prueban solas.
 */

/** Artículos por página del índice (3 columnas × 3 filas). */
export const POR_PAGINA_BLOG = 9;

/** Parámetro de la búsqueda por texto. No es una faceta: es texto libre. */
export const CLAVE_BUSQUEDA = "buscar";

/** Largo máximo de lo que se busca: una URL inventada no puede pedir un libro. */
export const MAX_BUSQUEDA = 60;

/** Lo que necesita el índice de un artículo (sin el cuerpo: va a la caché de datos). */
export type ArticuloLista = {
  id: number;
  slug: string;
  titulo: string;
  /** ISO, la fecha que ordena el blog. */
  fecha: string;
  /** Unos 100 caracteres, cortados en una palabra. */
  extracto: string;
  imagen: ImagenLista | null;
  categoria: { slug: string; nombre: string } | null;
  /** Texto en minúsculas y sin tildes sobre el que busca el campo «Buscar…». */
  indice: string;
  /** Minutos de lectura (≈ 200 palabras por minuto), al menos 1. */
  minutos: number;
};

/** Minúsculas, sin tildes ni signos dobles de espacio. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Unos `largo` caracteres del texto, cortados en el límite de una palabra y
 * con «…» si se cortó. El corte nunca deja una palabra a medias ni un signo
 * suelto al final.
 */
export function extracto(texto: string, largo = 100): string {
  // WordPress deja «fallar.Primero» sin espacio entre párrafos: se restituye (no toca «S.A.S»).
  const limpio = texto
    .replace(/([a-záéíóúñ])([.!?])([A-ZÁÉÍÓÚÑ¿¡])/g, "$1$2 $3")
    .replace(/\s+/g, " ")
    .trim();
  if (limpio.length <= largo) return limpio;
  const corte = limpio.slice(0, largo + 1);
  const ultimoEspacio = corte.lastIndexOf(" ");
  const base = (ultimoEspacio > largo * 0.5 ? corte.slice(0, ultimoEspacio) : corte.slice(0, largo))
    .replace(/[\s.,;:!?¡¿\-–—(]+$/u, "")
    .trim();
  return `${base}…`;
}

/** Minutos de lectura de un texto: 200 palabras por minuto, mínimo 1. */
export function minutosDeLectura(texto: string): number {
  const palabras = texto.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
}

/**
 * La búsqueda que se aplica según la URL: recortada, sin espacios de más y
 * sin pasar de `MAX_BUSQUEDA`. Vacía = sin búsqueda.
 */
export function leerBusqueda(valor: string | string[] | undefined): string {
  const bruto = Array.isArray(valor) ? (valor[0] ?? "") : (valor ?? "");
  return bruto.replace(/\s+/g, " ").trim().slice(0, MAX_BUSQUEDA);
}

/** Los artículos que contienen TODAS las palabras buscadas (sin mayúsculas ni tildes). */
export function buscarEnArticulos(
  articulos: readonly ArticuloLista[],
  busqueda: string,
): ArticuloLista[] {
  const palabras = normalizar(busqueda).split(" ").filter(Boolean);
  if (!palabras.length) return [...articulos];
  return articulos.filter((a) => palabras.every((p) => a.indice.includes(p)));
}

/** Catálogo de filtros del índice: la categoría, y lo más reciente primero. */
export const CATALOGO_BLOG: Catalogo<ArticuloLista> = {
  facetas: [
    {
      tipo: "lista",
      clave: "categoria",
      etiqueta: "Categorías",
      de: (a) => (a.categoria ? { valor: a.categoria.slug, etiqueta: a.categoria.nombre } : null),
    },
  ],
  ordenes: [
    {
      valor: "recientes",
      etiqueta: "Más recientes",
      comparar: (a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id,
    },
  ],
};
