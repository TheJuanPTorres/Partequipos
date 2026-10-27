import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { destinoAvisos, modoCorreo, opcionesTransporte } from "./smtp";

const COMPLETO = {
  SMTP_HOST: "smtp.ejemplo.test",
  SMTP_USER: "avisos",
  SMTP_PASS: "secreto",
  SMTP_FROM_ADDRESS: "avisos@ejemplo.test",
};

describe("correo de avisos por SMTP (§10.11)", () => {
  it("sin variables: sin correo, y dice QUÉ falta (solo nombres)", () => {
    const m = modoCorreo({});
    assert.equal(m.modo, "sin-correo");
    assert.match(
      m.modo === "sin-correo" ? m.motivo : "",
      /SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM_ADDRESS/,
    );
  });

  it("falta una sola: sin correo", () => {
    const m = modoCorreo({ ...COMPLETO, SMTP_PASS: " " });
    assert.equal(m.modo, "sin-correo");
    assert.match(m.modo === "sin-correo" ? m.motivo : "", /SMTP_PASS/);
  });

  it("completo: puerto 587 y STARTTLS obligatorio por defecto; nombre «Partequipos»", () => {
    const m = modoCorreo(COMPLETO);
    assert.equal(m.modo, "smtp");
    if (m.modo !== "smtp") return;
    assert.equal(m.config.port, 587);
    assert.equal(m.config.cifrado, "starttls");
    assert.equal(m.config.fromName, "Partequipos");
    const t = opcionesTransporte(m.config);
    assert.equal(t.requireTLS, true);
    assert.deepEqual(t.auth, { user: "avisos", pass: "secreto" });
  });

  it("SMTP_SECURE=true y 465: TLS desde el principio", () => {
    const m = modoCorreo({ ...COMPLETO, SMTP_PORT: "465", SMTP_SECURE: "TRUE" });
    assert.equal(m.modo, "smtp");
    if (m.modo !== "smtp") return;
    assert.equal(m.config.port, 465);
    assert.equal(opcionesTransporte(m.config).secure, true);
    assert.equal(opcionesTransporte(m.config).requireTLS, false);
  });

  it("puerto inválido: sin correo", () => {
    assert.equal(modoCorreo({ ...COMPLETO, SMTP_PORT: "abc" }).modo, "sin-correo");
    assert.equal(modoCorreo({ ...COMPLETO, SMTP_PORT: "70000" }).modo, "sin-correo");
  });
});

describe("destino de los avisos: el preview nunca escribe al cliente (§10.21)", () => {
  it("con destino propio, ese, en cualquier entorno", () => {
    assert.equal(
      destinoAvisos("cliente@x.co", { SOLICITUDES_EMAIL_TO: "a@x.co, b@x.co" }),
      "a@x.co, b@x.co",
    );
  });
  it("producción sin destino propio: el correo de la empresa", () => {
    assert.equal(destinoAvisos("cliente@x.co", { VERCEL_ENV: "production" }), "cliente@x.co");
  });
  it("preview o local sin destino propio: NO se envía", () => {
    assert.equal(destinoAvisos("cliente@x.co", { VERCEL_ENV: "preview" }), null);
    assert.equal(destinoAvisos("cliente@x.co", {}), null);
  });
  it("producción: el correo del panel gana a SOLICITUDES_EMAIL_TO y al de la empresa", () => {
    const env = { VERCEL_ENV: "production", SOLICITUDES_EMAIL_TO: "env@x.co" };
    assert.equal(destinoAvisos("cliente@x.co", env, "panel@x.co"), "panel@x.co");
    assert.equal(destinoAvisos("cliente@x.co", env, "  "), "env@x.co");
  });
  it("fuera de producción el correo del panel se ignora (la base es un clon)", () => {
    assert.equal(destinoAvisos("cliente@x.co", { VERCEL_ENV: "preview" }, "panel@x.co"), null);
    const env = { VERCEL_ENV: "preview", SOLICITUDES_EMAIL_TO: "p@x.co" };
    assert.equal(destinoAvisos("cliente@x.co", env, "panel@x.co"), "p@x.co");
  });
});
