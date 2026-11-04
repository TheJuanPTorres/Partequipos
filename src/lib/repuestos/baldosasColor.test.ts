import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FONDO_RESPALDO, vistaBaldosa } from "./baldosasColor";

const logo = (width: number, height: number) => ({
  url: `/logo-${width}x${height}.webp`,
  width,
  height,
  oscuro: false,
});

describe("vistaBaldosa", () => {
  it("con color y logo para el color: la baldosa de color", () => {
    const blanco = logo(271, 74);
    const v = vistaBaldosa({ logo: logo(300, 80), color: "#FF3600", logoSobreColor: blanco });
    assert.deepEqual(v, { tipo: "color", fondo: "#ff3600", logo: blanco, alto: false });
  });

  it("sin el color, sin el logo para el color o con un color no válido: el respaldo", () => {
    const deSiempre = logo(300, 80);
    for (const d of [
      { logo: deSiempre },
      { logo: deSiempre, color: "#ff3600" },
      { logo: deSiempre, logoSobreColor: logo(271, 74) },
      { logo: deSiempre, color: "rojo", logoSobreColor: logo(271, 74) },
    ]) {
      const v = vistaBaldosa(d);
      assert.equal(v.tipo, "respaldo");
      assert.equal(v.fondo, FONDO_RESPALDO);
      assert.equal(v.logo, deSiempre);
    }
  });

  it("un logo en dos pisos (Hitachi LANDCROS, 640×313) va más alto; uno apaisado, no", () => {
    assert.equal(vistaBaldosa({ logo: logo(640, 313) }).alto, true);
    assert.equal(vistaBaldosa({ logo: logo(228, 69) }).alto, false);
    assert.equal(vistaBaldosa({ logo: null }).alto, false);
  });
});
