import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CategoriaUsada } from "../../collections/CategoriaUsada";
import { MENSAJE_SLUG_RESERVADO, slugCategoriaUsadaNoReservado } from "./slugsReservados";

// Lo mínimo de los argumentos de una validación de Payload para un campo de texto obligatorio.
const args = {
  required: true,
  req: { payload: { config: {} }, t: (k: string) => k },
} as unknown as Parameters<typeof slugCategoriaUsadaNoReservado>[1];

describe("slugCategoriaUsadaNoReservado", () => {
  it("rechaza «marcas» (la usan las páginas de marca), escrita como sea", () => {
    assert.equal(slugCategoriaUsadaNoReservado("marcas", args), MENSAJE_SLUG_RESERVADO);
    assert.equal(slugCategoriaUsadaNoReservado(" Marcas ", args), MENSAJE_SLUG_RESERVADO);
  });

  it("deja pasar las demás y conserva el «obligatorio» de Payload", () => {
    assert.equal(slugCategoriaUsadaNoReservado("excavadoras", args), true);
    assert.notEqual(slugCategoriaUsadaNoReservado("", args), true);
  });

  it("es la validación del campo «Dirección web» de las categorías de usada", () => {
    const campo = CategoriaUsada.fields.find((f) => "name" in f && f.name === "slug");
    assert.ok(campo && "validate" in campo);
    assert.equal(campo.validate, slugCategoriaUsadaNoReservado);
  });
});
