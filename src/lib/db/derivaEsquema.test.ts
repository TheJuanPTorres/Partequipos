import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { veredictoDeriva } from "./derivaEsquema";

describe("deriva de esquema", () => {
  it("sin sentencias: el código y las migraciones coinciden", () => {
    assert.deepEqual(veredictoDeriva([]), { coincide: true });
  });

  it("las sentencias vacías o en blanco no cuentan", () => {
    assert.deepEqual(veredictoDeriva(["", "  \n"]), { coincide: true });
  });

  it("FALLA con el caso real de la fase C: dos columnas sin migrar", () => {
    const v = veredictoDeriva([
      'ALTER TABLE "videos" ADD COLUMN "focal_x" numeric;',
      'ALTER TABLE "videos" ADD COLUMN "focal_y" numeric;',
    ]);
    assert.equal(v.coincide, false);
    if (!v.coincide) {
      assert.equal(v.sentencias.length, 2);
      assert.match(v.mensaje, /faltan 2 sentencia/);
      assert.match(v.mensaje, /migrate:create/);
    }
  });
});
