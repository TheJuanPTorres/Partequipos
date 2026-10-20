import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { tamanoLegible, textoContador, vistaDeDocumento } from "./visor";

const pagina = (id: number, extra: object = {}) => ({
  id,
  url: `https://almacen.example/p${id}.webp`,
  width: 1600,
  height: 2071,
  alt: "",
  ...extra,
});

describe("vistaDeDocumento", () => {
  it("el PDF con sus páginas en orden; sin alt, «Página N de <título>»", () => {
    const v = vistaDeDocumento(
      {
        titulo: "Política de garantía",
        url: "https://almacen.example/g.pdf",
        filesize: 220_000,
        paginas: [pagina(1), pagina(2, { alt: "Portada" })] as never,
      },
      null,
    );
    assert.ok(v);
    assert.equal(v.titulo, "Política de garantía");
    assert.deepEqual(v.pdf, { url: "https://almacen.example/g.pdf", tamano: "215 KB" });
    assert.deepEqual(
      v.paginas.map((p) => p.alt),
      ["Página 1 de Política de garantía", "Portada"],
    );
  });

  it("el título del bloque gana al del documento", () => {
    const v = vistaDeDocumento(
      { titulo: "Doc", url: "https://x/a.pdf", filesize: null, paginas: [] },
      " Garantía ",
    );
    assert.equal(v?.titulo, "Garantía");
  });

  it("omite las páginas sin URL o sin medidas, y las que llegan como id", () => {
    const v = vistaDeDocumento(
      {
        titulo: "Doc",
        url: "https://x/a.pdf",
        filesize: null,
        paginas: [pagina(1, { url: null }), pagina(2, { width: null }), 3, pagina(4)] as never,
      },
      null,
    );
    assert.equal(v?.paginas.length, 1);
  });

  it("sin PDF, nada; sin páginas, la vista con `paginas` vacío (solo el enlace)", () => {
    assert.equal(
      vistaDeDocumento({ titulo: "Doc", url: null, filesize: 1, paginas: [] }, null),
      null,
    );
    assert.equal(vistaDeDocumento(null, null), null);
    assert.deepEqual(
      vistaDeDocumento(
        { titulo: "Doc", url: "https://x/a.pdf", filesize: null, paginas: null },
        null,
      )?.paginas,
      [],
    );
  });
});

describe("tamanoLegible y textoContador", () => {
  it("KB por debajo del MB, MB con un decimal", () => {
    assert.equal(tamanoLegible(512), "1 KB");
    assert.equal(tamanoLegible(220_000), "215 KB");
    assert.equal(tamanoLegible(1_258_291), "1,2 MB");
    assert.equal(tamanoLegible(0), null);
  });

  it("«1 / 5» con una página, «1–2 / 5» con el libro abierto, la última sola", () => {
    assert.equal(textoContador(0, 5, false), "1 / 5");
    assert.equal(textoContador(0, 5, true), "1–2 / 5");
    assert.equal(textoContador(2, 5, true), "3–4 / 5");
    assert.equal(textoContador(4, 5, true), "5 / 5");
  });
});
