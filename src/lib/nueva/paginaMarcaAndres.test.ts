import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import {
  MAX_EQUIPOS_POR_TIPO,
  enlacesDeTipos,
  datosDeTarjeta,
  seccionesDeTipos,
  textosMarcaNueva,
} from "./paginaMarcaAndres";

const marca = { slug: "case-construction", nombre: "Case Construction" } as MarcasMaquinaria;
const tipo = (id: number, nombre: string) =>
  ({ id, nombre, slug: nombre.toLowerCase() }) as TiposMaquinaria;
const equipo = (id: number, tipoId: number, extra: Partial<EquiposNuevo> = {}) =>
  ({ id, nombre: `Equipo ${id}`, slug: `e${id}`, tipo: tipoId, ...extra }) as EquiposNuevo;

describe("textosMarcaNueva", () => {
  it("los de Andrés con el nombre de la marca; uno del panel manda", () => {
    const t = textosMarcaNueva(marca);
    assert.equal(t.intro, "Nuestra línea de equipos Case Construction incluye:");
    assert.match(t.cierre, /respaldo oficial/);
    const p = textosMarcaNueva({
      ...marca,
      plantillaLinea: { intro: "Equipos {marca}:", cierre: " " },
    });
    assert.equal(p.intro, "Equipos Case Construction:");
    assert.match(p.cierre, /respaldo oficial/);
  });
});

describe("enlacesDeTipos", () => {
  it("solo los tipos con equipos, enlazados a su página", () => {
    const r = enlacesDeTipos(marca, [tipo(1, "Retro"), tipo(2, "Vacio")], new Map([[1, 3]]));
    assert.deepEqual(
      r.map((e) => e.nombre),
      ["Retro"],
    );
    assert.match(r[0]!.href, /retro\/$/);
  });
});

describe("seccionesDeTipos", () => {
  it("una sección por tipo con equipos, y un tipo sin equipos directos no sale", () => {
    const r = seccionesDeTipos(
      marca,
      [tipo(1, "A"), tipo(2, "B"), tipo(3, "C")],
      [equipo(1, 1), equipo(2, 3)],
    );
    assert.deepEqual(
      r.map((s) => s.titulo),
      ["A", "C"],
    );
  });

  it("más de 6 equipos: muestra 6 y «hayMas»; con 6 o menos, no", () => {
    const muchos = Array.from({ length: MAX_EQUIPOS_POR_TIPO + 2 }, (_, i) => equipo(i + 1, 1));
    const [s] = seccionesDeTipos(marca, [tipo(1, "A")], muchos);
    assert.equal(s!.tarjetas.length, MAX_EQUIPOS_POR_TIPO);
    assert.equal(s!.hayMas, true);
    assert.equal(s!.total, MAX_EQUIPOS_POR_TIPO + 2);
    assert.equal(s!.todas.length, MAX_EQUIPOS_POR_TIPO + 2);
    const [t] = seccionesDeTipos(marca, [tipo(1, "A")], muchos.slice(0, MAX_EQUIPOS_POR_TIPO));
    assert.equal(t!.hayMas, false);
    assert.equal(t!.todas.length, 0);
  });

  it("los datos destacados de la ficha, como mucho 4", () => {
    const filas = Array.from({ length: 4 }, (_, i) => ({
      etiqueta: `D${i}`,
      valor: `${i}`,
      destacar: true,
    }));
    const [s] = seccionesDeTipos(marca, [tipo(1, "A")], [equipo(1, 1, { fichaTecnica: filas })]);
    assert.equal(s!.tarjetas[0]!.datos.length, 4);
  });
});

describe("datosDeTarjeta", () => {
  it("sin datos marcados, peso, potencia y motor de la ficha", () => {
    const d = datosDeTarjeta([
      { etiqueta: "Color", valor: "Naranja" },
      { etiqueta: "Peso operativo", valor: "7,7 t" },
      { etiqueta: "Potencia", valor: "90 hp" },
      { etiqueta: "Motor", valor: "FPT" },
    ]);
    assert.deepEqual(
      d.map((x) => x.icono),
      ["peso", "potencia", "motor"],
    );
  });

  it("con datos marcados, solo esos", () => {
    const d = datosDeTarjeta([
      { etiqueta: "Color", valor: "Naranja", destacar: true },
      { etiqueta: "Peso operativo", valor: "7,7 t" },
    ]);
    assert.equal(d.length, 1);
  });

  it("las prioritarias con el nombre uniforme de la ficha nueva; las demás y los valores, tal cual", () => {
    const d = datosDeTarjeta([
      { etiqueta: "POTENCIA NETA (SAE J1349):", valor: "74 hp @ 2.200 rpm", destacar: true },
      { etiqueta: "Peso operacional", valor: "13.000 kg", destacar: true },
      { etiqueta: "Marca y modelo del motor", valor: "Isuzu AR-4JJ1X", destacar: true },
      { etiqueta: "Capacidad del cucharón", valor: "0,5 m³", destacar: true },
    ]);
    assert.deepEqual(
      d.map((x) => [x.etiqueta, x.valor]),
      [
        ["Potencia neta", "74 hp @ 2.200 rpm"],
        ["Peso operativo", "13.000 kg"],
        ["Motor", "Isuzu AR-4JJ1X"],
        ["Capacidad del cucharón", "0,5 m³"],
      ],
    );
  });

  it("la potencia bruta no se llama «Potencia neta»", () => {
    const [d] = datosDeTarjeta([{ etiqueta: "Potencia bruta", valor: "80 hp", destacar: true }]);
    assert.equal(d?.etiqueta, "Potencia bruta");
  });
});
