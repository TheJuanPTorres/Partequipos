import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  fuenteDe,
  fuentesDelHero,
  posicionDelTitulo,
  reglasFontFace,
  tamanosDelTitulo,
  tipografiaDe,
  variablesDeLetra,
} from "./tipografia";

const URL_BLOB = "https://abc123.public.blob.vercel-storage.com/mi-fuente.woff2";
const fuente = { id: 7, nombre: "Mi fuente", url: URL_BLOB, formato: "woff2" };

describe("tipografiaDe", () => {
  it("todo vacío es null: el título se pinta como siempre", () => {
    assert.equal(tipografiaDe(null), null);
    assert.equal(tipografiaDe({}), null);
    assert.equal(tipografiaDe({ peso: null, color: "", fuente: null }), null);
  });

  it("traduce cada campo del panel", () => {
    const t = tipografiaDe({
      fuente,
      peso: "800",
      color: "#D92035",
      mayusculas: "normal",
      alineacion: "izquierda",
      interlineado: 1.1,
      interletrado: 5,
      tamanoEscritorio: 90,
      tamanoMovil: 40,
      posicionXEscritorio: 0,
      posicionYMovil: 80,
    })!;
    assert.deepEqual(t.fuente, { familia: "pq-fuente-7", url: URL_BLOB, formato: "woff2" });
    assert.equal(t.peso, 800);
    assert.equal(t.color, "#d92035");
    assert.equal(t.mayusculas, "none");
    assert.equal(t.alineacion, "left");
    assert.deepEqual(t.tamano, { escritorio: 90, tablet: null, movil: 40 });
    assert.deepEqual(t.posicion, {
      escritorio: { x: 0, y: null },
      tablet: null,
      movil: { x: null, y: 80 },
    });
  });

  it("descarta valores fuera de rango o mal formados", () => {
    assert.equal(
      tipografiaDe({ peso: "650", color: "rojo", tamanoEscritorio: 5000, interlineado: 0 }),
      null,
    );
  });
});

describe("fuenteDe", () => {
  it("solo una fuente poblada, del CDN del Blob y con formato conocido", () => {
    assert.equal(fuenteDe(7), null, "un id sin poblar no tiene URL");
    assert.equal(fuenteDe({ ...fuente, url: "https://otro.com/f.woff2" }), null);
    assert.equal(fuenteDe({ ...fuente, formato: "otf" }), null);
  });

  it('rechaza URL que romperían el url("…") del CSS', () => {
    for (const malo of [`${URL_BLOB}")}body{color:red`, `${URL_BLOB} x`, `${URL_BLOB}'`]) {
      assert.equal(fuenteDe({ ...fuente, url: malo }), null, malo);
    }
  });
});

describe("variables CSS", () => {
  it("sin tipografía no escribe nada", () => {
    assert.deepEqual(variablesDeLetra(null), {});
    assert.deepEqual(tamanosDelTitulo(null), { estilo: {}, datos: {} });
    assert.deepEqual(posicionDelTitulo(null), { estilo: {}, datos: {} });
  });

  it("letra: fuente con Inter de respaldo, interletrado en em y alineación", () => {
    const v = variablesDeLetra(
      tipografiaDe({ fuente, interletrado: -5, alineacion: "derecha", peso: "300" }),
    );
    assert.equal(v["--titulo-fuente"], '"pq-fuente-7", var(--hero-fuente)');
    assert.equal(v["--titulo-interletrado"], "-0.05em");
    assert.equal(v["--titulo-texto"], "right");
    assert.equal(v["--titulo-alinear"], "flex-end");
    assert.equal(v["--titulo-peso"], "300");
  });

  it("tamaño: solo las pantallas que lo tienen, con su atributo", () => {
    const r = tamanosDelTitulo(tipografiaDe({ tamanoTablet: 64 }));
    assert.deepEqual(r, { estilo: { "--titulo-tam-t": "64px" }, datos: { "data-tam-t": "" } });
  });

  it("posición: un eje sin valor no escribe su variable (queda como siempre)", () => {
    const r = posicionDelTitulo(tipografiaDe({ posicionXEscritorio: 25 }));
    assert.deepEqual(r.datos, { "data-pos-e": "" });
    assert.equal(r.estilo["--pos-tx-e"], "-25%");
    assert.match(r.estilo["--pos-left-e"]!, /\* 0\.25\)$/);
    assert.equal(r.estilo["--pos-top-e"], undefined);
  });
});

describe("@font-face", () => {
  it("una regla por fuente, sin repetir, con swap", () => {
    const t = tipografiaDe({ fuente })!;
    const fuentes = fuentesDelHero([{ tipografia: t }, { tipografia: t }, { tipografia: null }]);
    assert.equal(fuentes.length, 1);
    const css = reglasFontFace(fuentes);
    assert.equal(
      css,
      `@font-face{font-family:"pq-fuente-7";src:url("${URL_BLOB}") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}`,
    );
  });

  it("no escribe una fuente con URL o familia que no pasen el filtro", () => {
    assert.equal(reglasFontFace([{ familia: "x}body{", url: URL_BLOB, formato: "woff2" }]), "");
    assert.equal(
      reglasFontFace([
        { familia: "pq-fuente-1", url: "https://otro.com/a.woff2", formato: "woff2" },
      ]),
      "",
    );
  });
});
