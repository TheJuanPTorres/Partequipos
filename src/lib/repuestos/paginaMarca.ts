import type { CategoriasTecnica, RepuestosMarca } from "@/payload-types";

import { imagenDeMedia, type ImagenLista } from "../utils/relations";

import type { VistaPorQue } from "./plantillaTipo";

/**
 * SECCIONES PROPIAS DE UNA PÁGINA DE MARCA dentro de una categoría técnica (Filtros
 * Donaldson, 2026-10-26, dirección), del grupo «Secciones propias de la página de marca».
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

export type VistaBienvenida = {
  antetitulo: string;
  titulo: string;
  texto: string;
  fotos: ImagenLista[];
};

/** La presentación con su carrusel; sin título, texto ni fotos, no se pinta. */
export function vistaBienvenida(
  c: Pick<CategoriasTecnica, "nombre" | "paginaMarca">,
): VistaBienvenida | null {
  const p = c.paginaMarca;
  const vista = {
    antetitulo: texto(p?.bienvenidaAntetitulo),
    titulo: texto(p?.bienvenidaTitulo),
    texto: texto(p?.bienvenidaTexto),
    fotos: (p?.bienvenidaFotos ?? []).flatMap((f) => {
      const img = imagenDeMedia(f, c.nombre.trim());
      return img ? [img] : [];
    }),
  };
  return vista.titulo || vista.texto || vista.fotos.length > 0 ? vista : null;
}

/**
 * El «¿Por qué elegirnos?» PROPIO: solo con título y foto (como el general). Sin ellos, `null`
 * y la página usa el general del sitio. El botón es el del general.
 */
export function vistaPorQuePropia(
  c: Pick<CategoriasTecnica, "paginaMarca">,
  global: Pick<RepuestosMarca, "porQueBoton">,
): VistaPorQue | null {
  const p = c.paginaMarca;
  const titulo = texto(p?.porQueTitulo);
  const imagen = imagenDeMedia(p?.porQueImagen, "");
  if (!titulo || !imagen) return null;
  const frase = texto(p?.compromisoTitulo);
  return {
    titulo,
    imagen,
    texto: texto(p?.porQueTexto) || undefined,
    compromiso: frase ? { titulo: frase, texto: texto(p?.compromisoTexto) } : undefined,
    puntos: [],
    cierre: "",
    boton: texto(global.porQueBoton),
  };
}
