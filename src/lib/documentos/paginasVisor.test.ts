import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dosPaginasCaben, hayAnterior, haySiguiente, paginasVisibles } from "./paginasVisor";

describe("dosPaginasCaben", () => {
  it("el mismo umbral que el CSS del visor (640 px)", () => {
    assert.equal(dosPaginasCaben(358), false);
    assert.equal(dosPaginasCaben(639), false);
    assert.equal(dosPaginasCaben(640), true);
    assert.equal(dosPaginasCaben(1120), true);
  });
});

describe("paginasVisibles y botones", () => {
  it("una página a la vez (móvil): 1 de 2 deja pasar a la 2", () => {
    assert.deepEqual(paginasVisibles(0, 2, false), [0]);
    assert.equal(haySiguiente(0, 2, false), true);
    assert.equal(hayAnterior(0), false);
    assert.equal(haySiguiente(1, 2, false), false);
    assert.equal(hayAnterior(1), true);
  });

  it("dos a la vez (escritorio): con 2 páginas no hay siguiente; con más, sí", () => {
    assert.deepEqual(paginasVisibles(0, 2, true), [0, 1]);
    assert.equal(haySiguiente(0, 2, true), false);
    assert.equal(haySiguiente(0, 10, true), true);
    assert.equal(haySiguiente(8, 10, true), false);
  });

  it("PDF de una página: ni anterior ni siguiente, en cualquier ancho", () => {
    for (const dobles of [true, false]) {
      assert.deepEqual(paginasVisibles(0, 1, dobles), [0]);
      assert.equal(haySiguiente(0, 1, dobles), false);
    }
    assert.equal(hayAnterior(0), false);
  });

  it("muchas páginas en móvil: siguiente hasta la última", () => {
    assert.equal(haySiguiente(0, 24, false), true);
    assert.equal(haySiguiente(22, 24, false), true);
    assert.equal(haySiguiente(23, 24, false), false);
  });
});
