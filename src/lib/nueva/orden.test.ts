import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { porOrden, SORT_POR_ORDEN } from "./orden";

describe("orden de tipos y equipos de maquinaria nueva", () => {
  it("primero los que tienen «Orden», de menor a mayor; los vacíos al final, por nombre", () => {
    const tipos = [
      { nombre: "Retrocargadora", orden: null },
      { nombre: "Excavadora", orden: 2 },
      { nombre: "Bulldozer" },
      { nombre: "Motoniveladora", orden: 1 },
      { nombre: "Minicargador", orden: 0 },
    ];
    assert.deepEqual(
      [...tipos].sort(porOrden).map((t) => t.nombre),
      ["Minicargador", "Motoniveladora", "Excavadora", "Bulldozer", "Retrocargadora"],
    );
  });

  it("a igual «Orden», por nombre", () => {
    const equipos = [
      { nombre: "CX 350D", orden: 1 },
      { nombre: "CX 130D", orden: 1 },
    ];
    assert.deepEqual(
      [...equipos].sort(porOrden).map((e) => e.nombre),
      ["CX 130D", "CX 350D"],
    );
  });

  it("la consulta ordena igual: por «Orden» y después por nombre", () => {
    assert.deepEqual(SORT_POR_ORDEN, ["orden", "nombre"]);
  });
});
