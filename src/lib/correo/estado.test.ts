import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { errorSinSecretos, estadoCorreo } from "./estado";
import { enviarCorreoDePrueba } from "./prueba";

const COMPLETO = {
  SMTP_HOST: "smtp.ejemplo.test",
  SMTP_USER: "usuario-smtp",
  SMTP_PASS: "clave-secreta",
  SMTP_FROM_ADDRESS: "avisos@ejemplo.test",
};

describe("estado del correo en el panel", () => {
  it("sin SMTP: no configurado y QUÉ falta (solo nombres)", () => {
    const e = estadoCorreo({ SMTP_HOST: "smtp.ejemplo.test" });
    assert.equal(e.configurado, false);
    if (e.configurado) return;
    assert.match(e.motivo, /SMTP_USER/);
  });
  it("con SMTP: servidor, puerto, cifrado y remitente, NUNCA usuario ni contraseña", () => {
    const e = estadoCorreo({ ...COMPLETO, SMTP_FROM_NAME: "Avisos" });
    assert.deepEqual(e, {
      configurado: true,
      servidor: "smtp.ejemplo.test",
      puerto: 587,
      cifrado: "STARTTLS obligatorio",
      remitente: "Avisos <avisos@ejemplo.test>",
    });
    assert.doesNotMatch(JSON.stringify(e), /usuario-smtp|clave-secreta/);
  });
  it("el error de envío sale sin usuario ni contraseña", () => {
    const t = errorSinSecretos(
      new Error("Invalid login: 535 usuario-smtp / clave-secreta rejected"),
      COMPLETO,
    );
    assert.doesNotMatch(t, /usuario-smtp|clave-secreta/);
    assert.match(t, /\[oculto\]/);
  });
});

describe("correo de prueba", () => {
  const enviado: unknown[] = [];
  const enviar = async (c: unknown) => {
    enviado.push(c);
    return { messageId: "<abc@ejemplo.test>" };
  };

  it("solo un administrador", async () => {
    const r = await enviarCorreoDePrueba("a@ejemplo.test", {
      esAdministrador: false,
      enviar,
      env: COMPLETO,
    });
    assert.equal(r.status, 403);
  });
  it("una sola dirección válida", async () => {
    for (const d of ["", "no-es-correo", "a@x.co, b@x.co", "Nombre <a@x.co>", 42]) {
      const r = await enviarCorreoDePrueba(d, { esAdministrador: true, enviar, env: COMPLETO });
      assert.equal(r.status, 400, String(d));
    }
  });
  it("sin SMTP no intenta enviar y dice qué falta", async () => {
    const antes = enviado.length;
    const r = await enviarCorreoDePrueba("a@ejemplo.test", {
      esAdministrador: true,
      enviar,
      env: {},
    });
    assert.equal(r.status, 409);
    assert.match(r.cuerpo.mensaje, /SMTP_HOST/);
    assert.equal(enviado.length, antes);
  });
  it("con SMTP: envía a esa dirección y devuelve el identificador", async () => {
    const r = await enviarCorreoDePrueba(" a@ejemplo.test ", {
      esAdministrador: true,
      enviar,
      env: { ...COMPLETO, VERCEL_ENV: "preview" },
    });
    assert.equal(r.status, 200);
    assert.equal(r.cuerpo.ok, true);
    assert.match(r.cuerpo.mensaje, /abc@ejemplo\.test/);
    const ultimo = enviado.at(-1) as { to: string; subject: string };
    assert.equal(ultimo.to, "a@ejemplo.test");
    assert.match(ultimo.subject, /preview/);
  });
  it("si el servidor falla: el motivo, sin secretos", async () => {
    const r = await enviarCorreoDePrueba("a@ejemplo.test", {
      esAdministrador: true,
      enviar: async () => {
        throw new Error("Invalid login for usuario-smtp");
      },
      env: COMPLETO,
    });
    assert.equal(r.status, 502);
    assert.equal(r.cuerpo.ok, false);
    assert.doesNotMatch(r.cuerpo.mensaje, /usuario-smtp/);
  });
});
