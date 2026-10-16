import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { alFrente, avanzaSolo, hayQueVolver, siguiente } from "./carruselMarcas";

describe("carrusel de marcas de la portada", () => {
  it("avanza de una en una hasta la copia de la primera y no más allá", () => {
    assert.equal(siguiente(0, 4), 1);
    assert.equal(siguiente(3, 4), 4);
    assert.equal(siguiente(4, 4), 4);
  });

  it("con una sola tarjeta no se mueve", () => {
    assert.equal(siguiente(0, 1), 0);
    assert.equal(hayQueVolver(1, 1), false);
  });

  it("la copia de la primera cuenta como la primera, para los puntos", () => {
    assert.equal(alFrente(4, 4), 0);
    assert.equal(alFrente(2, 4), 2);
  });

  it("solo vuelve sin animar cuando la pista está en la copia", () => {
    assert.equal(hayQueVolver(4, 4), true);
    assert.equal(hayQueVolver(3, 4), false);
  });

  it("no avanza con pausa, con el puntero o el foco dentro, ni fuera de la vista (WCAG 2.2.2)", () => {
    const base = { total: 4, pausado: false, dentro: false, visible: true };
    assert.equal(avanzaSolo(base), true);
    assert.equal(avanzaSolo({ ...base, pausado: true }), false);
    assert.equal(avanzaSolo({ ...base, dentro: true }), false);
    assert.equal(avanzaSolo({ ...base, visible: false }), false);
    assert.equal(avanzaSolo({ ...base, total: 1 }), false);
  });
});
