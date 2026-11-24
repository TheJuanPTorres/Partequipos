import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { COOKIE_TEMA, esRutaDelPanel, temaQueFalta } from "./temaPorDefecto";

describe("tema claro por defecto del panel", () => {
  it("sin elección, o con una que Payload no entiende, pone claro", () => {
    assert.equal(temaQueFalta(undefined), "light");
    assert.equal(temaQueFalta(""), "light");
    assert.equal(temaQueFalta("auto"), "light");
    assert.equal(temaQueFalta("DARK"), "light");
  });

  it("respeta la elección del usuario", () => {
    assert.equal(temaQueFalta("dark"), null);
    assert.equal(temaQueFalta("light"), null);
  });

  it("solo actúa en el panel", () => {
    assert.equal(esRutaDelPanel("/admin"), true);
    assert.equal(esRutaDelPanel("/admin/"), true);
    assert.equal(esRutaDelPanel("/admin/collections/marcas"), true);
    assert.equal(esRutaDelPanel("/administracion/"), false);
    assert.equal(esRutaDelPanel("/"), false);
    assert.equal(esRutaDelPanel("/api/users/me"), false);
  });

  it("la cookie es la que lee el Payload instalado", () => {
    const raiz = path.resolve(import.meta.dirname, "../../..");
    const servidor = readFileSync(
      path.join(raiz, "node_modules/@payloadcms/next/dist/utilities/getRequestTheme.js"),
      "utf8",
    );
    const navegador = readFileSync(
      path.join(raiz, "node_modules/@payloadcms/ui/dist/providers/Theme/index.js"),
      "utf8",
    );
    // `<cookiePrefix o "payload">-theme`, y la elección manda sobre el sistema operativo.
    assert.equal(COOKIE_TEMA, "payload-theme");
    assert.match(servidor, /cookiePrefix \|\| 'payload'\}-theme/);
    assert.match(navegador, /cookiePrefix \|\| "payload"\}-theme/);
    assert.ok(
      servidor.indexOf("themeFromCookie") < servidor.indexOf("Sec-CH-Prefers-Color-Scheme"),
      "la cookie tiene que leerse antes que la preferencia del sistema",
    );
  });

  it("el proxy corre en el panel y el proyecto no cambia el prefijo de la cookie", () => {
    const raiz = path.resolve(import.meta.dirname, "../../..");
    const proxy = readFileSync(path.join(raiz, "src/proxy.ts"), "utf8");
    assert.match(proxy, /"\/admin\/:path\*"/);
    assert.match(proxy, /"\/admin"/);
    const config = readFileSync(path.join(raiz, "src/payload.config.ts"), "utf8");
    assert.doesNotMatch(config, /cookiePrefix/);
  });
});
