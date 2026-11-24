import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cuantasFilas, filaDeDiapositiva, pareceDePrueba, tieneSubida } from "./avisos";

describe("cuantasFilas", () => {
  it("cuenta listas y números de filas", () => {
    assert.equal(cuantasFilas([1, 2]), 2);
    assert.equal(cuantasFilas(3), 3);
  });

  it("vacío o desconocido cuenta 0 (y saca el aviso de «sin fotos»)", () => {
    for (const v of [[], 0, -1, null, undefined, "", {}, "3"]) {
      assert.equal(cuantasFilas(v), 0, JSON.stringify(v));
    }
  });
});

describe("filaDeDiapositiva", () => {
  it("saca el prefijo y la posición de un campo de una diapositiva", () => {
    assert.deepEqual(filaDeDiapositiva("hero.diapositivas.0.avisoRecorteMovil"), {
      prefijo: "hero.diapositivas.0",
      indice: 0,
    });
    assert.deepEqual(filaDeDiapositiva("hero.diapositivas.12.imagenFondo"), {
      prefijo: "hero.diapositivas.12",
      indice: 12,
    });
  });

  it("null si la ruta no es de una diapositiva", () => {
    for (const r of ["hero.diapositivas", "titulo", "bloques.0.imagen", "hero.diapositivas.x.a"]) {
      assert.equal(filaDeDiapositiva(r), null, r);
    }
  });
});

describe("tieneSubida", () => {
  it("un id o un documento poblado cuentan como subida", () => {
    for (const v of [7, "7", { id: 7, url: "/x.jpg" }]) assert.equal(tieneSubida(v), true);
  });

  it("vacío no cuenta (y saca el aviso de «sin recorte móvil»)", () => {
    for (const v of [null, undefined, "", " ", 0]) assert.equal(tieneSubida(v), false, String(v));
  });
});

describe("pareceDePrueba", () => {
  it("avisa con «test» o «prueba» al principio, en cualquier mayúscula", () => {
    for (const n of ["Test segunda pasada", "TEST", "  prueba 3", "Pruebas del panel", "test-1"])
      assert.equal(pareceDePrueba(n), true, n);
  });
  it("no avisa con nombres reales ni con la palabra en medio", () => {
    for (const n of ["Testimonio", "Excavadora de prueba", "Probador", "", null, 3])
      assert.equal(pareceDePrueba(n), false, String(n));
  });
});
