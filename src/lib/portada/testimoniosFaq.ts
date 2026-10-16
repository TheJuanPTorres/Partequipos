import { videoDeYouTube } from "../fields/youtube";

/**
 * PREGUNTAS FRECUENTES Y TESTIMONIOS REALES (`scripts/contenido-real/testimonios-faq.ts`):
 * tipos de la fuente y reglas puras del importador. La fuente vive FUERA del
 * repositorio (`Desktop/partequipos-cierre/testimonios-faq-fuente.json`) porque
 * lleva nombres de empresas clientes (CLAUDE.md §9). Detalle en
 * `docs/contenido-real-portada.md` §6.
 */
export type FuenteTestimoniosFaq = {
  preguntas: { orden: number; pregunta: string; respuesta: string }[];
  testimonios: {
    orden: number;
    clave: string;
    empresa: string;
    ciudad: string | null;
    youtube: string;
    imagen: string;
  }[];
};

export type ManifiestoTestimoniosFaq = {
  destino: string;
  inicio: string;
  creado: {
    media: { clave: string; id: number; url: string }[];
    testimonios: number[];
    preguntas: number[];
  };
  /** Preguntas que existían y se despublicaron (solo con `despublicar`); la retirada las devuelve. */
  despublicadas: number[];
  /** Lo mismo con los testimonios de ejemplo del preview. */
  testimoniosDespublicados?: number[];
};

export const PREFIJO_TESTIMONIO = "wp-real-testimonio-";

/** Nombre del fichero de la miniatura en el Blob. */
export function ficheroTestimonio(clave: string, urlWp: string): string {
  const ext = (urlWp.match(/\.(jpe?g|png|webp)(?:\?|$)/i)?.[1] ?? "jpg").toLowerCase();
  return `${PREFIJO_TESTIMONIO}${clave.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${ext}`;
}

/** Errores de la fuente, todos juntos: una lista vacía es una fuente buena. */
export function problemasDeLaFuente(f: FuenteTestimoniosFaq): string[] {
  const p: string[] = [];
  if (!f.preguntas.length) p.push("no hay preguntas");
  for (const q of f.preguntas)
    if (!q.pregunta.trim() || !q.respuesta.trim()) p.push(`pregunta ${q.orden} incompleta`);
  const claves = new Set<string>();
  const videos = new Set<string>();
  for (const t of f.testimonios) {
    const v = videoDeYouTube(t.youtube);
    if (!v) p.push(`testimonio «${t.clave}»: enlace de YouTube no válido`);
    else if (videos.has(v.id)) p.push(`testimonio «${t.clave}»: vídeo repetido`);
    else videos.add(v.id);
    if (claves.has(t.clave)) p.push(`clave repetida «${t.clave}»`);
    claves.add(t.clave);
    if (!t.empresa.trim()) p.push(`testimonio «${t.clave}»: sin empresa`);
    if (!/^https:\/\//.test(t.imagen)) p.push(`testimonio «${t.clave}»: imagen no https`);
  }
  return p;
}

/** Qué preguntas faltan por crear: las que no existen ya con el mismo texto. */
export function preguntasPorCrear(
  fuente: FuenteTestimoniosFaq["preguntas"],
  existentes: string[],
): FuenteTestimoniosFaq["preguntas"] {
  const ya = new Set(existentes.map((e) => e.trim().toLowerCase()));
  return fuente.filter((q) => !ya.has(q.pregunta.trim().toLowerCase()));
}

/** Qué testimonios faltan por crear: los cuyo vídeo no sale ya en uno existente. */
export function testimoniosPorCrear(
  fuente: FuenteTestimoniosFaq["testimonios"],
  youtubeExistentes: (string | null | undefined)[],
): FuenteTestimoniosFaq["testimonios"] {
  const ya = new Set(
    youtubeExistentes.flatMap((u) => {
      const v = videoDeYouTube(u);
      return v ? [v.id] : [];
    }),
  );
  return fuente.filter((t) => {
    const v = videoDeYouTube(t.youtube);
    return v !== null && !ya.has(v.id);
  });
}
