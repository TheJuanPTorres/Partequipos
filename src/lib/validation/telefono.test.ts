import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { telefonoValido } from "./telefono";

describe("telefonoValido", () => {
  it("acepta móviles y fijos colombianos y con prefijo", () => {
    for (const t of [
      "3176707071",
      "317 670 7071",
      "+57 317 670 7071",
      "(604) 444 1234",
      "444 1234",
    ]) {
      assert.equal(telefonoValido(t), true, t);
    }
  });
  it("acepta justo 15 dígitos y rechaza 16", () => {
    assert.equal(telefonoValido("+123456789012345"), true);
    assert.equal(telefonoValido("+1234567890123456"), false);
  });
  it("rechaza menos de 7 dígitos, letras y vacío", () => {
    for (const t of ["123456", "abc1234567", "", "   ", "31767070a1"]) {
      assert.equal(telefonoValido(t), false, t);
    }
  });
});
