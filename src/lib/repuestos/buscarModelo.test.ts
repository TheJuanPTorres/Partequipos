import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { coincideModelo, enOrdenNatural, normalizarBusqueda } from "./buscarModelo";
import { codigoInterruptorMejoras, MEJORAS, mejorasApagadasPorUrl } from "./mejoras";

describe("normalizarBusqueda y coincideModelo (R5)", () => {
  it("ignora mayúsculas, tildes, guiones y espacios", () => {
    assert.equal(normalizarBusqueda(" ZX-200 lc é"), "zx200lce");
    const clave = normalizarBusqueda("ZX200-3 Excavadora");
    for (const q of ["zx200", "ZX 200", "zx-2", "200-3", "excavadora"]) {
      assert.ok(coincideModelo(clave, q), q);
    }
    assert.ok(!coincideModelo(clave, "zx210"));
  });

  it("una consulta vacía (o solo signos) encuentra todos", () => {
    assert.ok(coincideModelo("ex100", ""));
    assert.ok(coincideModelo("ex100", " - "));
  });
});

describe("enOrdenNatural (R5)", () => {
  it("ordena los números por su valor, no como texto", () => {
    const n = (nombre: string) => ({ nombre });
    const orden = enOrdenNatural([n("EX1200"), n("EX200"), n("ex120"), n("EX100")]).map(
      (m) => m.nombre,
    );
    assert.deepEqual(orden, ["EX100", "ex120", "EX200", "EX1200"]);
  });

  it("no cambia la lista original", () => {
    const lista = [{ nombre: "B" }, { nombre: "A" }];
    enOrdenNatural(lista);
    assert.equal(lista[0]?.nombre, "B");
  });
});

describe("interruptores por URL", () => {
  it("sin parámetro, ninguna apagada; «no», todas; una lista, el resto", () => {
    assert.deepEqual(mejorasApagadasPorUrl(null), []);
    assert.deepEqual(mejorasApagadasPorUrl("no"), [...MEJORAS]);
    assert.deepEqual(mejorasApagadasPorUrl("r2, R5"), ["R4"]);
    assert.deepEqual(mejorasApagadasPorUrl(""), [...MEJORAS]);
  });

  it("el script en línea hace lo mismo que la función", () => {
    for (const busqueda of ["", "?mejoras=R2,R4", "?mejoras=no", "?x=1&mejoras=r5", "?mejoras="]) {
      const atributos: Record<string, string> = {};
      const documento = {
        documentElement: { setAttribute: (k: string, v: string) => (atributos[k] = v) },
      };
      new Function("document", "location", codigoInterruptorMejoras())(documento, {
        search: busqueda,
      });
      const valor = new URLSearchParams(busqueda).get("mejoras");
      const esperado = valor === null ? undefined : mejorasApagadasPorUrl(valor).join(" ");
      assert.equal(atributos["data-mejoras-apagadas"], esperado, busqueda);
    }
  });
});
