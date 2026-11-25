import { describe, expect, it } from "vitest";

import { FRACCION_TOLERADA, tapadoCuenta, VECES_GRANDE } from "./desbordesReglas.mjs";

/** El WhatsApp flotante: un círculo de 56 px de lado. */
const FLOTANTE = 56 * 56;

describe("tapadoCuenta (qa:desbordes, lo que tapa el WhatsApp flotante)", () => {
  it("un control pequeño cuenta aunque lo pise un poco", () => {
    // «Enviar», 120 × 44: menos de 4 veces el botón.
    expect(tapadoCuenta({ area: 120 * 44, pisada: 10 * 10, areaFlotante: FLOTANTE })).toBe(true);
  });

  it("una tarjeta grande pisada en una esquina no cuenta", () => {
    // Tarjeta de repuestos de 300 × 360, con el botón sobre una esquina de la foto (5 %).
    const area = 300 * 360;
    expect(tapadoCuenta({ area, pisada: area * 0.05, areaFlotante: FLOTANTE })).toBe(false);
  });

  it("una tarjeta grande tapada en buena parte sí cuenta", () => {
    const area = 300 * 360;
    const pisada = area * (FRACCION_TOLERADA + 0.05);
    expect(tapadoCuenta({ area, pisada, areaFlotante: FLOTANTE })).toBe(true);
  });

  it("el límite de grande es VECES_GRANDE veces el botón", () => {
    const justoGrande = VECES_GRANDE * FLOTANTE;
    const pisada = justoGrande * 0.05;
    expect(tapadoCuenta({ area: justoGrande, pisada, areaFlotante: FLOTANTE })).toBe(false);
    expect(tapadoCuenta({ area: justoGrande - 1, pisada, areaFlotante: FLOTANTE })).toBe(true);
  });

  it("rozarlo (2 × 2 px o menos) no cuenta", () => {
    expect(tapadoCuenta({ area: 40 * 40, pisada: 4, areaFlotante: FLOTANTE })).toBe(false);
  });
});
