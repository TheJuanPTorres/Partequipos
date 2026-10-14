/**
 * CATEGORÍAS DE USADA HEREDADAS del sitio actual (decisión D4 de dirección,
 * 2026-10-13).
 *
 * Una categoría o marca de usados SIN unidades disponibles no se indexa ni
 * sale en el sitemap: el marketplace genera una página por cada una que se
 * crea en el panel, y una página vacía no aporta nada a Google. Salvo estas:
 * están indexadas en WordPress (`docs/url-map.csv`) y siguen indexables
 * aunque se queden sin unidades.
 *
 * `excavadoras4` no está: es el duplicado clasificado como basura
 * (§10.3 p.8). La prueba compara esta lista con el rastreo.
 */
export const CATEGORIAS_USADA_HEREDADAS: ReadonlySet<string> = new Set([
  "bulldozer",
  "cargadores",
  "compactadores",
  "excavadoras",
  "minicargadores",
  "motoniveladoras",
  "retrocargadoras",
  "vibrocompactadores",
]);

/** ¿Se indexa esta categoría? Las heredadas, siempre; las demás, si tienen unidades. */
export function categoriaUsadaIndexable(slug: string, disponibles: number): boolean {
  return CATEGORIAS_USADA_HEREDADAS.has(slug) || disponibles > 0;
}
