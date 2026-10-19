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
});
