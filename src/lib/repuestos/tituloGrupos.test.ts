import assert from "node:assert/strict";
import { test } from "node:test";

import { tituloDeGrupos, tituloEligeRepuesto } from "./tituloGrupos";

test("categoría técnica: el nombre en minúsculas, como en «Qué incluye»", () => {
  assert.equal(
    tituloEligeRepuesto("Baldes y Herramienta de Corte", true),
    "Elige el repuesto de baldes y herramienta de corte que necesitas",
  );
});

test("las siglas se respetan en mayúsculas; una sola letra no es sigla", () => {
  assert.equal(
    tituloEligeRepuesto("Herramienta de Corte (GETS)", true),
    "Elige el repuesto de herramienta de corte (GETS) que necesitas",
  );
  assert.equal(
    tituloEligeRepuesto("Llantas Y Rines", true),
    "Elige el repuesto de llantas y rines que necesitas",
  );
  assert.equal(
    tituloEligeRepuesto("Filtros CAT y GETS-2", true),
    "Elige el repuesto de filtros CAT y GETS-2 que necesitas",
  );
});

test("Filtros Donaldson: el nombre tal cual", () => {
  assert.equal(
    tituloEligeRepuesto("Filtros Donaldson", false),
    "Elige el repuesto de Filtros Donaldson que necesitas",
  );
});

test("espacios de sobra y nombre vacío", () => {
  assert.equal(
    tituloEligeRepuesto("  Tren   de Rodaje ", true),
    "Elige el repuesto de tren de rodaje que necesitas",
  );
  assert.equal(tituloEligeRepuesto("  ", true), "Elige el repuesto que necesitas");
});

test("sin «repuesto de repuestos»: el «Repuestos» inicial del nombre se quita", () => {
  assert.equal(
    tituloEligeRepuesto("Repuestos Motor Diesel", true),
    "Elige el repuesto de motor diesel que necesitas",
  );
  assert.equal(
    tituloEligeRepuesto("Repuestos para Motor", true),
    "Elige el repuesto de motor que necesitas",
  );
  assert.equal(
    tituloEligeRepuesto("REPUESTOS DE TRANSMISIÓN", false),
    "Elige el repuesto de TRANSMISIÓN que necesitas",
  );
  assert.equal(tituloEligeRepuesto("Repuestos", true), "Elige el repuesto que necesitas");
});

test("«repuestos» en medio del nombre, o una palabra que solo empieza igual, no se toca", () => {
  assert.equal(
    tituloEligeRepuesto("Kits de Repuestos", true),
    "Elige el repuesto de kits de repuestos que necesitas",
  );
  assert.equal(
    tituloEligeRepuesto("Repuestosa Diesel", true),
    "Elige el repuesto de repuestosa diesel que necesitas",
  );
});

test("título propio de la categoría: tal cual; vacío, el automático", () => {
  assert.equal(
    tituloDeGrupos("  Todo para el  Motor Diesel ", "Repuestos Motor Diesel", true),
    "Todo para el Motor Diesel",
  );
  for (const vacio of [undefined, null, "", "   "]) {
    assert.equal(
      tituloDeGrupos(vacio, "Repuestos Motor Diesel", true),
      "Elige el repuesto de motor diesel que necesitas",
    );
  }
  assert.equal(
    tituloDeGrupos(null, "Filtros Donaldson", false),
    "Elige el repuesto de Filtros Donaldson que necesitas",
  );
});
