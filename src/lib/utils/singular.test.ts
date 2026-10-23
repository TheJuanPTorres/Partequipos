import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { singularAproximado } from "./singular";

describe("singularAproximado", () => {
  it("el plural y el singular de cada nombre dan lo mismo", () => {
    const pares = [
      ["Excavadoras", "Excavadora"],
      ["Bulldozers", "Bulldozer"],
      ["Cargadores Frontales", "Cargador Frontal"],
      ["Motoniveladoras", "Motoniveladora"],
      ["Minicargadores", "Minicargador"],
      ["Vibrocompactadores", "Vibrocompactador"],
      ["Compactadores de Doble Rodillo", "Compactador de Doble Rodillo"],
      ["Reglas Vibratorias", "Regla Vibratoria"],
      ["Aditamentos para excavadoras", "Aditamentos para Excavadora"],
    ];
    for (const [plural, singular] of pares) {
      assert.equal(singularAproximado(plural!), singularAproximado(singular!), plural);
    }
  });

  it("minúsculas, sin tildes y sin espacios de más", () => {
    assert.equal(singularAproximado("  Cargadores   Frontales "), "cargador frontal");
    assert.equal(singularAproximado("Grúas"), "grua");
  });
});
