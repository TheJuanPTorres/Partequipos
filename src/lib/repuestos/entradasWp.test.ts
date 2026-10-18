import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { TiposEquipo } from "@/payload-types";

import { ENTRADAS_WP } from "./entradasWp";
import { gruposDeModelos, conOtrasEntradas, type ModeloEnlace } from "./tipo";

const modelo = (id: number, nombre: string, serie: string | null = null): ModeloEnlace => ({
  id,
  nombre,
  codigo: null,
  href: `/m${id}/`,
  serie,
});
const tipo = (t: Partial<TiposEquipo>) =>
  ({ id: 1, nombre: "Excavadora", slug: "excavadora", marca: 1, ...t }) as TiposEquipo;

describe("otras entradas de la lista (WordPress tal cual)", () => {
  it("sin otras entradas, la lista de siempre y en su orden", () => {
    const lista = [modelo(2, "B 320"), modelo(1, "A 10")];
    assert.equal(
      conOtrasEntradas(tipo({}), lista, () => null),
      lista,
    );
  });

  it("una sin ficha va como texto (href null) y todo se ordena con los números en su orden", () => {
    const t = tipo({ otrasEntradas: [{ texto: "Excavadora Caterpillar 326D2" }] });
    const r = conOtrasEntradas(
      t,
      [modelo(1, "Excavadora CATERPILLAR 330"), modelo(2, "Excavadora CATERPILLAR 32")],
      () => null,
    );
    assert.deepEqual(
      r.map((m) => [m.nombre, m.href]),
      [
        ["Excavadora CATERPILLAR 32", "/m2/"],
        ["Excavadora Caterpillar 326D2", null],
        ["Excavadora CATERPILLAR 330", "/m1/"],
      ],
    );
  });

  it("una con enlace lleva la URL de la otra ficha y cae en su serie", () => {
    const t = tipo({
      series: [{ nombre: "EX" }, { nombre: "ZAXIS" }],
      otrasEntradas: [{ texto: "Miniexcavadora Hitachi EX450LC-5", serie: "EX", modelo: 77 }],
    });
    const lista = conOtrasEntradas(t, [modelo(1, "Miniexcavadora HITACHI EX40U", "EX")], (id) =>
      id === 77 ? "/excavadora/zx450lc-5/" : null,
    );
    const grupos = gruposDeModelos(t, lista);
    assert.deepEqual(
      grupos?.map((g) => [g.ancla, g.modelos.map((m) => [m.nombre, m.href])]),
      [
        [
          "serie-ex",
          [
            ["Miniexcavadora HITACHI EX40U", "/m1/"],
            ["Miniexcavadora Hitachi EX450LC-5", "/excavadora/zx450lc-5/"],
          ],
        ],
      ],
    );
  });

  it("el plan: 4 sin ficha y la EX450LC-5 que enlaza a la ZX450LC-5 en la serie EX", () => {
    assert.equal(ENTRADAS_WP.filter((e) => !e.enlace).length, 4);
    const ex450 = ENTRADAS_WP.find((e) => e.enlace);
    assert.equal(ex450?.serie, "EX");
    assert.match(ex450?.enlace?.modelo ?? "", /zx450lc-5$/);
  });
});
