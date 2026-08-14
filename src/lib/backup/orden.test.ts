import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ordenTopologico } from "./orden";

/** Índice de cada tabla en el resultado, para comparar precedencias. */
const pos = (orden: string[], t: string) => orden.indexOf(t);

describe("ordenTopologico", () => {
  it("pone el padre antes que la hija", () => {
    const orden = ordenTopologico(["modelos", "marcas"], [{ hija: "modelos", padre: "marcas" }]);
    assert.ok(pos(orden, "marcas") < pos(orden, "modelos"));
  });

  it("resuelve una cadena de tres niveles", () => {
    const orden = ordenTopologico(
      ["modelos", "tipos", "marcas"],
      [
        { hija: "modelos", padre: "tipos" },
        { hija: "tipos", padre: "marcas" },
      ],
    );
    assert.deepEqual(orden, ["marcas", "tipos", "modelos"]);
  });

  it("devuelve TODAS las tablas, también las sueltas", () => {
    const tablas = ["a", "b", "suelta", "c"];
    const orden = ordenTopologico(tablas, [
      { hija: "b", padre: "a" },
      { hija: "c", padre: "b" },
    ]);
    assert.equal(orden.length, tablas.length);
    assert.deepEqual([...orden].sort(), [...tablas].sort());
  });

  it("una autorreferencia no bloquea la tabla", () => {
    const orden = ordenTopologico(["categorias"], [{ hija: "categorias", padre: "categorias" }]);
    assert.deepEqual(orden, ["categorias"]);
  });

  it("un ciclo real no deja tablas fuera", () => {
    const orden = ordenTopologico(
      ["a", "b", "libre"],
      [
        { hija: "a", padre: "b" },
        { hija: "b", padre: "a" },
      ],
    );
    assert.equal(orden.length, 3);
    assert.ok(orden.includes("a") && orden.includes("b") && orden.includes("libre"));
    // Lo que no está en el ciclo se resuelve primero.
    assert.equal(orden[0], "libre");
  });

  it("ignora aristas hacia tablas que no se están restaurando", () => {
    const orden = ordenTopologico(["a"], [{ hija: "a", padre: "tabla_de_otro_esquema" }]);
    assert.deepEqual(orden, ["a"]);
  });

  it("con varias hijas del mismo padre, el padre va primero que todas", () => {
    const orden = ordenTopologico(
      ["h1", "h2", "h3", "padre"],
      [
        { hija: "h1", padre: "padre" },
        { hija: "h2", padre: "padre" },
        { hija: "h3", padre: "padre" },
      ],
    );
    for (const h of ["h1", "h2", "h3"]) assert.ok(pos(orden, "padre") < pos(orden, h));
  });

  it("sin tablas devuelve lista vacía", () => {
    assert.deepEqual(ordenTopologico([], []), []);
  });
});
