import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { llevaAlFormulario } from "./enlaceContacto";

describe("llevaAlFormulario", () => {
  it("reconoce /contactanos/ y las anclas de contacto", () => {
    for (const h of [
      "/contactanos/",
      "/contactanos",
      "/contactanos/#formulario",
      "#contacto",
      "#formulario-contacto",
      "#cotizar",
    ]) {
      assert.equal(llevaAlFormulario(h), true, h);
    }
  });
  it("no toca el resto de enlaces", () => {
    for (const h of [
      "/nosotros/",
      "https://x.com/contactanos/",
      "#modelos-repuestos",
      "/contactanos-ventas/",
      "",
      null,
      undefined,
    ]) {
      assert.equal(llevaAlFormulario(h), false, String(h));
    }
  });
});
