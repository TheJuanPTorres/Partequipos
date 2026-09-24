import type { Pagina } from "@/payload-types";

import { validarEnlace } from "../fields/reglasPortada";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

export type DiapositivaHero = {
  titulo: string;
  parrafo: string | null;
  /** Decorativa: `alt` vacío, el título ya dice qué es (ADR 0009). */
  fondo: ImagenLista;
  frontal: ImagenLista | null;
  enlace: { href: string; nombre: string } | null;
};

/**
 * Diapositivas del hero de la portada, listas para pintar.
 *
 * Se DESCARTA la diapositiva sin fondo utilizable (imagen borrada, sin
 * dimensiones): sin fondo el título blanco quedaría sobre la página. El enlace
 * solo se admite con nombre accesible —el «+» no tiene texto visible— y con un
 * destino válido, aunque ya lo valide el panel: los datos pueden venir de antes
 * de la validación.
 */
export function diapositivasDeHero(hero: Pagina["hero"]): DiapositivaHero[] {
  return (hero?.diapositivas ?? []).flatMap((d) => {
    const fondo = imagenDeMedia(d.imagenFondo, "");
    const titulo = d.titulo?.trim();
    if (!fondo || !titulo) return [];
    const href = d.enlace?.trim();
    const nombre = d.enlaceNombre?.trim();
    return [
      {
        titulo,
        parrafo: d.parrafo?.trim() || null,
        fondo: { ...fondo, alt: "" },
        frontal: imagenDeMedia(d.imagenFrontal, titulo),
        enlace: href && nombre && validarEnlace(href) === true ? { href, nombre } : null,
      },
    ];
  });
}
