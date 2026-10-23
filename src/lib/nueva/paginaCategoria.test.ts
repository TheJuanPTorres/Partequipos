import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposNuevo } from "@/payload-types";

import {
  COLOR_BARRA_SIN_MARCA,
  barraDeMarcas,
  sinAditamentos,
  tituloBannerTipoNueva,
  type GrupoDeCategoria,
} from "./paginaCategoria";

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

describe("barraDeMarcas", () => {
  const grupo = (clave: string, slug: string, nombre: string, colorMarca?: string) =>
    ({
      clave,
      titulo: clave,
      marca: { slug, nombre, colorMarca },
      tarjetas: [],
    }) as unknown as GrupoDeCategoria;
  const logo = { url: "/l.png", width: 10, height: 5, oscuro: false, alt: "Logo" };

  it("una pastilla por marca, al primer grupo de cada una, con su color y la tinta por contraste", () => {
    const r = barraDeMarcas(
      [
        grupo("dynapac-pavimentadoras", "dynapac", "Dynapac", "#1a1a1a"),
        grupo("dynapac-reglas", "dynapac", "Dynapac", "#1a1a1a"),
        grupo("case-compactadores", "case", "Case", "#ffcd00"),
      ],
      (m) => (m.slug === "case" ? logo : null),
    );
    assert.deepEqual(
      r.map((p) => [p.ancla, p.titulo, p.color.fondo, p.color.tinta, Boolean(p.logo)]),
      [
        ["grupo-dynapac-pavimentadoras", "Dynapac", "#1a1a1a", "#ffffff", false],
        ["grupo-case-compactadores", "Case", "#ffcd00", "#000000", true],
      ],
    );
  });

  it("sin color, el naranja de la barra de series; con una sola marca, ninguna barra", () => {
    const r = barraDeMarcas(
      [grupo("a-x", "a", "A"), grupo("b-x", "b", "B", "no-es-color")],
      () => null,
    );
    assert.deepEqual(
      r.map((p) => p.color.fondo),
      [COLOR_BARRA_SIN_MARCA, COLOR_BARRA_SIN_MARCA],
    );
    assert.deepEqual(
      barraDeMarcas([grupo("a-x", "a", "A"), grupo("a-y", "a", "A")], () => null),
      [],
    );
  });
});
