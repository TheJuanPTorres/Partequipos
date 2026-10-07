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
    assert.equal(m.config.secure, false);
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
});
