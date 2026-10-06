import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { imagenDeAcceso, mensajeDeError, minutosDeBloqueo, urlMicrosoft } from "./acceso";

describe("imagenDeAcceso", () => {
  it("con la imagen elegida y poblada, la devuelve", () => {
    assert.deepEqual(imagenDeAcceso({ url: "https://x/a.webp", width: 1254, height: 1254 }), {
      url: "https://x/a.webp",
      width: 1254,
      height: 1254,
    });
  });

  it("vacía, sin poblar o sin medidas: null (degradado)", () => {
    for (const v of [
      null,
      undefined,
      7,
      {},
      { url: "", width: 1, height: 1 },
      { url: "https://x/a", width: 0, height: 9 },
    ]) {
      assert.equal(imagenDeAcceso(v), null, JSON.stringify(v));
    }
  });
});

const bloqueo = { intentos: 5, minutos: 30 };

describe("urlMicrosoft", () => {
  it("sin variable, el botón va desactivado", () => {
    assert.equal(urlMicrosoft(undefined), null);
    assert.equal(urlMicrosoft(""), null);
    assert.equal(urlMicrosoft("   "), null);
  });

  it("solo acepta https", () => {
    assert.equal(
      urlMicrosoft("https://auth.ejemplo.com/inicio"),
      "https://auth.ejemplo.com/inicio",
    );
    for (const malo of [
      "http://auth.ejemplo.com/",
      "javascript:alert(1)",
      "/admin/login",
      "activo",
    ]) {
      assert.equal(urlMicrosoft(malo), null, malo);
    }
  });
});

describe("mensajeDeError", () => {
  it("contraseña mala y cuenta bloqueada (los dos 401) dan un mensaje que avisa del bloqueo", () => {
    const texto = mensajeDeError(401, bloqueo);
    assert.match(texto, /Correo o contraseña incorrectos/);
    assert.match(texto, /5 intentos/);
    assert.match(texto, /30 minutos/);
  });

  it("no dice si el correo existe ni si la cuenta está bloqueada", () => {
    const texto = mensajeDeError(401, bloqueo).toLowerCase();
    assert.doesNotMatch(texto, /no existe|no encontrad|está bloquead|ha sido bloquead/);
  });

  it("un fallo de red o del servidor no habla de credenciales", () => {
    for (const estado of [null, 429, 500, 503]) {
      assert.doesNotMatch(mensajeDeError(estado, bloqueo), /incorrect/, String(estado));
    }
  });

  it("sin correo o sin contraseña, lo pide", () => {
    assert.match(mensajeDeError(400, bloqueo), /Escribe tu correo y tu contraseña/);
  });
});

describe("minutosDeBloqueo", () => {
  it("convierte el lockTime de Payload", () => {
    assert.equal(minutosDeBloqueo(30 * 60 * 1000), 30);
    assert.equal(minutosDeBloqueo(undefined), 10);
  });
});
