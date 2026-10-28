import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { conMensaje, enlaceWhatsApp, mensajeWhatsApp } from "./whatsapp";

describe("conMensaje", () => {
  it("añade el mensaje al enlace sin cambiar el número ni la etiqueta", () => {
    const base = enlaceWhatsApp("+57 317 000 0000");
    assert.ok(base);
    const r = conMensaje(base, "Hola, quiero cotizar el lubricante Eni X 5W-40.");
    assert.equal(r.etiqueta, base.etiqueta);
    const u = new URL(r.href);
    assert.equal(u.pathname, "/573170000000");
    assert.equal(u.searchParams.get("text"), "Hola, quiero cotizar el lubricante Eni X 5W-40.");
  });
  it("sustituye un mensaje previo", () => {
    const base = enlaceWhatsApp("+57 317 000 0000", "antes");
    assert.ok(base);
    assert.equal(new URL(conMensaje(base, "después").href).searchParams.get("text"), "después");
  });
});

describe("mensajeWhatsApp", () => {
  it("con referencia, nombra lo que se consulta", () => {
    assert.equal(
      mensajeWhatsApp(" Excavadora Hitachi ZX350 ", "Contacto sobre maquinaria Hitachi"),
      "Hola, quiero información sobre Excavadora Hitachi ZX350.",
    );
  });

  it("sin referencia, toma el tema de un título «Contacto sobre …»", () => {
    assert.equal(
      mensajeWhatsApp(undefined, "Contacto sobre repuestos Hitachi"),
      "Hola, quiero información sobre repuestos Hitachi.",
    );
  });

  it("con otro título (Contáctanos), un saludo neutro", () => {
    assert.equal(mensajeWhatsApp(undefined, "Escríbenos"), "Hola, quiero información.");
    assert.equal(mensajeWhatsApp("  ", " "), "Hola, quiero información.");
  });
});
