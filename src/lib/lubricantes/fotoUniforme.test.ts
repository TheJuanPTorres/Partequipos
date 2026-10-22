import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cajaDelContenido, encajeEnLienzo } from "./fotoUniforme";

/** Imagen RGBA de `ancho` × `alto` con fondo `fondo` y un rectángulo negro en `caja`. */
function imagen(
  ancho: number,
  alto: number,
  fondo: [number, number, number, number],
  caja?: { x: number; y: number; ancho: number; alto: number },
): Uint8Array {
  const d = new Uint8Array(ancho * alto * 4);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const dentro =
        caja && x >= caja.x && x < caja.x + caja.ancho && y >= caja.y && y < caja.y + caja.alto;
      d.set(dentro ? [20, 20, 20, 255] : fondo, (y * ancho + x) * 4);
    }
  }
  return d;
}

describe("cajaDelContenido", () => {
  it("ignora el fondo transparente", () => {
    const caja = { x: 3, y: 2, ancho: 4, alto: 6 };
    assert.deepEqual(cajaDelContenido(imagen(10, 10, [255, 255, 255, 0], caja), 10, 10, 4), caja);
  });

  it("ignora el fondo blanco opaco", () => {
    const caja = { x: 1, y: 0, ancho: 2, alto: 10 };
    assert.deepEqual(cajaDelContenido(imagen(10, 10, [255, 255, 255, 255], caja), 10, 10, 4), caja);
  });

  it("cuenta un fondo de color como contenido (no lo recorta)", () => {
    assert.deepEqual(cajaDelContenido(imagen(5, 5, [200, 0, 0, 255]), 5, 5, 4), {
      x: 0,
      y: 0,
      ancho: 5,
      alto: 5,
    });
  });

  it("devuelve null si todo es fondo", () => {
    assert.equal(cajaDelContenido(imagen(4, 4, [255, 255, 255, 0]), 4, 4, 4), null);
  });
});

describe("encajeEnLienzo", () => {
  it("una botella vertical ocupa la fracción del alto y queda centrada", () => {
    assert.deepEqual(encajeEnLienzo({ ancho: 1087, alto: 1972 }, 800, 0.86), {
      x: 211,
      y: 56,
      ancho: 379,
      alto: 688,
    });
  });

  it("dos botellas con márgenes distintos acaban del MISMO alto", () => {
    const a = encajeEnLienzo({ ancho: 478, alto: 867 });
    const b = encajeEnLienzo({ ancho: 1087, alto: 1972 });
    assert.equal(a.alto, b.alto);
  });

  it("una garrafa más ancha que alta ocupa la fracción del ancho", () => {
    const e = encajeEnLienzo({ ancho: 1845, alto: 1718 }, 800, 0.86);
    assert.equal(e.ancho, 688);
    assert.ok(e.alto < 688);
    assert.equal(e.x, 56);
  });
});
