import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pestanasDeCategorias, unidadesPorCategoria } from "./pestanas";

describe("botones de categoría de los listados de usada", () => {
  const categorias = [
    { id: 1, slug: "bulldozer", nombre: "Bulldozers" },
    { id: 2, slug: "cargadores", nombre: "Cargadores" },
    { id: 3, slug: "excavadoras", nombre: "Excavadoras" },
    { id: 4, slug: "aditamentos", nombre: "Aditamentos" },
    { id: 5, slug: "motoniveladoras", nombre: "Motoniveladoras" },
  ];
  const cuentas = unidadesPorCategoria([
    { categoria: 3 },
    { categoria: 3 },
    { categoria: 3 },
    { categoria: 1 },
    { categoria: 4 },
  ]);

  it("primero las que tienen unidades, de más a menos y por nombre; después las vacías", () => {
    const p = pestanasDeCategorias(categorias, cuentas, 2);
    assert.deepEqual(
      p.map((x) => [x.texto, x.activa, x.cuenta ?? null, x.nota ?? null]),
      [
        ["Excavadoras", false, 3, null],
        ["Aditamentos", false, 1, null],
        ["Bulldozers", false, 1, null],
        ["Cargadores", true, null, "Sin unidades por ahora"],
        ["Motoniveladoras", false, null, "Sin unidades por ahora"],
      ],
    );
    assert.equal(p[0]?.href, "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/");
  });

  it("cuenta las unidades de cada categoría", () => {
    assert.deepEqual([...cuentas.entries()].sort(), [
      [1, 1],
      [3, 3],
      [4, 1],
    ]);
  });
});
