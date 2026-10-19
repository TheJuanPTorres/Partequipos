import type { CSSProperties } from "react";

import { colorDeMarca, tintaSobre } from "../marca/colorMarca";

/**
 * IDENTIDAD DE LA MARCA DE LUBRICANTES (2026-10-19, cliente): la página de la marca es un
 * «sitio dentro del sitio» con sus colores, editables en el panel. Sin color válido, el
 * amarillo y el negro de ENI (la única marca de hoy).
 *
 * El texto sobre cada color es negro o blanco, el que más contraste da (AA garantizado,
 * `tintaSobre`): el amarillo nunca se usa como color de TEXTO sobre blanco, solo como fondo
 * con tinta oscura o como acento sobre el fondo oscuro.
 */
export const COLOR_PRINCIPAL_POR_DEFECTO = "#ffd100";
export const COLOR_OSCURO_POR_DEFECTO = "#111111";

export function estiloDeIdentidad(
  principal: string | null | undefined,
  oscuro: string | null | undefined,
): CSSProperties {
  const p = colorDeMarca(principal) ?? COLOR_PRINCIPAL_POR_DEFECTO;
  const o = colorDeMarca(oscuro) ?? COLOR_OSCURO_POR_DEFECTO;
  return {
    "--lub-principal": p,
    "--lub-sobre-principal": tintaSobre(p),
    "--lub-oscuro": o,
    "--lub-sobre-oscuro": tintaSobre(o),
  } as CSSProperties;
}

/** Totales que presume la portada, sacados de los datos (nunca escritos a mano). */
export function totalesDeCatalogo(
  secciones: { grupos: { productos: { ficha: string | null }[] }[] }[],
) {
  let productos = 0;
  let fichas = 0;
  for (const s of secciones)
    for (const g of s.grupos)
      for (const p of g.productos) {
        productos++;
        if (p.ficha) fichas++;
      }
  return { lineas: secciones.length, productos, fichas };
}
