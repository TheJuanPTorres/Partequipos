import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Marca, Media, TiposEquipo } from "@/payload-types";

import { tarjetasDeTipos } from "./marca";
import { tarjetasDeModelos, type ModeloEnlace } from "./tipo";

const marca = { id: 1, nombre: "Hitachi", slug: "hitachi", colorMarca: "#fc661c" } as Marca;
const foto = (url: string) => ({ id: 9, url, width: 10, height: 10 }) as Media;
const tipo = (series?: { nombre: string; imagen?: Media }[], imagen?: Media) =>
  ({
    id: 7,
    nombre: "Excavadora",
    slug: "excavadora-hitachi",
    marca: 1,
    series,
    imagen,
  }) as TiposEquipo;
const modelo = (
  id: number,
  serie: string | null,
  href: string | null = `/m${id}/`,
): ModeloEnlace => ({
  id,
  nombre: `M${id}`,
  codigo: null,
  href,
  serie,
});

describe("«Ver todo» de la marca de repuestos abre el panel", () => {
  it("con series, cada tarjeta lleva solo los modelos de su serie, en su orden", () => {
    const t = tarjetasDeTipos(marca, [tipo([{ nombre: "EX" }, { nombre: "Zaxis" }])], () => [
      modelo(1, "zaxis"),
      modelo(2, "EX"),
      modelo(3, "EX", null),
      modelo(4, null),
    ]);
    assert.deepEqual(
      t.map((x) => [x.panel?.titulo, x.panel?.total, x.panel?.elementos.map((e) => e.id)]),
      [
        ["Excavadora Hitachi LANDCROS EX", 2, [2, 3]],
        ["Excavadora Hitachi LANDCROS ZAXIS", 1, [1]],
      ],
    );
    // El enlace a la página completa y el color de la barra.
    assert.equal(t[0]?.panel?.enlacePagina, "Ver la página de Excavadora Hitachi");
    assert.equal(t[0]?.panel?.acento, "#fc661c");
    // Una entrada sin ficha sigue en la lista, sin enlace.
    assert.equal(t[0]?.panel?.elementos[1]?.href, null);
    // Sin JavaScript, «Ver todo» lleva a la página del tipo, como antes.
    assert.match(t[0]?.href ?? "", /excavadora-hitachi\/#serie-ex$/);
  });

  it("sin series, todos los modelos del tipo", () => {
    const t = tarjetasDeTipos(marca, [tipo([])], () => [modelo(1, null), modelo(2, null)]);
    assert.equal(t[0]?.panel?.titulo, "Excavadora Hitachi LANDCROS");
    assert.equal(t[0]?.panel?.total, 2);
  });

  it("sin modelos (o sin la lista), sin panel: el enlace de siempre", () => {
    assert.equal(tarjetasDeTipos(marca, [tipo([])], () => [])[0]?.panel, undefined);
    assert.equal(tarjetasDeTipos(marca, [tipo([])])[0]?.panel, undefined);
  });
});

describe("modelos de la página de tipo como tarjetas", () => {
  it("mismo nombre y destino; foto del modelo, o de su serie, o del tipo", () => {
    const t = tarjetasDeModelos(
      tipo([{ nombre: "EX", imagen: foto("/serie.jpg") }], foto("/tipo.jpg")),
      [
        {
          ...modelo(1, "EX"),
          imagen: { url: "/propia.jpg", alt: "", width: 1, height: 1, posicion: "50% 50%" },
        },
        modelo(2, "EX"),
        { ...modelo(3, null, null), codigo: "ZX-1" },
      ],
    );
    assert.deepEqual(
      t.map((x) => [x.titulo, x.href, x.imagen?.url, x.detalle]),
      [
        ["M1", "/m1/", "/propia.jpg", undefined],
        ["M2", "/m2/", "/serie.jpg", undefined],
        ["M3", null, "/tipo.jpg", "ZX-1"],
      ],
    );
  });
});
