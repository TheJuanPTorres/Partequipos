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

/**
 * `sizes` DEL FONDO DEL HERO, por la proporción de cada foto (fase C).
 *
 * La tarjeta mide ~86vh de alto y la foto la cubre con `object-cover`. Cuando la
 * ventana es más ESTRECHA que (proporción de la foto × 86vh) —cualquier móvil en
 * vertical—, lo que manda es el alto: la foto se pinta a `86·p` vh de ancho, no
 * a 100vw. Con `sizes="100vw"` el navegador pedía la versión del ancho de la
 * ventana y la foto se ampliaba ~2,5 veces en Lighthouse móvil (medido,
 * docs/diseno/decisiones-home-ux9.md §10). En ventanas más anchas, 100vw.
 *
 * Sin dimensiones utilizables, 100vw: lo de antes.
 */
export const ALTO_TARJETA_VH = 86;

export function sizesFondoHero(ancho: number, alto: number): string {
  if (!(ancho > 0 && alto > 0)) return "100vw";
  const vh = Math.ceil((ALTO_TARJETA_VH * ancho) / alto);
  return `(max-aspect-ratio: ${vh}/100) ${vh}vh, 100vw`;
}
