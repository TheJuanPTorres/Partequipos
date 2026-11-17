import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sinTelefonoDeEmpresa } from "./telefonoEnDescripcion";

const TEL = "+57 317 670 7071";

describe("sinTelefonoDeEmpresa", () => {
  it("quita el teléfono de la empresa con su icono y la raya, y deja el resto de la frase", () => {
    const r = sinTelefonoDeEmpresa(
      ["Equipo revisado. 📞 317 670 7071 — Cotiza ya tu excavadora usada"],
      TEL,
    );
    assert.equal(r.estaba, true);
    assert.deepEqual(r.parrafos, ["Equipo revisado. Cotiza ya tu excavadora usada"]);
  });

  it("con prefijo +57, guiones o puntos, y al final del párrafo", () => {
    for (const t of [
      "Llama al +57 317-670-7071",
      "Llama al 317.670.7071",
      "Llama al (+57) 3176707071",
    ]) {
      const r = sinTelefonoDeEmpresa([t], TEL);
      assert.equal(r.estaba, true, t);
      assert.deepEqual(r.parrafos, ["Llama al"], t);
    }
  });

  it("un párrafo que solo era el teléfono desaparece", () => {
    const r = sinTelefonoDeEmpresa(["Primero.", "📞 317 670 7071"], TEL);
    assert.deepEqual(r.parrafos, ["Primero."]);
  });

  it("otro número, un año o unas horas no se tocan", () => {
    const p = ["Horómetro 6.860 h, año 2015. Otro contacto: 300 123 4567. Serie 3176707071234"];
    const r = sinTelefonoDeEmpresa(p, TEL);
    assert.equal(r.estaba, false);
    assert.deepEqual(r.parrafos, p);
  });

  it("sin teléfono de empresa, el texto queda igual", () => {
    const p = ["📞 317 670 7071"];
    assert.deepEqual(sinTelefonoDeEmpresa(p, null), { parrafos: p, estaba: false });
    assert.deepEqual(sinTelefonoDeEmpresa(p, "123"), { parrafos: p, estaba: false });
  });
});
