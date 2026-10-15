import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { tiposConEquipos } from "./tiposConEquipos";

describe("tipos de maquinaria nueva con equipos (D4)", () => {
  it("reúne los tipos con la relación como id o poblada", () => {
    const ids = tiposConEquipos([{ tipo: 3 }, { tipo: { id: 9 } }, { tipo: 3 }]);
    assert.deepEqual([...ids].sort(), [3, 9]);
  });

  it("un tipo sin ningún equipo no está; una relación vacía no cuenta", () => {
    const ids = tiposConEquipos([{ tipo: 3 }, { tipo: null }, { tipo: undefined }]);
    assert.equal(ids.has(7), false);
    assert.equal(ids.size, 1);
  });

  it("sin equipos, ningún tipo es indexable", () => {
    assert.equal(tiposConEquipos([]).size, 0);
  });
});
