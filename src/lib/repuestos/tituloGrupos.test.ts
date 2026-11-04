import assert from "node:assert/strict";
import { test } from "node:test";

import { tituloEligeRepuesto } from "./tituloGrupos";

test("categoría técnica: el nombre en minúsculas, como en «Qué incluye»", () => {
  assert.equal(
    tituloEligeRepuesto("Baldes y Herramienta de Corte", true),
    "Elige el repuesto de baldes y herramienta de corte que necesitas",
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
