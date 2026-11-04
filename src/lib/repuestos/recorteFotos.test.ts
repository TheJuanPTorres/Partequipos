import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cajaDeLaPieza, ficheroRecortado, recorteCuadrado } from "./recorteFotos";

/** Un fichero RGB blanco de `w`×`h` con un rectángulo gris en la caja dada. */
function fichero(
  w: number,
  h: number,
  caja?: { x: number; y: number; ancho: number; alto: number },
) {
  const d = new Uint8Array(w * h * 3).fill(255);
  if (caja) {
    for (let y = caja.y; y < caja.y + caja.alto; y++) {
      for (let x = caja.x; x < caja.x + caja.ancho; x++)
        d.fill(90, (y * w + x) * 3, (y * w + x) * 3 + 3);
    }
  }
  return d;
}

describe("cajaDeLaPieza", () => {
  it("encuentra la caja de lo que no es blanco", () => {
    assert.deepEqual(
      cajaDeLaPieza(fichero(100, 100, { x: 20, y: 30, ancho: 50, alto: 25 }), 100, 100, 3),
      {
        x: 20,
        y: 30,
        ancho: 50,
        alto: 25,
      },
    );
  });
  it("casi blanco (por encima del umbral) cuenta como blanco", () => {
    const d = fichero(50, 50);
    d.fill(245, 0, 30);
    assert.equal(cajaDeLaPieza(d, 50, 50, 3), null);
  });
  it("una mota suelta no agranda la caja si la fila o columna no llega al mínimo", () => {
    const w = 1000;
    const d = fichero(w, w, { x: 400, y: 400, ancho: 200, alto: 200 });
    d.fill(0, (5 * w + 5) * 3, (5 * w + 5) * 3 + 3); // un píxel en (5, 5)
    assert.deepEqual(cajaDeLaPieza(d, w, w, 3), { x: 400, y: 400, ancho: 200, alto: 200 });
  });
});

describe("recorteCuadrado", () => {
  it("cuadrado centrado en la pieza con el 4 % de margen, sin cortarla", () => {
    const r = recorteCuadrado(1000, 1000, { x: 200, y: 350, ancho: 600, alto: 300 });
    assert.equal(r.accion, "recortar");
    if (r.accion !== "recortar") return;
    assert.equal(r.cuadrado.ancho, Math.ceil(600 / 0.92));
    assert.ok(r.cuadrado.x <= 200 && r.cuadrado.x + r.cuadrado.ancho >= 800);
    assert.ok(r.cuadrado.y <= 350 && r.cuadrado.y + r.cuadrado.alto >= 650);
    assert.ok(Math.abs(r.ocupacion - 0.92) < 0.01);
  });
  it("si el cuadrado se sale del fichero, rellena de blanco por ese lado", () => {
    const r = recorteCuadrado(1000, 1000, { x: 5, y: 400, ancho: 600, alto: 100 });
    assert.equal(r.accion, "recortar");
    if (r.accion !== "recortar") return;
    assert.ok(r.relleno.izq > 0);
    assert.equal(r.relleno.der, 0);
  });
  it("conserva la foto cuya pieza toca un borde (sin fondo blanco o ya cortada)", () => {
    assert.equal(
      recorteCuadrado(800, 800, { x: 0, y: 100, ancho: 800, alto: 500 }).accion,
      "conservar",
    );
    assert.equal(
      recorteCuadrado(800, 800, { x: 50, y: 0, ancho: 600, alto: 800 }).accion,
      "conservar",
    );
    assert.equal(
      recorteCuadrado(800, 800, { x: 100, y: 200, ancho: 300, alto: 600 }).accion,
      "conservar",
    );
  });
  it("conserva la foto con poco blanco y la que es toda blanca", () => {
    assert.equal(
      recorteCuadrado(1000, 1000, { x: 30, y: 40, ancho: 920, alto: 900 }).accion,
      "conservar",
    );
    assert.equal(recorteCuadrado(1000, 1000, null).accion, "conservar");
  });
});

describe("ficheroRecortado", () => {
  it("cambia la extensión a WebP y añade el sufijo", () => {
    assert.equal(ficheroRecortado("wp-grupo-tren-1-AbC.jpg"), "wp-grupo-tren-1-AbC-recorte.webp");
  });
});
