import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { contraste, luminancia, rgbDeHex } from "../portada/contraste";

import { colorDeMarca, estiloDeMarca, logoBlancoSobre, tintaSobre } from "./colorMarca";

const luz = (hex: string) => {
  const [r, g, b] = rgbDeHex(hex)!;
  return luminancia(r, g, b);
};

describe("colorDeMarca", () => {
  it("normaliza a #rrggbb en minúscula y rechaza lo que no es un color", () => {
    assert.equal(colorDeMarca(" #FFCD00 "), "#ffcd00");
    assert.equal(colorDeMarca("#fc0"), "#ffcc00");
    for (const malo of ["", "  ", null, undefined, "amarillo", "#12", "#12345g", "ffcd00"]) {
      assert.equal(colorDeMarca(malo), null, String(malo));
    }
  });
});

describe("tintaSobre", () => {
  it("negro sobre los claros y blanco sobre los oscuros", () => {
    assert.equal(tintaSobre("#ffcd00"), "#000000"); // Caterpillar
    assert.equal(tintaSobre("#fc661c"), "#000000"); // Hitachi
    assert.equal(tintaSobre("#283d99"), "#ffffff"); // Komatsu
    assert.equal(tintaSobre("#003057"), "#ffffff"); // Volvo
    assert.equal(tintaSobre("#ffffff"), "#000000");
    assert.equal(tintaSobre("#000000"), "#ffffff");
  });

  it("garantiza el AA (4,5:1) con cualquier color de fondo", () => {
    // Barrido del cubo RGB cada 17 (4.096 colores), con el peor caso incluido (gris medio).
    const peores: number[] = [];
    for (let r = 0; r < 256; r += 17)
      for (let g = 0; g < 256; g += 17)
        for (let b = 0; b < 256; b += 17) {
          const fondo = `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
          peores.push(contraste(luz(fondo), luz(tintaSobre(fondo))));
        }
    assert.ok(Math.min(...peores) >= 4.5, `mínimo ${Math.min(...peores)}`);
    assert.ok(contraste(luz("#767676"), luz(tintaSobre("#767676"))) >= 4.5);
  });
});

describe("estiloDeMarca", () => {
  it("sin color válido, ninguna variable (manda el CSS de siempre)", () => {
    assert.equal(estiloDeMarca(null), undefined);
    assert.equal(estiloDeMarca("rojo"), undefined);
  });

  it("con color: la franja, la tinta y el aspecto al pasar el ratón (nunca el color sobre sí mismo)", () => {
    const e = estiloDeMarca("#FFCD00") as Record<string, string>;
    assert.equal(e["--marca-amarillo"], "#ffcd00");
    assert.equal(e["--marca-tinta"], "#000000");
    assert.equal(e["--marca-hover-fondo"], "#000000");
    assert.equal(e["--marca-hover-texto"], "#ffffff");
    const oscuro = estiloDeMarca("#283d99") as Record<string, string>;
    assert.equal(oscuro["--marca-hover-fondo"], "#ffffff");
    assert.equal(oscuro["--marca-hover-texto"], "#000000");
  });
});

describe("logoBlancoSobre", () => {
  it("blanco sobre un color oscuro, negro sobre uno claro o sin color (el amarillo de siempre)", () => {
    assert.equal(logoBlancoSobre("#0b4ea2"), true);
    assert.equal(logoBlancoSobre("#ffd100"), false);
    assert.equal(logoBlancoSobre("#04aca3"), false);
    assert.equal(logoBlancoSobre(null), false);
    assert.equal(logoBlancoSobre("no-es-un-color"), false);
  });
});
