import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { comprobarPadre, esAnidado, segmentoDeTipo } from "./anidado";

const padre = { id: 2, nombre: "Cargador frontal", marca: 1, tipoPadre: null };
const base = {
  idTipo: 9,
  slugTipo: "excavadora-case",
  marcaTipo: 1,
  padre,
  marcaPadre: 1,
  slugsDeModelosDelPadre: ["580", "621"],
  tieneHijos: false,
};

describe("tipo anidado", () => {
  it("el segmento lleva el slug del padre delante solo si cuelga de otro", () => {
    assert.equal(segmentoDeTipo({ slug: "excavadora" }), "excavadora");
    assert.equal(segmentoDeTipo({ slug: "excavadora", slugPadre: " " }), "excavadora");
    assert.equal(
      segmentoDeTipo({ slug: "excavadora", slugPadre: "cargador" }),
      "cargador/excavadora",
    );
    assert.equal(esAnidado({ slugPadre: "cargador" }), true);
    assert.equal(esAnidado({ slugPadre: null }), false);
  });

  it("un padre válido no da error", () => {
    assert.equal(comprobarPadre(base), null);
  });

  it("rechaza: él mismo, otra marca, dos niveles, con hijos y la misma URL que un modelo del padre", () => {
    assert.match(String(comprobarPadre({ ...base, idTipo: 2 })), /sí mismo/);
    assert.match(String(comprobarPadre({ ...base, marcaPadre: 3 })), /otra marca/);
    assert.match(
      String(comprobarPadre({ ...base, padre: { ...padre, tipoPadre: 5 } })),
      /un nivel/,
    );
    assert.match(String(comprobarPadre({ ...base, tieneHijos: true })), /cuelgan otros/);
    assert.match(
      String(comprobarPadre({ ...base, slugsDeModelosDelPadre: ["excavadora-case"] })),
      /misma dirección web/,
    );
  });
});
