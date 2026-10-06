import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { esImagenAcceso, mensajeDeError, minutosDeBloqueo, urlMicrosoft } from "./acceso";

describe("esImagenAcceso", () => {
  it("reconoce el nombre con y sin el sufijo aleatorio del almacén", () => {
    assert.ok(esImagenAcceso("acceso-panel.webp"));
    assert.ok(esImagenAcceso("acceso-panel-zfmyVmgfG85W7ipUuIbR7ciZbec1Lr.webp"));
    assert.ok(esImagenAcceso("acceso-panel.JPG"));
  });

  it("no confunde otros ficheros que solo contienen el nombre", () => {
    for (const otro of [
      "acceso-panel-viejo.webp",
      "acceso-panel-viejo-2.webp",
      "mi-acceso-panel.webp",
      "acceso-panel.svg",
      "acceso-panel.webp.png",
      "",
      null,
    ]) {
      assert.equal(esImagenAcceso(otro), false, String(otro));
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
