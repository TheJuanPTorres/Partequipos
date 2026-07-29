import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { aRutaCanonica, cadenasAAplanar, creaBucle, normalizarRuta } from "./normalizar";

describe("aRutaCanonica", () => {
  it("emite con barra final, que es la forma que sirve el sitio", () => {
    assert.equal(aRutaCanonica("/a/b"), "/a/b/");
    assert.equal(aRutaCanonica("/a/b/"), "/a/b/");
    assert.equal(aRutaCanonica("a/b"), "/a/b/");
  });

  it("no añade barra a la raíz duplicándola", () => {
    assert.equal(aRutaCanonica("/"), "/");
    assert.equal(aRutaCanonica(""), "/");
  });

  it("no añade barra a archivos con extensión", () => {
    assert.equal(aRutaCanonica("/sitemap.xml"), "/sitemap.xml");
    assert.equal(aRutaCanonica("/robots.txt"), "/robots.txt");
  });

  it("coincide con normalizarRuta al comparar, pero difiere al emitir", () => {
    // Misma clave de emparejamiento, distinta forma de emisión: es el punto
    // exacto donde antes se colaba un 308 detrás del 301.
    assert.equal(normalizarRuta("/a/b/"), normalizarRuta("/a/b"));
    assert.notEqual(aRutaCanonica("/a/b"), normalizarRuta("/a/b"));
  });
});

describe("normalizarRuta", () => {
  it("añade la barra inicial", () => {
    assert.equal(normalizarRuta("a/b"), "/a/b");
  });

  it("quita la barra final salvo en la raíz", () => {
    assert.equal(normalizarRuta("/a/b/"), "/a/b");
    assert.equal(normalizarRuta("/"), "/");
  });

  it("descarta query y fragmento", () => {
    assert.equal(normalizarRuta("/a/b?utm=x"), "/a/b");
    assert.equal(normalizarRuta("/a/b#seccion"), "/a/b");
  });

  it("colapsa barras repetidas", () => {
    assert.equal(normalizarRuta("//a///b"), "/a/b");
  });

  it("trata como iguales las variantes de la misma ruta", () => {
    const esperado = "/a/b";
    for (const variante of ["/a/b", "a/b", "/a/b/", "/a/b?x=1", "//a//b/"]) {
      assert.equal(normalizarRuta(variante), esperado);
    }
  });
});

describe("creaBucle", () => {
  it("rechaza A → A", () => {
    assert.equal(creaBucle({ desde: "/a", hacia: "/a" }, []), true);
  });

  it("rechaza A → A aunque difieran en barras", () => {
    assert.equal(creaBucle({ desde: "/a/", hacia: "a" }, []), true);
  });

  it("detecta el bucle de dos saltos (existe B → A, se crea A → B)", () => {
    const existentes = [{ desde: "/b", hacia: "/a" }];
    assert.equal(creaBucle({ desde: "/a", hacia: "/b" }, existentes), true);
  });

  it("detecta ciclos más largos (A→B, B→C, y se crea C→A)", () => {
    const existentes = [
      { desde: "/a", hacia: "/b" },
      { desde: "/b", hacia: "/c" },
    ];
    assert.equal(creaBucle({ desde: "/c", hacia: "/a" }, existentes), true);
  });

  it("acepta una redirección normal", () => {
    const existentes = [{ desde: "/a", hacia: "/b" }];
    assert.equal(creaBucle({ desde: "/c", hacia: "/d" }, existentes), false);
  });

  it("acepta varias rutas apuntando al mismo destino", () => {
    const existentes = [{ desde: "/a", hacia: "/z" }];
    assert.equal(creaBucle({ desde: "/b", hacia: "/z" }, existentes), false);
  });
});

describe("cadenasAAplanar", () => {
  it("detecta A → B cuando se crea B → C", () => {
    const existentes = [{ desde: "/a", hacia: "/b" }];
    const aplanar = cadenasAAplanar({ desde: "/b", hacia: "/c" }, existentes);

    assert.equal(aplanar.length, 1);
    assert.equal(aplanar[0]?.desde, "/a");
  });

  it("aplana varias entradas que apuntaban al mismo origen", () => {
    const existentes = [
      { desde: "/a1", hacia: "/b" },
      { desde: "/a2", hacia: "/b" },
      { desde: "/otro", hacia: "/z" },
    ];
    const aplanar = cadenasAAplanar({ desde: "/b", hacia: "/c" }, existentes);

    assert.deepEqual(
      aplanar.map((r) => r.desde),
      ["/a1", "/a2"],
    );
  });

  it("no devuelve nada si no hay cadena", () => {
    const existentes = [{ desde: "/a", hacia: "/z" }];
    assert.deepEqual(cadenasAAplanar({ desde: "/b", hacia: "/c" }, existentes), []);
  });

  it("no aplana el propio destino (evita crear C → C)", () => {
    const existentes = [{ desde: "/c", hacia: "/b" }];
    const aplanar = cadenasAAplanar({ desde: "/b", hacia: "/c" }, existentes);
    assert.deepEqual(aplanar, []);
  });
});
