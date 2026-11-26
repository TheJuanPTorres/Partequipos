import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encajeDeFoto, sizesDeFoto } from "./sizesGaleria";

const foto = (width: number, height: number) => ({ url: "/x.jpg", alt: "x", width, height });
const SIZES = "(min-width: 1025px) max(810px, 50.625vw), (min-width: 768px) 88vw, 85vw";

describe("encajeDeFoto (caja 4:3 de la galería)", () => {
  it("4:3 y 3:2 cubren la caja; cuadrada, 16:9 y vertical van enteras", () => {
    assert.equal(encajeDeFoto(foto(1600, 1200)), "cubrir");
    assert.equal(encajeDeFoto(foto(1500, 1000)), "cubrir");
    assert.equal(encajeDeFoto(foto(1000, 1000)), "entera");
    assert.equal(encajeDeFoto(foto(1920, 1080)), "entera");
    assert.equal(encajeDeFoto(foto(1536, 2048)), "entera");
  });

  it("sin medidas, cubre (como antes)", () => {
    assert.equal(encajeDeFoto(foto(0, 0)), "cubrir");
  });
});

describe("sizesDeFoto", () => {
  it("una 4:3 o una entera, el sizes tal cual", () => {
    assert.equal(sizesDeFoto(SIZES, foto(1600, 1200)), SIZES);
    assert.equal(sizesDeFoto(SIZES, foto(1536, 2048)), SIZES);
  });

  it("una 3:2 pide lo que sobresale en tablet y móvil, no en escritorio", () => {
    assert.equal(
      sizesDeFoto(SIZES, foto(1500, 1000)),
      "(min-width: 1025px) max(810px, 50.625vw), (min-width: 768px) calc(88vw * 1.125), calc(85vw * 1.125)",
    );
  });
});
