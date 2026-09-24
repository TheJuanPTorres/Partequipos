import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pideRecorte, sinRecorte } from "./sinRecorte";

type Argumentos = Parameters<typeof sinRecorte>[0];

const llamar = (uploadEdits: unknown, operation = "update") =>
  sinRecorte({ args: {}, operation, req: { query: { uploadEdits } } } as unknown as Argumentos);

describe("recorte desactivado en el servidor", () => {
  it("detecta un recorte o un cambio de tamaño", () => {
    assert.equal(pideRecorte({ crop: { x: 0, y: 0, width: 50, height: 50 } }), true);
    assert.equal(pideRecorte({ heightInPixels: 400 }), true);
    assert.equal(pideRecorte({ widthInPixels: 600 }), true);
  });

  it("NO confunde el punto focal con un recorte: se usa en la fase C", () => {
    assert.equal(pideRecorte({ focalPoint: { x: 30, y: 70 } }), false);
    assert.equal(pideRecorte(undefined), false);
  });

  it("el gancho rechaza la petición de recorte (falla cuando debe)", () => {
    assert.throws(
      () => llamar({ crop: { x: 0, y: 0, width: 50, height: 50 } }),
      /recorte está desactivado/,
    );
    assert.throws(() => llamar({ widthInPixels: 600 }, "create"), /recorte está desactivado/);
  });

  it("deja pasar el punto focal y las operaciones sin ediciones", () => {
    assert.doesNotThrow(() => llamar({ focalPoint: { x: 30, y: 70 } }));
    assert.doesNotThrow(() => llamar(undefined));
  });
});
