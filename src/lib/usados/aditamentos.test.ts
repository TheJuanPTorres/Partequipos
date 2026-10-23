import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  camposDeAditamento,
  esDeAditamentos,
  MAX_DESCRIPCION_CORTA,
  textoLimpio,
} from "./aditamentos";

describe("camposDeAditamento", () => {
  it("en la categoría Aditamentos, los dos campos limpios", () => {
    assert.deepEqual(
      camposDeAditamento("aditamentos", {
        serial: "  XY-9 ",
        descripcionCorta: "Cucharón\n de 24 in",
      }),
      { serial: "XY-9", descripcionCorta: "Cucharón de 24 in" },
    );
  });
  it("en otra categoría, nada, aunque el campo tenga valor", () => {
    assert.deepEqual(
      camposDeAditamento("excavadoras", { serial: "XY-9", descripcionCorta: "texto" }),
      { serial: null, descripcionCorta: null },
    );
    assert.deepEqual(camposDeAditamento(null, { serial: "XY-9" }), {
      serial: null,
      descripcionCorta: null,
    });
  });
  it("vacíos o solo espacios, null", () => {
    assert.deepEqual(camposDeAditamento("aditamentos", { serial: "   ", descripcionCorta: null }), {
      serial: null,
      descripcionCorta: null,
    });
  });
});

describe("piezas", () => {
  it("esDeAditamentos solo con la dirección exacta", () => {
    assert.equal(esDeAditamentos("aditamentos"), true);
    assert.equal(esDeAditamentos("Aditamentos"), false);
    assert.equal(esDeAditamentos(undefined), false);
  });
  it("textoLimpio junta los espacios", () => {
    assert.equal(textoLimpio(" a \t b "), "a b");
    assert.equal(textoLimpio(""), null);
  });
  it("el límite de la descripción corta cabe en 3 líneas de la tarjeta", () => {
    assert.ok(MAX_DESCRIPCION_CORTA <= 3 * 50);
  });
});
