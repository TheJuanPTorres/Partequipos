import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { idDePagina, rutaDeVuelta } from "./rutas";

describe("vista previa del borrador: entradas", () => {
  it("el id de la página, solo un entero positivo", () => {
    assert.equal(idDePagina("12"), 12);
    for (const malo of [null, "", "0", "-3", "1.5", "12abc", " 12", "1e3", "99999999999"])
      assert.equal(idDePagina(malo), null, String(malo));
  });

  it("la vuelta, solo una ruta del propio sitio", () => {
    assert.equal(rutaDeVuelta("/nosotros/"), "/nosotros/");
    assert.equal(rutaDeVuelta("/"), "/");
    for (const malo of [
      "//otro.sitio/",
      "https://otro.sitio/",
      "/\\otro.sitio",
      "nosotros",
      "",
      3,
      "/a\nb",
    ])
      assert.equal(rutaDeVuelta(malo), "/", String(malo));
  });
});
