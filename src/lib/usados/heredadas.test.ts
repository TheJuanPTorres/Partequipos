import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { categoriaUsadaIndexable, CATEGORIAS_USADA_HEREDADAS } from "./heredadas";

describe("CATEGORIAS_USADA_HEREDADAS", () => {
  it("son las categorías de usada del rastreo, menos el duplicado «excavadoras4»", () => {
    const csv = readFileSync("docs/url-map.csv", "utf8");
    const delRastreo = new Set(
      [...csv.matchAll(/maquinaria-pesada\/maquinaria-pesada-usada\/([a-z0-9-]+)\/"/g)].map(
        (m) => m[1]!,
      ),
    );
    delRastreo.delete("excavadoras4");
    assert.deepEqual([...CATEGORIAS_USADA_HEREDADAS].sort(), [...delRastreo].sort());
  });
});

describe("categoriaUsadaIndexable", () => {
  it("heredada: siempre; creada en el panel: solo con unidades", () => {
    assert.equal(categoriaUsadaIndexable("bulldozer", 0), true);
    assert.equal(categoriaUsadaIndexable("miniexcavadoras", 24), true);
    assert.equal(categoriaUsadaIndexable("gruas", 0), false);
  });
});
