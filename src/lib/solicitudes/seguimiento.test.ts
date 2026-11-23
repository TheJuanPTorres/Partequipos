import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { celdaCsv, fechaDeContacto, solicitudesACsv } from "./seguimiento";

const AHORA = new Date("2026-11-20T15:00:00.000Z");

describe("fechaDeContacto", () => {
  it("apunta el momento al salir de «Nueva»", () => {
    assert.equal(fechaDeContacto("nueva", "contactada", null, AHORA), AHORA.toISOString());
    assert.equal(fechaDeContacto(undefined, "cerrada", null, AHORA), AHORA.toISOString());
  });
  it("respeta una fecha puesta a mano", () => {
    assert.equal(
      fechaDeContacto("nueva", "contactada", "2026-11-01T10:00:00.000Z", AHORA),
      "2026-11-01T10:00:00.000Z",
    );
  });
  it("no inventa fecha si sigue Nueva o ya estaba atendida sin fecha", () => {
    assert.equal(fechaDeContacto("nueva", "nueva", null, AHORA), null);
    assert.equal(fechaDeContacto("contactada", "cerrada", null, AHORA), null);
  });
});

describe("CSV", () => {
  it("escapa comillas, saltos y punto y coma", () => {
    assert.equal(celdaCsv('a "b"; c'), '"a ""b""; c"');
    assert.equal(celdaCsv("uno\ndos"), '"uno\ndos"');
  });
  it("neutraliza fórmulas de Excel", () => {
    assert.equal(celdaCsv("=HYPERLINK(1)"), "'=HYPERLINK(1)");
    assert.equal(celdaCsv("+57 300"), "'+57 300");
    assert.equal(celdaCsv("@x"), "'@x");
  });
  it("lleva BOM, encabezado en español y etiquetas legibles", () => {
    const csv = solicitudesACsv([
      {
        createdAt: "2026-11-20T15:00:00.000Z",
        estado: "contactada",
        tipo: "cotizacion",
        nombre: "Ana Prueba",
        responsable: { email: "ventas@ejemplo.test" },
      },
    ]);
    assert.ok(csv.startsWith("\uFEFFFecha;Estado;Tipo;"));
    assert.match(csv, /2026-11-20 15:00;Contactada;Cotización de equipo;Ana Prueba;/);
    assert.match(csv, /ventas@ejemplo\.test/);
  });
});
