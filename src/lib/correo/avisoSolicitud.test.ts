import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  RESPUESTA_POR_DEFECTO,
  correoAlEquipo,
  destinoRespuesta,
  respuestaAlVisitante,
  unaLinea,
} from "./avisoSolicitud";

const doc = {
  id: 7,
  tipo: "cotizacion",
  nombre: "Ana Prueba",
  correo: "ana@ejemplo.test",
  mensaje: "Quiero cotizar.",
};

describe("correoAlEquipo", () => {
  it("lleva los datos, el enlace al panel y responde al visitante", () => {
    const c = correoAlEquipo(doc, "https://partequipos.com/");
    assert.equal(c.subject, "Nueva solicitud (cotización) de Ana Prueba");
    assert.equal(c.replyTo, "ana@ejemplo.test");
    assert.match(c.text, /https:\/\/partequipos\.com\/admin\/collections\/solicitudes\/7$/);
    assert.match(c.text, /Quiero cotizar\./);
  });
  it("no deja saltos de línea en el asunto ni en replyTo (inyección de cabeceras)", () => {
    const c = correoAlEquipo(
      { ...doc, nombre: "Ana\r\nBcc: x@y.test", correo: "a@b.test\nBcc: z@y.test" },
      "https://x.test",
    );
    assert.doesNotMatch(c.subject, /[\r\n]/);
    assert.doesNotMatch(c.replyTo, /[\r\n]/);
  });
});

describe("respuestaAlVisitante", () => {
  it("usa los textos de siempre y pone el nombre", () => {
    const r = respuestaAlVisitante({ nombre: "Ana" }, {});
    assert.equal(r?.subject, RESPUESTA_POR_DEFECTO.asunto);
    assert.match(r?.text ?? "", /^Hola Ana,/);
  });
  it("usa los textos editados", () => {
    const r = respuestaAlVisitante(
      { nombre: "Ana" },
      { respuestaAsunto: "Gracias {nombre}", respuestaTexto: "Recibido, {nombre}." },
    );
    assert.deepEqual(r, { subject: "Gracias Ana", text: "Recibido, Ana." });
  });
  it("se apaga solo desmarcando", () => {
    assert.equal(respuestaAlVisitante({ nombre: "Ana" }, { respuestaActiva: false }), null);
    assert.notEqual(respuestaAlVisitante({ nombre: "Ana" }, { respuestaActiva: null }), null);
  });
  it("nunca devuelve el mensaje del visitante", () => {
    const r = respuestaAlVisitante({ nombre: "Ana" }, {});
    assert.doesNotMatch(r?.text ?? "", /cotizar/);
  });
});

describe("destinoRespuesta", () => {
  it("en el sitio publicado va al visitante", () => {
    assert.deepEqual(destinoRespuesta("ana@ejemplo.test", "Asunto", { VERCEL_ENV: "production" }), {
      to: "ana@ejemplo.test",
      subject: "Asunto",
    });
  });
  it("fuera de él, solo al buzón de pruebas y con el asunto marcado", () => {
    const d = destinoRespuesta("ana@ejemplo.test", "Asunto", {
      VERCEL_ENV: "preview",
      SOLICITUDES_EMAIL_TO: "pruebas@ejemplo.test",
    });
    assert.equal(d?.to, "pruebas@ejemplo.test");
    assert.match(d?.subject ?? "", /^\[PRUEBA/);
  });
  it("fuera del sitio publicado y sin buzón de pruebas, a nadie", () => {
    assert.equal(destinoRespuesta("ana@ejemplo.test", "A", { VERCEL_ENV: "preview" }), null);
    assert.equal(destinoRespuesta("ana@ejemplo.test", "A", {}), null);
  });
});

describe("unaLinea", () => {
  it("quita controles y recorta", () => {
    assert.equal(unaLinea("a\r\nb\tc"), "a b c");
    assert.equal(unaLinea("x".repeat(500), 10).length, 10);
  });
});
