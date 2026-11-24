import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { candidatosDeSlug, nombreDeCopia } from "./duplicar";

describe("duplicar una ficha", () => {
  it("el nombre lleva «(copia)» una sola vez", () => {
    assert.equal(nombreDeCopia("Excavadora ZX130"), "Excavadora ZX130 (copia)");
    assert.equal(nombreDeCopia("Excavadora ZX130 (copia)"), "Excavadora ZX130 (copia)");
    assert.equal(nombreDeCopia(""), "");
    assert.equal(nombreDeCopia(null), null);
  });

  it("las direcciones de la copia: «-copia», «-copia-2»…, sin encadenar «-copia-copia»", () => {
    assert.deepEqual(candidatosDeSlug("zx130", 3), [
      "zx130-copia",
      "zx130-copia-2",
      "zx130-copia-3",
    ]);
    assert.deepEqual(candidatosDeSlug("zx130-copia", 2), ["zx130-copia", "zx130-copia-2"]);
    assert.deepEqual(candidatosDeSlug("zx130-copia-4", 1), ["zx130-copia"]);
  });
});
