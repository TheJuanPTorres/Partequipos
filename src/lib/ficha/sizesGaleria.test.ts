import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encajeDeFoto, sizesDeFoto, teclaGaleria } from "./sizesGaleria";

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
  it("una 4:3 o una 16:9 entera (llena el ancho), el sizes tal cual", () => {
    assert.equal(sizesDeFoto(SIZES, foto(1600, 1200)), SIZES);
    assert.equal(sizesDeFoto(SIZES, foto(1920, 1080)), SIZES);
  });

  it("una vertical entera pide solo su parte de la caja en tablet y móvil", () => {
    assert.equal(
      sizesDeFoto(SIZES, foto(1536, 2048)),
      "(min-width: 1025px) max(810px, 50.625vw), (min-width: 768px) calc(88vw * 0.563), calc(85vw * 0.563)",
    );
  });

  it("una 3:2 pide lo que sobresale en tablet y móvil, no en escritorio", () => {
    assert.equal(
      sizesDeFoto(SIZES, foto(1500, 1000)),
      "(min-width: 1025px) max(810px, 50.625vw), (min-width: 768px) calc(88vw * 1.125), calc(85vw * 1.125)",
    );
  });
});

describe("teclaGaleria (flechas de la galería)", () => {
  it("←/→ dan la vuelta; Inicio y Fin, la primera y la última", () => {
    assert.equal(teclaGaleria("ArrowRight", 0, 5), 1);
    assert.equal(teclaGaleria("ArrowRight", 4, 5), 0);
    assert.equal(teclaGaleria("ArrowLeft", 0, 5), 4);
    assert.equal(teclaGaleria("Home", 3, 5), 0);
    assert.equal(teclaGaleria("End", 1, 5), 4);
  });

  it("con una foto, con modificador u otra tecla, nada", () => {
    assert.equal(teclaGaleria("ArrowRight", 0, 1), null);
    assert.equal(teclaGaleria("ArrowRight", 0, 5, true), null);
    assert.equal(teclaGaleria("Tab", 0, 5), null);
    assert.equal(teclaGaleria("ArrowDown", 0, 5), null);
  });
});
