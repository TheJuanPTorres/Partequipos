import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  modoTurnstile,
  turnstileEnModoPrueba,
  turnstileSiteKey,
  verificarTurnstile,
} from "./turnstile";

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

const VARIABLES = ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY", "VERCEL_ENV"] as const;
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
    // Son las claves de PRUEBA aunque vengan en las variables.
    assert.equal(turnstileEnModoPrueba(), true);
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
    process.env.TURNSTILE_SECRET_KEY = "secreto-real";
    assert.equal(turnstileSiteKey(), "clave-del-sitio");
    assert.equal(modoTurnstile().modo, "real");
  });
  it("en el preview (VERCEL_ENV=preview) sin claves, también las de prueba", () => {
    process.env.VERCEL_ENV = "preview";
    assert.equal(turnstileSiteKey(), SITE_APRUEBA);
    assert.equal(turnstileEnModoPrueba(), true);
  });
});

/*
 * HALLAZGO del 2026-10-06: la ficha publicada pintaba el widget con la clave de
 * PRUEBA (aprueba siempre). En producción, sin claves reales —o con las de
 * prueba en las variables—, ni widget ni verificación fingida: se acepta como
 * en §10.11 y se avisa en el registro.
 */
describe("Turnstile en producción: nunca las claves de prueba", () => {
  const errores: string[] = [];
  const consolaOriginal = console.error;
  beforeEach(() => {
    process.env.VERCEL_ENV = "production";
    errores.length = 0;
    console.error = (...a: unknown[]) => void errores.push(a.join(" "));
  });
  afterEach(() => {
    console.error = consolaOriginal;
  });

  it("sin claves: sin widget, el envío se acepta sin llamar a Cloudflare y queda en el registro", async () => {
    cloudflareDePrueba();
    assert.equal(turnstileSiteKey(), null);
    assert.equal(modoTurnstile().modo, "sin-claves");
    assert.equal(await verificarTurnstile(undefined), true);
    assert.deepEqual(secretosEnviados, []);
    assert.match(errores.join(" "), /\[turnstile\].*SIN verificación/);
  });

  it("con las claves de PRUEBA en las variables: igual que sin claves", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = SITE_APRUEBA;
    process.env.TURNSTILE_SECRET_KEY = SECRETO_APRUEBA;
    cloudflareDePrueba();
    assert.equal(turnstileSiteKey(), null);
    assert.equal(await verificarTurnstile(TOKEN_PRUEBA), true);
    assert.deepEqual(secretosEnviados, []);
    assert.match(errores.join(" "), /son las de PRUEBA/);
  });

  it("solo la clave del sitio, sin secreto: sin widget", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "clave-real";
    assert.equal(turnstileSiteKey(), null);
  });

  it("con claves reales: widget y verificación de verdad, con el secreto real", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "0x4AAAAAAA-clave-real";
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAA-secreto-real";
    cloudflareDePrueba();
    assert.equal(turnstileSiteKey(), "0x4AAAAAAA-clave-real");
    assert.equal(await verificarTurnstile(undefined), false);
    await verificarTurnstile(TOKEN_PRUEBA);
    assert.deepEqual(secretosEnviados, ["0x4AAAAAAA-secreto-real"]);
    assert.deepEqual(errores, []);
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
