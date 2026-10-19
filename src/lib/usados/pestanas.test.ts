import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pestanasDeCategorias } from "./pestanas";

describe("pestañas de las categorías de usada", () => {
  const categorias = [
    { id: 1, slug: "bulldozer", nombre: "Bulldozers" },
    { id: 2, slug: "cargadores", nombre: "Cargadores" },
    { id: 3, slug: "excavadoras", nombre: "Excavadoras" },
  ];

  it("solo las categorías con unidades, con la actual marcada", () => {
    const p = pestanasDeCategorias(categorias, new Set([1, 3]), 3);
    assert.deepEqual(
      p.map((x) => [x.texto, x.activa]),
      [
        ["Bulldozers", false],
        ["Excavadoras", true],
      ],
    );
    assert.equal(p[1]?.href, "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/");
  });

  it("la actual sale aunque esté vacía", () => {
    const p = pestanasDeCategorias(categorias, new Set([1]), 2);
    assert.deepEqual(
      p.map((x) => x.texto),
      ["Bulldozers", "Cargadores"],
    );
  });
});
