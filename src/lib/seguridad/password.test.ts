import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { LONGITUD_MINIMA, validarPassword } from "./password";

const valida = (p: string, correo?: string) => validarPassword(p, correo) === null;

describe("validarPassword — acepta", () => {
  it("una contraseña larga y variada", () => {
    assert.ok(valida("caballo-bateria-grapa-correcto"));
  });

  it("una frase con espacios, que es lo que recomienda el NIST", () => {
    assert.ok(valida("tres tristes tigres comen trigo"));
  });

  it("no exige mayúsculas, dígitos ni símbolos", () => {
    assert.ok(valida("abcdefghijklmnop"));
  });

  it("acepta justo la longitud mínima", () => {
    assert.equal(validarPassword("abcdefghijkl"), null);
    assert.equal("abcdefghijkl".length, LONGITUD_MINIMA);
  });
});

describe("validarPassword — rechaza", () => {
  const rechaza = (p: unknown, correo?: string) => {
    const e = validarPassword(p, correo);
    assert.ok(e, `debería rechazar ${JSON.stringify(p)}`);
    return e;
  };

  it("vacía, ausente o de otro tipo", () => {
    for (const p of ["", undefined, null, 12345678901234]) rechaza(p);
  });

  it("una contraseña corta, diciendo cuánto le falta", () => {
    const e = rechaza("corta1");
    assert.match(e, /al menos 12/);
    assert.match(e, /tiene 6/);
  });

  it("una desmesuradamente larga", () => {
    rechaza("a".repeat(201));
  });

  it("casi toda espacios", () => {
    rechaza("ab             ");
  });

  it("un solo carácter repetido, aunque cumpla la longitud", () => {
    rechaza("aaaaaaaaaaaaaaaa");
  });

  it("las obvias, incluido el nombre del proyecto", () => {
    for (const p of ["passwordpassword", "micontrasenasecreta", "partequipos2026"]) rechaza(p);
  });

  it("la que contiene el usuario del correo", () => {
    const e = rechaza("juanperez-maquinaria", "juanperez@partequipos.com");
    assert.match(e, /correo/);
  });

  it("ignora tildes al comparar con la lista de prohibidas", () => {
    rechaza("micontraseñalarga");
  });
});

describe("validarPassword — casos límite del correo", () => {
  it("sin correo no falla", () => {
    assert.ok(valida("caballo-bateria-grapa"));
  });

  it("un usuario de correo muy corto no invalida media contraseña", () => {
    // "jp" tiene 2 caracteres: demasiado corto para usarlo como criterio.
    assert.ok(valida("jpmaquinariapesada", "jp@partequipos.com"));
  });
});
