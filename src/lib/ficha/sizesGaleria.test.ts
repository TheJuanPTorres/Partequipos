import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sizesDeFoto } from "./sizesGaleria";

const foto = (width: number, height: number) => ({ url: "/x.jpg", alt: "x", width, height });
const SIZES = "(min-width: 1025px) max(810px, 50.625vw), (min-width: 768px) 88vw, 85vw";

describe("sizesDeFoto (galería de la ficha en móvil)", () => {
  it("con alto en móvil, pide el ancho que pinta `cover`", () => {
    assert.equal(
      sizesDeFoto(SIZES, 400, foto(1880, 1000)),
      "(min-width: 1025px) max(810px, 50.625vw), (min-width: 768px) 88vw, max(85vw, 752px)",
    );
  });

  it("sin alto o sin medidas, el sizes tal cual", () => {
    assert.equal(sizesDeFoto(SIZES, undefined, foto(1880, 1000)), SIZES);
    assert.equal(sizesDeFoto(SIZES, 400, foto(0, 0)), SIZES);
  });
});
