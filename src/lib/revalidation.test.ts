import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { PATRONES_DE_PAGINA } from "./revalidation";

/**
 * Un patrón de `revalidatePath(patrón, "page")` solo revalida si es el fichero
 * de ruta tal cual, con su grupo `(site)`: sin él no casa con la etiqueta de
 * la página y no hace nada, sin error (revalidation.ts, 2026-10-16).
 */
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("patrones de revalidación de páginas", () => {
  for (const [nombre, patron] of Object.entries(PATRONES_DE_PAGINA)) {
    it(`${nombre} es un page.tsx que existe, con su grupo`, () => {
      assert.ok(patron.startsWith("/(site)/"), `${patron} no lleva el grupo (site)`);
      const fichero = path.join(raiz, "src", "app", patron, "page.tsx");
      assert.ok(existsSync(fichero), `no existe ${fichero}`);
    });
  }

  it("la comprobación falla con un patrón sin el grupo (el defecto del 2026-10-16)", () => {
    const sinGrupo = PATRONES_DE_PAGINA.fichasNuevas.replace("/(site)", "");
    assert.equal(existsSync(path.join(raiz, "src", "app", sinGrupo, "page.tsx")), false);
  });

  it("ningún revalidatePath con segmento dinámico se escribe fuera de PATRONES_DE_PAGINA", () => {
    const fuente = readFileSync(path.join(raiz, "src", "lib", "revalidation.ts"), "utf8");
    const llamadas = fuente.match(/revalidatePath\(\s*[^)]*\)/g) ?? [];
    const sueltas = llamadas.filter((l) => l.includes("[") && !l.includes("PATRONES_DE_PAGINA"));
    assert.deepEqual(sueltas, []);
  });
});
