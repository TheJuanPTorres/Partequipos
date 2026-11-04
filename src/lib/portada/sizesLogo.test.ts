import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sizesDeLogo } from "./sizesLogo";

describe("sizesDeLogo", () => {
  it("usa el ancho pintado (alto × proporción), no el de la caja", () => {
    assert.equal(sizesDeLogo({ width: 200, height: 100 }), "(min-width: 1025px) 128px, 88px");
  });
  it("no pasa del ancho de la caja en un logo muy apaisado", () => {
    assert.equal(sizesDeLogo({ width: 1000, height: 100 }), "(min-width: 1025px) 232px, 176px");
  });
  it("con medidas inválidas no rompe", () => {
    assert.equal(sizesDeLogo({ width: 0, height: 0 }), "(min-width: 1025px) 64px, 44px");
  });
});
