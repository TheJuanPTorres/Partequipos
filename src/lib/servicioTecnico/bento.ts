/**
 * MOSAICO («bento») SIN HUECOS para la galería de siniestros (2026-10-19,
 * dirección): con cualquier número de fotos, la rejilla queda LLENA a 2, 3 y 4
 * columnas. Lógica pura: devuelve, por foto y por ancho de rejilla, cuántas
 * columnas y filas ocupa; el CSS las aplica con `grid-column`/`grid-row: span`
 * y colocación automática en orden (sin `dense`), así que el resultado no
 * depende del navegador.
 *
 * La primera foto es la grande (2 × 2). Las demás van de una en una y la
 * última fila se completa ensanchando las últimas fotos.
 */
export type Tamano = { columnas: number; filas: number };

/** Los tamaños de `n` fotos en una rejilla de `columnas` (2, 3 o 4). */
export function tamanosBento(n: number, columnas: 2 | 3 | 4): Tamano[] {
  if (n <= 0) return [];
  const uno = (): Tamano => ({ columnas: 1, filas: 1 });
  if (n === 1) return [{ columnas, filas: 2 }];
  const grande: Tamano = { columnas: 2, filas: 2 };

  if (columnas === 2) {
    const resto = Array.from({ length: n - 1 }, uno);
    if (resto.length % 2 === 1) resto[resto.length - 1] = { columnas: 2, filas: 1 };
    return [grande, ...resto];
  }

  if (columnas === 3) {
    // La grande ocupa 2 columnas en 2 filas; a su lado caben 2 fotos (una por fila).
    if (n === 2) return [grande, { columnas: 1, filas: 2 }];
    const resto = Array.from({ length: n - 3 }, uno);
    const sobra = resto.length % 3;
    if (sobra === 1) resto[resto.length - 1] = { columnas: 3, filas: 1 };
    if (sobra === 2) resto[resto.length - 1] = { columnas: 2, filas: 1 };
    return [grande, uno(), uno(), ...resto];
  }

  // 4 columnas: a la derecha de la grande caben 4 fotos (2 por fila).
  if (n === 2) return [grande, grande];
  if (n === 3) return [grande, { columnas: 2, filas: 1 }, { columnas: 2, filas: 1 }];
  if (n === 4) return [grande, { columnas: 2, filas: 1 }, uno(), uno()];
  const resto = Array.from({ length: n - 5 }, uno);
  const sobra = resto.length % 4;
  const ultimo = resto.length - 1;
  if (sobra === 1) resto[ultimo] = { columnas: 4, filas: 1 };
  if (sobra === 2) {
    resto[ultimo] = { columnas: 2, filas: 1 };
    resto[ultimo - 1] = { columnas: 2, filas: 1 };
  }
  if (sobra === 3) resto[ultimo] = { columnas: 2, filas: 1 };
  return [grande, uno(), uno(), uno(), uno(), ...resto];
}
