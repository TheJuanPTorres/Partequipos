import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { aplanar, leerCsv, mapaActual, partirClave, planear, serializarCsv } from "./hojaEnlaces";

const modelos = [{ id: 7, nombre: "Bulldozer 1150M", enlaceTienda: "https://t.ejemplo.test/m7" }];
const categorias = [
  {
    id: 3,
    nombre: "Tren de rodaje",
    grupos: [
      {
        id: "g1",
        nombre: 'Cadena; "especial"',
        productos: [
          { id: "p1", texto: "Cadena A", enlaceTienda: "https://t.ejemplo.test/a" },
          { id: "p2", texto: "Cadena B" },
        ],
      },
      { nombre: "Sin id" },
    ],
  },
];

describe("hoja de enlaces: filas", () => {
  const filas = aplanar(modelos, categorias);
  it("una fila por elemento, con clave estable y sin las filas sin id", () => {
    assert.deepEqual(
      filas.map((f) => f.clave),
      ["modelo:7", "categoria:3", "grupo:3/g1", "producto:3/g1/p1", "producto:3/g1/p2"],
    );
    assert.equal(filas[0]?.enlace, "https://t.ejemplo.test/m7");
    assert.equal(filas[1]?.enlace, "");
  });
  it("ida y vuelta por CSV, con comillas, punto y coma y BOM", () => {
    const csv = serializarCsv(filas);
    assert.ok(csv.startsWith("﻿"));
    const { filas: leidas, errores } = leerCsv(csv);
    assert.deepEqual(errores, []);
    assert.deepEqual(
      leidas.map((f) => f.clave),
      filas.map((f) => f.clave),
    );
    assert.equal(leidas[3]?.enlace, "https://t.ejemplo.test/a");
  });
});

describe("leerCsv", () => {
  it("separador coma, columnas en otro orden y líneas en blanco", () => {
    const r = leerCsv("enlace,clave\r\nhttps://x.ejemplo.test/a,modelo:1\r\n\r\n,modelo:2\r\n");
    assert.deepEqual(r.errores, []);
    assert.deepEqual(r.filas, [
      { clave: "modelo:1", enlace: "https://x.ejemplo.test/a" },
      { clave: "modelo:2", enlace: "" },
    ]);
  });
  it("sin las columnas necesarias, error", () => {
    assert.equal(leerCsv("a;b\n1;2").errores.length, 1);
  });
  it("una clave repetida o vacía es un error", () => {
    const r = leerCsv(
      "clave;enlace\nmodelo:1;https://a.ejemplo.test\nmodelo:1;https://b.ejemplo.test\n;https://c.ejemplo.test",
    );
    assert.equal(r.errores.length, 2);
    assert.equal(r.filas.length, 1);
  });
});

describe("planear", () => {
  const actual = mapaActual(aplanar(modelos, categorias));
  it("cambios, sin cambio y filas vacías; lo que no está en la hoja no se toca", () => {
    const p = planear(
      [
        { clave: "modelo:7", enlace: "https://t.ejemplo.test/m7" },
        { clave: "categoria:3", enlace: "https://t.ejemplo.test/c3" },
        { clave: "producto:3/g1/p1", enlace: "-" },
        { clave: "producto:3/g1/p2", enlace: "" },
      ],
      actual,
    );
    assert.equal(p.bloqueado, false);
    assert.equal(p.sinCambio, 1);
    assert.equal(p.vacias, 1);
    assert.deepEqual(p.cambios, [
      { clave: "categoria:3", antes: "", despues: "https://t.ejemplo.test/c3" },
      { clave: "producto:3/g1/p1", antes: "https://t.ejemplo.test/a", despues: "" },
    ]);
  });
  it("«-» en una fila que no tenía enlace no cambia nada", () => {
    const p = planear([{ clave: "categoria:3", enlace: "-" }], actual);
    assert.equal(p.sinCambio, 1);
    assert.deepEqual(p.cambios, []);
  });
  it("un enlace que no es https:// bloquea todo", () => {
    for (const malo of ["http://x.ejemplo.test", "tienda", "javascript:alert(1)", "/tienda/"]) {
      const p = planear([{ clave: "modelo:7", enlace: malo }], actual);
      assert.equal(p.bloqueado, true, malo);
      assert.equal(p.invalidas.length, 1);
      assert.deepEqual(p.cambios, []);
    }
  });
  it("una clave que ya no existe bloquea todo (hoja vieja)", () => {
    const p = planear(
      [
        { clave: "modelo:7", enlace: "https://t.ejemplo.test/otro" },
        { clave: "modelo:999", enlace: "https://t.ejemplo.test/x" },
      ],
      actual,
    );
    assert.equal(p.bloqueado, true);
    assert.deepEqual(p.noEncontradas, ["modelo:999"]);
  });
  it("un error de lectura bloquea aunque lo demás esté bien", () => {
    assert.equal(planear([], actual, ["Línea 2: falta la clave."]).bloqueado, true);
  });
});

describe("partirClave", () => {
  it("reconoce las cuatro formas y rechaza lo demás", () => {
    assert.deepEqual(partirClave("modelo:7"), { tipo: "modelo", ids: ["7"] });
    assert.deepEqual(partirClave("grupo:3/g1"), { tipo: "grupo", ids: ["3", "g1"] });
    assert.deepEqual(partirClave("producto:3/g1/p1"), { tipo: "producto", ids: ["3", "g1", "p1"] });
    for (const mala of [
      "modelo:",
      "grupo:3",
      "producto:3/g1",
      "otro:1",
      "modelo:1/2",
      "grupo:3//x",
    ]) {
      assert.equal(partirClave(mala), null, mala);
    }
  });
});
