/**
 * El desplazamiento vertical del recuadro de una tarjeta de la «Plantilla 1»
 * con el scroll, como el efecto del export de Elementor
 * (`motion_fx_translateY`, tipo «elemento», velocidad 0,5):
 *
 *   desplazamiento = −(recorrido − 50) × velocidad
 *
 * donde `recorrido` es el porcentaje (0–100) que la tarjeta lleva recorrido de
 * la ventana: 0 cuando su borde de arriba asoma por abajo, 100 cuando su borde
 * de abajo sale por arriba. Con 0,5: +25 px al entrar, 0 en el centro, −25 px
 * al salir. Fuera de la ventana se queda en el extremo.
 */
export const VELOCIDAD_RECUADRO = 0.5;

export function desplazamientoRecuadro(
  arriba: number,
  alto: number,
  altoVentana: number,
  velocidad = VELOCIDAD_RECUADRO,
): number {
  const recorrido = ((altoVentana - arriba) / (altoVentana + alto)) * 100;
  const acotado = Math.min(100, Math.max(0, recorrido));
  const valor = Math.round(-(acotado - 50) * velocidad * 10) / 10;
  // Sin «−0» (en el centro): 0.
  return valor === 0 ? 0 : valor;
}
