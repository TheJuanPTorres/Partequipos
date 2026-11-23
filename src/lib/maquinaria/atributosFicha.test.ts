import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_ATRIBUTOS,
  datosDeAtributos,
  separarValor,
  validarLista,
  validarValor,
  valorConUnidad,
} from "./atributosFicha";

const potencia = { nombre: "Potencia neta", icono: "potencia", unidad: "hp", tipoValor: "numero" };
const motor = { nombre: "Motor", icono: "motor", unidad: "", tipoValor: "texto" };

describe("datosDeAtributos", () => {
  it("pinta icono, nombre, valor y unidad del catálogo, en el orden de las filas", () => {
    const d = datosDeAtributos([
      { atributo: motor, valor: "Yanmar 4TNV" },
      { atributo: potencia, valor: "122" },
    ]);
    assert.deepEqual(d, [
      { etiqueta: "Motor", valor: "Yanmar 4TNV", icono: "motor" },
      { etiqueta: "Potencia neta", valor: "122 hp", icono: "potencia" },
    ]);
  });
  it("como mucho 5", () => {
    const filas = Array.from({ length: 8 }, (_, i) => ({ atributo: potencia, valor: String(i) }));
    assert.equal(datosDeAtributos(filas)?.length, MAX_ATRIBUTOS);
  });
  it("salta filas sin atributo poblado, sin nombre o sin valor", () => {
    const d = datosDeAtributos([
      { atributo: 7, valor: "1" },
      { atributo: null, valor: "1" },
      { atributo: { nombre: "", icono: "peso" }, valor: "1" },
      { atributo: potencia, valor: "  " },
      { atributo: motor, valor: "X" },
    ]);
    assert.equal(d?.length, 1);
  });
  it("sin ninguna fila válida: null (la ficha usa lo de siempre)", () => {
    assert.equal(datosDeAtributos([]), null);
    assert.equal(datosDeAtributos(undefined), null);
    assert.equal(datosDeAtributos([{ atributo: 3, valor: "1" }]), null);
  });
  it("un icono desconocido se pinta como «otro»", () => {
    const d = datosDeAtributos([{ atributo: { nombre: "X", icono: "nave" }, valor: "1" }]);
    assert.equal(d?.[0]?.icono, "otro");
  });
});

describe("separarValor", () => {
  it("número y unidad", () => {
    assert.deepEqual(separarValor("3658 mm"), { tipo: "numero", valor: "3658", unidad: "mm" });
    assert.deepEqual(separarValor("20.500 kg"), { tipo: "numero", valor: "20.500", unidad: "kg" });
    assert.deepEqual(separarValor("122hp"), { tipo: "numero", valor: "122", unidad: "hp" });
    assert.deepEqual(separarValor("5,5 km/h"), { tipo: "numero", valor: "5,5", unidad: "km/h" });
  });
  it("número solo", () => {
    assert.deepEqual(separarValor("4"), { tipo: "numero", valor: "4", unidad: "" });
  });
  it("lo que no encaja queda como texto, tal cual", () => {
    for (const t of ["angulo 20 grds derecha/izquierda", "Cummins 4B3.9", "1,2 m³ (SAE)", "N/A"]) {
      assert.deepEqual(separarValor(t), { tipo: "texto", valor: t, unidad: "" });
    }
  });
  it("lo que se separa se vuelve a juntar igual que antes", () => {
    for (const t of ["3658 mm", "20.500 kg", "5,5 km/h"]) {
      const s = separarValor(t);
      assert.equal(valorConUnidad(s.valor, s.unidad), t);
    }
  });
});

describe("validaciones", () => {
  it("un atributo numérico exige número", () => {
    assert.equal(validarValor("122", "numero"), true);
    assert.equal(validarValor("20.500", "numero"), true);
    assert.notEqual(validarValor("122 hp", "numero"), true);
    assert.equal(validarValor("lo que sea", "texto"), true);
    assert.notEqual(validarValor("", "texto"), true);
  });
  it("la lista: máximo 5 y sin repetidos", () => {
    const seis = Array.from({ length: 6 }, (_, i) => ({ atributo: i + 1, valor: "1" }));
    assert.notEqual(validarLista(seis), true);
    assert.notEqual(
      validarLista([
        { atributo: 1, valor: "1" },
        { atributo: 1, valor: "2" },
      ]),
      true,
    );
    assert.equal(validarLista(seis.slice(0, 5)), true);
    assert.equal(validarLista(null), true);
  });
});
