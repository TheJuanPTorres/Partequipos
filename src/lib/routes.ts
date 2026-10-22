/**
 * Segmentos de la jerarquía de repuestos.
 *
 * Copiados literalmente del mapa de URLs rastreado (`docs/url-map.csv`), no
 * inferidos: la jerarquía existente es intocable (CLAUDE.md §3.3) y cualquier
 * cambio aquí rompe URLs indexadas.
 *
 *   /repuestos-maquinaria-pesada-colombia/
 *     repuestos-maquinaria-pesada-marcas/
 *       {marca}/
 *         {tipo}/
 *           {modelo}/
 */
export const SEGMENTO_REPUESTOS = "repuestos-maquinaria-pesada-colombia";
export const SEGMENTO_MARCAS = "repuestos-maquinaria-pesada-marcas";

/**
 * Categorías técnicas de repuestos (Tren de rodaje, Filtración…): un índice y una
 * página por categoría, al mismo nivel que las marcas. Copiado del rastreo
 * (`docs/url-map.csv`): `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/`.
 */
export const SEGMENTO_CATEGORIAS_REPUESTOS = "categoria-repuestos-para-maquinaria-pesada";

/**
 * Segmentos de la sección de maquinaria, copiados literalmente del rastreo:
 *
 *   /maquinaria-pesada/
 *     maquinaria-pesada-nueva/
 *       {categoria}/                 vistas transversales por tipo
 *       marcas/{marca}/{tipo}/{modelo}/
 *     maquinaria-pesada-usada/
 *       {categoria}/
 *
 * `marcas` es un segmento estático al mismo nivel que `{categoria}`. Next
 * resuelve lo estático antes que lo dinámico, así que no chocan — pero ninguna
 * categoría puede llamarse "marcas".
 */
export const SEGMENTO_MAQUINARIA = "maquinaria-pesada";
export const SEGMENTO_NUEVA = "maquinaria-pesada-nueva";
export const SEGMENTO_USADA = "maquinaria-pesada-usada";
export const SEGMENTO_MARCAS_MAQUINARIA = "marcas";
/** La página «Otros» de usados (cliente, 2026-10-19): agrupa las categorías que no van en el primer nivel. */
export const SEGMENTO_OTROS_USADA = "otros";

/**
 * Lubricantes.
 *
 * `/lubricantes/` es la página GENERAL de lubricantes desde el 2026-10-20
 * (plantilla de Andrés 809451, dirección). Antes no existía: el rastreo no la
 * encuentra entre las 648 URLs vivas, que solo tienen `/lubricantes/{marca}/` y
 * sus categorías. Es una URL NUEVA (no sustituye a ninguna indexada).
 */
export const SEGMENTO_LUBRICANTES = "lubricantes";

/**
 * Blog.
 *
 * Los ARTICULOS no tienen segmento propio: viven en `/{slug}/`, en la raiz,
 * como los mide el rastreo (profundidad 1, sin prefijo ni fecha). Por eso aqui
 * solo hay constantes para el indice y para el archivo de categoria.
 *
 * `category` es el segmento que genera WordPress y se conserva porque
 * /category/noticias/ esta indexada.
 */
export const SEGMENTO_BLOG_INDICE = "noticias";
export const SEGMENTO_BLOG_CATEGORIA = "category";

export const rutas = {
  repuestos: () => `/${SEGMENTO_REPUESTOS}`,
  marcas: () => `/${SEGMENTO_REPUESTOS}/${SEGMENTO_MARCAS}`,
  categoriasRepuestos: () => `/${SEGMENTO_REPUESTOS}/${SEGMENTO_CATEGORIAS_REPUESTOS}`,
  categoriaRepuestos: (slug: string) =>
    `/${SEGMENTO_REPUESTOS}/${SEGMENTO_CATEGORIAS_REPUESTOS}/${slug}`,
  marca: (marcaSlug: string) => `/${SEGMENTO_REPUESTOS}/${SEGMENTO_MARCAS}/${marcaSlug}`,
  tipo: (marcaSlug: string, tipoSlug: string) =>
    `/${SEGMENTO_REPUESTOS}/${SEGMENTO_MARCAS}/${marcaSlug}/${tipoSlug}`,
  modelo: (marcaSlug: string, tipoSlug: string, modeloSlug: string) =>
    `/${SEGMENTO_REPUESTOS}/${SEGMENTO_MARCAS}/${marcaSlug}/${tipoSlug}/${modeloSlug}`,

  // --- Maquinaria ---------------------------------------------------------
  maquinaria: () => `/${SEGMENTO_MAQUINARIA}`,
  nueva: () => `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}`,
  usada: () => `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_USADA}`,
  categoriaNueva: (slug: string) => `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${slug}`,
  categoriaUsada: (slug: string) => `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_USADA}/${slug}`,
  /** «Otros» de usados: las categorías agrupadas (`otros` está reservada en las categorías). */
  usadaOtros: () => `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_USADA}/${SEGMENTO_OTROS_USADA}`,
  /** Página n del listado de maquinaria nueva («Categoría secundaria»); la 1 es el índice. */
  nuevaPagina: (pagina: number) =>
    pagina <= 1
      ? `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}`
      : `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/pagina/${pagina}`,
  /** Página n del listado de una categoría de nueva; la 1 es la propia categoría. */
  categoriaNuevaPagina: (slug: string, pagina: number) =>
    pagina <= 1
      ? `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${slug}`
      : `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${slug}/pagina/${pagina}`,
  /**
   * Página de UNA unidad usada (2026-10-16, decisión de dirección): cuelga de su
   * categoría. `pagina` y `marcas` no pueden ser el slug de una unidad
   * (`src/lib/usados/urls.ts`).
   */
  unidadUsada: (categoriaSlug: string, unidadSlug: string) =>
    `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_USADA}/${categoriaSlug}/${unidadSlug}`,
  /** Página n del listado de una categoría de usada; la 1 es la propia categoría. */
  categoriaUsadaPagina: (slug: string, pagina: number) =>
    pagina <= 1
      ? `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_USADA}/${slug}`
      : `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_USADA}/${slug}/pagina/${pagina}`,
  /** Página de una marca de usada (D1, 2026-10-13); `marcas` está reservada en las categorías. */
  marcaUsada: (slug: string) =>
    `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_USADA}/${SEGMENTO_MARCAS_MAQUINARIA}/${slug}`,
  /** Página n del listado de una marca de usada; la 1 es la propia marca. */
  marcaUsadaPagina: (slug: string, pagina: number) =>
    pagina <= 1
      ? `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_USADA}/${SEGMENTO_MARCAS_MAQUINARIA}/${slug}`
      : `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_USADA}/${SEGMENTO_MARCAS_MAQUINARIA}/${slug}/pagina/${pagina}`,
  marcasMaquinaria: () => `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${SEGMENTO_MARCAS_MAQUINARIA}`,
  marcaMaquinaria: (marcaSlug: string) =>
    `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${SEGMENTO_MARCAS_MAQUINARIA}/${marcaSlug}`,
  tipoMaquinaria: (marcaSlug: string, tipoSlug: string) =>
    `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${SEGMENTO_MARCAS_MAQUINARIA}/${marcaSlug}/${tipoSlug}`,
  equipoNuevo: (marcaSlug: string, tipoSlug: string, equipoSlug: string) =>
    `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${SEGMENTO_MARCAS_MAQUINARIA}/${marcaSlug}/${tipoSlug}/${equipoSlug}`,

  // --- Lubricantes --------------------------------------------------------
  /** La página general (2026-10-20): presentación, formulario y la marca. */
  lubricantes: () => `/${SEGMENTO_LUBRICANTES}`,
  marcaLubricante: (marcaSlug: string) => `/${SEGMENTO_LUBRICANTES}/${marcaSlug}`,
  /**
   * La página de una línea de lubricantes, en su URL de WordPress (desde el
   * 2026-10-22, plantilla de Andrés 4039; del 2026-10-14 al 21 fue un ancla de
   * la página de su marca).
   */
  categoriaLubricante: (marcaSlug: string, categoriaSlug: string) =>
    `/${SEGMENTO_LUBRICANTES}/${marcaSlug}/${categoriaSlug}`,

  // --- Blog ---------------------------------------------------------------
  blog: () => `/${SEGMENTO_BLOG_INDICE}`,
  categoriaBlog: (slug: string) => `/${SEGMENTO_BLOG_CATEGORIA}/${slug}`,
  /** Los articulos van en la raiz, sin prefijo. */
  articulo: (slug: string) => `/${slug}`,
} as const;
