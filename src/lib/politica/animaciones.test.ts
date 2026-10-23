import assert from "node:assert/strict";
import { test } from "node:test";

import { activasDe } from "../listado/animaciones";
import { ANIMACIONES_POLITICA, etiquetaCorta } from "./animaciones";

test("etiquetaCorta: el núcleo del título de cada política", () => {
  assert.equal(etiquetaCorta("Política de garantía de repuestos"), "Garantía");
  assert.equal(etiquetaCorta("Política de devolución de repuestos"), "Devolución");
  assert.equal(etiquetaCorta("politica de cambios"), "Cambios");
  assert.equal(etiquetaCorta("Condiciones de uso"), "Condiciones de uso");
});

test("los interruptores de la página: todas encendidas y recortables desde la URL del preview", () => {
  assert.deepEqual(activasDe(ANIMACIONES_POLITICA, null, true), ["V1", "V2", "V3", "V4"]);
  assert.deepEqual(activasDe(ANIMACIONES_POLITICA, "v3,V1", true), ["V1", "V3"]);
  assert.deepEqual(activasDe(ANIMACIONES_POLITICA, "no", true), []);
  // En el sitio publicado el parámetro no hace nada.
  assert.deepEqual(activasDe(ANIMACIONES_POLITICA, "V1", false), ["V1", "V2", "V3", "V4"]);
});
