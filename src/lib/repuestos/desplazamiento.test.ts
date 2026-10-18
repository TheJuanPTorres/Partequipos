import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { desplazamientoRecuadro } from "./desplazamiento";

describe("desplazamiento del recuadro con el scroll (motion_fx del export, velocidad 0,5)", () => {
  const ventana = 900;
  const alto = 400;

  it("+25 px al asomar por abajo, 0 en el centro y −25 px al salir por arriba", () => {
    assert.equal(desplazamientoRecuadro(ventana, alto, ventana), 25);
    assert.equal(desplazamientoRecuadro((ventana - alto) / 2, alto, ventana), 0);
    assert.equal(desplazamientoRecuadro(-alto, alto, ventana), -25);
  });

  it("fuera de la ventana se queda en el extremo", () => {
    assert.equal(desplazamientoRecuadro(5000, alto, ventana), 25);
    assert.equal(desplazamientoRecuadro(-5000, alto, ventana), -25);
  });
});
