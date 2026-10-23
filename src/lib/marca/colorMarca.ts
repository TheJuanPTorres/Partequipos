import type { CSSProperties } from "react";

import { contraste, luminancia, rgbDeHex } from "../portada/contraste";

/**
 * COLOR DE LA MARCA (2026-10-18, petición del cliente): la franja de color de las
 * páginas de marca y de tipo (de repuestos y de maquinaria nueva) deja de ser el
 * amarillo de Caterpillar y toma el de cada marca. Sin color, ninguno: la franja toma el fondo de la página (en el CSS).
 */

const RE_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** El color en `#rrggbb` minúscula, o `null` si no es un color válido. */
export function colorDeMarca(valor: string | null | undefined): string | null {
  const v = valor?.trim() ?? "";
  if (!RE_COLOR.test(v)) return null;
  const seis = v.length === 4 ? `#${[...v.slice(1)].map((c) => c + c).join("")}` : v;
  return seis.toLowerCase();
}

const NEGRO = "#000000";
const BLANCO = "#ffffff";

const luz = (hex: string) => {
  const [r, g, b] = rgbDeHex(hex) ?? [0, 0, 0];
  return luminancia(r, g, b);
};

/**
 * Negro o blanco, el que más contraste da sobre el color. Con cualquier fondo, el
 * mejor de los dos llega siempre a 4,58:1 como mínimo: el AA de texto normal queda
 * garantizado (el peor caso es un gris medio, ~#757575).
 */
export function tintaSobre(fondo: string): string {
  const l = luz(fondo);
  return contraste(l, luz(NEGRO)) >= contraste(l, luz(BLANCO)) ? NEGRO : BLANCO;
}

/**
 * La tinta de un LOGO sobre el color de la marca (pastilla activa de la barra de marcas,
 * dirección 2026-10-23): BLANCO siempre que se lea bien (contraste ≥ 3:1, el de los
 * elementos gráficos de WCAG, que basta para un logo); NEGRO solo en colores claros.
 */
export function tintaDeLogoSobre(fondo: string): string {
  return contraste(luz(fondo), luz(BLANCO)) >= 3 ? BLANCO : NEGRO;
}

/**
 * Las variables CSS de la página: el color de la franja, la tinta de sus
 * títulos y del foco, y el aspecto de una píldora al pasar el ratón (la tinta
 * sobre el color de la franja: nunca del color de la franja sobre sí mismo).
 * Sin color válido, ninguna: manda el CSS de siempre.
 */
export function estiloDeMarca(valor: string | null | undefined): CSSProperties | undefined {
  const color = colorDeMarca(valor);
  if (!color) return undefined;
  const tinta = tintaSobre(color);
  return {
    "--marca-amarillo": color,
    "--marca-tinta": tinta,
    "--marca-hover-fondo": tinta,
    "--marca-hover-texto": tintaSobre(tinta),
  } as CSSProperties;
}
