import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CAJA_GRANDE, colocarLogo, SIN_RECORTE } from "./tamanoOptico";

const cerca = (a: number, b: number, tol: number) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} no está cerca de ${b}`);
const area = (c: ReturnType<typeof colocarLogo>) => c.visible.ancho * c.visible.alto;

describe("colocarLogo", () => {
  it("nunca se sale de la caja fija, sea cual sea la proporción", () => {
    for (const [w, h] of [
      [2170, 725],
      [640, 313],
      [275, 34],
      [100, 100],
      [20, 400],
    ] as const) {
      const c = colocarLogo({ width: w, height: h }, CAJA_GRANDE);
      assert.ok(c.visible.ancho <= CAJA_GRANDE.ancho + 0.01);
      assert.ok(c.visible.alto <= CAJA_GRANDE.alto + 0.01);
      assert.ok(c.visible.izquierda >= -0.01);
      assert.ok(c.visible.arriba >= -0.01);
    }
  });

  it("dos logos de proporción distinta que caben ocupan la misma área visible", () => {
    const a = colocarLogo({ width: 300, height: 100 }, CAJA_GRANDE);
    const b = colocarLogo({ width: 360, height: 100 }, CAJA_GRANDE);
    cerca(area(a), CAJA_GRANDE.area, 1);
    cerca(area(b), CAJA_GRANDE.area, 1);
    assert.ok(b.visible.ancho > a.visible.ancho);
    assert.ok(b.visible.alto < a.visible.alto);
  });

  it("sin los márgenes transparentes, la versión con márgenes y la recortada salen iguales", () => {
    // Logo de 200 × 100 con 25 % de margen a cada lado (contenido 100 × 100) y el mismo, recortado.
    const conMargenes = colocarLogo(
      { width: 200, height: 100, recorte: { x: 0.25, y: 0, w: 0.5, h: 1 } },
      CAJA_GRANDE,
    );
    const recortado = colocarLogo({ width: 100, height: 100 }, CAJA_GRANDE);
    assert.deepEqual(conMargenes.visible, recortado.visible);
    // El fichero entero es el doble de ancho y se desplaza un cuarto a la izquierda.
    cerca(conMargenes.imagen.ancho, 2 * conMargenes.visible.ancho, 0.1);
    cerca(conMargenes.imagen.izquierda, -conMargenes.visible.ancho / 2, 0.1);
  });

  it("un recorte imposible cuenta como el fichero entero", () => {
    const malo = colocarLogo(
      { width: 300, height: 100, recorte: { x: 0.8, y: 0, w: 0.5, h: 1 } },
      CAJA_GRANDE,
    );
    const entero = colocarLogo({ width: 300, height: 100, recorte: SIN_RECORTE }, CAJA_GRANDE);
    assert.deepEqual(malo, entero);
  });

  it("centra el contenido en la caja", () => {
    const c = colocarLogo({ width: 100, height: 100 }, CAJA_GRANDE);
    cerca(c.visible.izquierda * 2 + c.visible.ancho, CAJA_GRANDE.ancho, 0.1);
    cerca(c.visible.arriba * 2 + c.visible.alto, CAJA_GRANDE.alto, 0.1);
  });
});
