import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PESTANAS,
  destinoDeUrl,
  enlaceEditar,
  esCampoValido,
  esPestanaValida,
  idDeCampo,
} from "./enlaceEditar";

describe("enlace «Editar»: formato", () => {
  it("colección e id, con pestaña y campo", () => {
    assert.equal(
      enlaceEditar({ coleccion: "equipos-usados", id: 27, pestana: "fotos", campo: "imagenes" }),
      "/admin/collections/equipos-usados/27?pestana=fotos&campo=imagenes",
    );
  });

  it("sin pestaña ni campo, la ficha tal cual; un global; otra ruta del panel", () => {
    assert.equal(enlaceEditar({ coleccion: "paginas", id: "5" }), "/admin/collections/paginas/5");
    assert.equal(
      enlaceEditar({ global: "pie", campo: "redes.0.url" }),
      "/admin/globals/pie?campo=redes.0.url",
    );
    assert.equal(
      enlaceEditar({ coleccion: "marcas", id: 1 }, "/panel"),
      "/panel/collections/marcas/1",
    );
  });

  it("datos inválidos: sin enlace", () => {
    for (const coleccion of ["", "Equipos", "../users", "a/b", "x y", "a?b"])
      assert.equal(enlaceEditar({ coleccion, id: 1 }), null, coleccion);
    for (const id of [0, -1, 1.5, "abc", "1;drop", "", "01"])
      assert.equal(enlaceEditar({ coleccion: "marcas", id }), null, String(id));
    assert.equal(enlaceEditar({ global: "../seo" }), null);
  });

  it("una pestaña o un campo inválidos se omiten (el enlace sigue)", () => {
    assert.equal(
      enlaceEditar({
        coleccion: "marcas",
        id: 1,
        pestana: "otra" as never,
        campo: "<img onerror=x>",
      }),
      "/admin/collections/marcas/1",
    );
  });
});

describe("enlace «Editar»: validación estricta de lo que llega por la URL", () => {
  it("pestaña: solo las de la lista", () => {
    for (const p of Object.keys(PESTANAS)) assert.equal(esPestanaValida(p), true, p);
    for (const p of ["Contenido", "toString", "__proto__", "constructor", "", "fotos ", null, 3])
      assert.equal(esPestanaValida(p), false, String(p));
  });

  it("campo: letras, números, puntos y guiones", () => {
    for (const c of ["nombre", "seo.titulo", "imagenes.0.alt", "ficha-tecnica", "a"])
      assert.equal(esCampoValido(c), true, c);
    for (const c of [
      "",
      "a b",
      "<script>",
      '"x"',
      "x'",
      "#field-nombre",
      "a/b",
      "a\\b",
      "a_b",
      ".nombre",
      "nombre.",
      "a..b",
      "a]",
      "a,b",
      "nombre\n",
      "x".repeat(81),
      null,
      42,
    ])
      assert.equal(esCampoValido(c), false, JSON.stringify(c));
  });

  it("lee la URL del panel: la etiqueta de la pestaña y el campo, o null", () => {
    assert.deepEqual(destinoDeUrl("?pestana=buscadores&campo=seo.titulo"), {
      pestana: "Buscadores y redes",
      campo: "seo.titulo",
    });
    assert.deepEqual(destinoDeUrl("?pestana=__proto__&campo=%3Cimg%20src%3Dx%3E"), {
      pestana: null,
      campo: null,
    });
    assert.deepEqual(destinoDeUrl(""), { pestana: null, campo: null });
  });

  it("el id del campo, como lo pinta Payload", () => {
    assert.equal(idDeCampo("nombre"), "field-nombre");
    assert.equal(idDeCampo("imagenes.0.alt"), "field-imagenes__0__alt");
  });
});
