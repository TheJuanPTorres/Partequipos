import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { tamanosBento, type Tamano } from "./bento";

/**
 * Coloca los tamaños como lo hace CSS Grid con colocación automática en orden
 * (`grid-auto-flow: row`, sin `dense`) y devuelve la rejilla ocupada.
 */
function colocar(tamanos: Tamano[], columnas: number): boolean[][] {
  const rejilla: boolean[][] = [];
  const libre = (f: number, c: number, t: Tamano) => {
    if (c + t.columnas > columnas) return false;
    for (let i = f; i < f + t.filas; i++)
      for (let j = c; j < c + t.columnas; j++) if (rejilla[i]?.[j]) return false;
    return true;
  };
  let fila = 0;
  let col = 0;
  for (const t of tamanos) {
    while (!libre(fila, col, t)) {
      col++;
      if (col >= columnas) {
        col = 0;
        fila++;
      }
    }
    for (let i = fila; i < fila + t.filas; i++) {
      rejilla[i] ??= Array(columnas).fill(false);
      for (let j = col; j < col + t.columnas; j++) rejilla[i]![j] = true;
    }
  }
  return rejilla;
}

describe("galería en mosaico sin huecos", () => {
  for (const columnas of [2, 3, 4] as const) {
    it(`a ${columnas} columnas, de 1 a 20 fotos, la rejilla queda llena`, () => {
      for (let n = 1; n <= 20; n++) {
        const t = tamanosBento(n, columnas);
        assert.equal(t.length, n);
        const rejilla = colocar(t, columnas);
        const huecos = rejilla.flat().filter((x) => !x).length;
        assert.equal(huecos, 0, `${n} fotos a ${columnas} columnas: ${huecos} huecos`);
        assert.ok(t.every((x) => x.columnas <= columnas));
      }
    });
  }

  it("con las 7 de siniestros: la grande y una última fila de dos anchas a 4 columnas", () => {
    assert.deepEqual(tamanosBento(7, 4).slice(5), [
      { columnas: 2, filas: 1 },
      { columnas: 2, filas: 1 },
    ]);
  });
});
