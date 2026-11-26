import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { idDeGa4 } from "./config";
import { interpretar, serializar } from "./consentimiento";
import { clasificarClic, paginaDeOrigen, terminoSeguro, type Pulsado } from "./eventos";

const pulsado = (p: Partial<Pulsado>): Pulsado => ({
  href: null,
  texto: "",
  marca: null,
  ventana: "",
  abreVentana: false,
  ...p,
});

describe("idDeGa4", () => {
  it("acepta un identificador de GA4 y nada más", () => {
    assert.equal(idDeGa4("G-ABC123XYZ9"), "G-ABC123XYZ9");
    assert.equal(idDeGa4(" G-ABC123XYZ9 "), "G-ABC123XYZ9");
    for (const malo of [undefined, "", "UA-123-1", "GTM-ABC", "G-", "G-abc<script>"]) {
      assert.equal(idDeGa4(malo), null);
    }
  });
});

describe("consentimiento", () => {
  const ahora = new Date("2026-11-20T12:00:00Z");

  it("lo guardado se lee igual", () => {
    assert.deepEqual(interpretar(serializar(true, ahora), ahora)?.analitica, true);
    assert.deepEqual(interpretar(serializar(false, ahora), ahora)?.analitica, false);
  });

  it("sin dato, con basura o caducado se vuelve a preguntar", () => {
    assert.equal(interpretar(null, ahora), null);
    assert.equal(interpretar("true", ahora), null);
    assert.equal(interpretar("{", ahora), null);
    assert.equal(interpretar('{"v":2,"analitica":true,"fecha":"2026-11-01"}', ahora), null);
    assert.equal(interpretar('{"v":1,"analitica":"si","fecha":"2026-11-01"}', ahora), null);
    const viejo = serializar(true, new Date("2025-11-01T00:00:00Z"));
    assert.equal(interpretar(viejo, ahora), null);
    const futuro = serializar(true, new Date("2027-01-01T00:00:00Z"));
    assert.equal(interpretar(futuro, ahora), null);
  });
});

describe("clasificarClic", () => {
  it("WhatsApp: el flotante y los botones", () => {
    assert.deepEqual(
      clasificarClic(
        pulsado({ href: "https://wa.me/573000000000?text=Hola", marca: "whatsapp-flotante" }),
      ),
      { nombre: "clic_whatsapp", parametros: { ubicacion: "flotante" } },
    );
    assert.deepEqual(
      clasificarClic(pulsado({ href: "https://wa.me/573000000000", texto: "Cotizar" })),
      { nombre: "clic_whatsapp", parametros: { ubicacion: "boton" } },
    );
    assert.equal(
      clasificarClic(pulsado({ href: "https://api.whatsapp.com/send?phone=573000000000" }))?.nombre,
      "clic_whatsapp",
    );
  });

  it("compartir un artículo por WhatsApp no es un contacto", () => {
    assert.equal(clasificarClic(pulsado({ href: "https://wa.me/?text=Un%20articulo" })), null);
  });

  it("llamada", () => {
    assert.deepEqual(clasificarClic(pulsado({ href: "tel:+573000000000", texto: "300 000" })), {
      nombre: "clic_llamada",
      parametros: {},
    });
  });

  it("ficha técnica: abrir el visor y descargar el PDF", () => {
    const pdf = "https://ejemplo.public.blob.vercel-storage.com/ficha%20zx130.pdf?x=1";
    assert.deepEqual(
      clasificarClic(pulsado({ href: pdf, texto: "Ficha técnica", abreVentana: true })),
      { nombre: "ficha_tecnica", parametros: { accion: "ver", archivo: "ficha zx130.pdf" } },
    );
    assert.deepEqual(
      clasificarClic(
        pulsado({ href: pdf, texto: "Descargar PDF", ventana: "Ficha técnica: Excavadora" }),
      ),
      { nombre: "ficha_tecnica", parametros: { accion: "descargar", archivo: "ficha zx130.pdf" } },
    );
  });

  it("otro PDF no es una ficha técnica", () => {
    assert.equal(
      clasificarClic(
        pulsado({ href: "https://ejemplo.com/linea-etica.pdf", texto: "Línea Ética" }),
      ),
      null,
    );
  });

  it("«Cotizar», por el texto o por la marca", () => {
    assert.equal(
      clasificarClic(pulsado({ href: "https://ejemplo.com/#contacto", texto: "Cotizar equipo" }))
        ?.nombre,
      "clic_cotizar",
    );
    assert.equal(
      clasificarClic(pulsado({ texto: "Enviar", marca: "cotizar" }))?.nombre,
      "clic_cotizar",
    );
    assert.equal(clasificarClic(pulsado({ texto: "Ver más" })), null);
  });
});

describe("terminoSeguro", () => {
  it("deja pasar lo que se busca en un catálogo", () => {
    assert.equal(terminoSeguro("  Excavadora   HITACHI "), "excavadora hitachi");
    assert.equal(terminoSeguro("zx130-5b"), "zx130-5b");
    assert.equal(terminoSeguro("4TNV98"), "4tnv98");
    assert.equal(terminoSeguro("filtro 320d"), "filtro 320d");
  });

  it("no envía lo que parece un dato personal", () => {
    assert.equal(terminoSeguro("persona@ejemplo.com"), null);
    assert.equal(terminoSeguro("300 000 0000"), null);
    assert.equal(terminoSeguro("+57 (300) 000-0000"), null);
    assert.equal(terminoSeguro("1000000000"), null);
    assert.equal(terminoSeguro("a"), null);
  });
});

describe("paginaDeOrigen", () => {
  it("solo la ruta", () => {
    assert.equal(paginaDeOrigen("/buscar/?q=algo#x"), "/buscar/");
    assert.equal(paginaDeOrigen(""), "/");
  });
});

describe("clic_tienda", () => {
  const base = { href: "https://tienda.ejemplo.test/", texto: "", ventana: "", abreVentana: false };
  it("el botón «Ver en la tienda» da su evento con el elemento de origen", () => {
    assert.deepEqual(
      clasificarClic({ ...base, texto: "Ver Cadena en la tienda", marca: "tienda:producto" }),
      { nombre: "clic_tienda", parametros: { elemento: "producto" } },
    );
    assert.deepEqual(clasificarClic({ ...base, marca: "tienda:tipo-repuesto" }), {
      nombre: "clic_tienda",
      parametros: { elemento: "tipo-repuesto" },
    });
  });
  it("sin la marca, o con una malformada, no es ese evento", () => {
    assert.equal(clasificarClic({ ...base, marca: null }), null);
    assert.equal(clasificarClic({ ...base, marca: "tienda:" }), null);
    assert.equal(clasificarClic({ ...base, marca: "tienda:A B" }), null);
  });
});
