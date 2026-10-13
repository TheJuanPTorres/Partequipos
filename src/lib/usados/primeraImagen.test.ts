import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposUsado, Media } from "@/payload-types";

import { conPrimeraImagen, idsDePrimeraImagen } from "./primeraImagen";

// Datos inventados (CLAUDE.md §9): ni nombres ni seriales reales.
const unidad = (id: number, imagenes: EquiposUsado["imagenes"]) =>
  ({ id, nombre: `Unidad de ejemplo ${id}`, imagenes }) as EquiposUsado;
const foto = (id: number) => ({ id, url: `https://ejemplo.invalid/${id}.jpg` }) as Media;

describe("idsDePrimeraImagen", () => {
  it("solo la primera de cada unidad, sin repetir y aceptando ids o documentos", () => {
    const ids = idsDePrimeraImagen([
      unidad(1, [10, 11, 12]),
      unidad(2, [foto(20), 21]),
      unidad(3, [10]),
      unidad(4, []),
      unidad(5, null),
    ]);
    assert.deepEqual(ids, [10, 20]);
  });
});

describe("conPrimeraImagen", () => {
  it("deja cada unidad con su primera foto poblada y nada más", () => {
    const r = conPrimeraImagen([unidad(1, [10, 11, 12]), unidad(2, [20])], [foto(20), foto(10)]);
    assert.deepEqual(
      r.map((u) => u.imagenes),
      [[foto(10)], [foto(20)]],
    );
  });

  it("sin foto, o con la foto borrada, la unidad queda sin imágenes (y no se cae)", () => {
    const r = conPrimeraImagen([unidad(1, []), unidad(2, null), unidad(3, [99])], [foto(10)]);
    assert.deepEqual(
      r.map((u) => u.imagenes),
      [[], [], []],
    );
  });

  it("no toca el resto de campos ni el orden", () => {
    const r = conPrimeraImagen([unidad(2, [20]), unidad(1, [10])], [foto(10), foto(20)]);
    assert.deepEqual(
      r.map((u) => [u.id, u.nombre]),
      [
        [2, "Unidad de ejemplo 2"],
        [1, "Unidad de ejemplo 1"],
      ],
    );
  });
});
