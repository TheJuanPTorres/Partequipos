import { revalidatePath } from "next/cache";

import { ETIQUETAS_DATOS, revalidarDatos, revalidarIndices } from "./cacheDatos";

import {
  rutas,
  SEGMENTO_CATEGORIAS_REPUESTOS,
  SEGMENTO_MARCAS,
  SEGMENTO_REPUESTOS,
} from "./routes";

/**
 * Revalidación granular del catálogo (ISR), disparada por hooks de Payload.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ `revalidatePath` Y NO `revalidateTag`
 * ---------------------------------------------------------------------------
 * `revalidateTag` invalida entradas del *Data Cache*, y solo existen entradas
 * etiquetadas si los datos se obtienen con `fetch(..., { next: { tags } })` o se
 * envuelven en `unstable_cache` / `cacheTag`. Aquí los datos vienen de la **API
 * local de Payload** (`payload.find`, CLAUDE.md §3.2), que no pasa por `fetch`
 * y por tanto no genera entradas etiquetadas.
 *
 * Lo que sí existe es el *Full Route Cache*: cada ruta del catálogo es HTML
 * prerenderizado por `generateStaticParams`. La unidad de invalidación real es
 * **la ruta**, así que `revalidatePath` ataca exactamente lo que hay que
 * refrescar, sin una capa extra de envoltorios de caché.
 *
 * Alternativa considerada y descartada: envolver cada consulta en
 * `unstable_cache` con tags (`marca:<slug>`, `tipo:<id>`, …). Añade una segunda
 * capa de caché y un esquema de nombres que mantener, para invalidar igualmente
 * las mismas rutas. No compensa mientras el acceso a datos sea la API local.
 *
 * ---------------------------------------------------------------------------
 * GRAFO DE DEPENDENCIAS
 * ---------------------------------------------------------------------------
 * Dónde aparece cada entidad determina qué hay que revalidar al cambiarla:
 *
 *   Marca aparece en:  índice de repuestos (conteo) · índice de marcas ·
 *                      su propia página · migas de sus tipos y modelos
 *   Tipo aparece en:   página de su marca (listado) · su propia página ·
 *                      migas de sus modelos
 *   Modelo aparece en: página de su tipo (listado) · su propia ficha
 *
 * Por tanto:
 *
 *   cambia MODELO  -> ficha del modelo + página del tipo (donde se lista)
 *   cambia TIPO    -> página del tipo + página de la marca + fichas de sus
 *                     modelos (las migas muestran el nombre del tipo)
 *   cambia MARCA   -> página de la marca + índice de marcas + índice de
 *                     repuestos + todo el subárbol (tipos y modelos: sus migas
 *                     muestran el nombre de la marca)
 *
 * Si cambia un SLUG, además hay que revalidar la ruta ANTERIOR (queda huérfana)
 * y el subárbol, porque las URLs hijas cuelgan del slug del padre.
 */

/**
 * Patrones de página para `revalidatePath(patrón, "page")`, que invalidan
 * TODAS las URL de una ruta dinámica.
 *
 * **Llevan el grupo `(site)`.** Next etiqueta cada página con su fichero de
 * ruta tal cual, grupos incluidos (`/(site)/…/[modelo]/page`), y el patrón se
 * compara letra a letra con esa etiqueta: sin el grupo no casa con nada y no
 * revalida, sin ningún error (2026-10-16: guardar el global «Ficha de
 * producto» no refrescó las fichas hasta un redeploy). Leído en Next 16.3.5,
 * `getImplicitTags(workStore.page, …)` y `revalidatePath`. Las rutas literales
 * (`/nosotros/`) no tienen este problema: casan con la URL.
 *
 * `revalidation.test.ts` exige que cada patrón sea un `page.tsx` que existe.
 */
export const PATRONES_DE_PAGINA = {
  fichasNuevas: "/(site)/maquinaria-pesada/maquinaria-pesada-nueva/marcas/[marca]/[tipo]/[modelo]",
  marcasDeRepuestos: `/(site)/${SEGMENTO_REPUESTOS}/${SEGMENTO_MARCAS}/[marca]`,
  categoriasDeRepuestos: `/(site)/${SEGMENTO_REPUESTOS}/${SEGMENTO_CATEGORIAS_REPUESTOS}/[categoria]`,
  paginasUsadas: "/(site)/maquinaria-pesada/maquinaria-pesada-usada/[categoria]/pagina/[pagina]",
} as const;

/** Ejecuta `revalidatePath` sin permitir que un fallo rompa el guardado. */
function revalidar(path: string, motivo: string): void {
  try {
    revalidatePath(path);
  } catch (error) {
    // CLAUDE.md §5: sin console.log; los errores van a Sentry (tarea 0.4).
    // Nunca se relanza: el editor debe poder guardar aunque la revalidación falle.
    console.error(`[revalidación] falló ${path} (${motivo}):`, error);
  }
}

/**
 * Revalida una lista de rutas, deduplicando. Y el sitemap y el buscador
 * (`revalidarIndices`): lo que cambia una página del catálogo puede cambiar
 * también su entrada en los dos.
 */
export function revalidarRutas(paths: string[], motivo: string): void {
  for (const path of new Set(paths)) {
    revalidar(path, motivo);
  }
  revalidarIndices(motivo);
}

/** Rutas afectadas por un cambio en una MARCA. */
export function rutasDeMarca(
  marcaSlug: string,
  hijos: { tipoSlug: string; modeloSlugs: string[] }[],
): string[] {
  const paths = [rutas.repuestos(), rutas.marcas(), rutas.marca(marcaSlug)];

  // El subárbol también depende del slug de la marca (URL) y de su nombre (migas).
  for (const { tipoSlug, modeloSlugs } of hijos) {
    paths.push(rutas.tipo(marcaSlug, tipoSlug));
    for (const modeloSlug of modeloSlugs) {
      paths.push(rutas.modelo(marcaSlug, tipoSlug, modeloSlug));
    }
  }

  return paths;
}

/** Rutas afectadas por un cambio en un TIPO. */
export function rutasDeTipo(marcaSlug: string, tipoSlug: string, modeloSlugs: string[]): string[] {
  const paths = [
    rutas.marca(marcaSlug), // el tipo se lista aquí
    rutas.tipo(marcaSlug, tipoSlug),
  ];

  // Las fichas de sus modelos muestran el nombre del tipo en las migas.
  for (const modeloSlug of modeloSlugs) {
    paths.push(rutas.modelo(marcaSlug, tipoSlug, modeloSlug));
  }

  return paths;
}

/** Rutas afectadas por un cambio en un MODELO. */
export function rutasDeModelo(marcaSlug: string, tipoSlug: string, modeloSlug: string): string[] {
  return [
    rutas.tipo(marcaSlug, tipoSlug), // el modelo se lista aquí
    rutas.modelo(marcaSlug, tipoSlug, modeloSlug),
  ];
}

/* ---------------------------------------------------------------------------
 * MAQUINARIA
 *
 * Mismo grafo que en repuestos:
 *   cambia MARCA   -> su página + índice de marcas + índice de línea + subárbol
 *   cambia TIPO    -> su página + la de su marca + fichas de sus equipos
 *   cambia EQUIPO  -> su ficha + la página de su tipo
 *
 * Añadido propio de esta sección: las categorías transversales listan equipos de
 * varias marcas, así que un cambio en un equipo también las afecta. Como la
 * relación va en sentido contrario (la categoría declara los tipos), se
 * revalidan todas: son 4, no compensa resolver cuáles.
 * ------------------------------------------------------------------------ */

/** Rutas afectadas por un cambio en una MARCA de maquinaria. */
export function rutasDeMarcaMaquinaria(
  marcaSlug: string,
  hijos: { tipoSlug: string; equipoSlugs: string[] }[],
): string[] {
  const paths = [
    rutas.maquinaria(),
    rutas.nueva(),
    rutas.marcasMaquinaria(),
    rutas.marcaMaquinaria(marcaSlug),
  ];

  for (const { tipoSlug, equipoSlugs } of hijos) {
    paths.push(rutas.tipoMaquinaria(marcaSlug, tipoSlug));
    for (const equipoSlug of equipoSlugs) {
      paths.push(rutas.equipoNuevo(marcaSlug, tipoSlug, equipoSlug));
    }
  }

  return paths;
}

/** Rutas afectadas por un cambio en un TIPO de maquinaria. */
export function rutasDeTipoMaquinaria(
  marcaSlug: string,
  tipoSlug: string,
  equipoSlugs: string[],
): string[] {
  const paths = [rutas.marcaMaquinaria(marcaSlug), rutas.tipoMaquinaria(marcaSlug, tipoSlug)];
  for (const equipoSlug of equipoSlugs) {
    paths.push(rutas.equipoNuevo(marcaSlug, tipoSlug, equipoSlug));
  }
  return paths;
}

/**
 * Rutas afectadas por un cambio en un EQUIPO nuevo. Las fichas de los demás
 * equipos del mismo tipo también: lo enseñan en «Otras referencias de esta
 * categoría» (ficha V2, docs/diseno/decisiones-ficha.md).
 */
export function rutasDeEquipoNuevo(
  marcaSlug: string,
  tipoSlug: string,
  equipoSlug: string,
  categoriaSlugs: string[],
  hermanoSlugs: string[] = [],
): string[] {
  return [
    rutas.tipoMaquinaria(marcaSlug, tipoSlug),
    rutas.equipoNuevo(marcaSlug, tipoSlug, equipoSlug),
    ...hermanoSlugs.map((slug) => rutas.equipoNuevo(marcaSlug, tipoSlug, slug)),
    ...categoriaSlugs.map((slug) => rutas.categoriaNueva(slug)),
  ];
}

/**
 * Todas las fichas de equipo nuevo, por el patrón de la ruta: para lo que
 * comparten todas (el global `ficha-producto`). Nunca relanza.
 */
export function revalidarFichasNuevas(motivo: string): void {
  try {
    revalidatePath(PATRONES_DE_PAGINA.fichasNuevas, "page");
  } catch (error) {
    console.error(`[revalidación] fallaron las fichas de equipo nuevo (${motivo}):`, error);
  }
}

/**
 * Revalida TODAS las páginas de marca de repuestos. Para lo que comparten: el
 * global `repuestos-marca` y las categorías técnicas (comunes a las marcas).
 * Nunca relanza.
 */
export function revalidarMarcasDeRepuestos(motivo: string): void {
  try {
    revalidatePath(PATRONES_DE_PAGINA.marcasDeRepuestos, "page");
  } catch (error) {
    console.error(`[revalidación] fallaron las páginas de marca de repuestos (${motivo}):`, error);
  }
}

/**
 * Revalida el índice y TODAS las páginas de categoría técnica de repuestos, y
 * las de marca y tipo (que enlazan a ellas). Nunca relanza.
 */
export function revalidarCategoriasDeRepuestos(motivo: string): void {
  try {
    revalidatePath(rutas.categoriasRepuestos());
    revalidatePath(PATRONES_DE_PAGINA.categoriasDeRepuestos, "page");
    revalidatePath(rutas.repuestos());
    revalidarIndices(motivo);
  } catch (error) {
    console.error(
      `[revalidación] fallaron las páginas de categoría de repuestos (${motivo}):`,
      error,
    );
  }
}

/** Rutas afectadas por un cambio en una categoría de la línea nueva. */
export function rutasDeCategoriaNueva(slug: string): string[] {
  return [rutas.nueva(), rutas.categoriaNueva(slug)];
}

/**
 * Las páginas 2 y siguientes de los listados de usados, por el patrón de la
 * ruta: al entrar o salir una unidad se corren todas. Nunca relanza.
 */
export function revalidarPaginasUsadas(motivo: string): void {
  try {
    revalidatePath(PATRONES_DE_PAGINA.paginasUsadas, "page");
  } catch (error) {
    console.error(`[revalidación] fallaron las páginas de usados (${motivo}):`, error);
  }
}

/** Rutas afectadas por un cambio en una categoría de usada. */
export function rutasDeCategoriaUsada(slug: string): string[] {
  return [rutas.maquinaria(), rutas.usada(), rutas.categoriaUsada(slug)];
}

// --- Lubricantes ------------------------------------------------------------

/**
 * Rutas que caduca un cambio de MARCA de lubricantes, o de una de sus
 * categorías: solo la página de la marca. Desde el 2026-10-14 las categorías
 * son secciones de esa página y ya no tienen ruta propia.
 */
export function rutasDeMarcaLubricante(marcaSlug: string): string[] {
  return [rutas.marcaLubricante(marcaSlug)];
}

// --- Blog -------------------------------------------------------------------

/**
 * Rutas que caduca un cambio de ARTÍCULO: la suya, el índice y el archivo de su
 * categoría. Los dos últimos lo listan, así que su contenido cambia con él.
 */
export function rutasDeArticulo(slug: string, categoriaSlug: string | null): string[] {
  return [
    rutas.articulo(slug),
    rutas.blog(),
    ...(categoriaSlug ? [rutas.categoriaBlog(categoriaSlug)] : []),
  ];
}

/**
 * Rutas que caduca un cambio de CATEGORÍA: su archivo, el índice y la página de
 * cada artículo suyo, que muestra el nombre de la categoría en las migas.
 */
export function rutasDeCategoriaBlog(slug: string, articuloSlugs: string[]): string[] {
  return [rutas.categoriaBlog(slug), rutas.blog(), ...articuloSlugs.map((s) => rutas.articulo(s))];
}

/**
 * Revalida TODO el sitio: cada página lleva el pie (y la cabecera) en el layout.
 * Para cambios en globales como `pie`. Nunca relanza.
 *
 * PRIMERO la caché del marco (`datos:marco`): si no, las páginas se volverían
 * a pintar con la cabecera y el pie viejos que siguen en la caché de datos.
 */
export function revalidarTodoElSitio(motivo: string): void {
  revalidarDatos(ETIQUETAS_DATOS.marco, motivo);
  try {
    revalidatePath("/", "layout");
  } catch (error) {
    console.error(`[revalidación] falló el sitio entero (${motivo}):`, error);
  }
}
