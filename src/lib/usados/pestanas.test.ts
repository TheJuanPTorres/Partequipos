import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pestanasDeCategorias } from "./pestanas";

describe("pestañas de las categorías de usada", () => {
  const categorias = [
    { id: 1, slug: "bulldozer", nombre: "Bulldozers" },
    { id: 2, slug: "cargadores", nombre: "Cargadores" },
    { id: 3, slug: "excavadoras", nombre: "Excavadoras" },
  ];

  it("todas las categorías, con la actual marcada y las vacías con su nota", () => {
    const p = pestanasDeCategorias(categorias, new Set([1, 3]), 3);
    assert.deepEqual(
      p.map((x) => [x.texto, x.activa, x.nota ?? null]),
      [
        ["Bulldozers", false, null],
        ["Cargadores", false, "Sin unidades por ahora"],
        ["Excavadoras", true, null],
      ],
    );
    assert.equal(p[2]?.href, "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/");
  });
});
