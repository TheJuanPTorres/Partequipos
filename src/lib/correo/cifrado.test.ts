import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

import { cifrar, claveDeCifrado, descifrar } from "./cifrado";

const CLAVE = randomBytes(32);

describe("cifrar y descifrar", () => {
  it("ida y vuelta, y el texto no aparece en lo guardado", () => {
    const guardado = cifrar("contraseña-de-prueba ñ", CLAVE);
    assert.match(guardado, /^v1:[^:]+:[^:]+:[^:]+$/);
    assert.equal(guardado.includes("contraseña"), false);
    assert.equal(descifrar(guardado, CLAVE), "contraseña-de-prueba ñ");
  });

  it("el mismo texto da otro resultado cada vez (IV nuevo)", () => {
    assert.notEqual(cifrar("x", CLAVE), cifrar("x", CLAVE));
  });

  it("con otra clave, alterado o en otro formato: null, nunca basura", () => {
    const guardado = cifrar("secreto", CLAVE);
    assert.equal(descifrar(guardado, randomBytes(32)), null);
    const partes = guardado.split(":");
    const alterado = [...partes.slice(0, 3), Buffer.from("otra cosa").toString("base64")].join(":");
    assert.equal(descifrar(alterado, CLAVE), null);
    assert.equal(descifrar("secreto", CLAVE), null);
    assert.equal(descifrar("v2:a:b:c", CLAVE), null);
  });
});

describe("claveDeCifrado", () => {
  const propia = randomBytes(32).toString("base64");

  it("la variable propia, si son 32 bytes", () => {
    const c = claveDeCifrado({ SMTP_CLAVE_CIFRADO: propia, VERCEL_ENV: "production" });
    assert.ok(c.clave);
    assert.equal(c.clave.toString("base64"), propia);
    const corta = claveDeCifrado({ SMTP_CLAVE_CIFRADO: "abc", VERCEL_ENV: "production" });
    assert.equal(corta.clave, null);
  });

  it("en el sitio publicado es obligatoria: no se deriva de PAYLOAD_SECRET", () => {
    const c = claveDeCifrado({ VERCEL_ENV: "production", PAYLOAD_SECRET: "s" });
    assert.equal(c.clave, null);
    assert.match(c.clave === null ? c.motivo : "", /SMTP_CLAVE_CIFRADO/);
  });

  it("fuera de él, se deriva de PAYLOAD_SECRET (estable, y otra por cada secreto)", () => {
    const a = claveDeCifrado({ VERCEL_ENV: "preview", PAYLOAD_SECRET: "uno" });
    const b = claveDeCifrado({ VERCEL_ENV: "preview", PAYLOAD_SECRET: "uno" });
    const c = claveDeCifrado({ PAYLOAD_SECRET: "dos" });
    assert.ok(a.clave && b.clave && c.clave);
    assert.equal(a.clave.length, 32);
    assert.equal(a.clave.equals(b.clave), true);
    assert.equal(a.clave.equals(c.clave), false);
    assert.equal(claveDeCifrado({}).clave, null);
  });
});
