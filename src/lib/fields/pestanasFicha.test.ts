import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Field, Tab } from "payload";

import { CategoriaLubricante } from "../../collections/CategoriaLubricante";
import { CategoriaMaquinaria } from "../../collections/CategoriaMaquinaria";
import { CategoriaUsada } from "../../collections/CategoriaUsada";
import { EquipoNuevo } from "../../collections/EquipoNuevo";
import { EquipoUsado } from "../../collections/EquipoUsado";
import { MarcaLubricante } from "../../collections/MarcaLubricante";
import { MarcaMaquinaria } from "../../collections/MarcaMaquinaria";
import { MarcaUsada } from "../../collections/MarcaUsada";
import { TipoMaquinaria } from "../../collections/TipoMaquinaria";
import { ayudaDeFoto, fotosPequenas, idsDeSubida } from "../panel/fotoPequena";
import { conPestanas } from "./pestanasFicha";

/** Los nombres de los campos con datos, en cualquier contenedor sin nombre (pestañas, filas). */
function nombres(campos: Field[]): string[] {
  return campos.flatMap((c) => {
    if (c.type === "tabs") return c.tabs.flatMap((t) => nombres(t.fields));
    if (!("name" in c) && "fields" in c) return nombres(c.fields);
    return "name" in c && c.type !== "ui" ? [c.name] : [];
  });
}

const pestanasDe = (campos: Field[]) =>
  (campos.find((c) => c.type === "tabs") as { tabs: Tab[] } | undefined)?.tabs ?? [];
const etiquetas = (campos: Field[]) => pestanasDe(campos).map((t) => t.label);
const enPestana = (campos: Field[], etiqueta: string) =>
  nombres(pestanasDe(campos).find((t) => t.label === etiqueta)?.fields ?? []);

const ejemplo: Field[] = [
  { name: "aviso", type: "ui", admin: { components: { Field: "/x" } } },
  { name: "nombre", type: "text" },
  { name: "slug", type: "text", admin: { position: "sidebar" } },
  { name: "imagenes", type: "upload", relationTo: "media", admin: { description: "Galería." } },
  { name: "diseno", type: "select", options: ["a"], admin: { position: "sidebar" } },
  { name: "viejo", type: "text", admin: { hidden: true } },
  { name: "seo", type: "group", fields: [{ name: "metaTitle", type: "text" }] },
];

describe("fichas con pestañas", () => {
  const r = conPestanas(ejemplo, { fotos: { imagenes: "galeria" }, avanzado: ["diseno"] });

  it("reparte en Contenido · Fotos · Buscadores y redes · Avanzado", () => {
    assert.deepEqual(etiquetas(r), ["Contenido", "Fotos", "Buscadores y redes", "Avanzado"]);
    assert.deepEqual(enPestana(r, "Contenido"), ["nombre"]);
    assert.deepEqual(enPestana(r, "Fotos"), ["imagenes"]);
    assert.deepEqual(enPestana(r, "Buscadores y redes"), ["seo"]);
    assert.deepEqual(enPestana(r, "Avanzado"), ["diseno", "viejo"]);
  });

  it("deja el aviso arriba y la barra lateral en el primer nivel", () => {
    assert.equal("name" in r[0]! && r[0].name, "aviso");
    assert.ok(r.some((c) => "name" in c && c.name === "slug"));
  });

  it("añade el tamaño recomendado a la ayuda de la foto y el aviso de foto pequeña", () => {
    const fotos = pestanasDe(r).find((t) => t.label === "Fotos")!.fields;
    assert.equal("name" in fotos[0]! && fotos[0].name, "avisoFotoPequena");
    const galeria = fotos[1] as { admin: { description: string } };
    assert.equal(galeria.admin.description, `Galería. ${ayudaDeFoto("galeria")}`);
  });

  it("«Avanzado» solo lo ve un administrador", () => {
    const av = pestanasDe(r).find((t) => t.label === "Avanzado")!;
    const condicion = av.admin!.condition!;
    assert.equal(condicion({}, {}, { user: { rol: "administrador" } } as never), true);
    assert.equal(condicion({}, {}, { user: { rol: "editor" } } as never), false);
  });

  it("una pestaña solo con campos ocultos no se pinta, pero sus campos no se pierden", () => {
    const sinAvanzado = conPestanas(ejemplo.filter((c) => !("name" in c) || c.name !== "diseno"));
    assert.ok(!etiquetas(sinAvanzado).includes("Avanzado"));
    assert.ok(nombres(sinAvanzado).includes("viejo"));
  });

  // Mover campos a pestañas SIN NOMBRE no cambia el esquema; perder uno, sí (lo vigila también
  // `db:deriva`). En las 9 fichas: los mismos campos que antes, ni uno menos.
  const fichas = {
    EquipoNuevo,
    EquipoUsado,
    MarcaMaquinaria,
    TipoMaquinaria,
    CategoriaMaquinaria,
    CategoriaUsada,
    MarcaUsada,
    MarcaLubricante,
    CategoriaLubricante,
  };
  for (const [nombre, coleccion] of Object.entries(fichas)) {
    it(`${nombre}: lleva pestañas y conserva todos sus campos`, () => {
      assert.ok(etiquetas(coleccion.fields).includes("Contenido"));
      assert.ok(nombres(coleccion.fields).includes("nombre"));
      const repetidos = nombres(coleccion.fields).filter((n, i, a) => a.indexOf(n) !== i);
      assert.deepEqual(repetidos, []);
    });
  }
});

describe("fotos pequeñas", () => {
  it("lee los ids de un campo de subida en todas sus formas", () => {
    assert.deepEqual(idsDeSubida(5), [5]);
    assert.deepEqual(idsDeSubida("7"), [7]);
    assert.deepEqual(idsDeSubida({ id: 9 }), [9]);
    assert.deepEqual(idsDeSubida([1, { id: 2 }, null, "", "x"]), [1, 2]);
    assert.deepEqual(idsDeSubida(undefined), []);
  });

  it("avisa por debajo de 1.200 px y no de las vectoriales", () => {
    const r = fotosPequenas([
      { id: 1, width: 800 },
      { id: 2, width: 1200 },
      { id: 3, width: null },
      { id: 4, width: 1199 },
    ]);
    assert.deepEqual(
      r.map((i) => i.id),
      [1, 4],
    );
  });
});
