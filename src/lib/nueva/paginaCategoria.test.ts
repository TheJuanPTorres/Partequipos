import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposNuevo } from "@/payload-types";

import { sinAditamentos, tituloBannerTipoNueva } from "./paginaCategoria";

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

describe("sinAditamentos", () => {
  const equipo = (id: number, marca: string) =>
    ({ id, marca: { id, nombre: marca, slug: marca } }) as unknown as EquiposNuevo;

  it("las páginas generales, solo marcas: fuera los equipos de «Aditamentos»", () => {
    const r = sinAditamentos([equipo(1, "hitachi"), equipo(2, "aditamentos"), equipo(3, "case")]);
    assert.deepEqual(
      r.map((e) => e.id),
      [1, 3],
    );
  });
});
