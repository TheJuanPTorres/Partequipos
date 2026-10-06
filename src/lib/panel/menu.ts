/**
 * ORGANIZACIÓN DEL MENÚ DEL PANEL (F1 del rediseño, 2026-10-06; propuesta en
 * `partequipos-cierre\propuestas\2026-10-06-panel-sistema-diseno.md` §3 y
 * `docs/diseno/decisiones-panel.md` §20).
 *
 * Ocho grupos ordenados por uso, pensados para un editor no técnico: primero lo
 * que entra a diario (solicitudes y catálogo), luego lo editorial, los archivos
 * y al final lo que se toca una vez.
 *
 * El orden lo fija ESTA lista, no el array de `payload.config.ts`: Payload
 * agrupa por orden de aparición y pone los globales detrás de todas las
 * colecciones, así que un grupo solo de globales («Partes del sitio») saldría
 * detrás de «Configuración». No afecta al esquema: las tablas van por slug.
 */
export const GRUPOS_DEL_MENU = [
  "Solicitudes",
  "Repuestos",
  "Maquinaria",
  "Lubricantes",
  "Páginas y blog",
  "Archivos",
  "Partes del sitio",
  "Configuración",
] as const;

export type GrupoDelMenu = (typeof GRUPOS_DEL_MENU)[number];

/**
 * Orden de las entradas dentro de cada grupo: primero la ficha que más se edita
 * («Modelos», «Equipos nuevos»), después sus clasificaciones. Un slug que no
 * esté aquí va al final de su grupo, en el orden de Payload.
 */
export const ORDEN_DE_ENTRADAS = [
  // Solicitudes
  "solicitudes",
  // Repuestos
  "modelos-repuesto",
  "marcas",
  "tipos-equipo",
  "categorias-tecnicas",
  // Maquinaria
  "equipos-nuevos",
  "equipos-usados",
  "marcas-maquinaria",
  "tipos-maquinaria",
  "categorias-maquinaria",
  "categorias-usada",
  // Lubricantes
  "marcas-lubricante",
  "categorias-lubricante",
  // Páginas y blog
  "paginas",
  "articulos",
  "categorias-blog",
  "preguntas-frecuentes",
  "testimonios",
  "sedes",
  // Archivos
  "media",
  "documentos",
  "videos",
  "animaciones",
  // Partes del sitio (globales)
  "cabecera",
  "pie",
  "ficha-producto",
  // Configuración
  "seo",
  "redirects",
  "users",
] as const;

const posicion = (lista: readonly string[], valor: string) => {
  const i = lista.indexOf(valor);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

/**
 * Ordena los grupos según `GRUPOS_DEL_MENU` y las entradas de cada uno según
 * `ORDEN_DE_ENTRADAS`. Un grupo o una entrada desconocidos van al final, en el
 * orden en que llegaron (orden estable): nunca se pierde nada.
 */
export function ordenarMenu<G extends { nombre: string; entradas: { slug: string }[] }>(
  grupos: G[],
): G[] {
  const estable = <T>(lista: T[], clave: (t: T) => number) =>
    lista
      .map((elemento, i) => ({ elemento, i }))
      .sort((a, b) => clave(a.elemento) - clave(b.elemento) || a.i - b.i)
      .map(({ elemento }) => elemento);

  return estable(grupos, (g) => posicion(GRUPOS_DEL_MENU, g.nombre)).map((g) => ({
    ...g,
    entradas: estable(g.entradas, (e) => posicion(ORDEN_DE_ENTRADAS, e.slug)),
  }));
}
