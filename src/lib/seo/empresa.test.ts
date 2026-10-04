import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { seoConfig } from "./config";
import { datosEmpresa, validarTelefono, validarUrlRed } from "./empresa";

describe("datosEmpresa", () => {
  it("sin global, todo sale del respaldo de config.ts (lo que pinta hoy el sitio)", () => {
    assert.deepEqual(datosEmpresa(undefined), {
      telefono: seoConfig.contact.phone,
      whatsapp: seoConfig.contact.phone,
      correo: seoConfig.contact.email,
      direccion: seoConfig.contact.streetAddress,
      ciudad: seoConfig.contact.addressLocality,
      redes: [...seoConfig.sameAs],
    });
  });

  it("lo escrito en el panel gana, campo a campo", () => {
    const e = datosEmpresa({ telefono: "+57 300 000 0000", correo: "  ventas@x.co ", redes: [] });
    assert.equal(e.telefono, "+57 300 000 0000");
    assert.equal(e.whatsapp, "+57 300 000 0000", "sin WhatsApp propio, el teléfono");
    assert.equal(e.correo, "ventas@x.co");
    assert.equal(e.direccion, seoConfig.contact.streetAddress, "vacío: respaldo");
    assert.deepEqual(e.redes, [...seoConfig.sameAs], "sin redes: respaldo");
  });

  it("WhatsApp propio y redes del panel, sin entradas vacías", () => {
    const e = datosEmpresa({
      whatsapp: "+57 311 111 1111",
      redes: [{ url: "https://a.co/" }, { url: " " }, { url: null }],
    });
    assert.equal(e.whatsapp, "+57 311 111 1111");
    assert.deepEqual(e.redes, ["https://a.co/"]);
  });
});

describe("validaciones del panel", () => {
  it("teléfono: vacío vale; hacen falta 10 cifras", () => {
    assert.equal(validarTelefono(""), true);
    assert.equal(validarTelefono("+57 317 670 7071"), true);
    assert.match(String(validarTelefono("492-62-60")), /indicativo/);
  });

  it("redes: solo https://", () => {
    assert.equal(validarUrlRed("https://www.facebook.com/partequip0s"), true);
    assert.match(String(validarUrlRed("http://x.co")), /https/);
    assert.match(String(validarUrlRed("facebook.com/x")), /no es una dirección válida/i);
  });
});
