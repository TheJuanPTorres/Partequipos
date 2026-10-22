import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasLubricante } from "@/payload-types";

import {
  agruparProductos,
  encabezadoDeLinea,
  nombreCompleto,
  scriptAnclasALineas,
  seccionesDeCategorias,
} from "./marca";

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

describe("páginas de línea (2026-10-22)", () => {
  it("nombreCompleto: el nombre con su grado", () => {
    assert.equal(
      nombreCompleto({ nombre: "I-RIDE RACING", grado: "5W-40" }),
      "I-RIDE RACING 5W-40",
    );
    assert.equal(nombreCompleto({ nombre: "OSO", grado: null }), "OSO");
  });

  it("encabezado: «Lubricantes <línea>» y, sin entradilla, la de la marca", () => {
    const e = encabezadoDeLinea(
      { nombre: "Motos & Scooter", entradilla: "  ", imagen: null, imagenCabecera: null },
      { entradilla: "Lubricantes ENI son productos…" },
      null,
    );
    assert.equal(e.linea1, "Lubricantes Motos & Scooter");
    assert.equal(e.descripcion, "Lubricantes ENI son productos…");
    assert.equal(e.fondo, null);
  });

  it("encabezado: la entradilla propia de la línea manda", () => {
    const e = encabezadoDeLinea(
      { nombre: "Auto liviano", entradilla: "Propia", imagen: null, imagenCabecera: null },
      { entradilla: "De la marca" },
      null,
    );
    assert.equal(e.descripcion, "Propia");
  });

  it("producto: sin ficha, sin PDF; con ficha sin páginas, el PDF sin visor", () => {
    const [g] = agruparProductos([
      p("A"),
      p("B", {
        grado: "10W",
        ficha: {
          id: 1,
          titulo: "B",
          url: "https://x/b.pdf",
          filesize: 2048,
          updatedAt: "",
          createdAt: "",
        },
      }),
    ]);
    assert.equal(g?.productos[0]?.pdf, null);
    assert.equal(g?.productos[1]?.pdf?.pdf.url, "https://x/b.pdf");
    assert.equal(g?.productos[1]?.pdf?.titulo, "Ficha técnica: B 10W");
    assert.deepEqual(g?.productos[1]?.pdf?.paginas, []);
  });

  it("anclas viejas: el script solo lleva a las líneas que conoce y no puede cerrar el <script>", () => {
    const s = scriptAnclasALineas({
      "auto-liviano": "/lubricantes/lubricantes-eni/auto-liviano/",
      "x</script>": "/y/",
    });
    assert.ok(s.includes('"auto-liviano":"/lubricantes/lubricantes-eni/auto-liviano/"'));
    assert.ok(!s.includes("</script>"));
    assert.ok(s.includes("location.replace"));
  });
});
