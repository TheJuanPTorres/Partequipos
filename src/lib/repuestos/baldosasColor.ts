import type { LogoMarca } from "../marca/logoMarca";

/**
 * Las BALDOSAS DE COLOR del índice de marcas de repuestos (diseño del cliente «Repuestos por
 * marca», 2026-11-03; `BaldosasColorMarcas`): cada marca en una baldosa 3:2 de su color con el
 * logo en blanco al centro (Case sobre crema y Caterpillar sobre su amarillo, con su logo
 * original). Aquí, la parte pura: qué fondo y qué logo lleva cada una.
 *
 * Solo va en color si la marca tiene LAS DOS COSAS, el color y el logo para ese color: un logo
 * blanco sin su color no se vería, y un color sin su logo pondría el logo de siempre (pensado
 * para fondo claro) sobre él. Si falta cualquiera, el RESPALDO: el logo de siempre sobre gris.
 */

/** El gris del respaldo: el de las secciones del sitio. */
export const FONDO_RESPALDO = "#f0f0f0";

/** Un logo «en dos pisos» (más alto que ancho para un logo, como el de Hitachi LANDCROS). */
const PROPORCION_ALTO = 2.2;

export type DatosBaldosa = {
  /** El logo de siempre (`LogoMarca`): el del respaldo. */
  logo: LogoMarca | null;
  /** «Color de la baldosa» de la marca en el panel (`#rrggbb`). */
  color?: string | null;
  /** «Logo en blanco» de la marca en el panel: el que va sobre el color. */
  logoSobreColor?: LogoMarca | null;
};

export type VistaBaldosa = {
  tipo: "color" | "respaldo";
  fondo: string;
  logo: LogoMarca | null;
  /** El logo va más alto (50 % de la baldosa en lugar del 34 %): logos en dos pisos. */
  alto: boolean;
};

const hex = (v: string | null | undefined) => {
  const t = v?.trim().toLowerCase() ?? "";
  return /^#[0-9a-f]{6}$/.test(t) ? t : null;
};

export function vistaBaldosa(d: DatosBaldosa): VistaBaldosa {
  const color = hex(d.color);
  const enColor = color && d.logoSobreColor ? d.logoSobreColor : null;
  const logo = enColor ?? d.logo;
  return {
    tipo: enColor ? "color" : "respaldo",
    fondo: enColor ? color! : FONDO_RESPALDO,
    logo,
    alto: Boolean(logo && logo.height > 0 && logo.width / logo.height < PROPORCION_ALTO),
  };
}
