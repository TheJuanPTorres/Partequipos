import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { alineacionDeTexto, lineasDeTexto } from "./alineacionTexto";

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
