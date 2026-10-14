import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasLubricante } from "@/payload-types";

import { agruparProductos, seccionesDeCategorias } from "./marca";

type Producto = NonNullable<CategoriasLubricante["productos"]>[number];

const p = (nombre: string, extra: Partial<Producto> = {}): Producto => ({
  id: nombre,
  nombre,
  ...extra,
});

describe("agruparProductos", () => {
  it("agrupa los seguidos con el mismo grupo, en el orden del panel", () => {
    const grupos = agruparProductos([
      p("A", { grupo: "Uno" }),
      p("B", { grupo: "Uno" }),
      p("C", { grupo: "Dos" }),
      p("D", { grupo: "Uno" }),
    ]);
    assert.deepEqual(
      grupos.map((g) => [g.titulo, g.productos.map((x) => x.nombre)]),
      [
        ["Uno", ["A", "B"]],
        ["Dos", ["C"]],
        ["Uno", ["D"]],
      ],
    );
  });

  it("los productos sin grupo van juntos, sin subtítulo", () => {
    const grupos = agruparProductos([p("A"), p("B", { grupo: "  " })]);
    assert.equal(grupos.length, 1);
    assert.equal(grupos[0]?.titulo, null);
  });

  it("descarta un producto sin nombre y limpia el grado vacío", () => {
    const grupos = agruparProductos([p("  "), p("X", { grado: " " })]);
    assert.deepEqual(
      grupos.flatMap((g) => g.productos).map((x) => [x.nombre, x.grado]),
      [["X", null]],
    );
  });

  it("la ficha es la URL del PDF poblado; sin poblar, ninguna", () => {
    const [g] = agruparProductos([
      p("A", {
        ficha: { id: 1, titulo: "A", url: "https://x/a.pdf", updatedAt: "", createdAt: "" },
      }),
      p("B", { ficha: 7 }),
    ]);
    assert.deepEqual(
      g?.productos.map((x) => x.ficha),
      ["https://x/a.pdf", null],
    );
  });
});

describe("seccionesDeCategorias", () => {
  it("el ancla de cada sección es el slug de la categoría", () => {
    const [s] = seccionesDeCategorias([
      {
        id: 1,
        nombre: "Auto liviano",
        slug: "auto-liviano",
        marca: 1,
        productos: [p("I-SINT", { grado: "0W-20" })],
        updatedAt: "",
        createdAt: "",
      },
    ]);
    assert.equal(s?.ancla, "auto-liviano");
    assert.equal(s?.grupos[0]?.productos[0]?.grado, "0W-20");
  });
});
