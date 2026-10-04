import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { motivoAltFlojo, validarAlt } from "./altFlojo";

describe("motivoAltFlojo", () => {
  it("vacío o solo espacios", () => {
    for (const v of [undefined, null, "", "   "]) assert.equal(motivoAltFlojo(v), "Está vacío.");
  });

  it("menos de 5 letras (los números no cuentan)", () => {
    assert.match(String(motivoAltFlojo("Logo")), /corto \(4 letras\)/);
    assert.match(String(motivoAltFlojo("x")), /corto \(1 letra\)/);
    assert.match(String(motivoAltFlojo("ZX 200")), /corto/);
  });

  it("igual al nombre del fichero, sin extensión, guiones ni sufijo -1", () => {
    assert.equal(
      motivoAltFlojo("excavadora hitachi zx200", "Excavadora_Hitachi-ZX200-1.png"),
      "Es el nombre del fichero.",
    );
    assert.equal(
      motivoAltFlojo("Mesa de trabajo 1", "Mesa-de-trabajo-1.png"),
      "Es el nombre del fichero.",
    );
  });

  it("genéricos: palabra suelta o con números, con o sin tildes", () => {
    for (const v of ["imagen", "Fotografía", "Captura 2026", "imagen 3", "foto foto"]) {
      assert.match(String(motivoAltFlojo(v)), /genérica/, v);
    }
    // Con menos de 5 letras, el motivo es «corto», pero también se rechazan.
    for (const v of ["IMG_1234", "DSC 0001"]) assert.notEqual(motivoAltFlojo(v), null, v);
  });

  it("descripciones de verdad pasan, también las de los scripts de siembra", () => {
    for (const v of [
      "Excavadora Hitachi ZX200 trabajando en una obra",
      "Logo de Hitachi",
      "Partequipos",
      "EJEMPLO UX-9 — Excavadora amarilla",
      "PRUEBA HERO — Excavadora Hitachi en obra",
      "Imagen de demostración: cucharón",
    ]) {
      assert.equal(motivoAltFlojo(v, "foto.png"), null, v);
    }
  });
});

describe("validarAlt (campo de Payload)", () => {
  it("bien: true; flojo: el motivo y cómo arreglarlo", () => {
    assert.equal(validarAlt("Excavadora Hitachi en obra", { siblingData: {} }), true);
    const r = String(validarAlt("hero-fondo", { siblingData: { filename: "hero-fondo.jpg" } }));
    assert.match(r, /^Es el nombre del fichero\. Describe lo que se ve/);
  });

  it("un valor que no es texto cuenta como vacío", () => {
    assert.match(String(validarAlt(7, { siblingData: {} })), /^Está vacío\./);
  });
});
