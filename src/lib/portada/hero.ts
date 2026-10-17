import type { Pagina } from "@/payload-types";

import { validarEnlace } from "../fields/reglasPortada";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";
import { tipografiaDe, type TipografiaGuardada, type TipografiaTitulo } from "./tipografia";

export type DiapositivaHero = {
  /** El título en una línea: lo que lee un lector de pantalla y el nombre de la diapositiva. */
  titulo: string;
  /**
   * `false`: el título no se pinta y queda solo para lectores de pantalla
   * («Mostrar título» desmarcado en el panel). Nunca se borra: nombra la
   * diapositiva (`aria-labelledby`, puntos del carrusel, anuncios).
   */
  tituloVisible: boolean;
  /** Las líneas que se pintan (un salto de línea en el panel parte el título). */
  tituloLineas: string[];
  /** Solo en escritorio (≥ 1025 px): el título partido arriba y abajo. Los dos o ninguno. */
  tituloPartido: { arriba: string; abajo: string } | null;
  /** «sobre»: la máquina cruza el título en escritorio. */
  posicionMaquina: "debajo" | "sobre";
  /** Texto circular decorativo (oculto a los lectores de pantalla). */
  textoCircular: string | null;
  parrafo: string | null;
  /** Decorativa: `alt` vacío, el título ya dice qué es (ADR 0009). */
  fondo: ImagenLista;
  /**
   * Recorte vertical para móvil (< 768 px). Decorativo, como el fondo. Si
   * falta, el móvil usa `fondo` con su punto focal (CLAUDE.md §10.36).
   */
  fondoMovil: ImagenLista | null;
  frontal: ImagenLista | null;
  enlace: { href: string; nombre: string } | null;
  /**
   * «Tipografía del título» del panel (2026-10-17). `null`: el estilo de
   * siempre (todo vacío, o el título oculto).
   */
  tipografia: TipografiaTitulo | null;
};

/**
 * Diapositivas del hero de la portada, listas para pintar.
 *
 * Se DESCARTA la diapositiva sin fondo utilizable (imagen borrada, sin
 * dimensiones): sin fondo el título blanco quedaría sobre la página. El enlace
 * solo se admite con nombre accesible —el «+» no tiene texto visible— y con un
 * destino válido, aunque ya lo valide el panel: los datos pueden venir de antes
 * de la validación.
 *
 * SOLO LA IMAGEN DE FONDO (2026-10-15): las casillas «Mostrar …» del panel
 * quitan cada pieza. Solo `false` la quita: una fila anterior a la migración
 * (`null`) se pinta como siempre. Con el texto circular o el recuadro
 * desmarcados, sus datos llegan vacíos y la pieza no sale en el HTML; con el
 * título desmarcado, `tituloVisible: false` (sigue para lectores) y sin título
 * partido.
 */
export function diapositivasDeHero(hero: Pagina["hero"]): DiapositivaHero[] {
  return (hero?.diapositivas ?? []).flatMap((d) => {
    const fondo = imagenDeMedia(d.imagenFondo, "");
    const movil = imagenDeMedia(d.imagenFondoMovil, "");
    const tituloLineas = (d.titulo ?? "")
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const titulo = tituloLineas.join(" ");
    if (!fondo || !titulo) return [];
    const href = d.enlace?.trim();
    const nombre = d.enlaceNombre?.trim();
    const arriba = d.tituloArriba?.trim();
    const abajo = d.tituloAbajo?.trim();
    const tituloVisible = d.mostrarTitulo !== false;
    const conDescripcion = d.mostrarDescripcion !== false;
    return [
      {
        titulo,
        tituloVisible,
        tituloLineas,
        tituloPartido: tituloVisible && arriba && abajo ? { arriba, abajo } : null,
        posicionMaquina: d.posicionMaquina === "sobre" ? "sobre" : "debajo",
        textoCircular: d.mostrarTextoCircular !== false ? d.textoCircular?.trim() || null : null,
        parrafo: conDescripcion ? d.parrafo?.trim() || null : null,
        fondo: { ...fondo, alt: "" },
        fondoMovil: movil ? { ...movil, alt: "" } : null,
        frontal: imagenDeMedia(d.imagenFrontal, titulo),
        enlace:
          conDescripcion && href && nombre && validarEnlace(href) === true
            ? { href, nombre }
            : null,
        tipografia: tituloVisible ? tipografiaDe(d.tipografia as TipografiaGuardada) : null,
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
