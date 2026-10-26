import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

import type { Animacion, Media, Pagina, Video } from "@/payload-types";

import { anclaValida } from "../fields/ancla";
import { videoDeYouTube } from "../fields/youtube";
import { imagenDeMedia, poblado } from "../utils/relations";
import type { AnimacionBloque, EnlaceBloque, VideoBloque, VistaBloque } from "./vista";

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

/** Ids de los vídeos de los bloques (cabeceras y vídeos del taller y de fondo), para pedirlos con su póster. */
export function idsDeVideos(bloques: Pagina["bloques"]): number[] {
  const ids = new Set<number>();
  const anadir = (v: number | Video | null | undefined) => {
    if (v) ids.add(typeof v === "object" ? v.id : v);
  };
  for (const b of bloques ?? []) {
    if (b.blockType === "cabeceraVideo") anadir(b.video);
    if (b.blockType === "videoYoutube") {
      anadir(b.videoTaller);
      anadir(b.videoFondo);
    }
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

function animacion(rel: number | Animacion | null | undefined): AnimacionBloque | null {
  const doc = poblado<Animacion>(rel);
  if (!doc?.url || !doc.ancho || !doc.alto) return null;
  return { url: doc.url, ancho: doc.ancho, alto: doc.alto };
}

/** El ancla guardada, si es válida; si no, ninguna (un `id` roto no se pinta). */
function ancla(valor: string | null | undefined): string | null {
  const a = valor?.trim();
  return a && anclaValida(a) ? a : null;
}

export function vistaDeBloque(
  b: BloqueDoc,
  videos: ReadonlyMap<number, Video> = new Map(),
): VistaBloque | null {
  const vista = vistaSinAncla(b, videos);
  return vista ? { ...vista, ancla: ancla(b.ancla) } : null;
}

function vistaSinAncla(b: BloqueDoc, videos: ReadonlyMap<number, Video>): VistaBloque | null {
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
        animacion: animacion(b.lottie),
        antetitulo: b.antetitulo,
        titulo: b.titulo,
        texto: b.texto ? (b.texto as unknown as SerializedEditorState) : null,
        boton: boton(b.botonTexto, b.botonEnlace),
        textura: imagenDeMedia(b.textura, ""),
      };
    case "procesoPasos": {
      const pasos = (b.pasos ?? [])
        .filter((p) => p.etiqueta?.trim() && p.texto?.trim())
        .map((p) => ({ id: p.id, etiqueta: p.etiqueta.trim(), texto: p.texto.trim() }));
      return {
        blockType: b.blockType,
        id: b.id,
        antetitulo: b.antetitulo,
        titulo: b.titulo,
        entradilla: b.entradilla?.trim() || null,
        pasos,
        boton: boton(b.botonTexto, b.botonEnlace),
        textura: imagenDeMedia(b.textura, ""),
      };
    }
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
        fondos: [b.imagenFondo, ...(b.fondosExtra ?? [])]
          .map((m) => imagenDeMedia(m, ""))
          .filter((i) => i !== null),
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
    case "galeria": {
      const imagenes = (b.imagenes ?? []).flatMap((fila) => imagenDeMedia(fila.imagen, "") ?? []);
      return imagenes.length
        ? {
            blockType: b.blockType,
            id: b.id,
            antetitulo: b.antetitulo,
            titulo: b.titulo?.trim() || null,
            texto: b.texto?.trim() || null,
            imagenes,
          }
        : null;
    }
    case "videoYoutube": {
      const v = videoDeYouTube(b.youtube);
      return v
        ? {
            blockType: b.blockType,
            id: b.id,
            antetitulo: b.antetitulo,
            titulo: b.titulo,
            texto: b.texto ? (b.texto as unknown as SerializedEditorState) : null,
            video: v,
            miniatura: imagenDeMedia(b.miniatura, ""),
            descripcionYoutube: b.descripcionYoutube?.trim() || null,
            videoTaller: video(b.videoTaller, videos),
            videoFondo: video(b.videoFondo, videos),
          }
        : null;
    }
    case "formularioContacto":
      return {
        blockType: b.blockType,
        id: b.id,
        antetitulo: b.antetitulo,
        titulo: b.titulo,
        texto: b.texto?.trim() || null,
        botonTexto: b.botonTexto?.trim() || null,
      };
    case "documentoVisor": {
      const documento = typeof b.documento === "object" ? b.documento?.id : b.documento;
      return documento
        ? { blockType: b.blockType, id: b.id, documento, titulo: b.titulo?.trim() || null }
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

/** Un documento de «Vídeos» (con su póster poblado) en la forma que pintan los bloques. */
export function vistaDeVideo(doc: Video | null | undefined): VideoBloque | null {
  return doc ? video(doc, new Map()) : null;
}
