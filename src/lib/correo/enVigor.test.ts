import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

import { cifrar } from "./cifrado";
import { smtpEnVigor } from "./enVigor";
import { opcionesTransporte } from "./smtp";

const CLAVE = { clave: randomBytes(32) };
const SIN_CLAVE = { clave: null, motivo: "falta SMTP_CLAVE_CIFRADO" } as const;

const VERCEL = {
  SMTP_HOST: "smtp.vercel.test",
  SMTP_USER: "avisos",
  SMTP_PASS: "de-vercel",
  SMTP_FROM_ADDRESS: "avisos@ejemplo.co",
};

const PANEL = {
  servidor: "smtp.office365.com",
  cifrado: "starttls" as const,
  usuario: "ventas@ejemplo.co",
  contrasenaCifrada: cifrar("del-panel", CLAVE.clave),
  remitenteCorreo: "ventas@ejemplo.co",
  remitenteNombre: "Ventas",
};

describe("smtpEnVigor", () => {
  it("panel completo: manda el panel, con la contraseña descifrada y el puerto por defecto", () => {
    const r = smtpEnVigor(PANEL, CLAVE, VERCEL);
    assert.equal(r.origen, "panel");
    if (r.origen !== "panel") return;
    assert.equal(r.config.host, "smtp.office365.com");
    assert.equal(r.config.port, 587);
    assert.equal(r.config.pass, "del-panel");
    assert.equal(r.config.fromName, "Ventas");
    assert.equal(r.aviso, undefined);
  });

  it("SSL/TLS da 465 por defecto; un puerto escrito manda", () => {
    const ssl = smtpEnVigor({ ...PANEL, cifrado: "ssl" }, CLAVE, {});
    assert.equal(ssl.origen === "panel" && ssl.config.port, 465);
    assert.equal(ssl.origen === "panel" && opcionesTransporte(ssl.config).secure, true);
    const propio = smtpEnVigor({ ...PANEL, puerto: 2525 }, CLAVE, {});
    assert.equal(propio.origen === "panel" && propio.config.port, 2525);
  });

  it("«ninguno»: sin exigir TLS (ni secure ni requireTLS)", () => {
    const r = smtpEnVigor({ ...PANEL, cifrado: "ninguno" }, CLAVE, {});
    assert.equal(r.origen, "panel");
    if (r.origen !== "panel") return;
    const o = opcionesTransporte(r.config);
    assert.equal(o.secure, false);
    assert.equal(o.requireTLS, false);
  });

  it("panel incompleto: mandan las variables de Vercel, con aviso de qué falta", () => {
    const r = smtpEnVigor({ ...PANEL, contrasenaCifrada: null }, CLAVE, VERCEL);
    assert.equal(r.origen, "vercel");
    assert.match(r.aviso ?? "", /Contraseña/);
    if (r.origen === "vercel") assert.equal(r.config.pass, "de-vercel");
  });

  it("panel vacío: Vercel sin aviso; sin nada: ninguno con el motivo", () => {
    const r = smtpEnVigor({}, CLAVE, VERCEL);
    assert.equal(r.origen, "vercel");
    assert.equal(r.aviso, undefined);
    const n = smtpEnVigor(null, CLAVE, {});
    assert.equal(n.origen, "ninguno");
    assert.match(n.origen === "ninguno" ? n.motivo : "", /SMTP_HOST/);
  });

  it("sin clave o con otra clave: no se usa el panel, vuelve a Vercel y lo avisa", () => {
    const sin = smtpEnVigor(PANEL, SIN_CLAVE, VERCEL);
    assert.equal(sin.origen, "vercel");
    assert.match(sin.aviso ?? "", /SMTP_CLAVE_CIFRADO/);
    const otra = smtpEnVigor(PANEL, { clave: randomBytes(32) }, {});
    assert.equal(otra.origen, "ninguno");
    assert.match(otra.aviso ?? "", /otra clave/);
  });

  it("el aviso nunca lleva el usuario ni la contraseña", () => {
    for (const r of [
      smtpEnVigor({ ...PANEL, servidor: "" }, CLAVE, VERCEL),
      smtpEnVigor(PANEL, SIN_CLAVE, VERCEL),
      smtpEnVigor(PANEL, { clave: randomBytes(32) }, VERCEL),
    ]) {
      assert.equal((r.aviso ?? "").includes("ventas@"), false);
      assert.equal((r.aviso ?? "").includes("del-panel"), false);
    }
  });
});
