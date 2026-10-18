import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CABECERA_REVALIDACION, tokenDeRevalidacionValido } from "./tokenRevalidacion";

// Token inventado para la prueba.
const TOKEN = "prueba-revalidacion-0123456789abcdef";
const con = (valor?: string) => new Headers(valor ? { [CABECERA_REVALIDACION]: valor } : {});

describe("tokenDeRevalidacionValido", () => {
  it("acepta el token correcto", () => {
    assert.equal(tokenDeRevalidacionValido(con(TOKEN), { REVALIDACION_TOKEN: TOKEN }), true);
  });
  it("rechaza otro token o ninguno", () => {
    assert.equal(tokenDeRevalidacionValido(con(`${TOKEN}x`), { REVALIDACION_TOKEN: TOKEN }), false);
    assert.equal(tokenDeRevalidacionValido(con(), { REVALIDACION_TOKEN: TOKEN }), false);
  });
  it("falla cerrado sin variable o con una demasiado corta", () => {
    assert.equal(tokenDeRevalidacionValido(con(TOKEN), {}), false);
    assert.equal(tokenDeRevalidacionValido(con("corto"), { REVALIDACION_TOKEN: "corto" }), false);
  });
  it("no vale el token de lectura de la API", () => {
    assert.equal(tokenDeRevalidacionValido(con(TOKEN), { API_LECTURA_TOKEN: TOKEN }), false);
  });
});
