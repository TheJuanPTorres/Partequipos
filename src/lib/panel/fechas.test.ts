import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fechaExacta, fechaRelativa } from "./fechas";

const ahora = new Date("2026-10-06T15:00:00Z");

describe("fechaRelativa", () => {
  it("dice cuánto hace, en español", () => {
    assert.equal(fechaRelativa("2026-10-06T14:59:40Z", ahora), "ahora mismo");
    assert.equal(fechaRelativa("2026-10-06T14:55:00Z", ahora), "hace 5 minutos");
    assert.equal(fechaRelativa("2026-10-06T13:00:00Z", ahora), "hace 2 horas");
    assert.equal(fechaRelativa("2026-10-05T15:00:00Z", ahora), "ayer");
    assert.equal(fechaRelativa("2026-10-04T15:00:00Z", ahora), "anteayer");
    assert.equal(fechaRelativa("2026-10-03T15:00:00Z", ahora), "hace 3 días");
    assert.equal(fechaRelativa("2026-09-20T15:00:00Z", ahora), "hace 2 semanas");
    assert.equal(fechaRelativa("2026-07-06T15:00:00Z", ahora), "hace 3 meses");
  });

  it("una fecha inválida no rompe: cadena vacía", () => {
    assert.equal(fechaRelativa("no es fecha", ahora), "");
  });
});

describe("fechaExacta", () => {
  it("usa la hora de Colombia y el formato del panel", () => {
    // 04:56 UTC del 16 = 23:56 del 15 en Bogotá (UTC-5).
    assert.equal(fechaExacta("2026-09-16T04:56:00Z"), "15 sep 2026, 23:56");
  });
});
