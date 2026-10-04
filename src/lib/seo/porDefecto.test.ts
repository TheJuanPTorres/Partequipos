import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { recortarDescripcion, tituloPorDefecto } from "./porDefecto";
import { SEO_POR_COLECCION, estadoLongitud } from "./seoPanel";

describe("tituloPorDefecto", () => {
  it("reproduce las plantillas que tenían las páginas", () => {
    assert.equal(
      tituloPorDefecto.tipoRepuesto("Excavadora", "Caterpillar"),
      "Repuestos para excavadora Caterpillar",
    );
    assert.equal(tituloPorDefecto.modeloRepuesto("CAT 320D"), "Repuestos CAT 320D");
    assert.equal(tituloPorDefecto.marcaMaquinaria("Hitachi"), "Maquinaria pesada Hitachi");
    assert.equal(tituloPorDefecto.tipoMaquinaria("Excavadoras", "Hitachi"), "Excavadoras Hitachi");
    assert.equal(tituloPorDefecto.categoriaNueva("Excavadoras"), "Excavadoras nuevas");
    assert.equal(tituloPorDefecto.categoriaUsada("Excavadoras"), "Excavadoras usadas");
    assert.equal(tituloPorDefecto.marcaLubricante("Eni"), "Lubricantes Eni");
    assert.equal(tituloPorDefecto.categoriaLubricante("Motos", "Eni"), "Motos | Lubricantes Eni");
  });
});

describe("recortarDescripcion", () => {
  it("deja igual lo corto y corta lo largo a 160 con «…»", () => {
    assert.equal(recortarDescripcion("  hola   mundo "), "hola mundo");
    const largo = recortarDescripcion("a".repeat(200));
    assert.equal(largo.length, 160);
    assert.ok(largo.endsWith("…"));
  });
});

describe("SEO_POR_COLECCION", () => {
  it("cubre las colecciones con grupo SEO y página propia (no las categorías técnicas)", () => {
    assert.deepEqual(Object.keys(SEO_POR_COLECCION).sort(), [
      "articulos",
      "categorias-blog",
      "categorias-lubricante",
      "categorias-maquinaria",
      "categorias-usada",
      "equipos-nuevos",
      "marcas-lubricante",
      "marcas-maquinaria",
      "modelos-repuesto",
      "paginas",
      "tipos-equipo",
      "tipos-maquinaria",
    ]);
  });

  it("sin el nombre de la marca no inventa título", () => {
    assert.equal(SEO_POR_COLECCION["tipos-equipo"]!.titulo("Excavadora", {}), null);
    assert.equal(
      SEO_POR_COLECCION["tipos-equipo"]!.titulo("Excavadora", { marca: "Volvo" }),
      "Repuestos para excavadora Volvo",
    );
  });
});

describe("estadoLongitud", () => {
  it("vacío, corto, bien y largo", () => {
    assert.equal(estadoLongitud(0, { max: 60 }), "vacio");
    assert.equal(estadoLongitud(61, { max: 60 }), "largo");
    assert.equal(estadoLongitud(50, { min: 120, max: 160 }), "corto");
    assert.equal(estadoLongitud(140, { min: 120, max: 160 }), "bien");
  });
});
