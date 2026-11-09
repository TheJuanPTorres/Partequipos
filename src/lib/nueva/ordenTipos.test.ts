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

  it("«Vibrocompactador» va donde «Compactadores», con el nombre viejo o el nuevo (2026-10-25)", () => {
    assert.equal(posicionDeTipo("Vibrocompactador"), posicionDeTipo("Compactadores"));
    assert.equal(posicionDeTipo("Vibrocompactador de Llantas"), 6);
    assert.equal(posicionDeTipo("Compactador"), 6);
    assert.deepEqual(
      ordenarTiposNueva(["Pavimentadora", "Vibrocompactador", "Retrocargadora"], (n) => n),
      ["Retrocargadora", "Vibrocompactador", "Pavimentadora"],
    );
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
    // En el orden en que llegan las categorías: el del panel (`_order`, 2026-11-09).
    assert.deepEqual(r, ["cat-excavadoras", "cat-bulldozer", "cat-compactadoras"]);
  });

  it("respeta el orden del panel aunque no sea el de la web antigua (2026-11-09)", () => {
    const r = unaEntradaPorTipo(
      [
        { nombre: "Cargadores", marcas: 1, dato: "cargadores" },
        { nombre: "Excavadoras", marcas: 3, dato: "excavadoras" },
        { nombre: "Bulldozer", marcas: 1, dato: "bulldozer" },
      ],
      [],
    );
    assert.deepEqual(r, ["cargadores", "excavadoras", "bulldozer"]);
  });

  it("un tipo sin categoría sale con su página de marca, detrás de las categorías y en el orden de la web antigua", () => {
    const r = unaEntradaPorTipo(
      [{ nombre: "Excavadoras", marcas: 2, dato: "cat-excavadoras" }],
      [
        { nombre: "Retrocargadoras", dato: "tipo-retro" },
        { nombre: "Bulldozers", dato: "tipo-bulldozer" },
      ],
    );
    assert.deepEqual(r, ["cat-excavadoras", "tipo-bulldozer", "tipo-retro"]);
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
