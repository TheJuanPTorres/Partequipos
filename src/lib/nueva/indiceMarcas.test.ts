import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MarcasMaquinaria } from "@/payload-types";

import { vistaBaldosa } from "../repuestos/baldosasColor";
import { colorDeBaldosaNueva, logoEnBlanco, placasDeMarcasNueva } from "./indiceMarcas";

const marca = (id: number, slug: string, extra: Partial<MarcasMaquinaria> = {}) =>
  ({ id, slug, nombre: slug[0]!.toUpperCase() + slug.slice(1), ...extra }) as MarcasMaquinaria;

describe("placasDeMarcasNueva", () => {
  const marcas = [
    marca(1, "yanmar", { colorMarca: "#ed1c24" }),
    marca(2, "aditamentos", { colorMarca: "#123456" }),
    marca(3, "case"),
    marca(4, "ammann"),
    marca(5, "hitachi"),
  ];
  const equipos = [{ marca: 1 }, { marca: marca(2, "aditamentos") }, { marca: 3 }, { marca: 5 }];

  it("solo las marcas con equipos, por nombre", () => {
    assert.deepEqual(
      placasDeMarcasNueva(marcas, equipos, new Map()).map((p) => p.nombre),
      ["Case", "Hitachi", "Yanmar"],
    );
  });

  it("sin «Aditamentos», aunque tenga equipos (dirección, 2026-10-20)", () => {
    const placas = placasDeMarcasNueva(marcas, equipos, new Map());
    assert.ok(placas.every((p) => !/aditamentos/.test(p.href)));
  });

  it("una marca sin página propia sale sin equipos, con su enlace externo", () => {
    const conLiugong = [
      ...marcas,
      marca(6, "liugong", { enlaceExterno: "https://maquitecno.co/" }),
    ];
    const placas = placasDeMarcasNueva(conLiugong, equipos, new Map());
    assert.deepEqual(
      placas.map((p) => [p.nombre, p.href, p.externo]),
      [
        ["Case", "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case/", undefined],
        ["Hitachi", "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/", undefined],
        ["Liugong", "https://maquitecno.co/", true],
        ["Yanmar", "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/yanmar/", undefined],
      ],
    );
  });
});

describe("baldosas de color de nueva", () => {
  const logo = { url: "/l.png", width: 400, height: 100, oscuro: false };

  it("el color solo si el logo blanco llega a 3:1", () => {
    assert.equal(colorDeBaldosaNueva("#A20F14"), "#a20f14");
    assert.equal(colorDeBaldosaNueva("#FFCD00"), null, "el amarillo no sostiene un logo blanco");
    assert.equal(colorDeBaldosaNueva("rojo"), null);
    assert.equal(colorDeBaldosaNueva("#fff"), null);
    assert.equal(colorDeBaldosaNueva(null), null);
  });

  it("el logo de colores se pinta en blanco; el que ya es blanco, tal cual", () => {
    assert.deepEqual(logoEnBlanco(logo), { ...logo, oscuro: false, blanco: true });
    assert.deepEqual(logoEnBlanco({ ...logo, oscuro: true }), {
      ...logo,
      oscuro: false,
      blanco: false,
    });
    assert.equal(logoEnBlanco(null), null);
  });

  it("con color y logo, baldosa de color; sin alguno, el respaldo gris", () => {
    const logos = new Map([["yanmar", logo]]);
    const [b, a] = placasDeMarcasNueva(
      [marca(1, "yanmar", { colorMarca: "#ed1c24" }), marca(2, "case", { colorMarca: "#ed1c24" })],
      [{ marca: 1 }, { marca: 2 }],
      logos,
    ).map(vistaBaldosa);
    assert.equal(a!.tipo, "color");
    assert.equal(a!.logo?.blanco, true);
    assert.equal(b!.tipo, "respaldo", "sin logo, nombre sobre gris");
  });

  it("la marca externa conserva su enlace y su color", () => {
    const [p] = placasDeMarcasNueva(
      [marca(6, "liugong", { enlaceExterno: "https://maquitecno.co/", colorMarca: "#ed1c24" })],
      [],
      new Map(),
    );
    assert.equal(p!.externo, true);
    assert.equal(p!.color, "#ed1c24");
  });
});
