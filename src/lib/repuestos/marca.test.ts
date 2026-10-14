import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica, Marca, RepuestosMarca, TiposEquipo } from "@/payload-types";

import {
  categoriasDeMarca,
  tarjetaDeMarketplace,
  tarjetasDeLaPagina,
  vistaEncabezado,
} from "./marca";

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

  it("sin enlace no hay href (nada de enlaces rotos); con enlace, se enlaza sola", () => {
    const r = categoriasDeMarca([cat(1, "Sin", 1), cat(2, "Con", 2, " /ruta/ ")]);
    assert.equal(r[0]?.href, null);
    assert.equal(r[1]?.href, "/ruta/");
  });

  it("descarta las que no tienen nombre", () => {
    assert.equal(categoriasDeMarca([cat(1, "  ")]).length, 0);
  });
});

describe("tarjetas", () => {
  it("una por tipo, con el título de ux-9 y el enlace a la página del tipo", () => {
    const t = tarjetasDeLaPagina(marca, [tipo(1, "Bulldozer", "bulldozer")], global);
    assert.equal(t.length, 1);
    assert.equal(t[0]?.titulo, "Repuestos para maquinaria pesada bulldozer CATERPILLAR");
    assert.match(t[0]?.href ?? "", /caterpillar\/bulldozer\/?$/);
    assert.equal(t[0]?.soloEscritorio, false);
  });

  it("usadas y aditamentos van al final, solo escritorio, y solo si tienen título y enlace", () => {
    const g = {
      ...global,
      tarjetaUsadas: { titulo: "Maquinaria pesada usada", enlace: "/usada/" },
      tarjetaAditamentos: { titulo: "Aditamentos", enlace: "" },
    } as RepuestosMarca;
    const t = tarjetasDeLaPagina(marca, [tipo(1, "Excavadora", "excavadora")], g);
    assert.deepEqual(
      t.map((x) => x.clave),
      ["tipo-1", "usadas"],
    );
    assert.equal(t[1]?.soloEscritorio, true);
  });

  it("tarjetaDeMarketplace sin datos es null", () => {
    assert.equal(tarjetaDeMarketplace("x", null), null);
    assert.equal(tarjetaDeMarketplace("x", { titulo: "A" }), null);
  });

  it("un tipo sin slug no sale", () => {
    assert.equal(tarjetasDeLaPagina(marca, [tipo(1, "X", "")], global).length, 0);
  });
});
