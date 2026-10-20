import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mayusculaDelTipo } from "./tituloTipoMayuscula";

describe("mayusculaDelTipo", () => {
  it("pone en mayúscula solo la primera letra del tipo", () => {
    assert.equal(
      mayusculaDelTipo("LINK-BELT excavadora Link-Belt 210LX"),
      "LINK-BELT Excavadora Link-Belt 210LX",
    );
    assert.equal(
      mayusculaDelTipo("yANMAR miniexcavadora YANMAR VIO17-6B"),
      "yANMAR Miniexcavadora YANMAR VIO17-6B",
    );
  });

  it("no toca la marca ni sus erratas, ni un título que ya está bien", () => {
    assert.equal(mayusculaDelTipo("vOLVO excavadora vOLVO EC210"), "vOLVO Excavadora vOLVO EC210");
    assert.equal(
      mayusculaDelTipo("CASE CONSTRUCTION Cargador Frontal 621F"),
      "CASE CONSTRUCTION Cargador Frontal 621F",
    );
  });

  it("es idempotente y no confunde «miniexcavadora» con «excavadora»", () => {
    const una = mayusculaDelTipo("yANMAR miniexcavadora YANMAR VIO17-6B");
    assert.equal(mayusculaDelTipo(una), una);
    assert.equal(una.includes("miniExcavadora"), false);
  });

  it("no cambia una palabra del tipo que va al principio (es la marca)", () => {
    assert.equal(mayusculaDelTipo("excavadora"), "excavadora");
  });
});
