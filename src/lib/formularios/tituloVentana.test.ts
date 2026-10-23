import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ConfigFormulario } from "./configFormulario";
import { tituloDeVentana } from "./tituloVentana";

const base = { origen: "/", siteKey: null, textoBoton: "Enviar" };
const f = (o: Partial<ConfigFormulario> & { titulo: string }) =>
  ({ ...base, ...o }) as ConfigFormulario;

describe("tituloDeVentana", () => {
  it("la cotización no lleva el producto en el título, sí en el nombre accesible", () => {
    const r = tituloDeVentana(
      f({
        tipo: "cotizacion",
        titulo: "Cotización: Lubricante X",
        referencia: { texto: "Lubricante X" },
      }),
    );
    assert.equal(r.visible, "Cotización");
    assert.equal(r.accesible, "Cotización: Lubricante X");
  });
  it("«Solicitar cotización» pasa a «Cotización»", () => {
    const r = tituloDeVentana(
      f({
        tipo: "cotizacion",
        titulo: "Solicitar cotización",
        referencia: { texto: "Excavadora Y" },
      }),
    );
    assert.equal(r.visible, "Cotización");
    assert.equal(r.accesible, "Cotización: Excavadora Y");
  });
  it("«Contacto sobre …» pasa a «Contáctanos»", () => {
    assert.equal(
      tituloDeVentana(f({ tipo: "contacto", titulo: "Contacto sobre repuestos Hitachi" })).visible,
      "Contáctanos",
    );
  });
  it("los títulos genéricos se respetan", () => {
    assert.equal(
      tituloDeVentana(f({ tipo: "contacto", titulo: "Avísame cuando llegue una" })).visible,
      "Avísame cuando llegue una",
    );
    assert.equal(
      tituloDeVentana(f({ tipo: "contacto", titulo: "Contáctanos" })).visible,
      "Contáctanos",
    );
  });
});
