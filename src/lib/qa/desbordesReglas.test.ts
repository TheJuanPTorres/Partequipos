import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FRACCION_TOLERADA, tapadoCuenta, VECES_GRANDE } from "./desbordesReglas.mjs";

/** El WhatsApp flotante: un círculo de 56 px de lado. */
const FLOTANTE = 56 * 56;

describe("tapadoCuenta (qa:desbordes, lo que tapa el WhatsApp flotante)", () => {
  it("un control pequeño cuenta aunque lo pise un poco", () => {
    // «Enviar», 120 × 44: menos de 4 veces el botón.
    assert.equal(tapadoCuenta({ area: 120 * 44, pisada: 10 * 10, areaFlotante: FLOTANTE }), true);
  });

  it("una tarjeta grande pisada en una esquina no cuenta", () => {
    // Tarjeta de repuestos de 300 × 360, con el botón sobre una esquina de la foto (5 %).
    const area = 300 * 360;
    assert.equal(tapadoCuenta({ area, pisada: area * 0.05, areaFlotante: FLOTANTE }), false);
  });

  it("una tarjeta grande tapada en buena parte sí cuenta", () => {
    const area = 300 * 360;
    const pisada = area * (FRACCION_TOLERADA + 0.05);
    assert.equal(tapadoCuenta({ area, pisada, areaFlotante: FLOTANTE }), true);
  });

  it("el límite de grande es VECES_GRANDE veces el botón", () => {
    const justoGrande = VECES_GRANDE * FLOTANTE;
    const pisada = justoGrande * 0.05;
    assert.equal(tapadoCuenta({ area: justoGrande, pisada, areaFlotante: FLOTANTE }), false);
    assert.equal(tapadoCuenta({ area: justoGrande - 1, pisada, areaFlotante: FLOTANTE }), true);
  });

  it("rozarlo (2 × 2 px o menos) no cuenta", () => {
    assert.equal(tapadoCuenta({ area: 40 * 40, pisada: 4, areaFlotante: FLOTANTE }), false);
  });
});
