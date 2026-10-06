import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { es } from "@payloadcms/translations/languages/es";

import { aOracion, traduccionesEnOracion } from "./oracion";

describe("aOracion", () => {
  it("deja solo la mayúscula inicial", () => {
    assert.equal(aOracion("Panel de Control"), "Panel de control");
    assert.equal(aOracion("Guardar Cambios"), "Guardar cambios");
    assert.equal(aOracion("Restablecer tu Contraseña"), "Restablecer tu contraseña");
  });

  it("respeta siglas, variables, comillas e inicios de frase", () => {
    assert.equal(aOracion("Generar Nueva Clave API"), "Generar nueva clave API");
    assert.equal(aOracion("URL Personalizada"), "URL personalizada");
    assert.equal(aOracion("Hola. Otra Frase"), "Hola. Otra frase");
    assert.equal(aOracion("Abre {{Nombre}} Ahora"), "Abre {{Nombre}} ahora");
    assert.equal(aOracion('Desde el menú "Tablero" Arriba'), 'Desde el menú "Tablero" arriba');
    assert.equal(aOracion("Ver <b>Aquí</b>"), "Ver <b>Aquí</b>");
  });

  it("no cambia lo que ya está bien (comprobación del guardián)", () => {
    assert.equal(aOracion("Crear nuevo"), "Crear nuevo");
    assert.equal(aOracion("Ir a la página de Payload"), "Ir a la página de Payload");
  });
});

describe("traduccionesEnOracion sobre la traducción real de Payload", () => {
  const convertidas = traduccionesEnOracion(es.translations);

  it("arregla los textos conocidos", () => {
    assert.equal(convertidas.general.dashboard, "Panel de control");
    assert.equal(convertidas.general.saveChanges, "Guardar cambios");
    assert.equal(convertidas.authentication.newPassword, "Nueva contraseña");
  });

  it("no rompe ninguna variable {{…}}", () => {
    const variables = (t: unknown): string[] =>
      typeof t === "string"
        ? (t.match(/\{\{[^}]*\}\}/g) ?? [])
        : Object.values(t as object).flatMap(variables);
    assert.deepEqual(variables(convertidas), variables(es.translations));
  });
});
