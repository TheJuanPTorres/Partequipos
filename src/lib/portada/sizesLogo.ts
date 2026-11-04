/**
 * `sizes` de cada logo de las bandas de la portada: lo que se pinta de verdad, no el ancho de la
 * caja. El logo está limitado por ALTO (`max-height` de marcasKit.module.css: 44 px y, desde
 * 1025 px, `max(2.75rem, 3.5cqw)`, con el panel casi a ancho de ventana: ~49 px a 1440) y por el
 * ancho de su caja, así que su ancho es alto × proporción. Antes decía `15vw`, más del doble de lo
 * pintado: a DPR 2 se bajaba el escalón siguiente (640 por ~101 px). El navegador sigue pidiendo
 * ancho × densidad, así que en pantallas de alta densidad no se ve borroso.
 */
const ALTO_LOGO_MOVIL = 44;
const ALTO_LOGO_MINIMO = 44;
/** `3.5cqw` del alto máximo en escritorio, con el panel ≈ ancho de ventana. */
const VW_ALTO_ESCRITORIO = 3.5;
const ANCHO_CAJA_MOVIL = 176;
const ANCHO_CAJA_ESCRITORIO = 232;

const redondear = (n: number) => Math.round(n * 10) / 10;

export function sizesDeLogo({ width, height }: { width: number; height: number }): string {
  const proporcion = width > 0 && height > 0 ? width / height : 1;
  const movil = Math.min(ANCHO_CAJA_MOVIL, Math.ceil(ALTO_LOGO_MOVIL * proporcion));
  const minimo = Math.ceil(ALTO_LOGO_MINIMO * proporcion);
  const vw = redondear(VW_ALTO_ESCRITORIO * proporcion);
  const escritorio = `min(${ANCHO_CAJA_ESCRITORIO}px, max(${minimo}px, ${vw}vw))`;
  return `(min-width: 1025px) ${escritorio}, ${movil}px`;
}
