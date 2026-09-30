import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DIAPOSITIVAS_DEMO,
  MARCA_DEMO,
  esDiapositivaDeDemo,
  esImagenDeDemo,
} from "./heroDemoCliente";

describe("demo del hero con las fotos del cliente", () => {
  it("título con el patrón de ux-9: primera palabra y marca", () => {
    assert.deepEqual(
      DIAPOSITIVAS_DEMO.map((s) => s.titulo),
      ["Fuerza Hitachi", "Potencia LiuGong", "Precisión Dynapac", "Precisión Yanmar"],
    );
  });

  it("cada imagen lleva la marca en el alt y el focal dentro de 0–100", () => {
    for (const s of DIAPOSITIVAS_DEMO) {
      assert.ok(esImagenDeDemo(s.alt), s.alt);
      assert.ok(s.focalX >= 0 && s.focalX <= 100 && s.focalY >= 0 && s.focalY <= 100);
    }
  });

  it("no confunde imágenes ajenas con las de la demo", () => {
    assert.equal(esImagenDeDemo("PRUEBA HERO — Excavadora Hitachi en una cantera"), false);
    assert.equal(esImagenDeDemo(null), false);
    assert.equal(esImagenDeDemo(`${MARCA_DEMO} x`), true);
  });

  it("reconoce la diapositiva por su fondo, con id o con objeto", () => {
    assert.equal(esDiapositivaDeDemo({ imagenFondo: 7 }, [7]), true);
    assert.equal(esDiapositivaDeDemo({ imagenFondo: { id: 7 } }, [7]), true);
    assert.equal(esDiapositivaDeDemo({ imagenFondo: 8 }, [7]), false);
    assert.equal(esDiapositivaDeDemo({ imagenFondo: null }, [7]), false);
  });
});
