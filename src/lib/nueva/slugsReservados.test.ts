import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CategoriaMaquinaria } from "../../collections/CategoriaMaquinaria";
import {
  MENSAJE_SLUG_RESERVADO_NUEVA,
  mensajeRedireccionTapa,
  slugCategoriaNuevaNoReservado,
  slugCategoriaNuevaValido,
} from "./slugsReservados";

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
    assert.equal(campo.validate, slugCategoriaNuevaValido);
  });
});

describe("slugCategoriaNuevaValido", () => {
  // Una base con una sola redirección guardada, la de la limpieza del panel.
  const conRedireccion = (desdeGuardado: string) => {
    const consultas: unknown[] = [];
    const a = {
      required: true,
      req: {
        t: (k: string) => k,
        payload: {
          config: {},
          count: async (q: { where: { desde: { equals: string } } }) => {
            consultas.push(q.where);
            return { totalDocs: q.where.desde.equals === desdeGuardado ? 1 : 0 };
          },
        },
      },
    } as unknown as Parameters<typeof slugCategoriaNuevaValido>[1];
    return { a, consultas };
  };
  const MINI = "/maquinaria-pesada/maquinaria-pesada-nueva/miniexcavadoras";

  it("rechaza una dirección de la que sale una redirección guardada (la taparía)", async () => {
    const { a } = conRedireccion(MINI);
    assert.equal(
      await slugCategoriaNuevaValido(" Miniexcavadoras ", a),
      mensajeRedireccionTapa(MINI),
    );
  });

  it("deja pasar las demás, y las reservadas siguen con su mensaje sin consultar", async () => {
    const { a, consultas } = conRedireccion(MINI);
    assert.equal(await slugCategoriaNuevaValido("bulldozers", a), true);
    assert.equal(await slugCategoriaNuevaValido("tipos", a), MENSAJE_SLUG_RESERVADO_NUEVA);
    assert.equal(consultas.length, 1);
  });
});
