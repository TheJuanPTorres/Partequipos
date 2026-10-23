import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MAX_PDF_BYTES } from "./constantes";
import { destinoHojasDeVida } from "./destino";
import { nombreAdjunto, validarPdf } from "./pdf";
import { asuntoHv, procesarHojaDeVida, type DependenciasHv } from "./procesar";

const codificar = (t: string) => new TextEncoder().encode(t);
const PDF_VALIDO = codificar("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");

describe("validarPdf", () => {
  it("acepta un PDF real", () => {
    assert.equal(validarPdf(PDF_VALIDO, "cv.pdf").ok, true);
  });
  it("rechaza un archivo que no es PDF aunque se llame .pdf (por el contenido)", () => {
    const r = validarPdf(codificar("MZ\u0090\u0000 esto es un ejecutable"), "cv.pdf");
    assert.equal(r.ok, false);
  });
  it("rechaza un PDF de verdad con otra extensión", () => {
    assert.equal(validarPdf(PDF_VALIDO, "cv.png").ok, false);
  });
  it("rechaza un PDF cortado (sin el final)", () => {
    assert.equal(validarPdf(codificar("%PDF-1.4\nsolo la cabecera"), "cv.pdf").ok, false);
  });
  it("rechaza el vacío y lo que pasa del tope", () => {
    assert.equal(validarPdf(new Uint8Array(0), "cv.pdf").ok, false);
    assert.equal(validarPdf(new Uint8Array(MAX_PDF_BYTES + 1), "cv.pdf").ok, false);
  });
});

describe("nombreAdjunto", () => {
  it("limpia el nombre y acaba en .pdf", () => {
    assert.equal(nombreAdjunto("../../x.pdf", "María Pérez"), "Hoja-de-vida-Maria-Perez.pdf");
    assert.equal(nombreAdjunto("a b.pdf", ""), "Hoja-de-vida-a-b.pdf");
  });
});

describe("destinoHojasDeVida", () => {
  it("en producción: el correo del panel y, vacío, el de la empresa", () => {
    const env = { VERCEL_ENV: "production" };
    assert.equal(
      destinoHojasDeVida("rrhh@ejemplo.test", "info@ejemplo.test", env),
      "rrhh@ejemplo.test",
    );
    assert.equal(destinoHojasDeVida("  ", "info@ejemplo.test", env), "info@ejemplo.test");
  });
  it("fuera de producción: solo el buzón de pruebas, nunca el correo real del panel", () => {
    const env = { VERCEL_ENV: "preview", SOLICITUDES_EMAIL_TO: "pruebas@ejemplo.test" };
    assert.equal(
      destinoHojasDeVida("rrhh@ejemplo.test", "info@ejemplo.test", env),
      "pruebas@ejemplo.test",
    );
    assert.equal(
      destinoHojasDeVida("rrhh@ejemplo.test", "info@ejemplo.test", { VERCEL_ENV: "preview" }),
      null,
    );
  });
});

function formulario(extra: Record<string, string | File> = {}): FormData {
  const f = new FormData();
  const base: Record<string, string | File> = {
    nombre: "Persona de Prueba",
    correo: "prueba@ejemplo.test",
    telefono: "+57 300 000 0000",
    vacante: "Analista (Medellín)",
    autorizacion: "on",
    origen: "/nosotros/trabaja-con-nosotros/",
    hojaDeVida: new File([PDF_VALIDO], "cv.pdf", { type: "application/pdf" }),
    ...extra,
  };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}

function dependencias(sobre: Partial<DependenciasHv> = {}) {
  const llamadas = { correo: 0, guardado: 0, errores: [] as string[], asunto: "", adjuntos: 0 };
  const deps: DependenciasHv = {
    verificar: async () => true,
    destino: async () => "pruebas@ejemplo.test",
    enviarCorreo: async (c) => {
      llamadas.correo += 1;
      llamadas.asunto = c.subject;
      llamadas.adjuntos = c.attachments.length;
    },
    guardar: async () => {
      llamadas.guardado += 1;
    },
    registrarError: (c) => llamadas.errores.push(c),
    ...sobre,
  };
  return { deps, llamadas };
}

describe("procesarHojaDeVida", () => {
  it("envía el correo con el PDF adjunto y deja el registro", async () => {
    const { deps, llamadas } = dependencias();
    const r = await procesarHojaDeVida(formulario(), deps);
    assert.equal(r.ok, true);
    assert.equal(llamadas.correo, 1);
    assert.equal(llamadas.adjuntos, 1);
    assert.equal(llamadas.guardado, 1);
    assert.equal(llamadas.asunto, "Hoja de vida: Analista (Medellín) — Persona de Prueba");
  });

  it("rechaza un fichero que no es PDF sin enviar ni guardar nada", async () => {
    const { deps, llamadas } = dependencias();
    const falso = new File([codificar("no soy un pdf")], "cv.pdf", { type: "application/pdf" });
    const r = await procesarHojaDeVida(formulario({ hojaDeVida: falso }), deps);
    assert.equal(r.ok, false);
    assert.ok(!r.ok && r.errores?.hojaDeVida);
    assert.equal(llamadas.correo + llamadas.guardado, 0);
  });

  it("exige la autorización de datos y el archivo", async () => {
    const { deps, llamadas } = dependencias();
    const f = formulario();
    f.delete("autorizacion");
    f.delete("hojaDeVida");
    const r = await procesarHojaDeVida(f, deps);
    assert.ok(!r.ok && r.errores?.autorizacion && r.errores?.hojaDeVida);
    assert.equal(llamadas.correo, 0);
  });

  it("sin Turnstile válido, no hay correo", async () => {
    const { deps, llamadas } = dependencias({ verificar: async () => false });
    const r = await procesarHojaDeVida(formulario(), deps);
    assert.equal(r.ok, false);
    assert.equal(llamadas.correo, 0);
  });

  it("si el correo falla no queda registro a medias", async () => {
    const { deps, llamadas } = dependencias({
      enviarCorreo: async () => {
        throw new Error("smtp caído");
      },
    });
    const r = await procesarHojaDeVida(formulario(), deps);
    assert.equal(r.ok, false);
    assert.equal(llamadas.guardado, 0);
    assert.equal(llamadas.errores.length, 1);
  });

  it("sin destino no se envía (y no se pierde en silencio)", async () => {
    const { deps, llamadas } = dependencias({ destino: async () => null });
    const r = await procesarHojaDeVida(formulario(), deps);
    assert.equal(r.ok, false);
    assert.equal(llamadas.correo, 0);
  });

  it("si el correo salió y el registro falla, responde que sí", async () => {
    const { deps, llamadas } = dependencias({
      guardar: async () => {
        throw new Error("base caída");
      },
    });
    const r = await procesarHojaDeVida(formulario(), deps);
    assert.equal(r.ok, true);
    assert.equal(llamadas.correo, 1);
    assert.equal(llamadas.errores.length, 1);
  });
});

describe("asuntoHv", () => {
  it("no deja pasar saltos de línea al asunto", () => {
    assert.equal(asuntoHv("A\r\nBcc: x", "Pepe"), "Hoja de vida: A Bcc: x — Pepe");
  });
});
