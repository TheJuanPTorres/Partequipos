import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COLOR_OSCURO_POR_DEFECTO,
  COLOR_PRINCIPAL_POR_DEFECTO,
  estiloDeIdentidad,
} from "./identidad";

const variables = (p?: string | null, o?: string | null) =>
  estiloDeIdentidad(p, o) as Record<string, string>;

describe("estiloDeIdentidad", () => {
  it("sin colores, el amarillo y el negro de la marca, con tinta negra sobre el amarillo y blanca sobre el negro", () => {
    const v = variables(null, undefined);
    assert.equal(v["--lub-principal"], COLOR_PRINCIPAL_POR_DEFECTO);
    assert.equal(v["--lub-oscuro"], COLOR_OSCURO_POR_DEFECTO);
    assert.equal(v["--lub-sobre-principal"], "#000000");
    assert.equal(v["--lub-sobre-oscuro"], "#ffffff");
  });

  it("un color del panel manda, y la tinta se adapta (un azul oscuro como principal lleva texto blanco)", () => {
    const v = variables("#0A3D91", "#FFFFFF");
    assert.equal(v["--lub-principal"], "#0a3d91");
    assert.equal(v["--lub-sobre-principal"], "#ffffff");
    assert.equal(v["--lub-oscuro"], "#ffffff");
    assert.equal(v["--lub-sobre-oscuro"], "#000000");
  });

  it("un valor que no es un color se ignora y queda el de la marca", () => {
    assert.equal(variables("amarillo", "#12")["--lub-principal"], COLOR_PRINCIPAL_POR_DEFECTO);
    assert.equal(variables("amarillo", "#12")["--lub-oscuro"], COLOR_OSCURO_POR_DEFECTO);
  });
});
