import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { insigniaDe } from "./insignias";

describe("insigniaDe", () => {
  it("siempre da texto, no solo color", () => {
    assert.deepEqual(insigniaDe("disponible", true), { texto: "Disponible", tono: "exito" });
    assert.deepEqual(insigniaDe("disponible", false), { texto: "No disponible", tono: "neutro" });
    assert.deepEqual(insigniaDe("publicado", undefined), { texto: "Borrador", tono: "neutro" });
    assert.deepEqual(insigniaDe("autorizacion", false), {
      texto: "Sin autorización",
      tono: "aviso",
    });
    assert.deepEqual(insigniaDe("solicitud", "nueva"), { texto: "Nueva", tono: "aviso" });
    assert.deepEqual(insigniaDe("destino", "sin-ruta"), { texto: "No existe", tono: "error" });
  });

  it("un valor desconocido sale tal cual, en neutro (nunca se pierde)", () => {
    assert.deepEqual(insigniaDe("destino", "otro"), { texto: "otro", tono: "neutro" });
    assert.equal(insigniaDe("solicitud", undefined), null);
  });
});
