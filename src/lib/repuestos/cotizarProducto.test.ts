import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ConfigFormulario } from "@/lib/formularios/configFormulario";

import { cotizacionDeProducto } from "./cotizarProducto";

const base: ConfigFormulario = {
  tipo: "contacto",
  origen: "/categoria/ejemplo/",
  siteKey: null,
  whatsapp: { href: "https://wa.me/573000000000", etiqueta: "300 000 0000" },
  titulo: "Contacto sobre repuestos ejemplo",
  textoBoton: "Enviar",
  clasificacion: true,
  mensajeInicial: "Quiero cotizar: otra cosa",
};

describe("cotizacionDeProducto", () => {
  const c = cotizacionDeProducto(
    base,
    " RODILLO INFERIOR ",
    "Tren de rodaje para maquinaria pesada",
  );

  it("indica el producto y la categoría en la franja «Consulta sobre»", () => {
    assert.equal(c.tipo, "cotizacion");
    assert.deepEqual(c.referencia, {
      texto: "RODILLO INFERIOR · Tren de rodaje para maquinaria pesada",
    });
    assert.equal(c.clasificacion, false);
    assert.equal(c.mensajeInicial, undefined);
    assert.equal(c.origen, base.origen);
  });

  it("lleva el producto en el mensaje de WhatsApp, con el mismo número", () => {
    const url = new URL(c.whatsapp!.href);
    assert.equal(url.pathname, "/573000000000");
    assert.equal(
      url.searchParams.get("text"),
      "Hola, quiero cotizar: RODILLO INFERIOR · Tren de rodaje para maquinaria pesada.",
    );
    assert.equal(c.whatsapp!.etiqueta, "300 000 0000");
  });

  it("sin WhatsApp de la empresa, sin enlace", () => {
    const sin = cotizacionDeProducto({ ...base, whatsapp: undefined }, "X", "Y");
    assert.equal(sin.whatsapp, undefined);
  });
});
