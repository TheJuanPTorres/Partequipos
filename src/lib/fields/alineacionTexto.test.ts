import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { alineacionDeTexto, anchoDeTexto, escalaDeMaquina, lineasDeTexto } from "./alineacionTexto";

describe("alineacionDeTexto", () => {
  it("acepta las cuatro alineaciones", () => {
    for (const a of ["left", "center", "right", "justify"]) assert.equal(alineacionDeTexto(a), a);
  });
  it("cae a la izquierda con vacío o un valor desconocido", () => {
    assert.equal(alineacionDeTexto(undefined), "left");
    assert.equal(alineacionDeTexto(null), "left");
    assert.equal(alineacionDeTexto("middle"), "left");
  });
});

describe("lineasDeTexto", () => {
  it("separa por saltos de línea, también de Windows, y quita las líneas vacías", () => {
    assert.deepEqual(lineasDeTexto("Uno\r\nDos\n\n  Tres  "), ["Uno", "Dos", "Tres"]);
  });
  it("vacío o sin texto, ningún párrafo", () => {
    assert.deepEqual(lineasDeTexto(""), []);
    assert.deepEqual(lineasDeTexto(null), []);
    assert.deepEqual(lineasDeTexto(" \n "), []);
  });
});

describe("anchoDeTexto", () => {
  it("acepta las cuatro opciones", () => {
    for (const a of ["estrecho", "medio", "ancho", "columna"]) {
      assert.equal(anchoDeTexto(a, "ancho"), a);
    }
  });
  it("cae al valor por defecto del campo con vacío o desconocido", () => {
    assert.equal(anchoDeTexto(undefined, "estrecho"), "estrecho");
    assert.equal(anchoDeTexto("enorme", "columna"), "columna");
  });
});

describe("escalaDeMaquina", () => {
  it("78 % por defecto", () => {
    assert.equal(escalaDeMaquina(undefined), 0.78);
    assert.equal(escalaDeMaquina(null), 0.78);
    assert.equal(escalaDeMaquina(Number.NaN), 0.78);
  });
  it("respeta el valor dentro de 60–100 y acota lo de fuera", () => {
    assert.equal(escalaDeMaquina(90), 0.9);
    assert.equal(escalaDeMaquina(40), 0.6);
    assert.equal(escalaDeMaquina(250), 1);
  });
});
