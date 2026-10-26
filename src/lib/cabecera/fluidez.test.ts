import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { activasDe } from "../listado/animaciones";

import { dentroDelPasillo, FLUIDEZ_MEGAMENU, RETRASO_ABRIR_MS, RETRASO_CERRAR_MS } from "./fluidez";

// Un panel de 540 px centrado bajo la barra, como a 1440.
const panel = { left: 450, top: 99, right: 990, bottom: 383 };

describe("M2: pasillo seguro hacia el panel", () => {
  it("bajar en diagonal desde el botón hacia el panel va dentro del pasillo", () => {
    const origen = { x: 900, y: 50 };
    assert.equal(dentroDelPasillo(origen, { x: 870, y: 70 }, panel), true);
    assert.equal(dentroDelPasillo(origen, { x: 700, y: 95 }, panel), true);
  });

  it("dentro del panel siempre vale", () => {
    assert.equal(dentroDelPasillo({ x: 900, y: 50 }, { x: 500, y: 200 }, panel), true);
  });

  it("moverse en horizontal por la barra o subir no es ir al panel", () => {
    const origen = { x: 600, y: 50 };
    assert.equal(dentroDelPasillo(origen, { x: 760, y: 50 }, panel), false);
    assert.equal(dentroDelPasillo(origen, { x: 620, y: 30 }, panel), false);
  });

  it("alejarse hacia un lado, fuera del triángulo, no vale", () => {
    const origen = { x: 900, y: 50 };
    assert.equal(dentroDelPasillo(origen, { x: 1200, y: 90 }, panel), false);
  });
});

describe("interruptores y retrasos", () => {
  it("las cuatro mejoras se pueden recortar con ?anim= en un preview", () => {
    assert.deepEqual(activasDe(FLUIDEZ_MEGAMENU, null, true), ["M1", "M2", "M3", "M4"]);
    assert.deepEqual(activasDe(FLUIDEZ_MEGAMENU, "m1,M3", true), ["M1", "M3"]);
    assert.deepEqual(activasDe(FLUIDEZ_MEGAMENU, "no", true), []);
    // En el sitio publicado la URL no cuenta.
    assert.deepEqual(activasDe(FLUIDEZ_MEGAMENU, "no", false), ["M1", "M2", "M3", "M4"]);
  });

  it("cerrar espera más que abrir (M1)", () => {
    assert.ok(RETRASO_CERRAR_MS > RETRASO_ABRIR_MS);
  });
});
