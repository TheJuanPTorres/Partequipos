/**
 * LA VENTANA EMERGENTE DEL FORMULARIO (dirección, 2026-10-23): sus mejoras, cada una
 * INDEPENDIENTE; este objeto es su interruptor. Una en `false` desaparece del todo, sin tocar las
 * demás. En un preview se prueban con `?anim=F1,F3` (`?anim=no`, ninguna), con las utilidades del
 * listado de usados (#320, `activasDe`); en el sitio publicado el parámetro no hace nada.
 *
 * - F1: la ventana se abre con un fundido y una subida suave, el fondo se oscurece con un leve
 *   desenfoque y, en móvil, sube desde abajo como los paneles del sitio.
 * - F2: campos vivos: borde rojo al enfocar y píldoras que se marcan con una transición suave.
 * - F3: el botón muestra «Enviando…» con un indicador y, al terminar, un mensaje de confirmación
 *   con un check animado; la ventana no se cierra sola.
 * - F4: el campo que falta se marca con un leve movimiento y su mensaje aparece debajo, en un
 *   hueco ya reservado (sin saltos de diseño).
 *
 * Todas: solo `transform`, `opacity` y colores, apagadas con «reducir movimiento» y, sin
 * JavaScript, el formulario como siempre.
 */
export const ANIMACIONES_VENTANA = {
  F1: true,
  F2: true,
  F3: true,
  F4: true,
} as const satisfies Record<string, boolean>;

export type AnimacionVentana = keyof typeof ANIMACIONES_VENTANA;
