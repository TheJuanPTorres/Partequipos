import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { motivoAltFlojo } from "./altFlojo";
import { altACorregir, altDeEquipo, propuestas, type Uso } from "./altEquipos";

describe("alt de las fotos de maquinaria (QA del 2026-11-17, punto 25)", () => {
  it("se corrigen los que llevan «partequipos» o una errata; los buenos, no", () => {
    for (const malo of [
      "Hitachi LANDCROS ZX20 partequipos",
      "Partequipos excavadora",
      "Ezcabadora Hitachi ZX200",
      "EXACAVADORA CASE",
    ])
      assert.equal(altACorregir(malo), true, malo);
    for (const bueno of [
      "Excavadora Hitachi LANDCROS ZX200LC-5G",
      "Bulldozer CASE 1150M",
      "",
      null,
    ])
      assert.equal(altACorregir(bueno), false, String(bueno));
  });

  it("el alt nuevo es el nombre del equipo; desde la segunda foto, «(foto N)»; y no es flojo", () => {
    assert.equal(
      altDeEquipo("  Excavadora  Hitachi ZX200LC-5G ", 0),
      "Excavadora Hitachi ZX200LC-5G",
    );
    assert.equal(
      altDeEquipo("Excavadora Hitachi ZX200LC-5G", 2),
      "Excavadora Hitachi ZX200LC-5G (foto 3)",
    );
    assert.equal(motivoAltFlojo(altDeEquipo("Excavadora Hitachi ZX200LC-5G", 0), "x.jpg"), null);
  });

  it("una foto compartida por fichas de distinto nombre no se toca; la de una sola ficha, sí", () => {
    const uso = (id: number, nombre: string, indice = 0): Uso => ({
      coleccion: "equipos-nuevos",
      id,
      nombre,
      indice,
    });
    const usos = new Map([
      [1, [uso(10, "Excavadora A")]],
      [2, [uso(10, "Excavadora A", 1), uso(11, "Excavadora B")]],
      [3, [uso(12, "Excavadora C")]],
    ]);
    const r = propuestas(
      [
        { mediaId: 1, alt: "A partequipos" },
        { mediaId: 2, alt: "foto partequipos" },
        { mediaId: 3, alt: "Excavadora C" },
      ],
      usos,
    );
    assert.deepEqual(
      r.map((p) => [p.mediaId, p.decision, "despues" in p ? p.despues : null]),
      [
        [1, "cambiar", "Excavadora A"],
        [2, "compartida", null],
      ],
    );
  });
});
