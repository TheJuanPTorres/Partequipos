import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  completitudUsada,
  estadoUsada,
  modelosSugeridos,
  validarAnio,
  validarHorometro,
} from "./fichaUsada";

describe("estadoUsada", () => {
  it("oculta manda sobre vendida", () => {
    assert.equal(estadoUsada({ mostrarEnWeb: false, disponible: false }), "oculta");
  });
  it("vendida si no está disponible", () => {
    assert.equal(estadoUsada({ mostrarEnWeb: true, disponible: false }), "vendida");
  });
  it("sin valores cuenta como publicada", () => {
    assert.equal(estadoUsada({}), "publicada");
  });
});

describe("completitudUsada", () => {
  it("vacía: 0 % y faltan todas", () => {
    const c = completitudUsada({});
    assert.equal(c.porcentaje, 0);
    assert.ok(c.faltan.includes("Nombre"));
    assert.ok(c.faltan.includes("Fotos (al menos 3)"));
  });
  it("completa: 100 % y no falta nada", () => {
    const c = completitudUsada({
      nombre: "Excavadora",
      categoria: 1,
      marcaUsada: 2,
      modelo: "ZX200-3",
      anio: 2016,
      horometro: 0,
      pesoOperativo: 20,
      ubicacion: "Bogotá",
      descripcion: "Texto",
      imagenes: [1, 2, 3],
    });
    assert.deepEqual(c, { porcentaje: 100, faltan: [] });
  });
  it("una foto cuenta en parte y sigue faltando", () => {
    const c = completitudUsada({ imagenes: [1] });
    assert.equal(c.porcentaje, 8); // 1 de 12 puntos
    assert.ok(c.faltan.includes("Fotos (al menos 3)"));
  });
  it("un texto en blanco no cuenta", () => {
    assert.ok(completitudUsada({ nombre: "   " }).faltan.includes("Nombre"));
  });
});

describe("validaciones", () => {
  const hoy = new Date("2026-11-23");
  it("año", () => {
    assert.equal(validarAnio(2016, hoy), true);
    assert.equal(validarAnio(null, hoy), true);
    assert.match(String(validarAnio(16, hoy)), /cuatro cifras/);
    assert.match(String(validarAnio(2028, hoy)), /2027/);
  });
  it("horómetro", () => {
    assert.equal(validarHorometro(8450), true);
    assert.match(String(validarHorometro(-1)), /número/);
    assert.match(String(validarHorometro(900000)), /demasiadas/);
  });
});

describe("modelosSugeridos", () => {
  it("sin repetidos (sin distinguir mayúsculas), sin vacíos y ordenados", () => {
    assert.deepEqual(modelosSugeridos(["ZX200", " zx200 ", "", null, "PC200-8"]), [
      "PC200-8",
      "ZX200",
    ]);
  });
});
