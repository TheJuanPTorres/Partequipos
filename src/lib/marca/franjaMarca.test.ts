import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { contraste, luminancia, rgbDeHex } from "../portada/contraste";

import { COLOR_SIN_MARCA } from "./colorMarca";
import {
  coloresFranja,
  CONTRASTE_TEXTO,
  MEJORAS_FRANJA,
  oscurecer,
  textoModelos,
} from "./franjaMarca";

const luz = (hex: string) => {
  const [r, g, b] = rgbDeHex(hex)!;
  return luminancia(r, g, b);
};
const con = (a: string, b: string) => contraste(luz(a), luz(b));

describe("MEJORAS_FRANJA", () => {
  it("D1–D5, encendidas", () => {
    assert.deepEqual(Object.keys(MEJORAS_FRANJA), ["D1", "D2", "D3", "D4", "D5"]);
  });
});

describe("oscurecer", () => {
  it("mezcla con negro", () => {
    assert.equal(oscurecer("#ff8000", 0), "#ff8000");
    assert.equal(oscurecer("#ff8000", 0.5), "#804000");
    assert.equal(oscurecer("#ffffff", 1), "#000000");
  });
});

describe("coloresFranja", () => {
  it("la tinta de la barra de marcas: blanco en Yanmar y Dynapac, negro en Case y Hitachi", () => {
    assert.equal(coloresFranja("#ed1c24").tinta, "#ffffff");
    assert.equal(coloresFranja("#bf2e1a").tinta, "#ffffff");
    assert.equal(coloresFranja("#f2a900").tinta, "#000000");
    assert.equal(coloresFranja("#fc661c").tinta, "#000000");
  });

  it("sin color, el naranja de la barra de series", () => {
    assert.deepEqual(coloresFranja(null), coloresFranja(COLOR_SIN_MARCA));
    assert.deepEqual(coloresFranja("no-es-color"), coloresFranja(COLOR_SIN_MARCA));
  });

  it("el color de la marca tal cual si ya da AA; si no, lo justo más oscuro (Yanmar)", () => {
    assert.equal(coloresFranja("#bf2e1a").inicio, "#bf2e1a");
    assert.equal(coloresFranja("#f2a900").inicio, "#f2a900");
    const yanmar = coloresFranja("#ed1c24");
    assert.notEqual(yanmar.inicio, "#ed1c24");
    assert.ok(con(yanmar.inicio, "#ffffff") >= CONTRASTE_TEXTO);
  });

  it("el fin es más oscuro que el inicio", () => {
    for (const c of ["#ed1c24", "#bf2e1a", "#f2a900", "#fc661c"]) {
      const { inicio, fin } = coloresFranja(c);
      assert.ok(luz(fin) < luz(inicio), c);
    }
  });

  it("AA del texto pequeño en los dos extremos del degradado, con cualquier color", () => {
    for (let r = 0; r <= 255; r += 51)
      for (let g = 0; g <= 255; g += 51)
        for (let b = 0; b <= 255; b += 51) {
          const c = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
          const { inicio, fin, tinta } = coloresFranja(c);
          assert.ok(con(tinta, inicio) >= CONTRASTE_TEXTO, `${c} inicio`);
          assert.ok(con(tinta, fin) >= CONTRASTE_TEXTO, `${c} fin`);
        }
  });
});

describe("textoModelos", () => {
  it("singular y plural", () => {
    assert.equal(textoModelos(1), "1 modelo");
    assert.equal(textoModelos(3), "3 modelos");
  });
});
