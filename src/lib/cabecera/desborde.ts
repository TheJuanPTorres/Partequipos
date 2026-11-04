/**
 * «MÁS» DE LA BARRA DE ESCRITORIO (2026-11-04, dirección): cuando los enlaces de la
 * cabecera no caben entre el logo y las acciones (lupa y «Contáctanos»), los que
 * sobran pasan, en su orden, a un desplegable «Más» al final de la fila, en lugar de
 * meterse debajo de la lupa. Pasa sobre todo entre 1025 y 1299 px y con 7 u 8 enlaces.
 *
 * `cuantosCaben` decide cuántos se quedan en la fila con los anchos medidos de cada
 * enlace (su `<li>`), el hueco entre ellos, el sitio disponible y el ancho del botón
 * «Más». Si caben todos, no hay «Más». Si no, se quedan los que quepan junto a «Más»
 * (como mínimo ninguno: entonces todos van dentro).
 */

/** Holgura para redondeos de subpíxel: un enlace que entra por menos de 1 px, entra. */
const HOLGURA_PX = 1;

export function cuantosCaben(
  anchos: readonly number[],
  hueco: number,
  disponible: number,
  anchoMas: number,
): number {
  const ocupado = (n: number) =>
    anchos.slice(0, n).reduce((suma, ancho) => suma + ancho, 0) + Math.max(0, n - 1) * hueco;

  if (ocupado(anchos.length) <= disponible + HOLGURA_PX) return anchos.length;

  for (let n = anchos.length - 1; n > 0; n--) {
    if (ocupado(n) + hueco + anchoMas <= disponible + HOLGURA_PX) return n;
  }
  return 0;
}
