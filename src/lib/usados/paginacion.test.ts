import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { numeroDePagina, paginasVisibles, POR_PAGINA, totalPaginas } from "./paginacion";

describe("totalPaginas", () => {
  it("redondea hacia arriba y nunca baja de 1", () => {
    assert.equal(totalPaginas(0), 1);
    assert.equal(totalPaginas(POR_PAGINA), 1);
    assert.equal(totalPaginas(POR_PAGINA + 1), 2);
    assert.equal(totalPaginas(113, 24), 5);
    assert.equal(totalPaginas(500, 24), 21);
  });
});

describe("numeroDePagina", () => {
  it("acepta solo enteros positivos sin adornos", () => {
    assert.equal(numeroDePagina("2"), 2);
    assert.equal(numeroDePagina("21"), 21);
    for (const malo of ["0", "02", "-1", "+2", "2.0", "dos", "", "2 ", "99999"]) {
      assert.equal(numeroDePagina(malo), null, malo);
    }
  });
});

describe("paginasVisibles", () => {
  it("primera, última y vecinas, con «…» en los saltos", () => {
    assert.deepEqual(paginasVisibles(1, 1), [1]);
    assert.deepEqual(paginasVisibles(1, 5), [1, 2, "…", 5]);
    assert.deepEqual(paginasVisibles(3, 5), [1, 2, 3, 4, 5]);
    assert.deepEqual(paginasVisibles(10, 21), [1, "…", 9, 10, 11, "…", 21]);
    assert.deepEqual(paginasVisibles(21, 21), [1, "…", 20, 21]);
  });
});
