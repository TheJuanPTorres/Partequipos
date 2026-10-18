import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ADITAMENTOS_2022_EN_2025,
  fichaDeTarjeta,
  importarAditamento2022,
  marcaDeRotulo,
  nombreDeNuevo,
  nombreDeUsado,
  pesoDeTarjeta,
} from "./tarjetas";

describe("tarjetas sueltas del catálogo de WordPress", () => {
  it("nombre de los nuevos: tipo en singular, marca y modelo", () => {
    assert.equal(nombreDeNuevo("cargadores", "CASE", "W20F"), "Cargador Case Construction W20F");
    assert.equal(
      nombreDeNuevo("compactadores", "AMMANN", "ARX  45-2"),
      "Vibrocompactador Ammann ARX 45-2",
    );
    assert.throws(() => nombreDeNuevo("cargadores", "OTRA", "X1"));
  });

  it("la lista de la tarjeta pasa tal cual a la ficha técnica, y el peso se entiende", () => {
    const ficha = fichaDeTarjeta([
      "Peso operativo: 0.717 TON",
      "Potencia: 8,3 HP / 6,1 kW",
      "Motor: Hatz 1D42S",
      "línea sin dos puntos",
    ]);
    assert.deepEqual(ficha, [
      { etiqueta: "Peso operativo", valor: "0.717 TON" },
      { etiqueta: "Potencia", valor: "8,3 HP / 6,1 kW" },
      { etiqueta: "Motor", valor: "Hatz 1D42S" },
    ]);
    assert.equal(pesoDeTarjeta(ficha), 717);
    assert.equal(pesoDeTarjeta(fichaDeTarjeta(["Peso operativo: 11,9 TON"])), 11900);
  });

  it("usados: marca con mayúscula inicial y nombre compuesto", () => {
    assert.equal(marcaDeRotulo("CATERPILLAR"), "Caterpillar");
    assert.equal(
      nombreDeUsado("Bulldozer", "KOMATSU", "D39PX-21", 2007),
      "Bulldozer Komatsu D39PX-21 2007",
    );
    assert.equal(
      nombreDeUsado("Bulldozer", "CATERPILLAR", "D3C", null),
      "Bulldozer Caterpillar D3C",
    );
  });

  it("aditamentos de 2022: solo los que no están en 2025; uno sin decidir para", () => {
    assert.equal(importarAditamento2022("Ahoyador"), true);
    assert.equal(importarAditamento2022("Tablero porta horquilla"), false);
    assert.equal(importarAditamento2022("Martillo hidráulico"), false);
    assert.equal(importarAditamento2022("Cadena DE METAL"), false);
    assert.throws(() => importarAditamento2022("Aditamento inventado"));
    assert.equal(Object.values(ADITAMENTOS_2022_EN_2025).filter((v) => v === null).length, 1);
  });
});
