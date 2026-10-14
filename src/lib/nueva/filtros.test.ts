import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { facetasConCuenta, filtrar, leerSeleccion, ordenar } from "../filtros";
import { CATALOGO_NUEVA, opcionDeModelo, toneladas, type EquipoFiltrable } from "./filtros";

// Equipos INVENTADOS, con marcas y tipos del catálogo público.
const hitachi = { slug: "hitachi", nombre: "Hitachi" };
const caseC = { slug: "case-construction", nombre: "CASE Construction" };
const excavadoras = { slug: "excavadoras", nombre: "Excavadoras" };
const cargadores = { slug: "cargadores", nombre: "Cargadores" };

const EQUIPOS: EquipoFiltrable[] = [
  {
    id: 3,
    nombre: "Excavadora Hitachi ZX999",
    codigo: "ZX999",
    marcaRef: hitachi,
    tipoRef: excavadoras,
    pesoKg: 21500,
  },
  {
    id: 1,
    nombre: "Cargador CASE 999X",
    codigo: "999X",
    marcaRef: caseC,
    tipoRef: cargadores,
    pesoKg: 8400,
  },
  {
    id: 2,
    nombre: "Excavadora CASE CX999",
    codigo: "CX999",
    marcaRef: caseC,
    tipoRef: excavadoras,
    pesoKg: null,
  },
  {
    id: 4,
    nombre: "Excavadora Hitachi ZX111",
    codigo: "ZX111",
    marcaRef: hitachi,
    tipoRef: excavadoras,
    pesoKg: 45000,
  },
];

const seleccion = (q: Record<string, string | string[]>) => leerSeleccion(q, CATALOGO_NUEVA);
const ids = (xs: EquipoFiltrable[]) => xs.map((x) => x.id);

describe("adaptador de maquinaria nueva", () => {
  it("el peso en toneladas sale de los kilogramos; sin peso, nada", () => {
    assert.equal(toneladas(8400), 8.4);
    assert.equal(toneladas(null), null);
    assert.equal(toneladas(0), null);
    assert.equal(toneladas(Number.NaN), null);
  });

  it("el modelo: el código como etiqueta y su forma de URL como valor", () => {
    assert.deepEqual(opcionDeModelo(" ZX75US-7 "), { valor: "zx75us-7", etiqueta: "ZX75US-7" });
    assert.equal(opcionDeModelo(""), null);
    assert.equal(opcionDeModelo(null), null);
  });

  it("facetas: marcas, peso, tipo y modelo, sin año", () => {
    assert.deepEqual(
      CATALOGO_NUEVA.facetas.map((f) => f.clave),
      ["marca", "peso", "tipo", "modelo"],
    );
  });

  it("filtra por marca, por tramo de peso (en t) y por tipo", () => {
    assert.deepEqual(
      ids(filtrar(EQUIPOS, CATALOGO_NUEVA, seleccion({ marca: "hitachi" }))).sort(),
      [3, 4],
    );
    assert.deepEqual(ids(filtrar(EQUIPOS, CATALOGO_NUEVA, seleccion({ peso: "6-10" }))), [1]);
    assert.deepEqual(ids(filtrar(EQUIPOS, CATALOGO_NUEVA, seleccion({ peso: "40-mas" }))), [4]);
    assert.deepEqual(
      ids(
        filtrar(
          EQUIPOS,
          CATALOGO_NUEVA,
          seleccion({ tipo: "excavadoras", marca: "case-construction" }),
        ),
      ),
      [2],
    );
  });

  it("el tipo se junta entre marcas: «Excavadoras» cuenta las de todas", () => {
    const tipo = facetasConCuenta(EQUIPOS, CATALOGO_NUEVA, seleccion({})).find(
      (f) => f.clave === "tipo",
    )!;
    assert.deepEqual(
      tipo.opciones.map((o) => [o.valor, o.cuenta]),
      [
        ["cargadores", 1],
        ["excavadoras", 3],
      ],
    );
  });

  it("órdenes: recomendados por alta, peso con los vacíos al final, nombre A–Z", () => {
    assert.equal(CATALOGO_NUEVA.ordenes[0].valor, "recomendados");
    assert.deepEqual(ids(ordenar(EQUIPOS, CATALOGO_NUEVA, seleccion({}))), [1, 2, 3, 4]);
    assert.deepEqual(
      ids(ordenar(EQUIPOS, CATALOGO_NUEVA, seleccion({ orden: "menor-peso" }))),
      [1, 3, 4, 2],
    );
    assert.deepEqual(
      ids(ordenar(EQUIPOS, CATALOGO_NUEVA, seleccion({ orden: "mayor-peso" }))),
      [4, 3, 1, 2],
    );
    assert.deepEqual(
      ids(ordenar(EQUIPOS, CATALOGO_NUEVA, seleccion({ orden: "nombre" }))),
      [1, 2, 4, 3],
    );
  });
});
