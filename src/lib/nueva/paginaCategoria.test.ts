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
        grupo("dynapac-pavimentadoras", "dynapac", "Dynapac", "#bf2e1a"),
        grupo("dynapac-reglas", "dynapac", "Dynapac", "#bf2e1a"),
        grupo("case-compactadores", "case", "Case", "#ffcd00"),
      ],
      (m) => (m.slug === "case" ? logo : null),
    );
    assert.deepEqual(
      r.map((p) => [p.ancla, p.titulo, p.color.fondo, p.color.tinta, Boolean(p.logo)]),
      [
        ["grupo-dynapac-pavimentadoras", "Dynapac", "#bf2e1a", "#ffffff", false],
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
  it("activa con baldosa de repuestos: su color y su «Logo para la baldosa» tal cual, sin tinta", () => {
    const blanco = { url: "/hitachi-blanco.png", width: 40, height: 10, oscuro: false };
    const amarillo = { url: "/case-original.png", width: 40, height: 10, oscuro: false };
    const baldosas = new Map([
      ["hitachi", { color: "#c2410c", logo: blanco }],
      ["case", { color: "#ffcd00", logo: amarillo }],
    ]);
    const r = barraDeMarcas(
      [
        grupo("hitachi-ex", "hitachi-landcros", "Hitachi", "#ff6600"),
        grupo("case-ex", "case", "Case", "#ffcd00"),
      ],
      () => logo,
      baldosas,
    );
    assert.deepEqual(
      r.map((p) => [p.color.fondo, p.activa.logo?.url, p.activa.logo?.blanco, p.activa.placa]),
      [
        ["#c2410c", "/hitachi-blanco.png", false, false],
        ["#ffcd00", "/case-original.png", false, false],
      ],
    );
    // La inactiva, con el logo de todo el sitio, como siempre; el alt, el de ese logo.
    assert.deepEqual(
      r.map((p) => [p.logo?.url, p.activa.logo?.alt]),
      [
        ["/l.png", "Logo"],
        ["/l.png", "Logo"],
      ],
    );
  });

  it("activa sin baldosa: el color de la marca y su logo de siempre sobre plaquita blanca", () => {
    const r = barraDeMarcas(
      [grupo("dynapac-x", "dynapac", "Dynapac", "#bf2e1a"), grupo("sin-x", "sin", "Sin logo")],
      (m) => (m.slug === "dynapac" ? logo : null),
      new Map(),
    );
    assert.deepEqual(
      r.map((p) => [p.color.fondo, p.activa.logo?.url ?? null, p.activa.placa]),
      [
        ["#bf2e1a", "/l.png", true],
        [COLOR_BARRA_SIN_MARCA, null, false],
      ],
    );
  });
});
