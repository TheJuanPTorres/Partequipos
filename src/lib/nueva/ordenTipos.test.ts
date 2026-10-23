import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ordenarTiposNueva, posicionDeTipo, unaEntradaPorTipo } from "./ordenTipos";

describe("ordenarTiposNueva", () => {
  it("el orden de la web antigua, con «Cargadores» al final", () => {
    const nombres = [
      "Cargadores",
      "Pavimentadoras",
      "Retrocargadoras",
      "Excavadoras",
      "Minicargadores",
      "Compactadores",
      "Miniexcavadoras",
      "Motoniveladoras",
      "Bulldozers",
    ];
    assert.deepEqual(
      ordenarTiposNueva(nombres, (n) => n),
      [
        "Bulldozers",
        "Excavadoras",
        "Motoniveladoras",
        "Miniexcavadoras",
        "Minicargadores",
        "Retrocargadoras",
        "Compactadores",
        "Pavimentadoras",
        "Cargadores",
      ],
    );
  });

  it("un tipo que no está en la lista va detrás, por orden alfabético", () => {
    assert.deepEqual(
      ordenarTiposNueva(["Zanjadoras", "Cargadores", "Grúas"], (n) => n),
      ["Cargadores", "Grúas", "Zanjadoras"],
    );
  });

  it("compara por el comienzo, sin tildes ni mayúsculas (y no confunde «Miniexcavadoras»)", () => {
    assert.equal(posicionDeTipo("BULLDOZER"), 0);
    assert.equal(posicionDeTipo("Miniexcavadoras"), 3);
    assert.equal(posicionDeTipo("Minicargadores"), 4);
  });
});

describe("unaEntradaPorTipo", () => {
  it("la categoría gana SIEMPRE al tipo, aunque sea de una sola marca (página general, 2026-10-23)", () => {
    const r = unaEntradaPorTipo(
      [
        { nombre: "EXCAVADORAS", marcas: 2, dato: "cat-excavadoras" },
        { nombre: "BULLDOZER", marcas: 1, dato: "cat-bulldozer" },
        { nombre: "COMPACTADORAS", marcas: 1, dato: "cat-compactadoras" },
      ],
      [
        { nombre: "Bulldozers", dato: "tipo-bulldozer" },
        { nombre: "Excavadoras", dato: "tipo-excavadoras" },
      ],
    );
    assert.deepEqual(r, ["cat-bulldozer", "cat-excavadoras", "cat-compactadoras"]);
  });

  it("un tipo sin categoría sale con su página de marca (mientras se crea la general)", () => {
    const r = unaEntradaPorTipo(
      [{ nombre: "Excavadoras", marcas: 2, dato: "cat-excavadoras" }],
      [
        { nombre: "Retrocargadoras", dato: "tipo-retro" },
        { nombre: "Bulldozers", dato: "tipo-bulldozer" },
      ],
    );
    assert.deepEqual(r, ["tipo-bulldozer", "cat-excavadoras", "tipo-retro"]);
  });

  it("dos categorías con el mismo tipo: la de más marcas", () => {
    const r = unaEntradaPorTipo(
      [
        { nombre: "Compactadoras", marcas: 1, dato: "a" },
        { nombre: "Compactadores", marcas: 3, dato: "b" },
      ],
      [],
    );
    assert.deepEqual(r, ["b"]);
  });
});
