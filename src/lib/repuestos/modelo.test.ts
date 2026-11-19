import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica } from "@/payload-types";

import {
  categoriasDelTipo,
  referenciaModelo4086,
  tituloDisponibles4086,
  tituloModelo4086,
} from "./modelo";

const cat = (id: number, nombre = `Cat ${id}`) => ({ id, nombre }) as CategoriasTecnica;

describe("categoriasDelTipo", () => {
  const todas = [cat(1), cat(2), cat(3), cat(4, " ")];

  it("las del tipo, en el orden del tipo (ids o pobladas)", () => {
    assert.deepEqual(
      categoriasDelTipo({ categoriasModelo: [3, cat(1)] }, todas).map((c) => c.id),
      [3, 1],
    );
  });

  it("una que ya no existe, o sin nombre, no sale", () => {
    assert.deepEqual(
      categoriasDelTipo({ categoriasModelo: [9, 4, 2] }, todas).map((c) => c.id),
      [2],
    );
  });

  it("sin categorías elegidas, ninguna", () => {
    assert.deepEqual(categoriasDelTipo({ categoriasModelo: null }, todas), []);
  });
});

describe("títulos de la plantilla 4086", () => {
  const nombres = {
    marca: { nombre: "Hitachi" },
    tipo: { nombre: "Excavadora" },
    modelo: { nombre: "Excavadora HITACHI EX120-2", codigo: "EX120-2" },
  };

  it("el h1: «{MARCA} {Tipo} {Modelo}» con el código", () => {
    assert.equal(tituloModelo4086(nombres), "HITACHI Excavadora EX120-2");
  });

  it("sin código, el nombre del modelo", () => {
    assert.equal(
      tituloModelo4086({ ...nombres, modelo: { nombre: "ZX200", codigo: null } }),
      "HITACHI Excavadora ZX200",
    );
  });

  it("«Repuestos disponibles para» y, en otra línea, «{tipo} {marca} {modelo}»", () => {
    assert.equal(
      tituloDisponibles4086(nombres),
      "Repuestos disponibles para\nExcavadora Hitachi EX120-2",
    );
  });

  it("la referencia de «Cotizar» y de WhatsApp", () => {
    assert.equal(referenciaModelo4086(nombres), "Repuestos para Excavadora Hitachi EX120-2");
  });
});
