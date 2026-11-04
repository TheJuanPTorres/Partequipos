import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cuantosCaben } from "./desborde";

describe("cuantosCaben", () => {
  it("si caben todos, se quedan todos y no hay «Más»", () => {
    // 4 × 100 + 3 × 10 = 430.
    assert.equal(cuantosCaben([100, 100, 100, 100], 10, 430, 80), 4);
    assert.equal(cuantosCaben([100, 100, 100, 100], 10, 500, 80), 4);
  });

  it("si no caben, se quedan los que quepan junto a «Más», en su orden", () => {
    // 3 × 100 + 2 × 10 = 320; + 10 + 80 de «Más» = 410 (con 1 px de holgura).
    assert.equal(cuantosCaben([100, 100, 100, 100], 10, 428, 80), 3);
    assert.equal(cuantosCaben([100, 100, 100, 100], 10, 410, 80), 3);
    assert.equal(cuantosCaben([100, 100, 100, 100], 10, 408, 80), 2);
  });

  it("un enlace ancho que no cabe deja fuera también a los que le siguen", () => {
    // El tercero (300) no cabe: no se salta para meter el cuarto.
    assert.equal(cuantosCaben([100, 100, 300, 50], 10, 400, 80), 2);
  });

  it("los redondeos de subpíxel no lo mandan a «Más»", () => {
    assert.equal(cuantosCaben([100.4, 100.4], 0, 200.5, 80), 2);
  });

  it("sin sitio ni para uno, todos van a «Más»; sin enlaces, cero", () => {
    assert.equal(cuantosCaben([200, 200], 10, 150, 80), 0);
    assert.equal(cuantosCaben([], 10, 150, 80), 0);
  });
});
