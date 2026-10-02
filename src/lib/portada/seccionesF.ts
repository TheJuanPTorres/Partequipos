import type { Media, Pagina, Video } from "@/payload-types";

import { imagenDeMedia, poblado, type ImagenLista } from "../utils/relations";

export { urlInsercion, validarYouTube, videoDeYouTube, type VideoYouTube } from "../fields/youtube";

/**
 * SECCIONES 6–8 DE LA PORTADA (fase F, docs/diseno/decisiones-home-ux9.md §19)
 * y el YouTube de la H. Lógica pura: lo que se pinta a partir de Payload.
 */

// --- Sección 7: vídeo de la compañía ------------------------------------------------

export type VideoCompania = {
  url: string;
  tipo: string;
  /** Lo que se ve antes de cargar, al pausar y con movimiento reducido. */
  poster: ImagenLista | null;
  /** Decorativo: oculto al lector. Si no, su descripción lo nombra. */
  decorativo: boolean;
  descripcion: string;
};

export function videoDeCompania(seccion: Pagina["seccionCompania"]): VideoCompania | null {
  const v = poblado<Video>(seccion?.video);
  if (!v?.url) return null;
  const poster = imagenDeMedia(poblado<Media>(v.poster), "");
  return {
    url: v.url,
    tipo: v.mimeType ?? "video/mp4",
    poster: poster ? { ...poster, alt: "" } : null,
    decorativo: v.decorativo !== false,
    descripcion: v.descripcion?.trim() ?? "",
  };
}
