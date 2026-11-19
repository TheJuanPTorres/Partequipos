export type FotoFicha = { url: string; alt: string; width: number; height: number };

/**
 * El `sizes` de una foto: el de la galería y, con `altoMovil`, el último valor (el de móvil)
 * pasa a `max(<valor>, alto × proporción)`.
 */
export function sizesDeFoto(sizes: string, altoMovil: number | undefined, foto: FotoFicha): string {
  if (!altoMovil || !foto.width || !foto.height) return sizes;
  const corte = sizes.lastIndexOf(",");
  const movil = sizes.slice(corte + 1).trim();
  const ancho = Math.ceil((altoMovil * foto.width) / foto.height);
  return `${sizes.slice(0, corte + 1)} max(${movil}, ${ancho}px)`.trim();
}
