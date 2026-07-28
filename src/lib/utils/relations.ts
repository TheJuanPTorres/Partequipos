import type { Media } from "@/payload-types";

/**
 * Las relaciones de Payload llegan como id (number) o como documento poblado,
 * según el `depth` de la consulta. Estos helpers estrechan el tipo sin usar
 * `any` (CLAUDE.md §5).
 */
export function poblado<T extends { id: number }>(rel: number | T | null | undefined): T | null {
  return rel && typeof rel === "object" ? rel : null;
}

export type ImagenLista = { url: string; alt: string; width: number; height: number };

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
  };
}
