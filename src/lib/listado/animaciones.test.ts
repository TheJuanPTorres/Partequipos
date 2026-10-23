import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  activasDe,
  ANIMACIONES,
  animacionesActivas,
  frenar,
  inicioDelContador,
} from "./animaciones";

const encendidas = Object.entries(ANIMACIONES)
  .filter(([, v]) => v)
  .map(([k]) => k);

describe("animacionesActivas", () => {
  it("sin parámetro, todas las encendidas en el código", () => {
    assert.deepEqual(animacionesActivas(undefined, true), encendidas);
  });
  it("en el sitio publicado, el parámetro no tiene efecto", () => {
    assert.deepEqual(animacionesActivas("no", false), encendidas);
    assert.deepEqual(animacionesActivas("A1", false), encendidas);
  });
  it("«no» o vacío apaga todas", () => {
    assert.deepEqual(animacionesActivas("no", true), []);
    assert.deepEqual(animacionesActivas("", true), []);
  });
  it("una lista enciende solo esas, sin distinguir mayúsculas ni separadores", () => {
    assert.deepEqual(
      animacionesActivas("a3, A1", true),
      ["A1", "A3"].filter((a) => encendidas.includes(a)),
    );
    assert.deepEqual(
      animacionesActivas(["A5,A9", "A1"], true),
      ["A5"].filter((a) => encendidas.includes(a)),
    );
  });
});

describe("inicioDelContador", () => {
  it("sin valor de antes o igual, no cuenta", () => {
    assert.equal(inicioDelContador(null, 104), 104);
    assert.equal(inicioDelContador(104, 104), 104);
  });
  it("cuenta desde el valor de antes", () => {
    assert.equal(inicioDelContador(3, 104), 3);
    assert.equal(inicioDelContador(104, 60), 99);
  });
  it("nunca empieza con más dígitos que el final", () => {
    assert.equal(inicioDelContador(104, 9), 9);
    assert.equal(inicioDelContador(1500, 230), 999);
  });
});

describe("frenar (contador A5)", () => {
  it("va de 0 a 1", () => {
    assert.equal(frenar(0), 0);
    assert.equal(frenar(1), 1);
  });

  it("frena al acercarse al final: avanza más al principio que al final", () => {
    assert.ok(frenar(0.5) > 0.9);
    assert.ok(frenar(0.25) - frenar(0) > frenar(1) - frenar(0.75));
  });
});

describe("activasDe", () => {
  const interruptores = { C1: true, C2: false, C3: true };
  it("sin parámetro o sin permiso, las encendidas; una apagada no se enciende desde la URL", () => {
    assert.deepEqual(activasDe(interruptores, null, true), ["C1", "C3"]);
    assert.deepEqual(activasDe(interruptores, "c2", false), ["C1", "C3"]);
    assert.deepEqual(activasDe(interruptores, "c2,C3", true), ["C3"]);
    assert.deepEqual(activasDe(interruptores, "no", true), []);
  });
});
