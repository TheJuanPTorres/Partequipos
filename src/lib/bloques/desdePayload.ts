import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

import type { Media, Pagina, Video } from "@/payload-types";

import { imagenDeMedia, poblado } from "../utils/relations";
import type { EnlaceBloque, VideoBloque, VistaBloque } from "./vista";

/**
 * DE PAYLOAD A LA VISTA — traduce el campo `bloques` de una página (leída con
 * `depth: 1`) a lo que pintan los componentes de `src/components/bloques/`.
 * Lógica pura, sin consultas: los vídeos llegan aparte, con su póster poblado
 * (`getVideoPorId`), porque `depth: 1` lo deja sin poblar.
 *
 * Lo que falta no rompe: una imagen sin URL o sin medidas se omite, un botón
 * sin texto o sin enlace no se pinta y una cifra sin número se descarta.
 */
export type BloqueDoc = NonNullable<Pagina["bloques"]>[number];

/** Ids de los vídeos de las cabeceras, para pedirlos con su póster. */
export function idsDeVideos(bloques: Pagina["bloques"]): number[] {
  const ids = new Set<number>();
  for (const b of bloques ?? []) {
    if (b.blockType !== "cabeceraVideo" || !b.video) continue;
    ids.add(typeof b.video === "object" ? b.video.id : b.video);
  }
  return [...ids];
}

function boton(
  texto: string | null | undefined,
  href: string | null | undefined,
): EnlaceBloque | null {
  const t = texto?.trim();
  const h = href?.trim();
  return t && h ? { texto: t, href: h } : null;
}

function video(
  rel: number | Video | null | undefined,
  videos: ReadonlyMap<number, Video>,
): VideoBloque | null {
  if (!rel) return null;
  const doc = videos.get(typeof rel === "object" ? rel.id : rel) ?? poblado<Video>(rel);
  if (!doc?.url) return null;
  const poster = imagenDeMedia(poblado<Media>(doc.poster), "");
  return {
    url: doc.url,
    poster: poster ? { ...poster, alt: "" } : null,
    decorativo: doc.decorativo !== false,
    descripcion: doc.descripcion?.trim() ?? "",
  };
}

export function vistaDeBloque(
  b: BloqueDoc,
  videos: ReadonlyMap<number, Video> = new Map(),
): VistaBloque | null {
  switch (b.blockType) {
    case "cabeceraVideo":
      return {
        blockType: b.blockType,
        id: b.id,
        antetitulo: b.antetitulo,
        titulo: b.titulo,
        video: video(b.video, videos),
        imagen: imagenDeMedia(b.imagen, ""),
      };
    case "presentacionImagen":
      return {
        blockType: b.blockType,
        id: b.id,
        imagen: imagenDeMedia(b.imagen, ""),
        antetitulo: b.antetitulo,
        titulo: b.titulo,
        texto: b.texto ? (b.texto as unknown as SerializedEditorState) : null,
        boton: boton(b.botonTexto, b.botonEnlace),
      };
    case "cifras": {
      const cifras = (b.cifras ?? [])
        .filter(
          (c) => typeof c.numero === "number" && Number.isFinite(c.numero) && c.etiqueta?.trim(),
        )
        .map((c) => ({
          id: c.id,
          prefijo: c.prefijo,
          numero: c.numero,
          sufijo: c.sufijo,
          etiqueta: c.etiqueta.trim(),
        }));
      return cifras.length ? { blockType: b.blockType, id: b.id, cifras } : null;
    }
    case "franjaMarquee":
      return {
        blockType: b.blockType,
        id: b.id,
        texto: b.texto,
        imagenFondo: imagenDeMedia(b.imagenFondo, ""),
        imagenFrontal: imagenDeMedia(b.imagenFrontal, ""),
      };
    case "tarjetasExpandibles": {
      const tarjetas = (b.tarjetas ?? []).map((t) => ({
        id: t.id,
        titulo: t.titulo,
        texto: t.texto?.trim() || null,
        imagen: imagenDeMedia(t.imagen, ""),
        href: t.enlace?.trim() || null,
      }));
      return tarjetas.length
        ? {
            blockType: b.blockType,
            id: b.id,
            antetitulo: b.antetitulo,
            titulo: b.titulo,
            tarjetas,
            boton: boton(b.botonTexto, b.botonEnlace),
          }
        : null;
    }
  }
}

export function vistaDeBloques(
  bloques: Pagina["bloques"],
  videos: ReadonlyMap<number, Video> = new Map(),
): VistaBloque[] {
  return (bloques ?? []).flatMap((b) => vistaDeBloque(b, videos) ?? []);
}
