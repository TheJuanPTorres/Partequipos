import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Las dependencias que sostienen el ARRANQUE van con versión exacta, no con
 * rango: `next` y todo el ecosistema de Payload. Ver CLAUDE.md §10.28.
 *
 * Por qué es un guardarraíl y no una nota: un rango no falla nunca — deriva. El
 * 2026-09-17, `^3.86.0` resolvió a Payload **3.89.0** al regenerar el lock, sin
 * un solo aviso, y la documentación siguió hablando de 3.88. Con Next es peor:
 * la ventana que Payload soporta es estrecha (`>=16.2.6 <17.0.0`, y 15.5 nunca
 * estuvo soportado), así que un caret puede llevarnos a una versión que nadie ha
 * verificado con este panel.
 *
 * Subir cualquiera de estas es una tarea con su verificación —preview ruta a
 * ruta, trazado de `sharp`, proxy, CSP y revert de alias preparado—, no un
 * `npm install` de paso.
 *
 * La lista NO está escrita a mano: se deduce de `package.json`, así que un
 * paquete nuevo de Payload queda cubierto sin tocar esta prueba.
 */
const EXACTA = /^\d+\.\d+\.\d+$/;

const esCritica = (nombre: string) =>
  nombre === "next" || nombre === "payload" || nombre.startsWith("@payloadcms/");

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { dependencies } = JSON.parse(readFileSync(path.join(raiz, "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
};

const criticas = Object.entries(dependencies).filter(([nombre]) => esCritica(nombre));

describe("versiones de dependencias críticas", () => {
  it("encuentra las dependencias críticas declaradas", () => {
    assert.ok(
      criticas.length >= 7,
      `solo se encontraron ${criticas.length}: ¿cambió package.json?`,
    );
    assert.ok(
      criticas.some(([nombre]) => nombre === "next"),
      "next no está en dependencies",
    );
  });

  for (const [nombre, declarado] of criticas) {
    it(`${nombre} está fijado a una versión exacta`, () => {
      assert.match(
        declarado,
        EXACTA,
        `«${nombre}»: "${declarado}" es un rango. Fíjalo exacto (CLAUDE.md §10.28)`,
      );
    });
  }

  it("detecta un rango (comprobación del propio guardián)", () => {
    assert.doesNotMatch("^16.3.5", EXACTA);
    assert.doesNotMatch(">=16.2.6", EXACTA);
    assert.match("16.3.5", EXACTA);
  });
});
