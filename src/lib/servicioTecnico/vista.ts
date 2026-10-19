import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

import type {
  EnlaceBloque,
  ImagenBloque,
  VideoBloque,
  VistaBloque,
  VistaFormularioContacto,
  VistaGaleria,
  VistaPresentacionImagen,
  VistaVideoYoutube,
} from "../bloques/vista";

/**
 * SERVICIO TÉCNICO CON DISEÑO PROPIO (muestra del 2026-10-19, pendiente de
 * aprobación): lógica pura que convierte los bloques REALES de la página
 * (`vistaDeBloques`) en lo que pinta `PlantillaServicioTecnico`. No inventa
 * contenido: los pasos del proceso de siniestros salen de sus párrafos
 * «VALORACIÓN: …», «REPARACIÓN: …» y «REPUESTOS: …», tal cual WordPress.
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
    /** El vídeo alojado de las etapas (recomprimido) y el corto de YouTube. */
    etapas: VideoBloque | null;
    youtube: VistaVideoYoutube["video"];
    miniatura: ImagenBloque | null;
    /** La miniatura del corto de YouTube, local (no se carga YouTube hasta pulsar). */
    miniaturaYoutube: ImagenBloque | null;
    fondo: VideoBloque | null;
  } | null;
  posventa: {
    ancla: string;
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
    /** La frase que presenta la galería (texto nuestro; editable al aplicarlo). */
    galeriaTexto: string;
    /** Lo que queda tras el titular de la galería, si algo. */
    cierre: string[];
    galeria: ImagenBloque[];
    boton: EnlaceBloque | null;
  } | null;
  contacto: { ancla: string; titulo: string; texto: string | null; botonTexto: string } | null;
  /** La textura de fondo de WordPress para el taller y los siniestros. */
  textura: ImagenBloque | null;
};

const ETIQUETA_ACCESO: Record<string, string> = {
  taller: "Taller",
  alistamiento: "Alistamiento",
  posventa: "Posventa",
  siniestros: "Siniestros",
};

const texto = (p: Parrafo) => [p.negrita, p.texto].filter(Boolean).join(" ");

/**
 * La frase que presenta la galería de siniestros. Texto NUESTRO (en WordPress
 * no hay): describe las fotos sin afirmar que son trabajos propios.
 */
export const TEXTO_GALERIA_SINIESTROS =
  "Así llegan muchas máquinas tras un siniestro. Te acompañamos desde la valoración hasta la reparación y los repuestos.";

export function vistaServicioTecnico(
  bloques: VistaBloque[],
  extras: {
    etapas: VideoBloque | null;
    fondo: VideoBloque | null;
    textura: ImagenBloque | null;
    miniaturaYoutube?: ImagenBloque | null;
  },
): VistaServicioTecnico {
  const porAncla = (ancla: string) =>
    bloques.find((b) => b.ancla?.toLowerCase() === ancla.toLowerCase());
  const cabecera = bloques.find((b) => b.blockType === "cabeceraVideo");
  const taller = porAncla("taller") as VistaPresentacionImagen | undefined;
  const alist = porAncla("alistamiento") as VistaVideoYoutube | undefined;
  const posventa = porAncla("posventa") as VistaPresentacionImagen | undefined;
  const siniestros = porAncla("siniestros") as VistaPresentacionImagen | undefined;
  const galeria = bloques.find((b) => b.blockType === "galeria") as VistaGaleria | undefined;
  const contacto = bloques.find((b) => b.blockType === "formularioContacto") as
    VistaFormularioContacto | undefined;

  const pTaller = parrafosDe(taller?.texto);
  const destacado = pTaller.find((p) => p.negrita && !p.texto)?.negrita ?? null;
  const pSiniestros = parrafosDe(siniestros?.texto);
  const pasos: Paso[] = [];
  const cierre: string[] = [];
  let intro: string | null = null;
  for (const p of pSiniestros) {
    if (p.negrita && p.texto && /:$/.test(p.negrita)) {
      pasos.push({
        numero: String(pasos.length + 1).padStart(2, "0"),
        etiqueta: p.negrita.replace(/:$/, "").trim(),
        texto: p.texto,
      });
    } else if (!intro && !pasos.length) intro = texto(p);
    else cierre.push(texto(p));
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
          etapas: extras.etapas,
          youtube: alist.video,
          miniatura: alist.miniatura,
          miniaturaYoutube: extras.miniaturaYoutube ?? null,
          fondo: extras.fondo,
        }
      : null,
    posventa: posventa
      ? {
          ancla: posventa.ancla!,
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
          aseguradoras: cierre[0] ?? null,
          galeriaTexto: TEXTO_GALERIA_SINIESTROS,
          cierre: cierre.slice(1),
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
    textura: extras.textura,
  };
}
