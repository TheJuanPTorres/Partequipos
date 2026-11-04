/**
 * `sizes` de cada logo: lo que se pinta de verdad, no el ancho de la caja. El logo está limitado
 * por ALTO (`max-height` de marcasKit.module.css: 44 px y, desde 1025 px, `max(2.75rem, 3.5cqw)`,
 * unos 49 px a 1440 y ~64 a 1920) y por el ancho de su caja, así que su ancho es alto × proporción.
 * Antes decía `15vw`, el doble de lo pintado: a DPR 2 se bajaba el siguiente tamaño (640 por 101 px).
 * El navegador sigue pidiendo ancho × densidad, así que en pantallas de alta densidad no se ve borroso.
 */
const ALTO_LOGO_MOVIL = 44;
const ALTO_LOGO_ESCRITORIO = 64;
const ANCHO_CAJA_MOVIL = 176;
const ANCHO_CAJA_ESCRITORIO = 232;

export function sizesDeLogo({ width, height }: { width: number; height: number }): string {
  const proporcion = width > 0 && height > 0 ? width / height : 1;
  const px = (alto: number, tope: number) => Math.min(tope, Math.ceil(alto * proporcion));
  return `(min-width: 1025px) ${px(ALTO_LOGO_ESCRITORIO, ANCHO_CAJA_ESCRITORIO)}px, ${px(ALTO_LOGO_MOVIL, ANCHO_CAJA_MOVIL)}px`;
}
