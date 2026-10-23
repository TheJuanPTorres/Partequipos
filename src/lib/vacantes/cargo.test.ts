import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cargoLegible, ciudadDe } from "./cargo";

// Títulos inventados con la forma de los de Buk (sin datos reales).
describe("cargo legible", () => {
  it("pasa a frase, conserva las siglas y quita la ciudad del final", () => {
    assert.equal(cargoLegible("ANALISTA TIC - BOGOTÁ", "Bogotá, Bogotá, D.C."), "Analista TIC");
    assert.equal(
      cargoLegible("COORDINADOR SST - MEDELLÍN.", "Medellín, Antioquia"),
      "Coordinador SST",
    );
  });

  it("quita también el departamento y el guion pegado", () => {
    assert.equal(
      cargoLegible("SUPERVISOR DE BODEGA PRINCIPAL- CÓRDOBA", "Montería, Córdoba"),
      "Supervisor de bodega principal",
    );
  });

  it("quita el lugar del final aunque no lleve guion, también de varias palabras", () => {
    assert.equal(
      cargoLegible("COORDINADOR DE COMPRAS CORDOBA", "Montería, Córdoba"),
      "Coordinador de compras",
    );
    assert.equal(
      cargoLegible("COORDINADOR DE COMPRAS NORTE DE SANTANDER", "Cúcuta, Norte de Santander"),
      "Coordinador de compras",
    );
    assert.equal(
      cargoLegible("ANALISTA DE CARTERA Y COBRO ENVIGADO ", "Envigado, Antioquia"),
      "Analista de cartera y cobro",
    );
  });

  it("quita un lugar conocido aunque no sea la ubicación en Buk (y una región); la errata se queda", () => {
    assert.equal(
      cargoLegible("AUXILIAR DE ARCHIVO - ENVIGADO", "Medellín, Antioquia"),
      "Auxiliar de archivo",
    );
    assert.equal(
      cargoLegible("VENDEDOR DE MOSTRADR EJE CAFETERO", "Pereira, Risaralda"),
      "Vendedor de mostradr",
    );
  });

  it("no quita lo que va tras un guion si no es un lugar", () => {
    assert.equal(cargoLegible("TÉCNICO - MECÁNICO", "Guarne, Antioquia"), "Técnico - mecánico");
  });

  it("deja la ciudad en mayúscula si va en medio, y las marcas con su nombre", () => {
    assert.equal(
      cargoLegible("TÉCNICO HITACHI GUARNE TURNO NOCHE", "Guarne, Antioquia"),
      "Técnico Hitachi Guarne turno noche",
    );
  });

  it("respeta un título que ya viene con minúsculas", () => {
    assert.equal(
      cargoLegible("Analista de Datos BI - Cali", "Cali, Valle del Cauca"),
      "Analista de Datos BI",
    );
  });

  it("la ciudad sin el departamento", () => {
    assert.equal(ciudadDe("Bogotá, Bogotá, D.C."), "Bogotá");
    assert.equal(ciudadDe("Montería, Córdoba"), "Montería");
    assert.equal(ciudadDe("Caucasia"), "Caucasia");
  });
});
