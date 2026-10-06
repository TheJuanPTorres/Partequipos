import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cuantasFilas } from "./avisos";

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
