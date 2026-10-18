import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Marca, TiposEquipo } from "@/payload-types";

import { tarjetasDeTipos } from "./marca";
import { agruparPorSerie, anclaDeSerie, seriesDeTipo, validarSeries } from "./series";
import { PLAN_HITACHI, serieHitachi } from "./seriesHitachi";
import { gruposDeModelos, type ModeloEnlace } from "./tipo";

const marca = { id: 1, nombre: "Hitachi", slug: "hitachi" } as Marca;
const tipo = (series?: { nombre: string }[]) =>
  ({ id: 7, nombre: "Excavadora", slug: "excavadora-hitachi", marca: 1, series }) as TiposEquipo;
const modelo = (id: number, serie: string | null): ModeloEnlace => ({
  id,
  nombre: `M${id}`,
  codigo: null,
  href: `/m${id}/`,
  serie,
});

describe("series de un tipo", () => {
  it("en el orden del panel, sin vacías ni repetidas", () => {
    const s = seriesDeTipo(
      tipo([{ nombre: " EX " }, { nombre: "" }, { nombre: "ZAXIS" }, { nombre: "ex" }]),
    );
    assert.deepEqual(s, [
      { nombre: "EX", ancla: "serie-ex" },
      { nombre: "ZAXIS", ancla: "serie-zaxis" },
    ]);
    assert.equal(anclaDeSerie("Zaxis 5G"), "serie-zaxis-5g");
  });

  it("dos filas con el mismo nombre no se pueden guardar", () => {
    const v = validarSeries as unknown as (v: unknown) => true | string;
    assert.equal(v([{ nombre: "EX" }, { nombre: "ZAXIS" }]), true);
    assert.match(String(v([{ nombre: "EX" }, { nombre: "ex " }])), /repetida/);
    assert.equal(v(2), true);
  });
});

describe("agrupar los modelos por serie", () => {
  it("sin series, null: la página pinta la lista de siempre", () => {
    assert.equal(
      agruparPorSerie([], [modelo(1, "EX")], (m) => m.serie),
      null,
    );
  });

  it("por serie y en su orden; sin serie o con una que no existe, en «Otros modelos» al final", () => {
    const g = gruposDeModelos(tipo([{ nombre: "EX" }, { nombre: "ZAXIS" }]), [
      modelo(1, "zaxis"),
      modelo(2, "EX"),
      modelo(3, null),
      modelo(4, "CX"),
    ]);
    assert.deepEqual(
      g?.map((x) => [x.ancla, x.titulo, x.modelos.map((m) => m.id)]),
      [
        ["serie-ex", "Serie EX", [2]],
        ["serie-zaxis", "Serie ZAXIS", [1]],
        [null, "Otros modelos", [3, 4]],
      ],
    );
  });

  it("una serie sin modelos no se pinta", () => {
    const g = gruposDeModelos(tipo([{ nombre: "EX" }, { nombre: "ZAXIS" }]), [modelo(1, "EX")]);
    assert.deepEqual(
      g?.map((x) => x.ancla),
      ["serie-ex"],
    );
  });
});

describe("tarjetas de la marca con series", () => {
  it("una por serie, con el título de WordPress y el ancla de la serie", () => {
    const t = tarjetasDeTipos(marca, [tipo([{ nombre: "EX" }, { nombre: "Zaxis" }])]);
    assert.deepEqual(
      t.map((x) => [x.titulo, x.href]),
      [
        [
          "Repuestos para maquinaria pesada excavadora HITACHI EX",
          "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/hitachi/excavadora-hitachi/#serie-ex",
        ],
        [
          "Repuestos para maquinaria pesada excavadora HITACHI ZAXIS",
          "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/hitachi/excavadora-hitachi/#serie-zaxis",
        ],
      ],
    );
  });

  it("sin series, una sola tarjeta del tipo, como siempre", () => {
    const t = tarjetasDeTipos(marca, [tipo([])]);
    assert.equal(t.length, 1);
    assert.equal(t[0]?.titulo, "Repuestos para maquinaria pesada excavadora HITACHI");
  });
});

describe("series de Hitachi", () => {
  it("por el prefijo del código, y la ZX450LC-5 en ZAXIS (errata de WordPress: «EX450LC-5»)", () => {
    assert.equal(serieHitachi("EX70 / EX80-5"), "EX");
    assert.equal(serieHitachi(" zx450lc-5"), "ZAXIS");
    assert.equal(serieHitachi("ZX120/ ZX130LCN"), "ZAXIS");
    assert.equal(serieHitachi("CX210B"), null);
    assert.equal(serieHitachi(null), null);
  });

  it("el plan pone EX y ZAXIS, en ese orden, en los dos tipos", () => {
    assert.deepEqual(
      PLAN_HITACHI.map((p) => p.series.map((s) => s.nombre)),
      [
        ["EX", "ZAXIS"],
        ["EX", "ZAXIS"],
      ],
    );
  });
});
