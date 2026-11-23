import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { anchoPalabraMasLarga, necesitaGuion } from "./palabraLarga";

describe("anchoPalabraMasLarga", () => {
  it("mide la palabra más larga, no la frase", () => {
    const frase = anchoPalabraMasLarga("RODILLO VIBROCOMPACTADOR PARA MINICARGADORES");
    assert.equal(frase, anchoPalabraMasLarga("VIBROCOMPACTADOR"));
  });

  it("las mayúsculas miden más que las minúsculas", () => {
    assert.ok(anchoPalabraMasLarga("EXCAVADORA") > anchoPalabraMasLarga("excavadora"));
    assert.equal(
      anchoPalabraMasLarga("excavadora", { mayusculas: true }),
      anchoPalabraMasLarga("EXCAVADORA"),
    );
  });

  it("el caso que motivó la tarea no cabe a 9vw en 390 (35 px en unos 350 px de ancho)", () => {
    assert.ok(anchoPalabraMasLarga("VIBROCOMPACTADOR") * 35 > 350);
  });

  it("un título corto cabe a su tamaño (no cambia)", () => {
    assert.ok(anchoPalabraMasLarga("Excavadora Hitachi ZX200-3") * 35 < 350);
  });

  it("sin texto, 0", () => {
    assert.equal(anchoPalabraMasLarga("  "), 0);
  });
});

describe("necesitaGuion", () => {
  it("solo si ni al mínimo cabe", () => {
    assert.equal(necesitaGuion(anchoPalabraMasLarga("VIBROCOMPACTADOR"), "grande"), false);
    assert.equal(necesitaGuion(30, "grande"), true);
  });
});
