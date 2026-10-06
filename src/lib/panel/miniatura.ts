/**
 * Miniaturas del panel (F3, decisiones-panel.md §24): la imagen pasa por el
 * optimizador de Next a 128 px (vale para 40–64 px en pantallas densas), así
 * que el panel descarga unos pocos kB en vez del original, que puede pesar
 * hasta 15 MB (§10.39). Mismo origen que el panel, así que el navegador no la
 * bloquea por ORB.
 */
export const ANCHO_MINIATURA = 128;

/** URL de la miniatura de una imagen de `Media`, o `null` si no hay URL. */
export function urlMiniatura(url: string | null | undefined): string | null {
  const limpia = url?.trim();
  if (!limpia) return null;
  return `/_next/image?url=${encodeURIComponent(limpia)}&w=${ANCHO_MINIATURA}&q=75`;
}

/** El id de la primera imagen de una celda de subida (una o varias, id u objeto). */
export function primeraImagen(valor: unknown): number | string | null {
  const primero = Array.isArray(valor) ? valor[0] : valor;
  if (typeof primero === "number" || typeof primero === "string") return primero;
  if (primero && typeof primero === "object" && "id" in primero) {
    const id = (primero as { id: unknown }).id;
    return typeof id === "number" || typeof id === "string" ? id : null;
  }
  return null;
}
