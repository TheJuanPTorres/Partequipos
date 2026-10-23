import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ANIMACIONES,
  activasDe,
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

describe("activasDe (el pie, 2026-10-22)", () => {
  it("vale para otro juego de interruptores: los apagados no se encienden por la URL", () => {
    const pie = { P1: true, P2: false, P3: true } as const;
    assert.deepEqual(activasDe(pie, null, true), ["P1", "P3"]);
    assert.deepEqual(activasDe(pie, "p2,P3", true), ["P3"]);
    assert.deepEqual(activasDe(pie, "no", false), ["P1", "P3"]);
  });
});
