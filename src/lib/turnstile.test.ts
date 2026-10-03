import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { turnstileEnModoPrueba, turnstileSiteKey, verificarTurnstile } from "./turnstile";

/*
 * Los tres casos de §10.11, con las claves de PRUEBA públicas de Cloudflare
 * (https://developers.cloudflare.com/turnstile/troubleshooting/testing/):
 *
 *   1x0000000000000000000000000000000AA  secreto que siempre valida
 *   2x0000000000000000000000000000000AA  secreto que siempre rechaza
 *   (sin claves)                         cae a las de prueba: acepta todo
 *
 * `fetch` está simulado e imita la respuesta documentada de Cloudflare para
 * cada secreto de prueba: así la prueba no depende de la red en CI y,
 * además, comprueba QUÉ secreto viaja. Lo de punta a punta, contra
 * Cloudflare y la base, está en CLAUDE.md §10.11.
 */

const SECRETO_APRUEBA = "1x0000000000000000000000000000000AA";
const SECRETO_RECHAZA = "2x0000000000000000000000000000000AA";
const SITE_APRUEBA = "1x00000000000000000000AA";
const TOKEN_PRUEBA = "XXXX.DUMMY.TOKEN.XXXX";

const VARIABLES = ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"] as const;
const fetchOriginal = globalThis.fetch;
const guardadas = Object.fromEntries(VARIABLES.map((v) => [v, process.env[v]]));
let secretosEnviados: string[] = [];

/** Cloudflare simulado: responde según el secreto de prueba recibido. */
function cloudflareDePrueba(respuesta?: Response | "red-caida") {
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const cuerpo = new URLSearchParams(String(init?.body));
    secretosEnviados.push(cuerpo.get("secret") ?? "");
    if (respuesta === "red-caida") throw new TypeError("fetch failed");
    if (respuesta) return respuesta;
    const exito = cuerpo.get("secret")?.startsWith("1x") === true;
    return Response.json(
      exito ? { success: true } : { success: false, "error-codes": ["invalid-input-response"] },
    );
  }) as typeof fetch;
}

beforeEach(() => {
  secretosEnviados = [];
  for (const v of VARIABLES) delete process.env[v];
});

afterEach(() => {
  globalThis.fetch = fetchOriginal;
  for (const v of VARIABLES) {
    if (guardadas[v] === undefined) delete process.env[v];
    else process.env[v] = guardadas[v];
  }
});

describe("Turnstile: los tres casos de §10.11", () => {
  it("1. clave que siempre aprueba: el envío pasa", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = SITE_APRUEBA;
    process.env.TURNSTILE_SECRET_KEY = SECRETO_APRUEBA;
    cloudflareDePrueba();

    assert.equal(await verificarTurnstile(TOKEN_PRUEBA), true);
    assert.deepEqual(secretosEnviados, [SECRETO_APRUEBA]);
    assert.equal(turnstileEnModoPrueba(), false);
  });

  it("2. clave que siempre rechaza: el envío NO pasa", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = SITE_APRUEBA;
    process.env.TURNSTILE_SECRET_KEY = SECRETO_RECHAZA;
    cloudflareDePrueba();

    assert.equal(await verificarTurnstile(TOKEN_PRUEBA), false);
    assert.deepEqual(secretosEnviados, [SECRETO_RECHAZA]);
  });

  it("3. sin claves: cae a las de prueba, que aceptan cualquier token", async () => {
    cloudflareDePrueba();

    assert.equal(await verificarTurnstile("cualquier-cosa"), true);
    assert.deepEqual(secretosEnviados, [SECRETO_APRUEBA]);
    assert.equal(turnstileSiteKey(), SITE_APRUEBA);
    assert.equal(turnstileEnModoPrueba(), true);
  });

  it("con las claves reales puestas, la clave del widget es la configurada", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "  clave-del-sitio  ";
    assert.equal(turnstileSiteKey(), "clave-del-sitio");
  });
});

describe("Turnstile: se niega por defecto", () => {
  it("sin token no llama a Cloudflare y rechaza, también sin claves", async () => {
    cloudflareDePrueba();
    assert.equal(await verificarTurnstile(undefined), false);
    assert.equal(await verificarTurnstile(""), false);
    assert.deepEqual(secretosEnviados, []);
  });

  it("con la red caída rechaza (no deja pasar sin verificar)", async () => {
    process.env.TURNSTILE_SECRET_KEY = SECRETO_APRUEBA;
    cloudflareDePrueba("red-caida");
    assert.equal(await verificarTurnstile(TOKEN_PRUEBA), false);
  });

  it("con un 5xx de Cloudflare rechaza", async () => {
    process.env.TURNSTILE_SECRET_KEY = SECRETO_APRUEBA;
    cloudflareDePrueba(new Response("error", { status: 503 }));
    assert.equal(await verificarTurnstile(TOKEN_PRUEBA), false);
  });
});
