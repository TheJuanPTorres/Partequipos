import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planDeFechas, planDeRetirada, type Actual } from "./fechasPublicacion";

const creada = "2026-10-08T10:00:00.000Z";
const actuales = new Map<number, Actual>([
  [1, { fechaPublicacion: creada, createdAt: creada }],
  [2, { fechaPublicacion: "2025-12-16T17:34:51.000Z", createdAt: creada }],
  [3, { fechaPublicacion: null, createdAt: creada }],
]);

describe("fecha de publicación de las importadas", () => {
  it("cambia las que no llevan la fecha de WordPress y deja las que ya la llevan", () => {
    const r = planDeFechas(
      [
        { idWp: 10, id: 1, fechaGmt: "2025-12-16 17:34:51" },
        { idWp: 20, id: 2, fechaGmt: "2025-12-16 17:34:51" },
        { idWp: 30, id: 3, fechaGmt: "2026-10-05 14:11:43" },
      ],
      actuales,
    );
    assert.deepEqual(
      r.map((a) => a.tipo),
      ["cambiar", "igual", "cambiar"],
    );
    assert.equal(r[0]!.tipo === "cambiar" && r[0]!.hacia, "2025-12-16T17:34:51.000Z");
    assert.equal(r[2]!.tipo === "cambiar" && r[2]!.antes, null);
  });

  it("no toca una unidad sin fecha válida ni una que ya no existe", () => {
    const r = planDeFechas(
      [
        { idWp: 10, id: 1, fechaGmt: "0000-00-00 00:00:00" },
        { idWp: 40, id: 99, fechaGmt: "2025-12-16 17:34:51" },
      ],
      actuales,
    );
    assert.deepEqual(
      r.map((a) => a.tipo),
      ["sin-fecha", "no-existe"],
    );
  });

  it("la retirada devuelve la fecha de creación y no repite lo ya devuelto", () => {
    const r = planDeRetirada([1, 2, 99], actuales);
    assert.deepEqual(
      r.map((a) => a.tipo),
      ["igual", "cambiar", "no-existe"],
    );
    assert.equal(r[1]!.hacia, creada);
  });
});
