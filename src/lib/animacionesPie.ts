/**
 * Las animaciones del PIE (dirección, 2026-10-22), cada una INDEPENDIENTE: este
 * objeto es su interruptor, como las del listado de usados (#320,
 * `lib/listado/animaciones.ts`, de donde sale `activasDe`). Una en `false` no
 * se pinta ni corre su código.
 *
 * - P1: subrayado que crece al pasar el ratón (o con el foco) por los enlaces.
 * - P2: los iconos de las redes suben y se rellenan con el color de su red.
 * - P3: las columnas entran con un fundido escalonado la primera vez que se ve el pie.
 * - P4: botón «Volver arriba» en la franja legal.
 *
 * Todas: solo `opacity`, `transform` y el fondo del subrayado (nada que mueva
 * la maqueta: CLS 0) y apagadas con «reducir movimiento» (P4 sigue, pero sube
 * sin desplazamiento suave). Sin JavaScript, el pie como siempre (P4 es un
 * enlace a `#`, que sube igual).
 *
 * En un preview se prueban con `?anim=P1,P3` (`?anim=no`, ninguna); en el
 * sitio publicado, la URL no cuenta.
 */
export const ANIMACIONES_PIE = {
  P1: true,
  P2: true,
  P3: true,
  P4: true,
} as const satisfies Record<string, boolean>;

export type AnimacionPie = keyof typeof ANIMACIONES_PIE;

/**
 * Color de cada red para P2 (relleno de la caja, con el icono en blanco). Los
 * de marca salvo donde el blanco no llegaba a 3:1 (WCAG 1.4.11): WhatsApp va
 * en su verde oscuro (#128C7E, 4,2:1) y no en el claro (#25D366, 2:1), e
 * Instagram en su magenta (#C13584, 5,4:1).
 */
export const COLOR_RED = {
  LinkedIn: "#0A66C2",
  X: "#000000",
  Facebook: "#1877F2",
  TikTok: "#000000",
  YouTube: "#FF0000",
  Instagram: "#C13584",
  WhatsApp: "#128C7E",
} as const;
