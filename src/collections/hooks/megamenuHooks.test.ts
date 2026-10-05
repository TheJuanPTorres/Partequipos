import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cambiaElMenu } from "./megamenuHooks";

describe("megamenú: cuándo hay que revalidar el sitio", () => {
  const antes = { nombre: "Hitachi", slug: "hitachi", marca: 3, descripcion: "x" };

  it("al crear, siempre", () => {
    assert.equal(cambiaElMenu("create", antes, null), true);
  });

  it("si cambia el nombre, el slug o la marca", () => {
    assert.equal(cambiaElMenu("update", { ...antes, nombre: "HITACHI" }, antes), true);
    assert.equal(cambiaElMenu("update", { ...antes, slug: "hitachi-2" }, antes), true);
    assert.equal(cambiaElMenu("update", { ...antes, marca: 4 }, antes), true);
  });

  it("la marca poblada y su id cuentan como la misma", () => {
    assert.equal(cambiaElMenu("update", { ...antes, marca: { id: 3 } }, antes), false);
  });

  it("editar otra cosa (la descripción) no revalida todo el sitio", () => {
    assert.equal(cambiaElMenu("update", { ...antes, descripcion: "otra" }, antes), false);
  });
});
