import type { Media } from "@/payload-types";

/**
 * Las relaciones de Payload llegan como id (number) o como documento poblado,
 * según el `depth` de la consulta. Estos helpers estrechan el tipo sin usar
 * `any` (CLAUDE.md §5).
 */
export function poblado<T extends { id: number }>(rel: number | T | null | undefined): T | null {
  return rel && typeof rel === "object" ? rel : null;
}

export type ImagenLista = {
  url: string;
  alt: string;
  width: number;
  height: number;
  /** `object-position` del punto focal que el editor marca en el panel. */
  posicion: string;
};

/**
 * PUNTO FOCAL → `object-position` (fase C, CLAUDE.md §10.32).
 *
 * Payload guarda el punto focal en porcentajes (0–100, desde arriba a la
 * izquierda). Con `object-fit: cover`, `object-position: X% Y%` alinea el punto
 * X% de la imagen con el X% de la caja, así que el punto elegido queda SIEMPRE
 * dentro de lo visible, sea cual sea la proporción de la caja. Sin punto, o con
 * valores raros, el centro.
 */
export function posicionFocal(x: unknown, y: unknown): string {
  const valido = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(Math.max(v, 0), 100) : 50;
  return `${valido(x)}% ${valido(y)}%`;
}

/**
 * Convierte un Media poblado en los datos que `next/image` necesita.
 * Devuelve null si falta cualquier dato imprescindible (url o dimensiones),
 * de modo que la interfaz pueda renderizar su alternativa sin imagen.
 */
export function imagenDeMedia(
  media: number | Media | null | undefined,
  altPorDefecto: string,
): ImagenLista | null {
  const doc = poblado<Media>(media);
  if (!doc?.url || !doc.width || !doc.height) return null;

  return {
    url: doc.url,
    alt: doc.alt || altPorDefecto,
    width: doc.width,
    height: doc.height,
    posicion: posicionFocal(doc.focalX, doc.focalY),
  };
}
