import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MarcasMaquinaria } from "@/payload-types";

import { mezclaMarcas, tituloBannerTipoNueva, type GrupoDeCategoria } from "./paginaCategoria";

describe("tituloBannerTipoNueva", () => {
  it("«Maquinaria Tipo {Nombre} Nueva», con mayúscula en cada palabra del tipo", () => {
    assert.equal(tituloBannerTipoNueva("Bulldozers"), "Maquinaria Tipo Bulldozers Nueva");
    assert.equal(
      tituloBannerTipoNueva(" cargadores  frontales "),
      "Maquinaria Tipo Cargadores Frontales Nueva",
    );
    // El resto de cada palabra, tal cual (siglas, tildes).
    assert.equal(tituloBannerTipoNueva("Éxcavadoras CX"), "Maquinaria Tipo Éxcavadoras CX Nueva");
  });
});

describe("mezclaMarcas", () => {
  const grupo = (marca: string, clave: string): GrupoDeCategoria => ({
    clave,
    titulo: clave,
    marca: { id: 1, nombre: marca, slug: marca } as MarcasMaquinaria,
    tarjetas: [],
  });

  it("con una sola marca (aunque tenga varios tipos), sin franjas", () => {
    assert.equal(mezclaMarcas([grupo("case", "a"), grupo("case", "b")]), false);
    assert.equal(mezclaMarcas([]), false);
  });

  it("con dos o más marcas, cada grupo con su franja", () => {
    assert.equal(mezclaMarcas([grupo("case", "a"), grupo("hitachi", "b")]), true);
  });
});
