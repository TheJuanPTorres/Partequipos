/**
 * Pines del globo de sedes que se tocan entre sí (WCAG 2.5.8, área táctil).
 *
 * En móvil, la vista general del diseño deja los 7 pines en una franja de unos
 * 35 px: se solapan, y ningún tamaño de pin lo arregla (axe `target-size` ×6,
 * auditoría de D del 2026-10-14). Un pin que choca con otro se deja INACTIVO
 * (`inert`): fuera del orden de tabulación y sin clic. Lo cubre el control
 * equivalente que admite el criterio: las flechas «Sede anterior/siguiente»
 * (32 × 32) hacen lo mismo. Al acercarse a una sede, los pines se separan y
 * vuelven a estar activos.
 */
export type Caja = { alto: number; ancho: number; x: number; y: number };

/** Distancia mínima entre los centros de dos pines (el círculo de 24 px de WCAG). */
export const SEPARACION_MINIMA = 24;

const seTocan = (a: Caja, b: Caja) =>
  a.x < b.x + b.ancho && b.x < a.x + a.ancho && a.y < b.y + b.alto && b.y < a.y + a.alto;

/**
 * Para cada pin, si está amontonado: su caja toca la de otro pin, o el centro
 * de su punto está a menos de `SEPARACION_MINIMA` del de otro.
 */
export function pinesAmontonados(
  cajas: Caja[],
  centros: [number, number][],
  separacion = SEPARACION_MINIMA,
): boolean[] {
  return cajas.map((caja, i) =>
    cajas.some(
      (otra, j) =>
        j !== i &&
        (seTocan(caja, otra) ||
          Math.hypot(centros[i]![0] - centros[j]![0], centros[i]![1] - centros[j]![1]) <
            separacion),
    ),
  );
}
