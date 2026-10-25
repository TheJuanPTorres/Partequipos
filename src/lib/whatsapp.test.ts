import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { conMensaje, enlaceWhatsApp } from "./whatsapp";

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
