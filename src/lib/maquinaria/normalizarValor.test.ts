import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizarValor } from "./normalizarValor";

const n = (t: string) => normalizarValor(t);

describe("normalizarValor", () => {
  it("separa el número de la unidad con un espacio", () => {
    assert.equal(n("8,65m")?.despues, "8,65 m");
    assert.equal(n("168HP")?.despues, "168 hp");
    assert.equal(n("7290mm")?.despues, "7290 mm");
    assert.equal(n("2,71m³")?.despues, "2,71 m³");
    assert.equal(n("0.46 m3")?.despues, "0,46 m³");
  });

  it("el punto decimal pasa a coma y los ceros finales se quitan", () => {
    assert.equal(n("9.75m")?.despues, "9,75 m");
    assert.equal(n("34.1 kW")?.despues, "34,1 kW");
    assert.equal(n("6,0m")?.despues, "6 m");
  });

  it("miles con coma en kg: punto de miles, sin dudas", () => {
    const r = n("5,800kg");
    assert.equal(r?.despues, "5.800 kg");
    assert.equal(r?.dudoso, false);
  });

  it("cifras de más: se propone y se marca como dudoso", () => {
    const r = n("20,4000kg");
    assert.equal(r?.despues, "20.400 kg");
    assert.equal(r?.dudoso, true);
  });

  it("las toneladas escritas en palabra pasan a «t» y se marcan", () => {
    const r = n(": 2,6 Ton");
    assert.equal(r?.despues, "2,6 t");
    assert.equal(r?.dudoso, true);
    assert.equal(n("5.25 Toneladas")?.despues, "5,25 t");
  });

  it("lo que ya está bien o no se entiende no se toca", () => {
    assert.equal(n("8,65 m"), null);
    assert.equal(n("7.366 kg (16.239 lb)"), null);
    assert.equal(n("24/30/36 in (según requerimiento cliente)"), null);
    assert.equal(n("Tier 3"), null);
    assert.equal(n("1.234,5 kg"), null);
    assert.equal(n("12 parsecs"), null);
  });
});
