import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { geometriaMarco, PIEZAS_MARCO } from "./marco";

describe("geometría del marco del megamenú", () => {
  it("un panel de 500 × 284 centrado en un lienzo de 820", () => {
    const g = geometriaMarco(820, 284, 500, 284);
    assert.equal(g.piezas.fondo, "translate(160px, 0px) scale(500, 254)");
    assert.equal(g.piezas.base, "translate(190px, 254px) scale(440, 30)");
    assert.equal(g.piezas.ladoI, "translate(160px, 0px) scale(1, 254)");
    assert.equal(g.piezas.ladoD, "translate(659px, 0px) scale(1, 254)");
    assert.equal(g.piezas.pie, "translate(190px, 283px) scale(440, 1)");
    assert.equal(g.piezas.esquinaI, "translate(160px, 254px)");
    assert.equal(g.piezas.esquinaD, "translate(630px, 254px)");
    assert.equal(g.piezas.curvaI, "translate(140px, 0px)");
    assert.equal(g.piezas.curvaD, "translate(659px, 0px)");
    assert.equal(g.recorte, "inset(0px 160px 0px 160px round 0px 0px 30px 30px)");
  });

  it("el panel ancho ocupa todo el lienzo; el recorte deja fuera lo que sobra por abajo", () => {
    const g = geometriaMarco(820, 400, 820, 284);
    assert.equal(g.piezas.fondo, "translate(0px, 0px) scale(820, 254)");
    assert.equal(g.recorte, "inset(0px 0px 116px 0px round 0px 0px 30px 30px)");
  });

  it("todo en píxeles enteros, también con medidas con decimales", () => {
    const g = geometriaMarco(819, 283.6, 499.5, 283.6);
    for (const p of PIEZAS_MARCO) assert.doesNotMatch(g.piezas[p], /\d\.\d/, p);
    assert.doesNotMatch(g.recorte, /\d\.\d/);
  });

  it("nunca escalas negativas, aunque el panel sea más bajo que el radio", () => {
    const g = geometriaMarco(820, 10, 10, 10);
    for (const p of PIEZAS_MARCO) assert.doesNotMatch(g.piezas[p], /scale\([^)]*-/, p);
  });
});
