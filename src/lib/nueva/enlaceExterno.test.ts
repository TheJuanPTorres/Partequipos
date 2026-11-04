import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  enlaceExternoDe,
  normalizarEnlaceExterno,
  tienePaginaPropia,
  validarEnlaceExterno,
} from "./enlaceExterno";

describe("enlace externo de una marca de nueva", () => {
  it("vale una dirección https de otro sitio, normalizada", () => {
    assert.equal(normalizarEnlaceExterno("  https://maquitecno.co  "), "https://maquitecno.co/");
    assert.equal(validarEnlaceExterno("https://maquitecno.co/"), true);
  });

  it("vacío vale y significa «con página propia»", () => {
    for (const v of [undefined, null, "", "   "]) {
      assert.equal(validarEnlaceExterno(v), true);
      assert.equal(normalizarEnlaceExterno(v as string | null | undefined), null);
    }
    assert.equal(tienePaginaPropia({}), true);
    assert.equal(tienePaginaPropia({ enlaceExterno: "" }), true);
  });

  it("rechaza lo que no es https a otro sitio", () => {
    for (const v of [
      "http://maquitecno.co/",
      "maquitecno.co",
      "javascript:alert(1)",
      "/contactanos/",
      "https://localhost/",
      "https://usuario:clave@maquitecno.co/",
      "https://partequipos.com/contactanos/",
      "https://partequipos-abc.vercel.app/",
    ]) {
      assert.equal(normalizarEnlaceExterno(v), null, v);
      assert.equal(typeof validarEnlaceExterno(v), "string", v);
    }
  });

  it("una marca con enlace externo no tiene página propia", () => {
    const liugong = { enlaceExterno: "https://maquitecno.co/" };
    assert.equal(enlaceExternoDe(liugong), "https://maquitecno.co/");
    assert.equal(tienePaginaPropia(liugong), false);
  });
});
