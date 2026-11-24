import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encabezadosDesde } from "./encabezados";

const h = (tag: string, texto = "x") => ({
  type: "heading",
  tag,
  children: [{ type: "text", text: texto }],
});
const p = { type: "paragraph", children: [{ type: "text", text: "texto" }] };
const doc = (...hijos: unknown[]) => ({ root: { type: "root", children: hijos } });
const tags = (d: unknown) =>
  ((d as { root: { children: { type: string; tag?: string }[] } }).root.children ?? [])
    .filter((n) => n.type === "heading")
    .map((n) => n.tag);

describe("encabezadosDesde (QA del 2026-11-17, punto 32)", () => {
  it("h3 y h4 pasan a h2 y h3: tras el h1 de la ficha no hay saltos", () => {
    assert.deepEqual(tags(encabezadosDesde(doc(h("h3"), p, h("h4"), h("h3")))), ["h2", "h3", "h2"]);
  });

  it("un «Título 1» del panel no repite el h1 de la página: h1 y h2 pasan a h2 y h3", () => {
    assert.deepEqual(tags(encabezadosDesde(doc(h("h1"), h("h2")))), ["h2", "h3"]);
  });

  it("cierra los huecos (h2 y h4 → h2 y h3) y no pasa de h6", () => {
    assert.deepEqual(tags(encabezadosDesde(doc(h("h2"), h("h4")))), ["h2", "h3"]);
    const muchos = doc(h("h1"), h("h2"), h("h3"), h("h4"), h("h5"), h("h6"));
    assert.deepEqual(tags(encabezadosDesde(muchos)), ["h2", "h3", "h4", "h5", "h6", "h6"]);
  });

  it("sin encabezados o ya correctos, devuelve el mismo objeto; no toca el texto", () => {
    const sin = doc(p);
    assert.equal(encabezadosDesde(sin), sin);
    const bien = doc(h("h2"), h("h3"));
    assert.equal(encabezadosDesde(bien), bien);
    const original = doc(h("h3", "Título"));
    const copia = encabezadosDesde(original);
    assert.equal(tags(original)[0], "h3");
    assert.deepEqual(
      (copia as { root: { children: { children: unknown }[] } }).root.children[0]!.children,
      [{ type: "text", text: "Título" }],
    );
    assert.equal(encabezadosDesde(null), null);
  });
});
