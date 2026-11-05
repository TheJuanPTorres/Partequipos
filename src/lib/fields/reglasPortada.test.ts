import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TESTIMONIOS_PUBLICOS,
  exentoDeAutorizacion,
  validarCita,
  validarVideoDelCliente,
  publicadoEfectivo,
  validarEnlace,
  validarLatitud,
  validarLongitud,
  coordenadasEnColombia,
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
    // Colombia con sus islas: San Andrés, Leticia, Punta Gallinas.
    assert.equal(validarLongitud(-81.7), true);
    assert.equal(validarLatitud(-4.2), true);
    assert.equal(validarLatitud(12.5), true);
    // Fuera de Colombia, aunque sea un valor válido en el mundo.
    assert.notEqual(validarLatitud(40.4), true);
    assert.notEqual(validarLongitud(-3.7), true);
    assert.notEqual(validarLongitud(Number.NaN), true);
    assert.equal(coordenadasEnColombia(4.65, -74.1), true);
    assert.equal(coordenadasEnColombia(7.98, 75.2), false);
    assert.equal(coordenadasEnColombia(-75.2, 7.98), false);
    assert.equal(coordenadasEnColombia(undefined, -74), false);
    // Longitud positiva: el mensaje sugiere el signo menos con el valor ya negado.
    assert.match(String(validarLongitud(75.1983)), /signo menos.*−75\.1983/);
    assert.doesNotMatch(String(validarLongitud(-3.7)), /signo menos\? Prueba/);
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

  it("el filtro público exige publicado y (autorización o vídeo del cliente)", () => {
    assert.deepEqual(TESTIMONIOS_PUBLICOS.and, [
      { publicado: { equals: true } },
      { or: [{ autorizacionUso: { equals: true } }, { videoDelCliente: { equals: true } }] },
    ]);
  });

  it("la excepción del vídeo del cliente exige la casilla Y un YouTube válido", () => {
    assert.equal(exentoDeAutorizacion(true, true), true);
    assert.equal(exentoDeAutorizacion(true, false), false);
    assert.equal(exentoDeAutorizacion(false, true), false);
    assert.equal(exentoDeAutorizacion(undefined, true), false);
    assert.notEqual(validarVideoDelCliente(true, false), true);
    assert.equal(validarVideoDelCliente(true, true), true);
    assert.equal(validarVideoDelCliente(false, false), true);
  });

  it("con la excepción se publica sin autorización; sin ella, no", () => {
    assert.equal(validarPublicacionTestimonio(true, false, true), true);
    assert.notEqual(validarPublicacionTestimonio(true, false, false), true);
    assert.equal(publicadoEfectivo(true, false, true), true);
    assert.equal(publicadoEfectivo(true, undefined, false), false);
  });

  it("la frase es obligatoria salvo en el vídeo del cliente", () => {
    assert.notEqual(validarCita("", false), true);
    assert.notEqual(validarCita("   ", false), true);
    assert.notEqual(validarCita(undefined, false), true);
    assert.equal(validarCita("Muy bien.", false), true);
    assert.equal(validarCita("", true), true);
    assert.equal(validarCita(null, true), true);
  });
});
