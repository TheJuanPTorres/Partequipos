import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { facetasConCuenta, filtrar, leerSeleccion, ordenar } from "../filtros";
import {
  CATALOGO_USADOS,
  CATALOGO_USADOS_MARCA,
  marcaDeUnidad,
  opcionDeMarca,
  TRAMOS_HORAS,
  TRAMOS_PESO,
} from "./filtros";

describe("marcaDeUnidad", () => {
  it("el valor es el slug del texto: las variantes de escritura caen juntas", () => {
    assert.deepEqual(marcaDeUnidad(" LiuGong "), { valor: "liugong", etiqueta: "LiuGong" });
    assert.equal(marcaDeUnidad("Liugong")?.valor, "liugong");
    assert.equal(marcaDeUnidad("Case Construction")?.valor, "case-construction");
    assert.equal(marcaDeUnidad(""), null);
    assert.equal(marcaDeUnidad(null), null);
  });
});

describe("tramos de usados", () => {
  for (const [nombre, tramos] of [
    ["horas", TRAMOS_HORAS],
    ["peso", TRAMOS_PESO],
  ] as const) {
    it(`${nombre}: contiguos, sin huecos ni solapes, del 0 al infinito`, () => {
      assert.equal(tramos[0]!.desde, undefined);
      assert.equal(tramos.at(-1)!.hasta, undefined);
      for (let i = 1; i < tramos.length; i++) {
        assert.equal(tramos[i]!.desde, tramos[i - 1]!.hasta, `${tramos[i]!.valor}`);
      }
    });
  }
});

describe("CATALOGO_USADOS", () => {
  const unidades = [
    { id: 1, marca: "Hitachi", anio: 2019, horometro: 4100, pesoOperativo: 20 },
    { id: 2, marca: "Hitachi", anio: 2017, horometro: 9000, pesoOperativo: 1.7 },
    { id: 3, marca: "LiuGong", anio: null, horometro: null, pesoOperativo: 35 },
  ];

  it("filtra por marca, año, horas y peso desde la URL", () => {
    const s = leerSeleccion(
      { marca: "hitachi", horas: "4000-6000", peso: "20-30" },
      CATALOGO_USADOS,
    );
    assert.deepEqual(
      filtrar(unidades, CATALOGO_USADOS, s).map((u) => u.id),
      [1],
    );
  });

  it("el orden por defecto es el de siempre: año descendente, sin año al final", () => {
    const s = leerSeleccion({}, CATALOGO_USADOS);
    assert.equal(s.orden, "recientes");
    assert.deepEqual(
      ordenar(unidades, CATALOGO_USADOS, s).map((u) => u.id),
      [1, 2, 3],
    );
  });

  it("pinta las cuatro facetas con su recuento", () => {
    const f = facetasConCuenta(unidades, CATALOGO_USADOS, leerSeleccion({}, CATALOGO_USADOS));
    assert.deepEqual(
      f.map((x) => x.clave),
      ["marca", "anio", "horas", "peso"],
    );
    assert.deepEqual(
      f[0]!.opciones.map((o) => [o.etiqueta, o.cuenta]),
      [
        ["Hitachi", 2],
        ["LiuGong", 1],
      ],
    );
  });
});

describe("opcionDeMarca", () => {
  it("la relación gana al texto; sin relación, el slug del texto (el mismo que crearía el gancho)", () => {
    assert.deepEqual(
      opcionDeMarca({ id: 1, marcaRef: { slug: "hitachi", nombre: "Hitachi" }, marca: "otra" }),
      {
        valor: "hitachi",
        etiqueta: "Hitachi",
      },
    );
    assert.deepEqual(opcionDeMarca({ id: 1, marcaRef: null, marca: "LiuGong" }), {
      valor: "liugong",
      etiqueta: "LiuGong",
    });
  });
});

describe("CATALOGO_USADOS_MARCA", () => {
  it("en una marca se filtra por tipo de máquina en lugar de por marca", () => {
    assert.deepEqual(
      CATALOGO_USADOS_MARCA.facetas.map((f) => f.clave),
      ["categoria", "anio", "horas", "peso"],
    );
    const unidades = [
      { id: 1, categoriaRef: { slug: "excavadoras", nombre: "Excavadoras" } },
      { id: 2, categoriaRef: { slug: "miniexcavadoras", nombre: "Miniexcavadoras" } },
    ];
    const s = leerSeleccion({ categoria: "miniexcavadoras" }, CATALOGO_USADOS_MARCA);
    assert.deepEqual(
      filtrar(unidades, CATALOGO_USADOS_MARCA, s).map((u) => u.id),
      [2],
    );
  });
});
