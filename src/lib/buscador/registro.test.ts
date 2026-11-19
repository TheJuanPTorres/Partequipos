import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { permitirAhora, textoRegistrable } from "./registro";

describe("registro de búsquedas sin resultado: qué se guarda", () => {
  it("guarda una búsqueda normal, en minúsculas y sin tildes", () => {
    assert.equal(textoRegistrable("Excavadora Hítachi 2020"), "excavadora hitachi 2020");
  });
  it("descarta correos, direcciones web, teléfonos y documentos", () => {
    for (const x of [
      "ana@ejemplo.com",
      "www.ejemplo.co",
      "https://ejemplo.com/x",
      "317 555 0100",
      "+57 317-555-0100",
      "900123456-7",
      "1020304050",
    ]) {
      assert.equal(textoRegistrable(x), null, x);
    }
  });
  it("descarta lo muy corto, lo muy largo y lo que son solo números", () => {
    assert.equal(textoRegistrable("ab"), null);
    assert.equal(textoRegistrable("x".repeat(61)), null);
    assert.equal(textoRegistrable("12 34"), null);
  });
  it("descarta una cadena larga de letras y números pegados (serial)", () => {
    assert.equal(textoRegistrable("ab12cd34ef56gh78"), null);
  });
  it("un modelo corto sí se guarda", () => {
    assert.equal(textoRegistrable("ZX200LC"), "zx200lc");
  });
});

describe("registro de búsquedas sin resultado: límite de frecuencia", () => {
  it("el mismo texto no cuenta dos veces en un minuto, pero sí pasado ese tiempo", () => {
    const t = 10_000_000;
    assert.equal(permitirAhora("texto-a", t), true);
    assert.equal(permitirAhora("texto-a", t + 5_000), false);
    assert.equal(permitirAhora("texto-a", t + 61_000), true);
  });
  it("una ráfaga de textos distintos se corta", () => {
    const t = 20_000_000;
    const permitidos = Array.from({ length: 40 }, (_, i) => permitirAhora(`rafaga-${i}`, t)).filter(
      Boolean,
    ).length;
    assert.ok(permitidos <= 20);
  });
});
