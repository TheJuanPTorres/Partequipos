import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  coincideModelo,
  columnaEscritorio,
  columnaTablet,
  enOrdenNatural,
  normalizarBusqueda,
} from "./buscarModelo";
import { codigoInterruptorMejoras, MEJORAS, mejorasApagadasPorUrl } from "./mejoras";

describe("normalizarBusqueda y coincideModelo (R1)", () => {
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
    assert.deepEqual(mejorasApagadasPorUrl("r1, R3"), ["R2", "R4", "R5"]);
    assert.deepEqual(mejorasApagadasPorUrl(""), [...MEJORAS]);
  });

  it("el script en línea hace lo mismo que la función", () => {
    for (const busqueda of ["", "?mejoras=R1,R3", "?mejoras=no", "?x=1&mejoras=r5", "?mejoras="]) {
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

describe("colocación de los resultados (regla de las tarjetas, #281)", () => {
  const fila = (n: number, f: (i: number, n: number) => string | null) =>
    Array.from({ length: n }, (_, i) => f(i, n));
  it("escritorio: 1 y 2 al centro, 4 en 2 + 2, la última fila incompleta centrada", () => {
    assert.deepEqual(fila(1, columnaEscritorio), ["3 / span 2"]);
    assert.deepEqual(fila(2, columnaEscritorio), ["2 / span 2", null]);
    assert.deepEqual(fila(3, columnaEscritorio), [null, null, null]);
    assert.deepEqual(fila(4, columnaEscritorio), [
      "2 / span 2",
      "4 / span 2",
      "2 / span 2",
      "4 / span 2",
    ]);
    assert.deepEqual(fila(5, columnaEscritorio), [null, null, null, "2 / span 2", null]);
    assert.deepEqual(fila(7, columnaEscritorio).at(-1), "3 / span 2");
  });
  it("tablet: la última de un número impar, al centro", () => {
    assert.deepEqual(fila(3, columnaTablet), [null, null, "2 / span 2"]);
    assert.deepEqual(fila(4, columnaTablet), [null, null, null, null]);
  });
});
