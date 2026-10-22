import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CategoriaMaquinaria } from "../../collections/CategoriaMaquinaria";
import { MENSAJE_SLUG_RESERVADO_NUEVA, slugCategoriaNuevaNoReservado } from "./slugsReservados";

// Lo mínimo de los argumentos de una validación de Payload para un campo de texto obligatorio.
const args = {
  required: true,
  req: { payload: { config: {} }, t: (k: string) => k },
} as unknown as Parameters<typeof slugCategoriaNuevaNoReservado>[1];

describe("slugCategoriaNuevaNoReservado", () => {
  it("rechaza «marcas», «tipos» y «pagina», escritas como sea", () => {
    for (const v of ["marcas", " Tipos ", "PAGINA"]) {
      assert.equal(slugCategoriaNuevaNoReservado(v, args), MENSAJE_SLUG_RESERVADO_NUEVA);
    }
  });

  it("deja pasar las demás y conserva el «obligatorio» de Payload", () => {
    assert.equal(slugCategoriaNuevaNoReservado("excavadoras", args), true);
    assert.notEqual(slugCategoriaNuevaNoReservado("", args), true);
  });

  it("es la validación del campo «Dirección web» de las categorías de nueva", () => {
    const campo = CategoriaMaquinaria.fields.find((f) => "name" in f && f.name === "slug");
    assert.ok(campo && "validate" in campo);
    assert.equal(campo.validate, slugCategoriaNuevaNoReservado);
  });
});
