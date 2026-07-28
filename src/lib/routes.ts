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

export const rutas = {
  repuestos: () => `/${SEGMENTO_REPUESTOS}`,
  marcas: () => `/${SEGMENTO_REPUESTOS}/${SEGMENTO_MARCAS}`,
  marca: (marcaSlug: string) => `/${SEGMENTO_REPUESTOS}/${SEGMENTO_MARCAS}/${marcaSlug}`,
  tipo: (marcaSlug: string, tipoSlug: string) =>
    `/${SEGMENTO_REPUESTOS}/${SEGMENTO_MARCAS}/${marcaSlug}/${tipoSlug}`,
  modelo: (marcaSlug: string, tipoSlug: string, modeloSlug: string) =>
    `/${SEGMENTO_REPUESTOS}/${SEGMENTO_MARCAS}/${marcaSlug}/${tipoSlug}/${modeloSlug}`,
} as const;
