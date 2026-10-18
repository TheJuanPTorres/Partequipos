import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cambiaElMenuPorEquipo, tiposConEquipos } from "./tiposConEquipos";

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

describe("cambiaElMenuPorEquipo", () => {
  it("crear: solo si el tipo se queda con un equipo (acaba de aparecer)", () => {
    assert.equal(cambiaElMenuPorEquipo({ operacion: "create", tipo: 5, equiposDelTipo: 1 }), true);
    assert.equal(cambiaElMenuPorEquipo({ operacion: "create", tipo: 5, equiposDelTipo: 4 }), false);
  });

  it("borrar: solo si el tipo se queda sin equipos (acaba de desaparecer)", () => {
    assert.equal(cambiaElMenuPorEquipo({ operacion: "delete", tipo: 5, equiposDelTipo: 0 }), true);
    assert.equal(cambiaElMenuPorEquipo({ operacion: "delete", tipo: 5, equiposDelTipo: 2 }), false);
  });

  it("editar: solo si cambia de tipo", () => {
    const base = { operacion: "update" as const, equiposDelTipo: 3 };
    assert.equal(cambiaElMenuPorEquipo({ ...base, tipo: 5, tipoAnterior: 5 }), false);
    assert.equal(cambiaElMenuPorEquipo({ ...base, tipo: 6, tipoAnterior: 5 }), true);
  });
});
