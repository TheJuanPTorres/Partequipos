import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { escalaPx, factorEscala, sizesEscalado } from "./escala";
import { escalarValor, ficheroExcluido } from "./escalaPostcss.mjs";

describe("escala de las pantallas grandes", () => {
  it("es 1 hasta 1600 y proporcional después", () => {
    assert.equal(factorEscala(390), 1);
    assert.equal(factorEscala(1440), 1);
    assert.equal(factorEscala(1600), 1);
    assert.equal(factorEscala(3840), 2.4);
    assert.equal(escalaPx(110, 1440), 110);
    assert.equal(escalaPx(110, 3200), 220);
  });

  it("el sizes pide lo mismo hasta 1600 y en proporción después", () => {
    assert.equal(sizesEscalado(400), "max(400px, 25vw)");
    assert.equal(sizesEscalado(1200), "max(1200px, 75vw)");
  });
});

describe("plugin de PostCSS", () => {
  it("pasa los px a la unidad fluida", () => {
    assert.equal(escalarValor("24px"), "calc(24 * var(--u, 1px))");
    assert.equal(
      escalarValor("0 24px -8px"),
      "0 calc(24 * var(--u, 1px)) calc(-8 * var(--u, 1px))",
    );
    assert.equal(escalarValor("calc(100% - 1.5px)"), "calc(100% - calc(1.5 * var(--u, 1px)))");
    assert.equal(escalarValor("min(1.5vw, 24px)"), "min(1.5vw, calc(24 * var(--u, 1px)))");
    assert.equal(
      escalarValor("12px/20px Inter"),
      "calc(12 * var(--u, 1px))/calc(20 * var(--u, 1px)) Inter",
    );
  });

  it("no toca 0px, url(), cadenas, nombres de variable ni colores", () => {
    assert.equal(escalarValor("0px"), "0px");
    assert.equal(escalarValor('url("foto-24px.png")'), 'url("foto-24px.png")');
    assert.equal(escalarValor("url(a-24px.svg) 8px"), "url(a-24px.svg) calc(8 * var(--u, 1px))");
    assert.equal(escalarValor('"24px"'), '"24px"');
    assert.equal(escalarValor("var(--hueco-24px)"), "var(--hueco-24px)");
    assert.equal(escalarValor("1rem 2vw 50%"), "1rem 2vw 50%");
  });

  it("deja fuera el panel y node_modules", () => {
    assert.equal(ficheroExcluido("C:/p/src/app/(payload)/custom.scss"), true);
    assert.equal(ficheroExcluido("/p/src/components/admin/aviso/aviso.module.css"), true);
    assert.equal(ficheroExcluido("/p/node_modules/@payloadcms/ui/dist/styles.css"), true);
    assert.equal(ficheroExcluido("/p/src/components/ficha/ficha.module.css"), false);
  });
});
