import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Marca, ModelosRepuesto, RepuestosMarca, TiposEquipo } from "@/payload-types";

import { enlacesDeModelos, vistaEncabezadoTipo } from "./tipo";

const marca = { id: 1, nombre: "Caterpillar", slug: "caterpillar" } as Marca;
const tipo = {
  id: 7,
  nombre: "Excavadora",
  slug: "excavadora",
  descripcion: " Piezas de desgaste. ",
} as TiposEquipo;
const global = { subtituloHero: "En Colombia" } as RepuestosMarca;
const modelo = (id: number, nombre: string, slug: string, codigo?: string) =>
  ({ id, nombre, slug, codigo }) as ModelosRepuesto;

describe("vistaEncabezadoTipo", () => {
  it("compone el título con el tipo y la marca, y toma la descripción del tipo", () => {
    const v = vistaEncabezadoTipo(marca, tipo, global);
    assert.equal(v.linea1, "Repuestos para excavadora");
    assert.equal(v.linea2, "CATERPILLAR En Colombia");
    assert.equal(v.descripcion, "Piezas de desgaste.");
  });

  it("sin imágenes no hay fondo ni logo (la página se pinta igual, sin hueco)", () => {
    const v = vistaEncabezadoTipo(marca, tipo, global);
    assert.equal(v.fondo, null);
    assert.equal(v.logo, null);
  });

  it("sin el texto del global, la segunda línea es solo la marca", () => {
    assert.equal(vistaEncabezadoTipo(marca, tipo, {} as RepuestosMarca).linea2, "CATERPILLAR");
  });
});

describe("enlacesDeModelos", () => {
  it("un enlace por modelo, a su ficha, con el código si lo tiene", () => {
    const r = enlacesDeModelos(marca, tipo, [
      modelo(1, "320D", "320d", " 320-D "),
      modelo(2, "336", "336"),
    ]);
    assert.equal(r.length, 2);
    assert.equal(r[0]?.codigo, "320-D");
    assert.equal(r[1]?.codigo, null);
    assert.match(r[0]?.href ?? "", /caterpillar\/excavadora\/320d\/?$/);
  });

  it("descarta los que no tienen nombre o slug", () => {
    assert.equal(
      enlacesDeModelos(marca, tipo, [modelo(1, " ", "a"), modelo(2, "B", "")]).length,
      0,
    );
  });
});
