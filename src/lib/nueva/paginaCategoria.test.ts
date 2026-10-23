import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposNuevo } from "@/payload-types";

import { sinAditamentos, tituloBannerTipoNueva } from "./paginaCategoria";

describe("tituloBannerTipoNueva", () => {
  it("«Maquinaria Pesada {Nombre} Nuevo/Nueva», concordado con cada máquina", () => {
    const esperado: Record<string, string> = {
      Bulldozer: "Maquinaria Pesada Bulldozer Nuevo",
      Excavadora: "Maquinaria Pesada Excavadora Nueva",
      Motoniveladora: "Maquinaria Pesada Motoniveladora Nueva",
      Miniexcavadora: "Maquinaria Pesada Miniexcavadora Nueva",
      Minicargador: "Maquinaria Pesada Minicargador Nuevo",
      Retrocargadora: "Maquinaria Pesada Retrocargadora Nueva",
      Compactador: "Maquinaria Pesada Compactador Nuevo",
      Pavimentadora: "Maquinaria Pesada Pavimentadora Nueva",
    };
    for (const [nombre, titulo] of Object.entries(esperado)) {
      assert.equal(tituloBannerTipoNueva(nombre), titulo);
    }
  });

  it("con un nombre aún en plural, el adjetivo en plural; mayúscula en cada palabra", () => {
    assert.equal(tituloBannerTipoNueva("Bulldozers"), "Maquinaria Pesada Bulldozers Nuevos");
    assert.equal(
      tituloBannerTipoNueva(" cargador  frontal "),
      "Maquinaria Pesada Cargador Frontal Nuevo",
    );
    // El resto de cada palabra, tal cual (siglas, tildes).
    assert.equal(tituloBannerTipoNueva("Éxcavadora CX"), "Maquinaria Pesada Éxcavadora CX Nueva");
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
