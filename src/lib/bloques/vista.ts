/**
 * FORMA DE DATOS DE LOS BLOQUES DE PÁGINA — lo que reciben los componentes.
 *
 * Son los cinco bloques reutilizables del campo `bloques` de `paginas`
 * (docs/diseno/decisiones-nosotros.md §3). Cada tipo lleva el `blockType` y
 * los nombres de campo que tendrá el bloque en Payload; la única diferencia
 * es que aquí las relaciones (`media`, `videos`) ya vienen RESUELTAS a lo que
 * se pinta: URL, medidas y texto alternativo.
 *
 * Así los componentes no dependen del esquema: se construyen y se verifican
 * con datos fijos antes de la migración, y en la ventana solo se añade la
 * traducción de los documentos de Payload a estas formas.
 */
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

export type ImagenBloque = {
  url: string;
  alt: string;
  width: number;
  height: number;
  /** `object-position` del punto focal, p. ej. «50% 50%». */
  posicion?: string;
};

export type VideoBloque = {
  url: string;
  /** Primer fotograma o imagen equivalente: se ve hasta que el vídeo arranca, y con movimiento reducido. */
  poster: ImagenBloque | null;
  decorativo: boolean;
  descripcion: string;
};

export type EnlaceBloque = { texto: string; href: string };

export type BloqueCabeceraVideo = {
  blockType: "cabeceraVideo";
  id?: string | null;
  antetitulo?: string | null;
  /** El `<h1>` de la página. */
  titulo: string;
  video: VideoBloque | null;
  /** Fondo si no hay vídeo. Con vídeo, se usa su póster. */
  imagen: ImagenBloque | null;
};

export type BloquePresentacionImagen = {
  blockType: "presentacionImagen";
  id?: string | null;
  imagen: ImagenBloque | null;
  antetitulo?: string | null;
  titulo: string;
  texto: SerializedEditorState | null;
  boton: EnlaceBloque | null;
};

export type Cifra = {
  id?: string | null;
  prefijo?: string | null;
  numero: number;
  sufijo?: string | null;
  etiqueta: string;
};

export type BloqueCifras = {
  blockType: "cifras";
  id?: string | null;
  cifras: Cifra[];
};

export type BloqueFranjaMarquee = {
  blockType: "franjaMarquee";
  id?: string | null;
  /** El texto que se repite en movimiento, p. ej. «Marcas aliadas». */
  texto: string;
  imagenFondo: ImagenBloque | null;
  /** La máquina recortada (PNG transparente) que va delante del texto. */
  imagenFrontal: ImagenBloque | null;
};

export type TarjetaExpandible = {
  id?: string | null;
  titulo: string;
  texto?: string | null;
  imagen: ImagenBloque | null;
  href?: string | null;
};

export type BloqueTarjetasExpandibles = {
  blockType: "tarjetasExpandibles";
  id?: string | null;
  antetitulo?: string | null;
  titulo: string;
  tarjetas: TarjetaExpandible[];
  boton: EnlaceBloque | null;
};

export type BloquePagina =
  | BloqueCabeceraVideo
  | BloquePresentacionImagen
  | BloqueCifras
  | BloqueFranjaMarquee
  | BloqueTarjetasExpandibles;

/**
 * Formato de las cifras como en ux-9: separador de miles «,» (el que pone el
 * contador de Elementor por defecto), sin decimales. «10000» → «10,000».
 */
export function formatearCifra(n: number): string {
  const entero = Math.round(Math.abs(n));
  const texto = String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return n < 0 ? `-${texto}` : texto;
}

/**
 * Valor intermedio del contador en el instante `t` (0–1). Curva «swing» de
 * jQuery, la que usa el contador de Elementor: 0,5 − cos(t·π)/2.
 */
export function valorContador(final: number, t: number): number {
  const p = Math.min(1, Math.max(0, t));
  return final * (0.5 - Math.cos(p * Math.PI) / 2);
}

/** ¿Hay un `<h1>` en los bloques? Solo lo pone la cabecera. */
export function tieneCabecera(bloques: readonly BloquePagina[]): boolean {
  return bloques.some((b) => b.blockType === "cabeceraVideo");
}
