import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica, Marca, RepuestosMarca } from "@/payload-types";

import { fondoDeRespaldo, placasDeMarcas, vistaEncabezadoCategoria } from "./categoria";

const global = {
  tituloHero: "Repuestos para maquinaria pesada",
  subtituloHero: "En Colombia",
} as RepuestosMarca;
const categoria = {
  id: 1,
  nombre: "Tren de Rodaje",
  slug: "tren-de-rodaje-para-maquinaria-pesada",
  descripcion: " Cadenas y rodillos. ",
} as CategoriasTecnica;
const marca = (id: number, nombre: string, slug: string) => ({ id, nombre, slug }) as Marca;

describe("vistaEncabezadoCategoria", () => {
  it("compone el título con la categoría en mayúsculas, como el de la marca", () => {
    const v = vistaEncabezadoCategoria(categoria, global, null);
    assert.equal(v.linea1, "Repuestos para maquinaria pesada");
    assert.equal(v.linea2, "TREN DE RODAJE En Colombia");
    assert.equal(v.descripcion, "Cadenas y rodillos.");
    assert.equal(v.logo, null);
  });

  it("sin textos del global, el título no queda vacío", () => {
    const v = vistaEncabezadoCategoria(categoria, {} as RepuestosMarca, null);
    assert.equal(v.linea1, "Repuestos para maquinaria pesada");
    assert.equal(v.linea2, "TREN DE RODAJE");
  });

  it("sin imagen propia ni de respaldo, no hay fondo (sin hueco)", () => {
    assert.equal(vistaEncabezadoCategoria(categoria, global, null).fondo, null);
  });
});

describe("placasDeMarcas", () => {
  it("una placa por marca, con el enlace a su página", () => {
    const p = placasDeMarcas([
      marca(1, "Caterpillar", "repuestos-para-maquinaria-pesada-caterpillar"),
    ]);
    assert.equal(p.length, 1);
    assert.match(
      p[0]?.href ?? "",
      /repuestos-maquinaria-pesada-marcas\/repuestos-para-maquinaria-pesada-caterpillar\/?$/,
    );
    assert.equal(p[0]?.logo, null);
  });

  it("descarta las marcas sin nombre o sin slug", () => {
    assert.equal(placasDeMarcas([marca(1, " ", "a"), marca(2, "B", "")]).length, 0);
  });
});

describe("fondoDeRespaldo", () => {
  it("sin ninguna marca con fondo, es null", () => {
    assert.equal(fondoDeRespaldo([marca(1, "A", "a")]), null);
  });
});
