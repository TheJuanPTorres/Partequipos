import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TESTIMONIOS_PUBLICOS,
  publicadoEfectivo,
  validarEnlace,
  validarLatitud,
  validarLongitud,
  validarPublicacionTestimonio,
} from "./reglasPortada";

describe("enlaces editables", () => {
  it("acepta rutas internas, https y vacío", () => {
    assert.equal(validarEnlace("/contactanos/"), true);
    assert.equal(validarEnlace("https://wa.me/573176707071"), true);
    assert.equal(validarEnlace(""), true);
    assert.equal(validarEnlace(undefined), true);
  });

  it("rechaza lo que saca del sitio o ejecuta código", () => {
    for (const malo of ["//evil.com", "javascript:alert(1)", "http://sin-tls.com", "contactanos"]) {
      assert.notEqual(validarEnlace(malo), true, malo);
    }
  });
});

describe("coordenadas de sede", () => {
  it("acepta Bogotá y rechaza fuera de rango o texto", () => {
    assert.equal(validarLatitud(4.65), true);
    assert.equal(validarLongitud(-74.1), true);
    assert.notEqual(validarLatitud(91), true);
    assert.notEqual(validarLongitud(-181), true);
    assert.notEqual(validarLatitud("4.6"), true);
  });
});

describe("testimonios: no se publican sin autorización", () => {
  it("la validación rechaza publicar sin autorización", () => {
    assert.notEqual(validarPublicacionTestimonio(true, false), true);
    assert.notEqual(validarPublicacionTestimonio(true, undefined), true);
    assert.equal(validarPublicacionTestimonio(true, true), true);
    assert.equal(validarPublicacionTestimonio(false, false), true);
  });

  it("el estado guardado nunca es «publicado» sin autorización", () => {
    assert.equal(publicadoEfectivo(true, false), false);
    assert.equal(publicadoEfectivo(true, true), true);
    assert.equal(publicadoEfectivo(false, true), false);
  });

  it("el filtro público exige las dos cosas", () => {
    assert.deepEqual(TESTIMONIOS_PUBLICOS.and, [
      { publicado: { equals: true } },
      { autorizacionUso: { equals: true } },
    ]);
  });
});
