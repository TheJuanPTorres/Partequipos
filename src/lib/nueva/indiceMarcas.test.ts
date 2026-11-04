import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MarcasMaquinaria } from "@/payload-types";

import { placasDeMarcasNueva } from "./indiceMarcas";

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
