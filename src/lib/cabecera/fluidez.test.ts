import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { activasDe } from "../listado/animaciones";

import {
  dentroDelPasillo,
  DURACION_CIERRE_MENU_MS,
  FLUIDEZ_MEGAMENU,
  RETRASO_ABRIR_MS,
  RETRASO_CERRAR_MS,
} from "./fluidez";

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

/*
 * EL CIERRE ES EL ESPEJO DE LA APERTURA (tanda 24). Los tiempos van en el CSS y el componente
 * espera lo que dura el cierre (`DURACION_CIERRE_MENU_MS`) para desmontar el panel del móvil y
 * para dejar volver al del megamenú. Si alguien cambia uno sin el otro, el panel desaparecería
 * antes de acabar de recogerse (o se quedaría montado de más).
 */
describe("apertura y cierre del panel", () => {
  const aqui = path.dirname(fileURLToPath(import.meta.url));
  const css = (fichero: string) =>
    readFileSync(path.join(aqui, "../../components/layout", fichero), "utf8");
  const cierre = `${DURACION_CIERRE_MENU_MS / 1000}s`;

  it("el megamenú se recoge en lo que dura el cierre y deja de verse justo entonces", () => {
    const mega = css("megamenu.module.css");
    assert.ok(mega.includes(`visibility 0s linear ${cierre}`), "el marco no espera al cierre");
    assert.ok(
      mega.includes(`transition: clip-path ${cierre} `),
      "el panel no se recoge en ese tiempo",
    );
  });

  it("el menú del móvil se recoge en lo que dura el cierre", () => {
    assert.ok(css("cabecera.module.css").includes(`clip-path ${cierre} `));
  });

  it("solo se anima transform, opacity, clip-path o visibility en el marco y el panel", () => {
    const mega = css("megamenu.module.css");
    const marco = mega.slice(mega.indexOf(".marco {"), mega.indexOf(".contorno {"));
    for (const [, propiedad] of marco.matchAll(/^\s+([a-z-]+) [\d.]+s/gm)) {
      assert.ok(
        ["clip-path", "opacity", "transform", "visibility", "top"].includes(propiedad as string),
        `transición de ${propiedad}`,
      );
    }
  });
});
