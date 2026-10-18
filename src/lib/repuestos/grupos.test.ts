import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica } from "@/payload-types";

import { gruposDeCategoria } from "./grupos";

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
