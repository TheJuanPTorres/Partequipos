import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { FUENTE_RESPALDO, declaraFuenteRespaldo } from "./fuenteRespaldo";

/*
 * GUARDARRAÍL (2026-10-06): la cabecera del artículo fija su alto con una
 * copia invisible en la fuente de respaldo de next/font. Si Next la renombra,
 * la copia caería en otra fuente y el desplazamiento al llegar Inter volvería
 * sin ningún error. El build lo comprueba en su CSS real
 * (`scripts/qa/fuente-respaldo.ts`); aquí, la decisión y que falla cuando debe.
 */
describe("fuente de respaldo de Inter", () => {
  it("reconoce la declaración tal como la sirve el build (Turbopack, Next 16.3.5)", () => {
    const servido =
      "@font-face{font-family:Inter Fallback;src:local(Arial);ascent-override:90.44%;descent-override:22.52%;line-gap-override:0.0%;size-adjust:107.12%}";
    assert.equal(declaraFuenteRespaldo(servido), true);
    assert.equal(
      declaraFuenteRespaldo("@font-face { font-family: 'Inter Fallback'; src: local(Arial) }"),
      true,
    );
  });

  it("falla si el nombre cambia o si no hay @font-face", () => {
    assert.equal(
      declaraFuenteRespaldo("@font-face{font-family:__Inter_Fallback_a1b2;src:local(Arial)}"),
      false,
    );
    assert.equal(
      declaraFuenteRespaldo("@font-face{font-family:Inter Fallback 2;src:local(Arial)}"),
      false,
    );
    assert.equal(declaraFuenteRespaldo(".x{font-family:Inter Fallback}"), false);
    assert.equal(declaraFuenteRespaldo(""), false);
  });

  it("el CSS de la cabecera usa exactamente ese nombre", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src", "components", "blog", "cabeceraArticulo.module.css"),
      "utf8",
    );
    assert.ok(
      css.includes(`"${FUENTE_RESPALDO}"`),
      `cabeceraArticulo.module.css debe usar "${FUENTE_RESPALDO}"`,
    );
  });
});
