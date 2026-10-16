import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { partesDeRespuesta, respuestaEnTextoPlano, validarRespuestaFaq } from "./respuestaFaq";

describe("enlaces en la respuesta de una pregunta frecuente", () => {
  it("sin enlaces, un solo trozo de texto", () => {
    assert.deepEqual(partesDeRespuesta("Hola. Sin enlaces."), ["Hola. Sin enlaces."]);
  });

  it("parte el texto en orden, con enlaces internos y https", () => {
    assert.deepEqual(
      partesDeRespuesta("Mira [la política](/politica/#Parte) y [la web](https://ejemplo.com/a)."),
      [
        "Mira ",
        { texto: "la política", href: "/politica/#Parte" },
        " y ",
        { texto: "la web", href: "https://ejemplo.com/a" },
        ".",
      ],
    );
  });

  it("un destino peligroso o ajeno se queda como texto, nunca como enlace", () => {
    for (const malo of ["javascript:alert(1)", "//otro.com/x", "http://inseguro.com"]) {
      const partes = partesDeRespuesta(`Pulsa [aquí](${malo}) ya.`);
      assert.ok(
        partes.every((p) => typeof p === "string"),
        malo,
      );
    }
  });

  it("el texto plano quita la sintaxis y conserva el texto del enlace", () => {
    assert.equal(respuestaEnTextoPlano("Lee [la política](/p/) hoy."), "Lee la política hoy.");
  });

  it("el panel rechaza un destino no válido y acepta uno bueno", () => {
    assert.notEqual(validarRespuestaFaq("Pulsa [aquí](javascript:alert(1))."), true);
    assert.notEqual(validarRespuestaFaq("Pulsa [aquí]()."), true);
    assert.notEqual(validarRespuestaFaq(""), true);
    assert.equal(validarRespuestaFaq("Pulsa [aquí](/politica/)."), true);
    assert.equal(validarRespuestaFaq("Texto sin enlaces."), true);
  });
});
