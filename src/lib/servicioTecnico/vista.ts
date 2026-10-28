import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

import type {
  EnlaceBloque,
  ImagenBloque,
  VideoBloque,
  VistaBloque,
  VistaFormularioContacto,
  VistaGaleria,
  VistaPresentacionImagen,
  VistaProcesoPasos,
  VistaVideoYoutube,
} from "../bloques/vista";

/**
 * SERVICIO TÉCNICO CON DISEÑO PROPIO (aprobado el 2026-10-19; la página con
 * «Diseño: Servicio técnico»): lógica pura que convierte los bloques REALES de la página
 * (`vistaDeBloques`) en lo que pinta `PlantillaServicioTecnico`. No inventa
 * contenido: cada sección sale de su bloque, por su ancla; los pasos de
 * siniestros, del bloque «Proceso paso a paso».
 */

/** Un párrafo de texto enriquecido: su arranque en negrita (si lo tiene) y el resto. */
export type Parrafo = { negrita: string | null; texto: string };

type NodoLexical = { type?: string; text?: string; format?: number; children?: NodoLexical[] };

/** Los párrafos de un texto de Lexical, con lo que empieza en negrita aparte. */
export function parrafosDe(texto: SerializedEditorState | null | undefined): Parrafo[] {
  const raiz = texto?.root as NodoLexical | undefined;
  return (raiz?.children ?? [])
    .filter((p) => p.type === "paragraph" || p.type === "heading")
    .map((p) => {
      const hijos = (p.children ?? []).filter((h) => typeof h.text === "string");
      let negrita = "";
      let i = 0;
      while (i < hijos.length && ((hijos[i]!.format ?? 0) & 1) === 1) {
        negrita += hijos[i]!.text;
        i++;
      }
      const resto = hijos
        .slice(i)
        .map((h) => h.text)
        .join("");
      return { negrita: negrita.trim() || null, texto: resto.trim() };
    })
    .filter((p) => p.negrita || p.texto);
}

export type Paso = { numero: string; etiqueta: string; texto: string };

export type VistaServicioTecnico = {
  hero: {
    antetitulo: string | null;
    titulo: string;
    /** La frase destacada del taller («Contamos con personal calificado…»). */
    lema: string | null;
    video: VideoBloque | null;
    imagen: ImagenBloque | null;
  };
  /** Las secciones con ancla, para el acceso rápido de la cabecera. */
  accesos: { ancla: string; titulo: string }[];
  taller: {
    ancla: string;
    antetitulo: string | null;
    titulo: string;
    parrafos: string[];
    destacado: string | null;
    imagen: ImagenBloque | null;
    boton: EnlaceBloque | null;
  } | null;
  alistamiento: {
    ancla: string;
    titulo: string;
    parrafos: string[];
    /** El vídeo del taller (el de las etapas) y el corto de YouTube. */
    etapas: VideoBloque | null;
    youtube: VistaVideoYoutube["video"];
    /** La portada del vídeo de YouTube, local (no se carga YouTube hasta pulsar). */
    miniaturaYoutube: ImagenBloque | null;
    /** El recuadro bajo el vídeo de YouTube (editable; dirección, 2026-10-20). */
    descripcionYoutube: string | null;
    fondo: VideoBloque | null;
  } | null;
  posventa: {
    ancla: string;
    /** El antetítulo de su columna (el del bloque en el panel; vacío, «Servicio postventa»). */
    antetitulo: string | null;
    titulo: string;
    parrafos: string[];
    imagen: ImagenBloque | null;
    boton: EnlaceBloque | null;
  } | null;
  siniestros: {
    ancla: string;
    titulo: string;
    intro: string | null;
    pasos: Paso[];
    /**
     * El titular de la galería: el primer párrafo tras los pasos («Trabajamos
     * con las principales aseguradoras», tal cual WordPress).
     */
    aseguradoras: string | null;
    /** La frase que presenta la galería (el texto de la galería). */
    galeriaTexto: string | null;
    /** Lo que queda tras el titular de la galería, si algo. */
    cierre: string[];
    galeria: ImagenBloque[];
    boton: EnlaceBloque | null;
  } | null;
  contacto: { ancla: string; titulo: string; texto: string | null; botonTexto: string } | null;
  /** La textura de fondo (la del taller o la del proceso): la de WordPress. */
  textura: ImagenBloque | null;
};

const ETIQUETA_ACCESO: Record<string, string> = {
  taller: "Taller",
  alistamiento: "Alistamiento",
  posventa: "Posventa",
  siniestros: "Siniestros",
};

const texto = (p: Parrafo) => [p.negrita, p.texto].filter(Boolean).join(" ");

export function vistaServicioTecnico(bloques: VistaBloque[]): VistaServicioTecnico {
  const porAncla = (ancla: string) =>
    bloques.find((b) => b.ancla?.toLowerCase() === ancla.toLowerCase());
  const cabecera = bloques.find((b) => b.blockType === "cabeceraVideo");
  const taller = porAncla("taller") as VistaPresentacionImagen | undefined;
  const alist = porAncla("alistamiento") as VistaVideoYoutube | undefined;
  const posventa = porAncla("posventa") as VistaPresentacionImagen | undefined;
  // Siniestros: el bloque «Proceso paso a paso» o, en una página aún sin él,
  // una «Presentación con imagen» con sus párrafos «ETIQUETA: texto».
  const siniestros = porAncla("siniestros") as
    VistaPresentacionImagen | VistaProcesoPasos | undefined;
  const galeria = bloques.find((b) => b.blockType === "galeria") as VistaGaleria | undefined;
  const contacto = bloques.find((b) => b.blockType === "formularioContacto") as
    VistaFormularioContacto | undefined;

  const pTaller = parrafosDe(taller?.texto);
  const destacado = pTaller.find((p) => p.negrita && !p.texto)?.negrita ?? null;

  let intro: string | null = null;
  let pasos: Paso[] = [];
  const cierre: string[] = [];
  if (siniestros?.blockType === "procesoPasos") {
    intro = siniestros.entradilla;
    pasos = siniestros.pasos.map((p, i) => ({
      numero: String(i + 1).padStart(2, "0"),
      etiqueta: p.etiqueta,
      texto: p.texto,
    }));
  } else if (siniestros) {
    for (const p of parrafosDe(siniestros.texto)) {
      if (p.negrita && p.texto && /:$/.test(p.negrita)) {
        pasos.push({
          numero: String(pasos.length + 1).padStart(2, "0"),
          etiqueta: p.negrita.replace(/:$/, "").trim(),
          texto: p.texto,
        });
      } else if (!intro && !pasos.length) intro = texto(p);
      else cierre.push(texto(p));
    }
  }

  return {
    hero: {
      antetitulo: taller?.antetitulo ?? null,
      titulo: cabecera?.blockType === "cabeceraVideo" ? cabecera.titulo : "Servicio técnico",
      lema: destacado,
      video: cabecera?.blockType === "cabeceraVideo" ? cabecera.video : null,
      imagen: cabecera?.blockType === "cabeceraVideo" ? cabecera.imagen : null,
    },
    accesos: [taller, alist, posventa, siniestros]
      .filter((b): b is NonNullable<typeof b> => Boolean(b?.ancla))
      .map((b) => ({
        ancla: b.ancla!,
        titulo: ETIQUETA_ACCESO[b.ancla!.toLowerCase()] ?? b.titulo,
      })),
    taller: taller
      ? {
          ancla: taller.ancla!,
          antetitulo: taller.antetitulo ?? null,
          titulo: taller.titulo,
          parrafos: pTaller.filter((p) => p.texto).map(texto),
          destacado,
          imagen: taller.imagen,
          boton: taller.boton,
        }
      : null,
    alistamiento: alist
      ? {
          ancla: alist.ancla!,
          titulo: alist.titulo,
          parrafos: parrafosDe(alist.texto).map(texto),
          etapas: alist.videoTaller ?? null,
          youtube: alist.video,
          miniaturaYoutube: alist.miniatura,
          descripcionYoutube: alist.descripcionYoutube ?? null,
          fondo: alist.videoFondo ?? null,
        }
      : null,
    posventa: posventa
      ? {
          ancla: posventa.ancla!,
          antetitulo: posventa.antetitulo?.trim() || null,
          titulo: posventa.titulo,
          parrafos: parrafosDe(posventa.texto).map(texto),
          imagen: posventa.imagen,
          boton: posventa.boton,
        }
      : null,
    siniestros: siniestros
      ? {
          ancla: siniestros.ancla!,
          titulo: siniestros.titulo,
          intro,
          pasos,
          // El titular de la galería: su título o, sin él, el primer párrafo tras los pasos.
          aseguradoras: galeria?.titulo ?? cierre[0] ?? null,
          galeriaTexto: galeria?.texto ?? null,
          cierre: galeria?.titulo ? cierre : cierre.slice(1),
          galeria: galeria?.imagenes ?? [],
          boton: siniestros.boton,
        }
      : null,
    contacto: contacto
      ? {
          ancla: contacto.ancla ?? "contacto",
          titulo: contacto.titulo,
          texto: contacto.texto ?? null,
          botonTexto: contacto.botonTexto ?? "Enviar solicitud",
        }
      : null,
    textura:
      taller?.textura ??
      (siniestros?.blockType === "procesoPasos" ? siniestros.textura : null) ??
      null,
  };
}
