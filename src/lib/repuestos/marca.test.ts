import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica, Marca, RepuestosMarca, TiposEquipo } from "@/payload-types";

import { categoriasDeMarca, tarjetasDeTipos, vistaEncabezado } from "./marca";

const marca = {
  id: 1,
  nombre: "Caterpillar",
  slug: "caterpillar",
  descripcion: " Texto. ",
} as Marca;
const global = {
  tituloHero: "Repuestos para maquinaria pesada",
  subtituloHero: "En Colombia",
} as RepuestosMarca;
const tipo = (id: number, nombre: string, slug: string) =>
  ({ id, nombre, slug, marca: 1 }) as TiposEquipo;
const cat = (id: number, nombre: string, ordenMarca?: number | null, enlace?: string) =>
  ({ id, nombre, ordenMarca, enlace }) as CategoriasTecnica;

describe("vistaEncabezado", () => {
  it("compone las dos líneas del título con la marca en mayúsculas", () => {
    const v = vistaEncabezado(marca, global);
    assert.equal(v.linea1, "Repuestos para maquinaria pesada");
    assert.equal(v.linea2, "CATERPILLAR En Colombia");
    assert.equal(v.descripcion, "Texto.");
    assert.equal(v.fondo, null);
  });

  it("sin los textos del global el título no queda vacío", () => {
    const v = vistaEncabezado(marca, {} as RepuestosMarca);
    assert.equal(v.linea1, "Repuestos para maquinaria pesada");
    assert.equal(v.linea2, "CATERPILLAR");
  });
});

describe("categoriasDeMarca", () => {
  it("ordena por posición y deja al final las que no la tienen, por nombre", () => {
    const r = categoriasDeMarca([
      cat(1, "Zeta"),
      cat(2, "Beta", 2),
      cat(3, "Alfa", 1),
      cat(4, "Ceta"),
    ]);
    assert.deepEqual(
      r.map((c) => c.nombre),
      ["Alfa", "Beta", "Ceta", "Zeta"],
    );
  });

  it("enlaza a la página de la categoría; sin slug no hay página y no hay enlace", () => {
    const conSlug = {
      ...cat(2, "Con", 2),
      slug: "con-para-maquinaria-pesada",
    } as CategoriasTecnica;
    const sinSlug = { ...cat(1, "Sin", 1), slug: " " } as CategoriasTecnica;
    const r = categoriasDeMarca([sinSlug, conSlug]);
    assert.equal(r[0]?.href, null);
    assert.match(
      r[1]?.href ?? "",
      /categoria-repuestos-para-maquinaria-pesada\/con-para-maquinaria-pesada\/?$/,
    );
  });

  it("descarta las que no tienen nombre", () => {
    assert.equal(categoriasDeMarca([cat(1, "  ")]).length, 0);
  });
});

describe("tarjetas", () => {
  it("una por tipo, con el título de ux-9 y el enlace a la página del tipo", () => {
    const t = tarjetasDeTipos(marca, [tipo(1, "Bulldozer", "bulldozer")]);
    assert.equal(t.length, 1);
    assert.equal(t[0]?.titulo, "Repuestos para maquinaria pesada bulldozer CATERPILLAR");
    assert.match(t[0]?.href ?? "", /caterpillar\/bulldozer\/?$/);
    assert.equal(t[0]?.soloEscritorio, false);
  });

  it("un tipo sin slug no sale", () => {
    assert.equal(tarjetasDeTipos(marca, [tipo(1, "X", "")]).length, 0);
  });
});
