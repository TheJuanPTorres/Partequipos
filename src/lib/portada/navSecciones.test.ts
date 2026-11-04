import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { botonesNavDeRespaldo } from "./navSecciones";

describe("botonesNavDeRespaldo", () => {
  it("los tres botones con las anclas de la portada y la máquina de cada sección", () => {
    const m = { url: "/m.webp", alt: "", width: 10, height: 10, posicion: "50% 50%" };
    const b = botonesNavDeRespaldo([m, null, m]);
    assert.deepEqual(
      b.map((x) => [x.ancla, x.imagen ? "foto" : "sin"]),
      [
        ["nueva", "foto"],
        ["maquinaria-usada", "sin"],
        ["repuestos", "foto"],
      ],
    );
    assert.equal(b[2]!.texto, "Repuestos para maquinaria pesada");
  });
});
