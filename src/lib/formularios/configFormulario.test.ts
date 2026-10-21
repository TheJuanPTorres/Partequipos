import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { configContactoMarca } from "./configFormulario";

const base = { origen: "/x/", siteKey: "k", boton: "", marca: "Kobelco" };

describe("configContactoMarca", () => {
  it("marca o tipo: contacto con las preguntas de clasificación", () => {
    const c = configContactoMarca({ ...base, boton: "Enviar solicitud" });
    assert.equal(c.tipo, "contacto");
    assert.equal(c.clasificacion, true);
    assert.equal(c.conCiudad, false);
    assert.equal(c.titulo, "Contacto sobre repuestos Kobelco");
    assert.equal(c.textoBoton, "Enviar solicitud");
  });

  it("modelo: solicitud de repuesto con el modelo, ciudad y sin clasificación", () => {
    const c = configContactoMarca({ ...base, modelo: { id: 7, nombre: "SK200" } });
    assert.equal(c.tipo, "repuesto");
    assert.deepEqual(c.referencia, { tipo: "modelos-repuesto", id: 7, texto: "SK200" });
    assert.equal(c.clasificacion, false);
    assert.equal(c.conCiudad, true);
    assert.equal(c.textoBoton, "Enviar");
  });

  it("otra página (servicio técnico): sus textos y sus campos", () => {
    const c = configContactoMarca({
      ...base,
      formulario: { titulo: "Servicio", conCiudad: true, etiquetaMensaje: "¿Qué necesitas?" },
    });
    assert.equal(c.titulo, "Servicio");
    assert.equal(c.clasificacion, false);
    assert.equal(c.etiquetaMensaje, "¿Qué necesitas?");
  });

  it("ficha de maquinaria nueva: cotización con el equipo, Ciudad y «¿Qué necesitas?»", () => {
    const c = configContactoMarca({ ...base, equipo: { id: 12, nombre: "Excavadora ZX130-5B" } });
    assert.equal(c.tipo, "cotizacion");
    assert.deepEqual(c.referencia, {
      tipo: "equipos-nuevos",
      id: 12,
      texto: "Excavadora ZX130-5B",
    });
    assert.equal(c.clasificacion, false);
    assert.equal(c.conCiudad, true);
    assert.equal(c.etiquetaMensaje, "¿Qué necesitas?");
    assert.equal(c.titulo, "Cotización: Excavadora ZX130-5B");
  });
});
