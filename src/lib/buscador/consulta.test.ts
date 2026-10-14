import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { LONGITUD_MAXIMA, normalizarConsulta } from "./consulta";

describe("normalizarConsulta", () => {
  it("sin valor o en blanco es «vacía»", () => {
    assert.deepEqual(normalizarConsulta(undefined), { estado: "vacia" });
    assert.deepEqual(normalizarConsulta(""), { estado: "vacia" });
    assert.deepEqual(normalizarConsulta("   \t "), { estado: "vacia" });
  });

  it("una sola letra es «corta»", () => {
    assert.deepEqual(normalizarConsulta(" a "), { estado: "corta", texto: "a" });
  });

  it("colapsa espacios y recorta", () => {
    assert.deepEqual(normalizarConsulta("  excavadora   hitachi \n"), {
      estado: "valida",
      texto: "excavadora hitachi",
    });
  });

  it("toma el primer valor si q se repite", () => {
    assert.deepEqual(normalizarConsulta(["zx350", "otra"]), { estado: "valida", texto: "zx350" });
  });

  it("quita los comodines de LIKE y los caracteres de control", () => {
    assert.deepEqual(normalizarConsulta("100%_\\ filtro\u0000"), {
      estado: "valida",
      texto: "100 filtro",
    });
    // Solo comodines: no queda nada que buscar.
    assert.deepEqual(normalizarConsulta("%%__"), { estado: "vacia" });
  });

  it("corta a la longitud máxima sin dejar un espacio al final", () => {
    const r = normalizarConsulta(`${"a".repeat(LONGITUD_MAXIMA - 1)} ${"b".repeat(50)}`);
    assert.equal(r.estado, "valida");
    if (r.estado === "valida") {
      assert.ok(r.texto.length <= LONGITUD_MAXIMA);
      assert.equal(r.texto, r.texto.trim());
    }
  });

  it("conserva tildes y la ñ", () => {
    assert.deepEqual(normalizarConsulta("Retroexcavadora año"), {
      estado: "valida",
      texto: "Retroexcavadora año",
    });
  });
});
