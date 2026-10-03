import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { comprobarMarcaDelTipo, idDeRelacion } from "./marcaDelTipo";

describe("comprobarMarcaDelTipo", () => {
  it("rechaza un tipo de otra marca", () => {
    const error = comprobarMarcaDelTipo(1, 2, "Excavadora");
    assert.ok(error, "debería rechazarlo");
    assert.match(error, /«Excavadora» es de otra marca/);
  });

  it("acepta un tipo de la misma marca", () => {
    assert.equal(comprobarMarcaDelTipo(1, 1, "Excavadora"), null);
  });

  it("compara por id aunque uno llegue como texto y otro como documento", () => {
    assert.equal(comprobarMarcaDelTipo("7", { id: 7 }, "Bulldozer"), null);
    assert.ok(comprobarMarcaDelTipo({ id: 7 }, "8", "Bulldozer"));
  });

  it("no comprueba nada si falta la marca o la marca del tipo", () => {
    assert.equal(comprobarMarcaDelTipo(null, 2, "Excavadora"), null);
    assert.equal(comprobarMarcaDelTipo(1, undefined, "Excavadora"), null);
  });
});

describe("idDeRelacion", () => {
  it("normaliza id y documento a texto", () => {
    assert.equal(idDeRelacion(3), "3");
    assert.equal(idDeRelacion("3"), "3");
    assert.equal(idDeRelacion({ id: 3 }), "3");
    assert.equal(idDeRelacion(null), null);
    assert.equal(idDeRelacion(""), null);
  });
});
