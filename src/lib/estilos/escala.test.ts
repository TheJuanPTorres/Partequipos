import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SCRIPT_TECHO_ESCALA,
  escalaPx,
  factorEscala,
  sizesEscalado,
  sizesPorFactor,
  techoEscala,
} from "./escala";
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

  it("con la ventana al 100 % el techo del monitor no cambia nada", () => {
    // La ventana nunca es más ancha que el monitor.
    for (const [ancho, pantalla] of [
      [390, 390],
      [1440, 1440],
      [1920, 1920],
      [1600, 2560],
      [2560, 2560],
      [3840, 3840],
    ]) {
      assert.equal(factorEscala(ancho, pantalla), factorEscala(ancho, 0));
    }
  });

  it("al alejar el zoom la escala se queda en la del monitor", () => {
    // Monitor de 1920 con el zoom al 50 % y al 25 %: la ventana mide 3840 y 7680 px de CSS.
    assert.equal(factorEscala(3840, 1920), 1.2);
    assert.equal(factorEscala(7680, 1920), 1.2);
    // Monitor de 1440: sin escala a ningún zoom.
    assert.equal(factorEscala(5760, 1440), 1);
    // Al acercar (200 %), la ventana mide menos de 1600: escala 1 y la página se recoloca.
    assert.equal(factorEscala(960, 1920), 1);
    assert.equal(techoEscala(0), Infinity);
    assert.equal(escalaPx(100, 7680, 1920), 120);
  });

  it("el script del techo hace la misma cuenta que techoEscala", () => {
    const estilo = new Map<string, string>();
    const ventana = { screen: { width: 2560 } };
    const documento = {
      documentElement: { style: { setProperty: (k: string, v: string) => estilo.set(k, v) } },
    };
    new Function("window", "screen", "document", "addEventListener", SCRIPT_TECHO_ESCALA)(
      ventana,
      ventana.screen,
      documento,
      () => undefined,
    );
    assert.equal(Number(estilo.get("--escala-techo")), techoEscala(2560));
  });

  it("el sizes pide lo mismo hasta 1600 y en proporción después", () => {
    assert.equal(sizesEscalado(400), "max(400px, 25vw)");
    assert.equal(sizesEscalado(1200), "max(1200px, 75vw)");
  });
});

describe("plugin de PostCSS", () => {
  it("pasa los px a la unidad fluida", () => {
    assert.equal(escalarValor("24px"), "calc(24 * var(--escala-px, 1px))");
    assert.equal(
      escalarValor("0 24px -8px"),
      "0 calc(24 * var(--escala-px, 1px)) calc(-8 * var(--escala-px, 1px))",
    );
    assert.equal(
      escalarValor("calc(100% - 1.5px)"),
      "calc(100% - calc(1.5 * var(--escala-px, 1px)))",
    );
    assert.equal(escalarValor("min(1.5vw, 24px)"), "min(1.5vw, calc(24 * var(--escala-px, 1px)))");
    assert.equal(
      escalarValor("12px/20px Inter"),
      "calc(12 * var(--escala-px, 1px))/calc(20 * var(--escala-px, 1px)) Inter",
    );
  });

  it("no toca 0px, url(), cadenas, nombres de variable ni colores", () => {
    assert.equal(escalarValor("0px"), "0px");
    assert.equal(escalarValor('url("foto-24px.png")'), 'url("foto-24px.png")');
    assert.equal(
      escalarValor("url(a-24px.svg) 8px"),
      "url(a-24px.svg) calc(8 * var(--escala-px, 1px))",
    );
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

describe("sizesPorFactor", () => {
  it("multiplica cada valor y deja las condiciones", () => {
    assert.equal(
      sizesPorFactor("(max-width: 767px) 30vw, max(180px, 11.25vw)", 1.5),
      "(max-width: 767px) calc(30vw * 1.5), calc(max(180px, 11.25vw) * 1.5)",
    );
    assert.equal(sizesPorFactor("120px", 2), "calc(120px * 2)");
  });

  it("con factor 1 (o inválido) no cambia nada", () => {
    assert.equal(sizesPorFactor("120px", 1), "120px");
    assert.equal(sizesPorFactor("120px", Number.NaN), "120px");
  });
});
