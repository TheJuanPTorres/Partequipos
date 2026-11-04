import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sizesDeLogo } from "./sizesLogo";

describe("sizesDeLogo", () => {
  it("usa el ancho pintado (alto × proporción), con el tope de la caja", () => {
    assert.equal(
      sizesDeLogo({ width: 200, height: 100 }),
      "(min-width: 1025px) min(max(192px, calc(17.4vw - 40px)), max(88px, 6.8vw)), 88px",
    );
  });
  it("la banda espejo tiene su propio tope", () => {
    assert.match(sizesDeLogo({ width: 400, height: 100 }, true), /min\(max\(152px, 10\.8vw\)/);
  });
  it("en un logo muy apaisado manda el ancho de la caja", () => {
    assert.match(sizesDeLogo({ width: 1000, height: 100 }), /, 176px$/);
  });
  it("con medidas inválidas no rompe", () => {
    assert.match(sizesDeLogo({ width: 0, height: 0 }), /max\(44px, 3\.4vw\)\), 44px$/);
  });
});
