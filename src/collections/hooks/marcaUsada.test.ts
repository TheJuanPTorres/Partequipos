import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decidirMarca } from "./marcaUsada";

describe("decidirMarca", () => {
  it("con relación (id o poblada), el texto sale de ella", () => {
    assert.deepEqual(decidirMarca({ marcaUsada: 7, marca: "otra" }), {
      tipo: "texto-desde-relacion",
      id: 7,
    });
    assert.deepEqual(decidirMarca({ marcaUsada: { id: 7, nombre: "Hitachi" } }), {
      tipo: "texto-desde-relacion",
      id: 7,
    });
  });

  it("sin relación y con texto: buscar o crear por el slug del texto, sin espacios de más", () => {
    assert.deepEqual(decidirMarca({ marca: "  Case   Construction " }), {
      tipo: "relacion-desde-texto",
      slug: "case-construction",
      nombre: "Case Construction",
    });
    assert.deepEqual(decidirMarca({ marcaUsada: null, marca: "LiuGong" }), {
      tipo: "relacion-desde-texto",
      slug: "liugong",
      nombre: "LiuGong",
    });
  });

  it("sin nada útil, nada", () => {
    for (const data of [{}, { marca: "" }, { marca: "   " }, { marca: "—" }, { marca: 5 }]) {
      assert.deepEqual(decidirMarca(data), { tipo: "nada" }, JSON.stringify(data));
    }
  });
});
