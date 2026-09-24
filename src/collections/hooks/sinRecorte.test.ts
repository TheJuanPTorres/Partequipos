import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { esRecorteDeImagenEntera, pideRecorte, sinRecorte } from "./sinRecorte";

type Argumentos = Parameters<typeof sinRecorte>[0];

function llamar(uploadEdits: unknown, operation = "update") {
  const req = { query: { uploadEdits } };
  sinRecorte({ args: {}, operation, req } as unknown as Argumentos);
  return req.query.uploadEdits;
}

// Lo que manda el panel de Payload 3.89 al guardar SOLO el punto focal (medido en el preview).
const DEL_PANEL = () => ({
  crop: { x: 0, y: 0, width: 100, height: 100, unit: "%" },
  focalPoint: { x: 30, y: 70 },
  heightInPixels: 1360,
  widthInPixels: 2048,
});

describe("recorte desactivado en el servidor", () => {
  it("detecta un recorte o un cambio de tamaño", () => {
    assert.equal(pideRecorte({ crop: { x: 0, y: 0, width: 50, height: 50, unit: "%" } }), true);
    assert.equal(pideRecorte({ heightInPixels: 400 }), true);
    assert.equal(pideRecorte({ focalPoint: { x: 30, y: 70 } }), false);
    assert.equal(pideRecorte(undefined), false);
  });

  it("reconoce el «recorte» de la imagen entera que manda el panel con el punto focal", () => {
    assert.equal(esRecorteDeImagenEntera(DEL_PANEL()), true);
    assert.equal(
      esRecorteDeImagenEntera({
        crop: { x: 0, y: 0, width: 2048, height: 1360, unit: "px" },
        widthInPixels: 2048,
        heightInPixels: 1360,
      }),
      true,
    );
  });

  it("guardar SOLO el punto focal pasa, y se le quita el recorte para no recodificar", () => {
    const quedan = llamar(DEL_PANEL());
    assert.deepEqual(quedan, { focalPoint: { x: 30, y: 70 } });
  });

  it("un recorte REAL se rechaza (el guardián falla cuando debe)", () => {
    const real = { ...DEL_PANEL(), crop: { x: 10, y: 0, width: 50, height: 100, unit: "%" } };
    assert.throws(() => llamar(real), /recorte está desactivado/);
    assert.throws(
      () =>
        llamar({
          crop: { x: 0, y: 0, width: 600, height: 400, unit: "px" },
          widthInPixels: 1200,
          heightInPixels: 800,
        }),
      /recorte está desactivado/,
    );
  });

  it("un cambio de tamaño sin recorte se rechaza", () => {
    assert.throws(() => llamar({ widthInPixels: 600 }, "create"), /recorte está desactivado/);
  });

  it("sin ediciones, no interviene", () => {
    assert.equal(llamar(undefined), undefined);
  });
});
