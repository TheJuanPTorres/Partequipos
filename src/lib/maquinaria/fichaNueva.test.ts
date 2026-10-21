import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  datosDeCabecera,
  enlaceVista360,
  filasRestantes,
  tituloEscritorio,
  tituloOtras,
  validarVista360,
} from "./fichaNueva";
import type { FilaFicha } from "./fichaTecnica";

const fila = (etiqueta: string, valor: string, destacar = false, icono?: string): FilaFicha => ({
  etiqueta,
  valor,
  destacar,
  icono: icono ?? null,
});

describe("datosDeCabecera", () => {
  it("reconoce los cinco de la plantilla, en su orden, con la etiqueta tal cual (también erratas)", () => {
    const filas = [
      fila("PESO OPERATIVO", "13 t"),
      fila("MOTOR", "Isuzu AM-4JJ1X"),
      fila("ALANCE MAXIMO EN EL SUELO", "8,65m"),
      fila("POTENCIA NETA", "98 hp"),
      fila("PROFUNDIDAD MÁXIMA DE EXCAVACIÓN", "6,0m"),
    ];
    const d = datosDeCabecera(filas);
    assert.deepEqual(
      d.map((x) => [x.etiqueta, x.valor, x.icono]),
      [
        ["POTENCIA NETA", "98 hp", "potencia"],
        ["PESO OPERATIVO", "13 t", "peso"],
        ["ALANCE MAXIMO EN EL SUELO", "8,65m", "alcance"],
        ["PROFUNDIDAD MÁXIMA DE EXCAVACIÓN", "6,0m", "profundidad"],
        ["MOTOR", "Isuzu AM-4JJ1X", "motor"],
      ],
    );
    assert.deepEqual(filasRestantes(filas, d), []);
  });

  it("sin el dato, no sale: nunca se inventa", () => {
    const d = datosDeCabecera([fila("Peso operativo", "8.400 kg"), fila("Cilindros", "4")]);
    assert.deepEqual(
      d.map((x) => x.icono),
      ["peso"],
    );
  });

  it("prefiere la potencia neta y, si no hay, toma otra potencia con su propia etiqueta", () => {
    const conNeta = datosDeCabecera([
      fila("Potencia bruta (ISO 14396)", "110 hp"),
      fila("Potencia neta (SAE J1349)", "98 hp"),
    ]);
    assert.equal(conNeta[0]?.etiqueta, "Potencia neta (SAE J1349)");
    const sinNeta = datosDeCabecera([fila("Potencia bruta (ISO 14396)", "110 hp")]);
    assert.equal(sinNeta[0]?.etiqueta, "Potencia bruta (ISO 14396)");
  });

  it("reconoce las variantes de profundidad y de motor, pero no «motor de arranque»", () => {
    const d = datosDeCabecera([
      fila("Máx. profundidad de excavación", "4,1 m"),
      fila("Motor de arranque", "12 V"),
      fila("Marca y modelo del motor", "Yanmar 4TNV88C"),
    ]);
    assert.deepEqual(
      d.map((x) => [x.icono, x.valor]),
      [
        ["profundidad", "4,1 m"],
        ["motor", "Yanmar 4TNV88C"],
      ],
    );
  });

  it("si el editor marcó «Destacar», mandan esas filas (con su icono)", () => {
    const filas = [
      fila("Potencia neta", "98 hp"),
      fila("Ancho de rodadura", "2,5 m", true, "alcance"),
      fila("Peso operativo", "13 t"),
    ];
    const d = datosDeCabecera(filas);
    assert.deepEqual(
      d.map((x) => [x.etiqueta, x.icono, x.fila]),
      [["Ancho de rodadura", "alcance", 1]],
    );
    assert.deepEqual(
      filasRestantes(filas, d).map((f) => f.etiqueta),
      ["Potencia neta", "Peso operativo"],
    );
  });

  it("sin ficha técnica, ningún dato", () => {
    assert.deepEqual(datosDeCabecera(null), []);
    assert.deepEqual(datosDeCabecera([]), []);
  });
});

describe("filasRestantes", () => {
  it("devuelve lo que la cabecera no enseña, en el orden de la ficha y sin filas incompletas", () => {
    const filas = [
      fila("Peso operativo", "13 t"),
      fila("Cilindros", "4"),
      fila("Vacía", ""),
      fila("Ancho de la zapata", "500 mm"),
    ];
    assert.deepEqual(
      filasRestantes(filas, datosDeCabecera(filas)).map((f) => f.etiqueta),
      ["Cilindros", "Ancho de la zapata"],
    );
  });
});

describe("tituloOtras", () => {
  it("concuerda con la primera palabra del tipo", () => {
    assert.equal(tituloOtras("Excavadoras"), "Otras Excavadoras");
    assert.equal(tituloOtras("Pavimentadoras Dynapac"), "Otras Pavimentadoras Dynapac");
    assert.equal(tituloOtras("Reglas vibratorias"), "Otras Reglas vibratorias");
    assert.equal(tituloOtras("Minicargadores"), "Otros Minicargadores");
    assert.equal(tituloOtras("Bulldozers"), "Otros Bulldozers");
    assert.equal(
      tituloOtras("Aditamentos para minicargadores"),
      "Otros Aditamentos para minicargadores",
    );
  });
});

describe("tituloEscritorio", () => {
  it("marca y referencia; sin referencia, null (se pinta el nombre completo)", () => {
    assert.deepEqual(tituloEscritorio("Hitachi", " ZX130-5B "), {
      marca: "Hitachi",
      modelo: "ZX130-5B",
    });
    assert.equal(tituloEscritorio("Aditamentos", null), null);
    assert.equal(tituloEscritorio("Aditamentos", "  "), null);
  });
});

describe("validarVista360", () => {
  it("vacío vale (sin botón); solo https y sin credenciales", () => {
    assert.equal(validarVista360(""), true);
    assert.equal(validarVista360(null), true);
    assert.equal(validarVista360("https://my.matterport.com/show/?m=abc"), true);
    assert.match(String(validarVista360("http://ejemplo.com/360")), /https/);
    assert.match(String(validarVista360("javascript:alert(1)")), /https/);
    assert.match(String(validarVista360("no es un enlace")), /válido/);
    assert.match(String(validarVista360("https://u:p@ejemplo.com/")), /contraseña/);
  });

  it("enlaceVista360 solo devuelve enlaces válidos", () => {
    assert.equal(enlaceVista360(" https://ejemplo.com/360 "), "https://ejemplo.com/360");
    assert.equal(enlaceVista360("http://ejemplo.com/360"), null);
    assert.equal(enlaceVista360(null), null);
  });
});
