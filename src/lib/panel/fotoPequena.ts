/**
 * FOTOS PEQUEÑAS en las fichas del panel (fase 2, 2026-11-18): la ayuda con el tamaño recomendado
 * de cada uso y el umbral del aviso en vivo (`components/admin/aviso/AvisoFotoPequena.tsx`). Puro,
 * para poder probarlo.
 */

export type UsoDeFoto = "cabecera" | "galeria" | "tarjeta" | "logo" | "recorte";

/** El tamaño que se pide en la ayuda de cada uso (informe de la fase 1, §4). */
export const TAMANO_RECOMENDADO: Record<UsoDeFoto, string> = {
  cabecera: "2.560 × 1.440 px (horizontal)",
  galeria: "1.600 px de ancho o más; la primera es la de la tarjeta",
  tarjeta: "1.200 × 900 px",
  logo: "SVG, o PNG transparente de 600 px de ancho",
  recorte: "PNG o WebP transparente, 1.600 px de ancho",
};

/** Por debajo de este ancho la foto se ve borrosa en pantallas grandes: se avisa. */
export const ANCHO_MINIMO = 1200;

export function ayudaDeFoto(uso: UsoDeFoto): string {
  return `Tamaño recomendado: ${TAMANO_RECOMENDADO[uso]}.`;
}

/** Los ids de un campo de subida tal como lo da el formulario: id, documento, o una lista. */
export function idsDeSubida(valor: unknown): number[] {
  const lista = Array.isArray(valor) ? valor : [valor];
  return lista.flatMap((v) => {
    const crudo = typeof v === "object" && v !== null ? (v as { id?: unknown }).id : v;
    const id = typeof crudo === "string" && crudo.trim() !== "" ? Number(crudo) : crudo;
    return typeof id === "number" && Number.isInteger(id) && id > 0 ? [id] : [];
  });
}

/** Las imágenes de menos de `minimo` px de ancho (las vectoriales o sin ancho, no). */
export function fotosPequenas<T extends { width?: number | null }>(
  imagenes: T[],
  minimo: number = ANCHO_MINIMO,
): T[] {
  return imagenes.filter((i) => typeof i.width === "number" && i.width > 0 && i.width < minimo);
}
