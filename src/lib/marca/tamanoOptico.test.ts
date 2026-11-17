import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CAJA_GRANDE, colocarLogo, colocarLogoRelativo, SIN_RECORTE } from "./tamanoOptico";

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

describe("colocarLogoRelativo", () => {
  const CAJA = { proporcion: 3, area: 0.5 };

  it("en porcentajes: no se sale de la caja y dos logos que caben ocupan la misma fracción", () => {
    for (const [w, h] of [
      [2170, 725],
      [640, 313],
      [275, 34],
      [100, 100],
    ] as const) {
      const c = colocarLogoRelativo({ width: w, height: h }, CAJA);
      assert.ok(c.visible.ancho <= 100.01 && c.visible.alto <= 100.01);
      assert.ok(c.visible.izquierda >= -0.01 && c.visible.arriba >= -0.01);
      cerca(c.visible.izquierda * 2 + c.visible.ancho, 100, 0.05);
      cerca(c.visible.arriba * 2 + c.visible.alto, 100, 0.05);
    }
    const a = colocarLogoRelativo({ width: 300, height: 100 }, CAJA);
    const b = colocarLogoRelativo({ width: 360, height: 100 }, CAJA);
    cerca((a.visible.ancho * a.visible.alto) / 1e4, CAJA.area, 0.001);
    cerca((b.visible.ancho * b.visible.alto) / 1e4, CAJA.area, 0.001);
  });

  it("el fichero entero va en % de la parte visible, desplazado por sus márgenes", () => {
    const c = colocarLogoRelativo(
      { width: 200, height: 100, recorte: { x: 0.25, y: 0, w: 0.5, h: 1 } },
      CAJA,
    );
    cerca(c.imagen.ancho, 200, 0.05);
    cerca(c.imagen.alto, 100, 0.05);
    cerca(c.imagen.izquierda, -50, 0.05);
    cerca(c.imagen.arriba, 0, 0.05);
  });

  it("igual que colocarLogo en px, escalado a la caja", () => {
    const px = colocarLogo({ width: 640, height: 313 }, { ancho: 300, alto: 100, area: 15000 });
    const rel = colocarLogoRelativo({ width: 640, height: 313 }, CAJA);
    cerca(rel.visible.ancho, px.visible.ancho / 3, 0.05);
    cerca(rel.visible.alto, px.visible.alto, 0.05);
  });

  it("con `tope`, un logo muy alargado se queda en ese ancho (sin tocar el borde) y el resto conserva su área", () => {
    const caja = { proporcion: 3.7, area: 0.54, tope: 0.92 };
    const cat = colocarLogoRelativo({ width: 866, height: 100 }, caja);
    cerca(cat.visible.ancho, 92, 0.05);
    cerca(cat.visible.izquierda, 4, 0.05);
    const normal = colocarLogoRelativo({ width: 400, height: 100 }, caja);
    cerca((normal.visible.ancho * normal.visible.alto) / 1e4, 0.54, 0.001);
    assert.ok(normal.visible.ancho < 92 && normal.visible.alto < 92);
    // Sin tope, como antes.
    const sin = colocarLogoRelativo({ width: 866, height: 100 }, { proporcion: 3.7, area: 0.54 });
    cerca(sin.visible.ancho, 100, 0.05);
  });
});
