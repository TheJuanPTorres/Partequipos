/**
 * La escala de las pantallas grandes vista desde JavaScript (la del CSS es `--u`, `globals.css`):
 * 1 hasta 1600 px de ventana y, desde ahí, `ancho / 1600`. Para las medidas en píxeles que viven
 * en el código (márgenes al desplazar, recorridos de una animación…) y que tienen que crecer como
 * el resto de la página. Las que se miden en el DOM ya vienen escaladas: no se tocan.
 */
export const ANCHO_DISENO = 1600;

export function factorEscala(
  ancho: number = typeof window === "undefined" ? 0 : window.innerWidth,
) {
  return Math.max(1, ancho / ANCHO_DISENO);
}

/** `px` del diseño a píxeles de la pantalla actual. */
export function escalaPx(px: number, ancho?: number): number {
  return px * factorEscala(ancho);
}

/**
 * El `sizes` de una foto que se pinta a `px` en el diseño: lo mismo hasta 1600 y, desde ahí, en
 * proporción (`max(400px, 25vw)` = 400 px a 1600 y 960 a 3840).
 */
export function sizesEscalado(px: number): string {
  const vw = Math.round((px / ANCHO_DISENO) * 100 * 1000) / 1000;
  return `max(${px}px, ${vw}vw)`;
}
