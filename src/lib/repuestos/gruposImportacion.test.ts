import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { accionGrupos, ficheroGrupo, firmaDeGrupos } from "./gruposImportacion";

const grupos = [{ nombre: "Cadena", productos: [{ texto: "Cadena sellada" }] }];

describe("ficheroGrupo", () => {
  it("lleva el prefijo, la categoría corta, la posición desde 1 y la extensión de WordPress", () => {
    assert.equal(
      ficheroGrupo(
        "tren-de-rodaje-para-maquinaria-pesada",
        0,
        "https://partequipos.com/wp-content/uploads/2025/09/Cadena.JPG",
      ),
      "wp-grupo-tren-de-rodaje-1.jpg",
    );
    assert.equal(
      ficheroGrupo("filtracion-para-maquinaria-pesada", 5, "https://x.com/a.png?v=2"),
      "wp-grupo-filtracion-6.png",
    );
  });

  it("sin extensión reconocible, jpg", () => {
    assert.equal(
      ficheroGrupo("miscelaneos-para-maquinaria-pesada", 1, "https://x.com/a"),
      "wp-grupo-miscelaneos-2.jpg",
    );
  });
});

describe("accionGrupos", () => {
  it("vacío: se escribe", () => {
    assert.equal(accionGrupos(undefined, null), "escribir");
    assert.equal(accionGrupos([], null), "escribir");
  });

  it("con grupos que no son de la importación: se conservan", () => {
    assert.equal(accionGrupos(grupos, null), "conservar");
    assert.equal(
      accionGrupos(grupos, firmaDeGrupos([{ nombre: "Otro", productos: [] }])),
      "conservar",
    );
  });

  it("con lo mismo que escribió la importación: se vuelve a escribir sin duplicar", () => {
    assert.equal(accionGrupos(grupos, firmaDeGrupos(grupos)), "escribir");
  });

  it("si alguien cambió un producto después de la importación, se conserva", () => {
    const editado = [{ nombre: "Cadena", productos: [{ texto: "Cadena sellada y lubricada" }] }];
    assert.equal(accionGrupos(editado, firmaDeGrupos(grupos)), "conservar");
  });
});
