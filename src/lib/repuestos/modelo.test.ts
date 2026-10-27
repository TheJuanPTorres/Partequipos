import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica, ModelosRepuesto } from "@/payload-types";

import {
  categoriasDelTipo,
  referenciaModelo4086,
  tituloDisponibles4086,
  tituloModelo4086,
  usaDisenoPropio,
  vistaModelo,
} from "./modelo";

const modelo = (extra: Partial<ModelosRepuesto> = {}) =>
  ({ id: 1, nombre: "Excavadora EJEMPLO X100", ...extra }) as ModelosRepuesto;

const cat = (id: number, nombre = `Cat ${id}`) => ({ id, nombre }) as CategoriasTecnica;

describe("vistaModelo", () => {
  it("usa los textos de WordPress tal cual", () => {
    const v = vistaModelo(
      modelo({
        antetitulo: "Repuestos para Maquinaria Pesada",
        tituloPagina: "EJEMPLO Excavadora X100",
        tituloDisponibles: "repuestos disponibles para excavadora ejemplo x100",
      }),
    );
    assert.equal(v.antetitulo, "Repuestos para Maquinaria Pesada");
    assert.equal(v.titulo, "EJEMPLO Excavadora X100");
    assert.equal(v.disponibles, "repuestos disponibles para excavadora ejemplo x100");
  });

  it("sin textos, el título y el de las categorías tienen respaldo (nunca un h1 vacío)", () => {
    const v = vistaModelo(modelo({ tituloPagina: "  ", tituloDisponibles: null }));
    assert.equal(v.antetitulo, "");
    assert.equal(v.titulo, "Repuestos Excavadora EJEMPLO X100");
    assert.equal(v.disponibles, "Repuestos disponibles para Excavadora EJEMPLO X100");
  });

  it("la lista de piezas solo sale con «Mostrar la lista de piezas»", () => {
    const piezas = [{ texto: "- Filtros para x100" }, { texto: "  " }, { texto: "- llantas" }];
    assert.deepEqual(vistaModelo(modelo({ piezas, mostrarPiezas: false })).piezas, []);
    assert.deepEqual(vistaModelo(modelo({ piezas, mostrarPiezas: true })).piezas, [
      "- Filtros para x100",
      "- llantas",
    ]);
  });
});

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

describe("usaDisenoPropio", () => {
  it("solo con «propio» elegido expresamente", () => {
    assert.equal(usaDisenoPropio({ disenoModelo: "propio" }), true);
    assert.equal(usaDisenoPropio({ disenoModelo: "provisional" }), false);
    assert.equal(usaDisenoPropio({ disenoModelo: null }), false);
    assert.equal(usaDisenoPropio({}), false);
  });
});

describe("títulos de la plantilla 4086", () => {
  const nombres = {
    marca: { nombre: "Hitachi" },
    tipo: { nombre: "Excavadora" },
    modelo: { nombre: "Excavadora HITACHI EX120-2", codigo: "EX120-2" },
  };

  it("el h1: «{MARCA} {Tipo} {Modelo}» con el código", () => {
    assert.equal(tituloModelo4086(nombres), "Hitachi LANDCROS Excavadora EX120-2");
  });

  it("sin código, el nombre del modelo", () => {
    assert.equal(
      tituloModelo4086({ ...nombres, modelo: { nombre: "ZX200", codigo: null } }),
      "Hitachi LANDCROS Excavadora ZX200",
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
