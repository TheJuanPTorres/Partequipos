import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { cajaMarco, interpolarCaja, recorteMarco, suavizadoMarco } from "./marco";

describe("geometría del marco del megamenú", () => {
  it("un panel de 500 × 284 centrado en un lienzo de 820", () => {
    const c = cajaMarco(820, 500, 284);
    assert.deepEqual(c, { x: 160, ancho: 500, alto: 284 });
    assert.equal(recorteMarco(c, 820, 284), "inset(0px 160px 0px 160px round 0px 0px 30px 30px)");
  });

  it("el panel ancho ocupa todo el lienzo; el recorte deja fuera lo que sobra por abajo", () => {
    const c = cajaMarco(820, 820, 284);
    assert.deepEqual(c, { x: 0, ancho: 820, alto: 284 });
    assert.equal(recorteMarco(c, 820, 400), "inset(0px 0px 116px 0px round 0px 0px 30px 30px)");
  });

  it("todo en píxeles enteros, también con medidas con decimales", () => {
    const c = cajaMarco(819, 499.5, 283.6, 30, 161.4);
    for (const v of Object.values(c)) assert.ok(Number.isInteger(v), String(v));
    assert.doesNotMatch(recorteMarco(c, 819, 283.6), /\d\.\d/);
  });

  it("con la posición medida del panel, el contorno va ahí (no al centro calculado)", () => {
    const c = cajaMarco(820, 500, 284, 30, 161.4);
    assert.equal(c.x, 161);
    assert.equal(recorteMarco(c, 820, 284), "inset(0px 159px 0px 161px round 0px 0px 30px 30px)");
  });

  it("nunca más pequeña que las esquinas, ni recortes negativos", () => {
    const c = cajaMarco(820, 10, 10);
    assert.equal(c.ancho, 60);
    assert.equal(c.alto, 30);
    assert.doesNotMatch(recorteMarco(c, 820, 10), /-/);
  });

  it("interpolar: los extremos son las cajas y en medio, enteros", () => {
    const a = { x: 160, ancho: 500, alto: 284 };
    const b = { x: 0, ancho: 820, alto: 401 };
    assert.deepEqual(interpolarCaja(a, b, 0), a);
    assert.deepEqual(interpolarCaja(a, b, 1), b);
    const m = interpolarCaja(a, b, 0.37);
    for (const v of Object.values(m)) assert.ok(Number.isInteger(v));
    assert.ok(m.ancho > 500 && m.ancho < 820);
  });

  it("la curva de M3 va de 0 a 1 sin pasarse y siempre hacia delante", () => {
    assert.equal(suavizadoMarco(0), 0);
    assert.equal(suavizadoMarco(1), 1);
    let antes = 0;
    for (let t = 0.05; t < 1; t += 0.05) {
      const v = suavizadoMarco(t);
      assert.ok(v >= antes && v <= 1, `${t}: ${v}`);
      antes = v;
    }
    // Sale rápido y frena: a mitad del tiempo ya va más allá de la mitad.
    assert.ok(suavizadoMarco(0.5) > 0.6);
  });

  /*
   * EL FALLO DEL #357 (2026-10-26): las piezas de 1 × 1 px estiradas con `scale()` y con
   * transición CSS se quedaban en pantalla, con GPU, con el tamaño de otro panel. Que no vuelva:
   * ni `scale()` ni transiciones de `transform`, `translate`, `width`, `height` o `clip-path`
   * en el contorno del megamenú.
   */
  it("el contorno no se estira con scale() ni se anima con transiciones CSS", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/megamenu.module.css"),
      "utf8",
    );
    const reglas = [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
      (r) => [r[0], r[1] ?? "", r[2] ?? ""] as const,
    );
    const contorno = reglas.filter(([, sel]) => /\.(forma|contorno|contenidoMarco)\b/.test(sel));
    assert.ok(
      contorno.some(([, sel]) => /\.forma\b/.test(sel)),
      "falta la regla de .forma",
    );
    for (const [, sel, cuerpo] of contorno) {
      assert.doesNotMatch(cuerpo, /scale\(/, sel.trim());
      assert.doesNotMatch(cuerpo, /transition\s*:(?!\s*none)/, sel.trim());
    }
    assert.doesNotMatch(css, /\.pieza\b/, "las piezas estiradas no vuelven");
  });
});
