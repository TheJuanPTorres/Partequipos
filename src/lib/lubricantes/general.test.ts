import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MarcasLubricante, PaginasIndice } from "@/payload-types";

import { TEXTOS_LUBRICANTES, parrafos, vistaLubricantes } from "./general";

const eni = {
  id: 1,
  nombre: "Eni",
  slug: "lubricantes-eni",
  logo: { id: 9, url: "/eni.png", width: 400, height: 200 },
} as Pick<MarcasLubricante, "id" | "nombre" | "slug" | "logo">;

describe("página general de lubricantes", () => {
  it("vacía, los textos del diseño; la marca, la primera; el logo de la marca, con sus colores", () => {
    const v = vistaLubricantes(null, [eni]);
    assert.equal(v.encabezado.antetitulo, "Partequipos");
    assert.equal(v.encabezado.linea1, "Nuestros Lubricantes");
    assert.equal(v.bloque.titulo, TEXTOS_LUBRICANTES.tituloBloque);
    assert.equal(v.bloque.parrafos.length, 2);
    assert.equal(v.bloque.textoBoton, "Ver catálogo");
    assert.deepEqual(v.bloque.marca, {
      nombre: "Eni",
      href: "/lubricantes/lubricantes-eni/",
      logo: { url: "/eni.png", width: 400, height: 200, oscuro: false, alt: "Logo de Eni" },
    });
  });

  it("los textos del panel mandan, y la marca elegida también", () => {
    const otra = { ...eni, id: 2, nombre: "Otra", slug: "otra" };
    const v = vistaLubricantes(
      {
        titulo: " Lubricantes ",
        tituloBloque: "T",
        textoBloque: "Uno.\n\nDos.\n\n\nTres.",
        textoBoton: "Catálogo",
        marca: otra,
      } as PaginasIndice["lubricantes"],
      [eni],
    );
    assert.equal(v.encabezado.linea1, "Lubricantes");
    assert.deepEqual(v.bloque.parrafos, ["Uno.", "Dos.", "Tres."]);
    assert.equal(v.bloque.textoBoton, "Catálogo");
    assert.equal(v.bloque.marca?.href, "/lubricantes/otra/");
  });

  it("sin ninguna marca, el bloque sale sin logo ni botón", () => {
    assert.equal(vistaLubricantes(null, []).bloque.marca, null);
  });

  it("párrafos: separados por línea en blanco", () => {
    assert.deepEqual(parrafos("a\nb\n\nc"), ["a\nb", "c"]);
  });
});
