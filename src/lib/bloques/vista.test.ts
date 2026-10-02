import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatearCifra, tieneCabecera, valorContador, type VistaBloque } from "./vista";

describe("formatearCifra (como el contador de ux-9)", () => {
  it("separa los miles con coma", () => {
    assert.equal(formatearCifra(10000), "10,000");
    assert.equal(formatearCifra(1234567), "1,234,567");
  });

  it("no separa por debajo de mil y redondea", () => {
    assert.equal(formatearCifra(25), "25");
    assert.equal(formatearCifra(999.6), "1,000");
    assert.equal(formatearCifra(0), "0");
  });

  it("conserva el signo", () => {
    assert.equal(formatearCifra(-1500), "-1,500");
  });
});

describe("valorContador (curva «swing», medida en ux-9)", () => {
  it("empieza en 0 y acaba en el valor final", () => {
    assert.equal(valorContador(10000, 0), 0);
    assert.equal(valorContador(10000, 1), 10000);
  });

  it("va por la mitad a mitad de tiempo", () => {
    assert.ok(Math.abs(valorContador(10000, 0.5) - 5000) < 1e-9);
  });

  // Medido pintado: a 1169 ms de 2000 desde el arranque (~0,25), 1.420.
  it("al cuarto de tiempo ronda el 15 %", () => {
    const v = valorContador(10000, 0.25);
    assert.ok(v > 1400 && v < 1500, `salió ${v}`);
  });

  it("no se sale de [0, final] fuera de rango", () => {
    assert.equal(valorContador(100, -1), 0);
    assert.equal(valorContador(100, 2), 100);
  });
});

describe("tieneCabecera (quién pone el único <h1>)", () => {
  const cifras: VistaBloque = { blockType: "cifras", cifras: [] };
  const cabecera: VistaBloque = {
    blockType: "cabeceraVideo",
    titulo: "Quiénes somos",
    video: null,
    imagen: null,
  };

  it("con bloque de cabecera, el h1 es suyo", () => {
    assert.equal(tieneCabecera([cifras, cabecera]), true);
  });

  it("sin cabecera, el h1 es el título de la página", () => {
    assert.equal(tieneCabecera([cifras]), false);
    assert.equal(tieneCabecera([]), false);
  });
});
