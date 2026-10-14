import type { Metadata } from "next";

/**
 * La metadata de un listado FILTRADO (o con un orden distinto del de por
 * defecto): no se indexa, sus enlaces se siguen, y su canónica es la del
 * listado sin filtros. Así una combinación de filtros nunca compite con la
 * página que sí se quiere posicionar.
 *
 * `indexacionPermitida`: con el sitio cerrado a buscadores, el layout ya
 * pone `noindex, nofollow` en todo; aquí no se toca `robots`, porque un
 * `follow` de la página pisaría ese `nofollow`.
 */
export function metadataFiltrada(
  base: Metadata,
  canonicaSinFiltros: string,
  indexacionPermitida: boolean,
): Metadata {
  const salida: Metadata = {
    ...base,
    alternates: { ...base.alternates, canonical: canonicaSinFiltros },
  };
  if (indexacionPermitida) salida.robots = { index: false, follow: true };
  return salida;
}

/**
 * La metadata de una página que no se quiere en el índice aunque no esté
 * filtrada (una categoría o marca creada en el panel y sin unidades, D4).
 */
export function metadataSinIndexar(base: Metadata, indexacionPermitida: boolean): Metadata {
  return indexacionPermitida ? { ...base, robots: { index: false, follow: true } } : base;
}
