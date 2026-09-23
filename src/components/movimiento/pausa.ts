/**
 * PAUSA — lógica pura de la desviación D2 (docs/diseno/decisiones-home-ux9.md).
 *
 * Todo lo que se mueve solo lleva control de pausa (WCAG 2.2.2), y el estado
 * de partida lo decide `prefers-reduced-motion`: quien pide menos movimiento
 * lo encuentra quieto. En cuanto el usuario pulsa, manda su elección.
 */

/** `eleccion` es `null` mientras el usuario no haya pulsado nada. */
export function estaPausado(eleccion: boolean | null, movimientoReducido: boolean): boolean {
  return eleccion ?? movimientoReducido;
}

/**
 * Nombre accesible del botón: dice lo que HARÁ al pulsarlo. Se cambia el
 * nombre en vez de usar `aria-pressed`: las dos cosas a la vez se leen como
 * «Pausar, pulsado», que es contradictorio.
 */
export function etiquetaPausa(pausado: boolean, que: string): string {
  return `${pausado ? "Reproducir" : "Pausar"} ${que}`;
}
