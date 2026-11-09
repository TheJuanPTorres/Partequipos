import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { coincideModelo } from "./buscarModelo";
import {
  datosClaveModelo,
  lineaDeTexto,
  otrosModelosDelTipo,
  textoDeBusqueda,
} from "./fichaModelo";
import { enlacesDeModelos, type ModeloEnlace } from "./tipo";
import type { Marca, ModelosRepuesto, TiposEquipo } from "@/payload-types";

describe("textoDeBusqueda", () => {
  it("junta nombre, código y serie, normalizados, para que «ex 120» encuentre «EX120-2»", () => {
    const clave = textoDeBusqueda({ nombre: "EX120-2", codigo: null, serie: "EX" });
    assert.ok(coincideModelo(clave, "ex 120"));
    assert.ok(coincideModelo(clave, "EX-120"));
    assert.ok(!coincideModelo(clave, "zx200"));
  });

  it("busca también por el código", () => {
    const clave = textoDeBusqueda({ nombre: "Cargador CASE", codigo: "621E" });
    assert.ok(coincideModelo(clave, "621e"));
  });
});

describe("lineaDeTexto", () => {
  it("toma la primera frase", () => {
    assert.equal(
      lineaDeTexto("Filtros para la 1150M. Aceites y más. Otra frase."),
      "Filtros para la 1150M.",
    );
  });

  it("corta en una palabra y añade puntos suspensivos si pasa del máximo", () => {
    const largo = `${"palabra ".repeat(40)}final.`;
    const r = lineaDeTexto(largo, 60);
    assert.ok(r.length <= 61, r);
    assert.ok(r.endsWith("…"));
    assert.ok(!r.includes("  "));
  });

  it("sin descripción, vacío", () => {
    assert.equal(lineaDeTexto(null), "");
    assert.equal(lineaDeTexto("   "), "");
  });

  it("un texto sin punto se usa entero si cabe", () => {
    assert.equal(
      lineaDeTexto("Repuestos originales y alternos"),
      "Repuestos originales y alternos",
    );
  });
});

describe("datosClaveModelo", () => {
  it("sin serie, no hay fila de serie", () => {
    const d = datosClaveModelo({ marca: "Case", tipo: "Bulldozer", serie: null, modelo: "1150M" });
    assert.deepEqual(
      d.map((x) => x.etiqueta),
      ["Marca", "Tipo", "Modelo"],
    );
  });

  it("con serie, la pone entre el tipo y el modelo", () => {
    const d = datosClaveModelo({
      marca: "Hitachi",
      tipo: "Excavadora",
      serie: "EX",
      modelo: "EX120",
    });
    assert.deepEqual(
      d.map((x) => x.etiqueta),
      ["Marca", "Tipo", "Serie", "Modelo"],
    );
  });
});

describe("otrosModelosDelTipo", () => {
  const m = (id: number, href: string | null): ModeloEnlace => ({
    id,
    nombre: `M${id}`,
    codigo: null,
    href,
    serie: null,
  });

  it("quita el modelo de la página y las entradas sin página", () => {
    const r = otrosModelosDelTipo([m(1, "/a/"), m(2, "/b/"), m(3, null)], { id: 1 });
    assert.deepEqual(
      r.map((x) => x.id),
      [2],
    );
  });
});

describe("modelo corto de la lista", () => {
  const marca = { slug: "hitachi", nombre: "Hitachi" } as Marca;
  const tipo = { slug: "excavadora", nombre: "Excavadora" } as TiposEquipo;
  const modelo = (nombre: string, codigo: string | null) =>
    ({ id: 1, nombre, slug: "m", codigo, serie: null, imagenes: [] }) as unknown as ModelosRepuesto;

  it("es el código del modelo, aunque el nombre ya lo lleve", () => {
    const [m] = enlacesDeModelos(marca, tipo, [modelo("Excavadora Hitachi EX120-2", "EX120-2")]);
    assert.equal(m?.corto, "EX120-2");
    assert.equal(m?.nombre, "Excavadora Hitachi EX120-2");
  });

  it("sin código, es el nombre", () => {
    const [m] = enlacesDeModelos(marca, tipo, [modelo("Hitachi sin código", null)]);
    assert.equal(m?.corto, "Hitachi sin código");
  });

  it("la búsqueda encuentra por el nombre completo y por el corto", () => {
    const clave = textoDeBusqueda({ nombre: "Excavadora Hitachi EX120-2", corto: "EX120-2" });
    assert.ok(coincideModelo(clave, "excavadora hitachi"));
    assert.ok(coincideModelo(clave, "ex120"));
  });
});
