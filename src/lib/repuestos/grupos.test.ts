import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica } from "@/payload-types";

import { enFrase, gruposDeCategoria, mensajeCotizar } from "./grupos";

const categoria = (grupos: CategoriasTecnica["grupos"]) =>
  ({ id: 1, nombre: "Filtración", slug: "filtracion", grupos }) as CategoriasTecnica;

describe("gruposDeCategoria", () => {
  it("sin grupos, no hay apartado", () => {
    assert.deepEqual(gruposDeCategoria(categoria(undefined)), []);
    assert.deepEqual(gruposDeCategoria(categoria([])), []);
  });

  it("conserva el orden y limpia los espacios", () => {
    const r = gruposDeCategoria(
      categoria([
        { id: "a", nombre: " Filtro de aire ", productos: [{ texto: " Filtro primario " }] },
        { id: "b", nombre: "Filtro de aceite", productos: [{ texto: "Filtro de aceite" }] },
      ]),
    );
    assert.deepEqual(
      r.map((g) => [g.nombre, g.productos]),
      [
        ["Filtro de aire", ["Filtro primario"]],
        ["Filtro de aceite", ["Filtro de aceite"]],
      ],
    );
  });

  it("no pinta un grupo sin nombre ni uno sin productos", () => {
    const r = gruposDeCategoria(
      categoria([
        { id: "a", nombre: "  ", productos: [{ texto: "Algo" }] },
        { id: "b", nombre: "Vacío", productos: [{ texto: "  " }] },
        { id: "c", nombre: "Sin lista" },
        { id: "d", nombre: "Bueno", productos: [{ texto: "Pieza" }] },
      ]),
    );
    assert.deepEqual(
      r.map((g) => g.nombre),
      ["Bueno"],
    );
  });

  it("un grupo con «Mostrar en la web» desmarcado no se pinta; sin dato, sí", () => {
    const r = gruposDeCategoria(
      categoria([
        { id: "a", nombre: "Oculto", mostrar: false, productos: [{ texto: "Pieza" }] },
        { id: "b", nombre: "Visible", mostrar: true, productos: [{ texto: "Pieza" }] },
        { id: "c", nombre: "Antiguo", productos: [{ texto: "Pieza" }] },
      ]),
    );
    assert.deepEqual(
      r.map((x) => x.nombre),
      ["Visible", "Antiguo"],
    );
  });

  it("una foto sin poblar deja la tarjeta sin foto", () => {
    const r = gruposDeCategoria(
      categoria([{ id: "a", nombre: "Grupo", imagen: 7, productos: [{ texto: "Pieza" }] }]),
    );
    assert.equal(r[0]?.imagen, null);
  });

  it("la foto poblada sin texto alternativo lleva uno por defecto", () => {
    const media = { id: 7, url: "/f.jpg", width: 800, height: 600, alt: "" };
    const r = gruposDeCategoria(
      categoria([
        { id: "a", nombre: "Cadena", imagen: media as never, productos: [{ texto: "Pieza" }] },
      ]),
    );
    assert.equal(r[0]?.imagen?.alt, "Cadena para maquinaria pesada");
  });
});

describe("mensajeCotizar", () => {
  it("escribe el grupo en tipo frase y la categoría en minúsculas", () => {
    assert.equal(
      mensajeCotizar("CADENA PARA  MAQUINARIA PESADA", "Tren de Rodaje"),
      "Quiero cotizar: Cadena para maquinaria pesada (tren de rodaje). Marca y modelo de la máquina: ",
    );
  });

  it("un nombre que no va todo en mayúsculas se deja como está", () => {
    assert.equal(enFrase("Filtros GET"), "Filtros GET");
    assert.equal(enFrase(" BOMBAS "), "Bombas");
  });
});

describe("gruposDeCategoria: enlaces de la tienda", () => {
  it("lleva el del grupo y el de cada producto, en su orden; vacío, null", () => {
    const [g] = gruposDeCategoria(
      categoria([
        {
          id: "a",
          nombre: "Cadena",
          enlaceTienda: " https://tienda.ejemplo.test/cadenas ",
          productos: [
            { texto: "Cadena A" },
            { texto: "Cadena B", enlaceTienda: "https://tienda.ejemplo.test/b" },
            { texto: "  " },
            { texto: "Cadena C", enlaceTienda: "" },
          ],
        },
      ]),
    );
    assert.equal(g?.enlaceTienda, "https://tienda.ejemplo.test/cadenas");
    assert.deepEqual(g?.productos, ["Cadena A", "Cadena B", "Cadena C"]);
    assert.deepEqual(g?.enlacesProductos, [null, "https://tienda.ejemplo.test/b", null]);
  });
  it("sin ningún enlace, todo null (la web usa la tienda general)", () => {
    const [g] = gruposDeCategoria(
      categoria([{ id: "a", nombre: "Cadena", productos: [{ texto: "X" }] }]),
    );
    assert.equal(g?.enlaceTienda, null);
    assert.deepEqual(g?.enlacesProductos, [null]);
  });
});
