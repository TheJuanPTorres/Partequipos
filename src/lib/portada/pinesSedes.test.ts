import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pinesAmontonados, type Caja } from "./pinesSedes";

const caja = (x: number, y: number, ancho = 40, alto = 37): Caja => ({ alto, ancho, x, y });
const centro = (c: Caja): [number, number] => [c.x + c.ancho / 2, c.y + 4.5];

describe("pinesAmontonados", () => {
  // Medido el 2026-10-14 en el sitio publicado a 390 (vista general).
  it("a 390, los 7 pines solapados: todos amontonados", () => {
    const cajas = [
      caja(179, 211, 41.7),
      caja(174, 212, 37.2),
      caja(173, 219, 22.4),
      caja(163, 208, 39.5),
      caja(164, 184, 50.9),
      caja(167, 201, 48.9),
      caja(169, 195, 77),
    ];
    assert.deepEqual(pinesAmontonados(cajas, cajas.map(centro)), Array(7).fill(true));
  });

  // Medido a 1440: separados, todos activos.
  it("a 1440, separados: ninguno amontonado", () => {
    const cajas = [
      caja(415, 718, 41.7),
      caja(305, 744, 37.2),
      caja(188, 840, 22.4),
      caja(164, 674, 39.5),
      caja(236, 325, 50.9),
      caja(267, 569, 48.9),
      caja(490, 484, 77),
    ];
    assert.deepEqual(pinesAmontonados(cajas, cajas.map(centro)), Array(7).fill(false));
  });

  it("solo los que chocan: dos juntos y uno aparte", () => {
    const cajas = [caja(0, 0), caja(30, 0), caja(300, 300)];
    assert.deepEqual(pinesAmontonados(cajas, cajas.map(centro)), [true, true, false]);
  });

  it("cajas que no se tocan pero con los centros a menos de 24 px", () => {
    const cajas = [caja(0, 0, 10, 10), caja(12, 0, 10, 10)];
    const centros: [number, number][] = [
      [5, 5],
      [17, 5],
    ];
    assert.deepEqual(pinesAmontonados(cajas, centros), [true, true]);
  });

  it("un solo pin nunca está amontonado", () => {
    assert.deepEqual(pinesAmontonados([caja(0, 0)], [[20, 4]]), [false]);
  });
});
