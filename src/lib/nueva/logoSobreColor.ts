import { colorDeMarca, COLOR_SIN_MARCA, tintaDeLogoSobre } from "../marca/colorMarca";
import { oscurecer } from "../marca/franjaMarca";
import { buscarPorNombre, claveDeMarca, type LogoConAlt } from "../marca/logoMarca";
import { contraste, luminancia, rgbDeHex } from "../portada/contraste";

import type { BaldosaDeRepuestos } from "./indiceMarcas";

/**
 * Contraste mínimo del blanco puro sobre el fondo de una pastilla activa con logo en blanco
 * (2026-11-05). WCAG pide 3:1 al logo (1.4.11), pero el blanco de un logo real no es puro (bordes
 * suavizados, WebP): medido en Hitachi LANDCROS, con el blanco puro a 3,01:1 el logo daba 2,78.
 * Con 3,5 de margen, el logo pasa de 3.
 */
export const CONTRASTE_BLANCO_PASTILLA = 3.5;

/**
 * El fondo de la pastilla activa: el de la baldosa tal cual, salvo que el logo vaya en blanco (la
 * tinta que toca sobre ese color) y el blanco no llegue a `CONTRASTE_BLANCO_PASTILLA`: entonces,
 * OSCURECIDO lo justo (mismo tono mezclado con negro, como `colorDeBaldosaNueva` del #420). Un
 * fondo claro (Case, su logo original oscuro) no se toca.
 */
export function fondoDePastilla(color: string): string {
  const t = color.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(t) || tintaDeLogoSobre(t) !== "#ffffff") return color;
  const conBlanco = (c: string) => contraste(1, luminancia(...rgbDeHex(c)!));
  let k = 0;
  let c = t;
  while (conBlanco(c) < CONTRASTE_BLANCO_PASTILLA && k < 1) {
    k = Math.round((k + 0.01) * 100) / 100;
    c = oscurecer(t, k);
  }
  return c;
}

/**
 * EL LOGO DE UNA MARCA SOBRE SU COLOR (dirección; selector #432/#439 y banner de marca, 2026-11-09),
 * con la regla «una marca, un solo logo» (#420) y SIN filtros que lo aplanen a una tinta:
 * - con la baldosa de la marca de repuestos del mismo nombre (índice de marcas de nueva: su color
 *   y su «Logo para la baldosa», pareja ya diseñada), ese logo tal cual sobre ese fondo, un poco
 *   más oscuro si su logo blanco no llegaría a 3:1 (`fondoDePastilla`): Hitachi, Yanmar y LiuGong
 *   con su logo blanco; Case, su logo original sobre su crema;
 * - sin baldosa, el color propio (o el naranja de siempre) y el logo de siempre, con sus colores,
 *   sobre una plaquita blanca (`placa`).
 */
export type LogoSobreColor = { fondo: string; logo: LogoConAlt | null; placa: boolean };

export function logoSobreColor(
  nombre: string,
  logo: LogoConAlt | null,
  colorPropio: string | null | undefined,
  baldosas: ReadonlyMap<string, BaldosaDeRepuestos>,
): LogoSobreColor {
  const titulo = nombre.trim();
  const baldosa = buscarPorNombre(claveDeMarca(titulo), baldosas);
  if (baldosa)
    return {
      fondo: fondoDePastilla(baldosa.color),
      logo: { ...baldosa.logo, oscuro: false, blanco: false, alt: logo?.alt ?? titulo },
      placa: false,
    };
  return {
    fondo: colorDeMarca(colorPropio) ?? COLOR_SIN_MARCA,
    logo: logo ? { ...logo, oscuro: false, blanco: false } : null,
    placa: logo !== null,
  };
}
