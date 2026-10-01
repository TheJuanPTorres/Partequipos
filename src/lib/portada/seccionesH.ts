import type { PreguntasFrecuente, Testimonio } from "@/payload-types";

import { videoDeYouTube, type VideoYouTube } from "../fields/youtube";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

/**
 * SECCIONES 10 Y 11 DE LA PORTADA (fase H, docs/diseno/decisiones-home-ux9.md §20).
 * Lógica pura: lo que se pinta a partir de Payload.
 */

/** Adónde lleva «Solicita asesoría». */
export const RUTA_ASESORIA = "/contactanos/";

// --- Sección 10: testimonios ------------------------------------------------------------

export type TarjetaTestimonio = {
  id: number;
  /** En ux-9 el texto grande es la EMPRESA («EMT SAS»); sin empresa, la persona. */
  titulo: string;
  /** El pequeño, la ciudad («Cali»). */
  subtitulo: string | null;
  texto: string;
  /** Es una persona: su `alt` la nombra. */
  foto: ImagenLista | null;
  youtube: VideoYouTube | null;
};

/**
 * SOLO los publicados: la consulta usa la API local, que salta el control de
 * acceso, así que el filtro va aquí además de en la consulta. Un testimonio no
 * se puede publicar sin la autorización de uso (L4, gancho de la colección).
 */
export function tarjetasDeTestimonios(docs: Testimonio[]): TarjetaTestimonio[] {
  return docs
    .filter((t) => t.publicado === true && t.nombre?.trim() && t.cita?.trim())
    .map((t) => {
      const nombre = t.nombre.trim();
      const foto = imagenDeMedia(t.foto, nombre);
      return {
        id: t.id,
        titulo: t.empresa?.trim() || nombre,
        subtitulo: t.ciudad?.trim() || null,
        texto: t.cita.trim(),
        foto: foto ? { ...foto, alt: nombre } : null,
        youtube: videoDeYouTube(t.youtube),
      };
    });
}

/** ux-9 abre la SEGUNDA al cargar; con una sola, esa. */
export function tarjetaInicial(total: number): number {
  return total > 1 ? 1 : 0;
}

// --- Sección 11: preguntas frecuentes -------------------------------------------------------

export type Pregunta = { id: number; pregunta: string; respuesta: string };

export function preguntasDeFaq(docs: PreguntasFrecuente[]): Pregunta[] {
  return docs
    .filter((p) => p.publicada === true && p.pregunta?.trim() && p.respuesta?.trim())
    .map((p) => ({ id: p.id, pregunta: p.pregunta.trim(), respuesta: p.respuesta.trim() }));
}
