import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { esSeccionActual, rutaNormalizada } from "./seccionActual";

describe("sección actual del menú (2026-11-26)", () => {
  it("la página de la sección es la actual, llegue la ruta con barra final o sin ella", () => {
    for (const ruta of ["/maquinaria-pesada/", "/maquinaria-pesada", "/maquinaria-pesada/?x=1"]) {
      assert.equal(esSeccionActual(ruta, "/maquinaria-pesada/"), true, ruta);
      // También si el enlace del panel se escribió sin la barra o con un ancla.
      assert.equal(esSeccionActual(ruta, "/maquinaria-pesada"), true, ruta);
      assert.equal(esSeccionActual(ruta, "/maquinaria-pesada/#arriba"), true, ruta);
    }
  });

  it("una subpágina también, con barra o sin ella; otra sección, no", () => {
    assert.equal(
      esSeccionActual("/maquinaria-pesada/maquinaria-pesada-nueva/tipos", "/maquinaria-pesada/"),
      true,
    );
    assert.equal(esSeccionActual("/lubricantes/", "/lubricantes/lubricantes-eni/"), false);
    assert.equal(
      esSeccionActual("/repuestos-maquinaria-pesada-colombia", "/maquinaria-pesada/"),
      false,
    );
    // Un nombre que solo empieza igual no es la misma sección.
    assert.equal(esSeccionActual("/maquinaria-pesada-usada/", "/maquinaria-pesada/"), false);
  });

  it("la portada solo es la actual en la portada, también regenerada (/index)", () => {
    for (const ruta of ["/", "/index", "/index/", "", null]) {
      assert.equal(esSeccionActual(ruta, "/"), true, String(ruta));
    }
    assert.equal(esSeccionActual("/noticias/", "/"), false);
    assert.equal(esSeccionActual("/index", "/noticias/"), false);
  });

  it("un enlace a otro sitio nunca es la sección actual", () => {
    assert.equal(esSeccionActual("/", "https://tienda.example.com/"), false);
    assert.equal(esSeccionActual("/tienda/", "https://tienda.example.com/tienda/"), false);
  });

  it("normaliza: sin ? ni #, sin /index y con barra final", () => {
    assert.equal(rutaNormalizada(" /a/b?x=1#y "), "/a/b/");
    assert.equal(rutaNormalizada("/a/"), "/a/");
    assert.equal(rutaNormalizada("/index"), "/");
    assert.equal(rutaNormalizada("/indexado"), "/indexado/");
  });

  it("la cabecera marca la sección con esta función, no comparando la ruta tal cual", () => {
    const fuente = readFileSync("src/components/layout/Cabecera.tsx", "utf8");
    assert.ok(fuente.includes("esSeccionActual(ruta, href)"));
    assert.ok(!/ruta\.startsWith\(href\)/.test(fuente), "comparación sin normalizar");
    assert.ok(!fuente.includes("data-diag-ruta"), "el atributo de diagnóstico no se fusiona");
  });
});
