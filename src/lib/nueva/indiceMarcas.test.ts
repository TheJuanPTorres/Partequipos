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

  it("solo las marcas con equipos, por nombre y con Aditamentos al final", () => {
    assert.deepEqual(
      placasDeMarcasNueva(marcas, equipos, new Map()).map((p) => p.nombre),
      ["Case", "Hitachi", "Yanmar", "Aditamentos"],
    );
  });

  it("Aditamentos va con su nombre (sin logo), aunque tenga uno propio", () => {
    const a = placasDeMarcasNueva(marcas, equipos, new Map()).at(-1)!;
    assert.equal(a.logo, null);
    assert.match(a.href, /aditamentos\/$/);
  });
});
