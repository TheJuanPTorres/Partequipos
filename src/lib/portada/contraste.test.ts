import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CONTRASTE_MINIMO,
  alfaDelVelo,
  contraste,
  luminancia,
  peorContraste,
  rgbDeHex,
  zonaDelTitulo,
} from "./contraste";

/** Imagen RGBA de un solo color. */
function lisa(ancho: number, alto: number, [r, g, b]: [number, number, number]): number[] {
  return Array.from({ length: ancho * alto }, () => [r, g, b, 255]).flat();
}

describe("contraste del título sobre la foto", () => {
  it("contraste de WCAG: blanco sobre negro 21:1", () => {
    assert.equal(Math.round(contraste(luminancia(255, 255, 255), luminancia(0, 0, 0))), 21);
  });

  it("lee #rgb y #rrggbb", () => {
    assert.deepEqual(rgbDeHex("#fff"), [255, 255, 255]);
    assert.deepEqual(rgbDeHex("#D92035"), [217, 32, 53]);
    assert.equal(rgbDeHex("blanco"), null);
  });

  it("el velo, como en hero.module.css: 45 % arriba y 22 % al 75 %", () => {
    assert.equal(alfaDelVelo(0), 0.45);
    assert.ok(Math.abs(alfaDelVelo(0.75) - 0.22) < 1e-9);
  });

  it("un color claro sobre una foto blanca: el velo no basta y AVISA", () => {
    const c = peorContraste(
      lisa(10, 10, [255, 255, 255]),
      10,
      10,
      zonaDelTitulo(null, null),
      [255, 238, 170],
    )!;
    assert.ok(c < CONTRASTE_MINIMO, String(c));
  });

  // El velo (D14) se pensó para el blanco: sobre una foto blanca deja 3,2:1.
  it("blanco sobre una foto blanca o una oscura: no avisa", () => {
    for (const foto of [
      [255, 255, 255],
      [30, 30, 30],
    ] as const) {
      const c = peorContraste(
        lisa(10, 10, [...foto]),
        10,
        10,
        zonaDelTitulo(null, null),
        [255, 255, 255],
      )!;
      assert.ok(c >= CONTRASTE_MINIMO, String(c));
    }
  });

  it("un color oscuro sobre una foto oscura también avisa", () => {
    const c = peorContraste(
      lisa(10, 10, [20, 20, 20]),
      10,
      10,
      zonaDelTitulo(50, 50),
      [40, 10, 10],
    )!;
    assert.ok(c < CONTRASTE_MINIMO, String(c));
  });

  it("la zona sigue a la posición y no se sale de la foto", () => {
    assert.deepEqual(zonaDelTitulo(0, 0), { x0: 0, y0: 0, x1: 0.5, y1: 0.2 });
    const z = zonaDelTitulo(100, 100);
    assert.equal(z.x1, 1);
    assert.ok(Math.abs(z.y1 - 1) < 1e-9);
  });
});
