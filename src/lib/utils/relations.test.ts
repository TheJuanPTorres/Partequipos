import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { imagenDeMedia, posicionFocal } from "./relations";

describe("punto focal a object-position", () => {
  it("usa los porcentajes del panel", () => {
    assert.equal(posicionFocal(30, 70), "30% 70%");
  });

  it("sin punto focal, el centro", () => {
    assert.equal(posicionFocal(null, undefined), "50% 50%");
  });

  it("recorta a 0–100 y descarta lo que no es número", () => {
    assert.equal(posicionFocal(-10, 140), "0% 100%");
    assert.equal(posicionFocal("30", Number.NaN), "50% 50%");
  });

  it("imagenDeMedia la incluye", () => {
    const img = imagenDeMedia(
      {
        id: 1,
        alt: "x",
        url: "https://a/b.png",
        width: 10,
        height: 10,
        focalX: 20,
        focalY: 80,
      } as never,
      "defecto",
    );
    assert.equal(img?.posicion, "20% 80%");
  });
});
