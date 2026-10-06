import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { ATRIBUTO_PIE_SIN_TARJETA } from "./PieSinTarjeta";

/**
 * El marcador (`PieSinTarjeta.tsx`) y la regla del pie (`pie.module.css`) van
 * por separado: si uno cambia de nombre sin el otro, la tarjeta vuelve a
 * salir en silencio. Y las páginas que lo piden tienen que seguir pintándolo.
 */
const dir = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(dir, "../../..");
const css = readFileSync(path.join(dir, "pie.module.css"), "utf8");

/** Páginas que piden el pie sin tarjeta (decisión de dirección, 2026-10-06). */
const PAGINAS = [
  "src/app/(site)/maquinaria-pesada/maquinaria-pesada-nueva/marcas/[marca]/[tipo]/[modelo]/page.tsx",
];

describe("pie sin la tarjeta roja", () => {
  it("el CSS del pie oculta la tarjeta con el MISMO atributo que pinta el marcador", () => {
    const regla = new RegExp(
      String.raw`:global\(body:has\(\[${ATRIBUTO_PIE_SIN_TARJETA}\]\)\)\s*\.marco\s*\{\s*display:\s*none;`,
    );
    assert.match(css, regla);
  });

  it("y quita la reserva del vuelo de la imagen, que va dentro de la tarjeta", () => {
    assert.ok(
      css.includes(`:global(body:has([${ATRIBUTO_PIE_SIN_TARJETA}])) .pie[data-con-imagen]`),
    );
  });

  for (const pagina of PAGINAS) {
    it(`${path.basename(path.dirname(pagina))} pinta el marcador`, () => {
      const fuente = readFileSync(path.join(raiz, pagina), "utf8");
      assert.match(fuente, /<PieSinTarjeta \/>/);
    });
  }

  it("detecta una regla con otro atributo (comprobación del propio guardián)", () => {
    const otro = css.replaceAll(ATRIBUTO_PIE_SIN_TARJETA, "data-otro");
    assert.doesNotMatch(
      otro,
      new RegExp(String.raw`\[${ATRIBUTO_PIE_SIN_TARJETA}\]\)\)\s*\.marco`),
    );
  });
});
