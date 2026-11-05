import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { idsElegidos, marcasDeLaBanda, validarMarcasSinRepetir } from "./marcasBanda";

const todas = [
  { id: 3, nombre: "Bobcat" },
  { id: 1, nombre: "Caterpillar" },
  { id: 7, nombre: "Hitachi" },
  { id: 5, nombre: "Komatsu" },
];
const nombres = (m: { nombre: string }[]) => m.map((x) => x.nombre);

describe("marcasDeLaBanda", () => {
  it("sin elegidas, todas en el orden recibido (alfabético), como antes", () => {
    assert.deepEqual(nombres(marcasDeLaBanda(todas, [])), [
      "Bobcat",
      "Caterpillar",
      "Hitachi",
      "Komatsu",
    ]);
    assert.deepEqual(nombres(marcasDeLaBanda(todas, null)), nombres(todas));
    assert.deepEqual(nombres(marcasDeLaBanda(todas, undefined)), nombres(todas));
  });

  it("con elegidas, solo esas y en el orden del panel", () => {
    assert.deepEqual(nombres(marcasDeLaBanda(todas, [5, 3, 7])), ["Komatsu", "Bobcat", "Hitachi"]);
  });

  it("acepta los documentos poblados y los ids en texto", () => {
    assert.deepEqual(nombres(marcasDeLaBanda(todas, [{ id: 7 }, "1"])), ["Hitachi", "Caterpillar"]);
  });

  it("una elegida que no se pinta (sin logo o borrada) no deja hueco; repetidas, una vez", () => {
    assert.deepEqual(nombres(marcasDeLaBanda(todas, [99, 1, 1, null])), ["Caterpillar"]);
  });

  it("si ninguna elegida se pinta, la banda queda vacía (no vuelve a todas)", () => {
    assert.deepEqual(marcasDeLaBanda(todas, [99]), []);
  });
});

describe("idsElegidos", () => {
  it("quita repetidos, nulos y valores que no son ids", () => {
    assert.deepEqual(idsElegidos([2, { id: 2 }, "x", null, 4.5, 8]), [2, 8]);
  });
});

describe("validarMarcasSinRepetir", () => {
  it("acepta una lista sin repetidas, vacía o sin valor", () => {
    assert.equal(validarMarcasSinRepetir([1, 2, 3]), true);
    assert.equal(validarMarcasSinRepetir([]), true);
    assert.equal(validarMarcasSinRepetir(null), true);
  });

  it("rechaza la misma marca dos veces, también poblada", () => {
    assert.match(String(validarMarcasSinRepetir([1, 2, 1])), /repetida/);
    assert.match(String(validarMarcasSinRepetir([{ id: 4 }, 4])), /repetida/);
  });
});
