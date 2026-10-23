import assert from "node:assert/strict";
import { test } from "node:test";

import { activasDe } from "../listado/animaciones";
import { ANIMACIONES_VENTANA } from "./animacionesVentana";

test("las mejoras de la ventana: todas encendidas y recortables desde la URL del preview", () => {
  assert.deepEqual(activasDe(ANIMACIONES_VENTANA, null, true), ["F1", "F2", "F3", "F4"]);
  assert.deepEqual(activasDe(ANIMACIONES_VENTANA, "f4,F1", true), ["F1", "F4"]);
  assert.deepEqual(activasDe(ANIMACIONES_VENTANA, "no", true), []);
  // En el sitio publicado el parámetro no hace nada.
  assert.deepEqual(activasDe(ANIMACIONES_VENTANA, "F2", false), ["F1", "F2", "F3", "F4"]);
});
