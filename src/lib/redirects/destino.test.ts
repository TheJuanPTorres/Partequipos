import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clasificarDestino } from "./destino";

/**
 * El caso que de verdad importa es `sin-ruta`: un destino que no encaja en
 * ninguna ruta construida acabará en 404, y un 301 hacia un 404 es peor que el
 * 404 original.
 */

const R = "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas";
const M = "/maquinaria-pesada/maquinaria-pesada-nueva/marcas";

describe("clasificarDestino — rutas estáticas", () => {
  for (const ruta of [
    "/",
    "/repuestos-maquinaria-pesada-colombia/",
    R + "/",
    "/maquinaria-pesada/",
    "/maquinaria-pesada/maquinaria-pesada-nueva/",
    M + "/",
    "/maquinaria-pesada/maquinaria-pesada-usada/",
    "/noticias/",
  ]) {
    it(`reconoce ${ruta}`, () => {
      assert.equal(clasificarDestino(ruta).clase, "estatica");
    });
  }

  it("es indiferente a la barra final", () => {
    assert.deepEqual(clasificarDestino("/noticias"), clasificarDestino("/noticias/"));
  });
});

describe("clasificarDestino — repuestos", () => {
  it("marca", () => {
    const d = clasificarDestino(`${R}/hitachi/`);
    assert.deepEqual(d, {
      clase: "dinamica",
      colecciones: ["marcas"],
      slug: "hitachi",
      padres: [],
    });
  });

  it("tipo, con su marca como padre", () => {
    const d = clasificarDestino(`${R}/hitachi/excavadoras/`);
    assert.ok(d.clase === "dinamica");
    assert.deepEqual(d.colecciones, ["tipos-equipo"]);
    assert.deepEqual(d.padres, ["hitachi"]);
  });

  it("modelo, con marca y tipo como padres", () => {
    const d = clasificarDestino(`${R}/hitachi/excavadoras/zx350/`);
    assert.ok(d.clase === "dinamica");
    assert.deepEqual(d.colecciones, ["modelos-repuesto"]);
    assert.deepEqual(d.padres, ["hitachi", "excavadoras"]);
  });

  it("rechaza un nivel de más", () => {
    assert.equal(clasificarDestino(`${R}/a/b/c/d/`).clase, "sin-ruta");
  });
});

describe("clasificarDestino — maquinaria", () => {
  it("equipo nuevo", () => {
    const d = clasificarDestino(`${M}/hitachi/excavadoras-hitachi/zx350lc/`);
    assert.ok(d.clase === "dinamica");
    assert.deepEqual(d.colecciones, ["equipos-nuevos"]);
    assert.deepEqual(d.padres, ["hitachi", "excavadoras-hitachi"]);
  });

  it("categoría transversal suelta de la línea nueva", () => {
    const d = clasificarDestino("/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras/");
    assert.ok(d.clase === "dinamica");
    assert.deepEqual(d.colecciones, ["categorias-maquinaria"]);
  });

  it("categoría de usada", () => {
    const d = clasificarDestino("/maquinaria-pesada/maquinaria-pesada-usada/bulldozer/");
    assert.ok(d.clase === "dinamica");
    assert.deepEqual(d.colecciones, ["categorias-usada"]);
  });

  it("rechaza una rama inventada de maquinaria", () => {
    assert.equal(clasificarDestino("/maquinaria-pesada/inventada/x/").clase, "sin-ruta");
  });
});

describe("clasificarDestino — lubricantes y blog", () => {
  it("marca de lubricante", () => {
    const d = clasificarDestino("/lubricantes/lubricantes-eni/");
    assert.ok(d.clase === "dinamica");
    assert.deepEqual(d.colecciones, ["marcas-lubricante"]);
  });

  it("categoría de lubricante, con su marca como padre", () => {
    const d = clasificarDestino("/lubricantes/lubricantes-eni/auto-pesado/");
    assert.ok(d.clase === "dinamica");
    assert.deepEqual(d.padres, ["lubricantes-eni"]);
  });

  it("`/lubricantes/` a secas NO es ruta: esa página no existe", () => {
    assert.equal(clasificarDestino("/lubricantes/").clase, "sin-ruta");
  });

  it("archivo de categoría del blog", () => {
    const d = clasificarDestino("/category/noticias/");
    assert.ok(d.clase === "dinamica");
    assert.deepEqual(d.colecciones, ["categorias-blog"]);
  });
});

describe("clasificarDestino — raíz", () => {
  it("un segmento puede ser página o artículo, en ese orden", () => {
    const d = clasificarDestino("/contactanos/");
    assert.ok(d.clase === "dinamica");
    assert.deepEqual(d.colecciones, ["paginas", "articulos"]);
    assert.equal(d.slug, "contactanos");
  });

  it("varios segmentos solo pueden ser una página anidada", () => {
    const d = clasificarDestino("/nosotros/trabaja-con-nosotros/");
    assert.ok(d.clase === "dinamica");
    assert.deepEqual(d.colecciones, ["paginas"]);
    assert.equal(d.slug, "nosotros/trabaja-con-nosotros");
  });

  it("conserva los slugs largos heredados del blog", () => {
    const largo = "variables-que-afectan-la-vida-util-del-tren-de-rodaje-en-excavadoras";
    const d = clasificarDestino(`/${largo}/`);
    assert.ok(d.clase === "dinamica");
    assert.equal(d.slug, largo);
  });
});

describe("clasificarDestino — casos límite", () => {
  it("una URL absoluta a otro dominio queda fuera de nuestro control", () => {
    const d = clasificarDestino("https://tienda.ejemplo.com/x");
    assert.deepEqual(d, { clase: "externa", url: "https://tienda.ejemplo.com/x" });
  });

  it("el destino vacío no es una ruta", () => {
    for (const v of ["", "   "]) assert.equal(clasificarDestino(v).clase, "sin-ruta");
  });

  it("ignora la cadena de consulta y el ancla", () => {
    const d = clasificarDestino("/contactanos/?utm_source=x#form");
    assert.ok(d.clase === "dinamica");
    assert.equal(d.slug, "contactanos");
  });
});
