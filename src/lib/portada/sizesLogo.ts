/**
 * `sizes` de cada logo de las bandas de la portada: lo que se pinta de verdad, no el ancho de la
 * caja entera. El logo está limitado por su ALTO (`max-height` de marcasKit.module.css: 44 px y,
 * desde 1025 px, `max(2.75rem, 3.5cqw)`) y por el ancho útil de su caja, así que su ancho es el
 * menor de alto × proporción y ese ancho útil. El panel mide ~0,97 del ancho de la ventana
 * (1392 de 1440, 1872 de 1920), de ahí que `cqw` se lea aquí como `0.97vw`. Antes decía `15vw`, más del doble
 * de lo pintado: a DPR 2 se bajaba un escalón del srcset (640 por ~101 px). El navegador sigue
 * pidiendo ancho × densidad, así que en pantallas de alta densidad no se ve borroso.
 */
const ALTO_LOGO_MOVIL = 44;
const ALTO_LOGO_MINIMO = 44;
/** `3.5cqw` ≈ 3,4vw (48,7 px medidos a 1440). Es una COTA: un logo ancho se limita antes por su caja. */
const VW_ALTO_ESCRITORIO = 3.4;
/** Caja de 13,5 rem menos 2 × 20 px de relleno. */
const ANCHO_UTIL_MOVIL = 176;
/**
 * Ancho útil en escritorio: banda normal `max(14.5rem, 18cqw)` menos 40 px de relleno; banda
 * espejo `max(12.5rem, 15cqw)` menos 2 × `max(1.5rem, 2cqw)`.
 */
const TOPE_ESCRITORIO = {
  normal: "max(192px, calc(17.4vw - 40px))",
  espejo: "max(152px, 10.8vw)",
} as const;

const redondear = (n: number) => Math.round(n * 10) / 10;

export function sizesDeLogo(
  { width, height }: { width: number; height: number },
  espejo = false,
): string {
  const proporcion = width > 0 && height > 0 ? width / height : 1;
  const movil = Math.min(ANCHO_UTIL_MOVIL, Math.ceil(ALTO_LOGO_MOVIL * proporcion));
  const minimo = Math.ceil(ALTO_LOGO_MINIMO * proporcion);
  const vw = redondear(VW_ALTO_ESCRITORIO * proporcion);
  const tope = TOPE_ESCRITORIO[espejo ? "espejo" : "normal"];
  return `(min-width: 1025px) min(${tope}, max(${minimo}px, ${vw}vw)), ${movil}px`;
}
