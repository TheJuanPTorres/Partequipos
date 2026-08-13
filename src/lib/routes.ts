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

/**
 * Lubricantes.
 *
 * OJO: `/lubricantes/` **no es una página**. El rastreo no la encuentra entre
 * las 648 URLs vivas: solo existen `/lubricantes/{marca}/` y sus categorías. Es
 * un segmento de ruta sin índice, y se replica así — inventar el índice sería
 * crear una URL que nadie ha indexado.
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
  marcasMaquinaria: () => `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${SEGMENTO_MARCAS_MAQUINARIA}`,
  marcaMaquinaria: (marcaSlug: string) =>
    `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${SEGMENTO_MARCAS_MAQUINARIA}/${marcaSlug}`,
  tipoMaquinaria: (marcaSlug: string, tipoSlug: string) =>
    `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${SEGMENTO_MARCAS_MAQUINARIA}/${marcaSlug}/${tipoSlug}`,
  equipoNuevo: (marcaSlug: string, tipoSlug: string, equipoSlug: string) =>
    `/${SEGMENTO_MAQUINARIA}/${SEGMENTO_NUEVA}/${SEGMENTO_MARCAS_MAQUINARIA}/${marcaSlug}/${tipoSlug}/${equipoSlug}`,

  // --- Lubricantes --------------------------------------------------------
  marcaLubricante: (marcaSlug: string) => `/${SEGMENTO_LUBRICANTES}/${marcaSlug}`,
  categoriaLubricante: (marcaSlug: string, categoriaSlug: string) =>
    `/${SEGMENTO_LUBRICANTES}/${marcaSlug}/${categoriaSlug}`,

  // --- Blog ---------------------------------------------------------------
  blog: () => `/${SEGMENTO_BLOG_INDICE}`,
  categoriaBlog: (slug: string) => `/${SEGMENTO_BLOG_CATEGORIA}/${slug}`,
  /** Los articulos van en la raiz, sin prefijo. */
  articulo: (slug: string) => `/${slug}`,
} as const;
