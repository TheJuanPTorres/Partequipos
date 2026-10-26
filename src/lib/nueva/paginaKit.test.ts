import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  acentoDeMarca,
  columnaDeTarjeta,
  enFilaDe,
  franjaDesde,
  mediosDeKit,
  repeticionesDeCinta,
} from "./paginaKit";

describe("acentoDeMarca", () => {
  it("usa el color de la marca y una tinta legible sobre él", () => {
    assert.deepEqual(acentoDeMarca({ colorMarca: "#f2a900" }, "#fc661c"), {
      acento: "#f2a900",
      tinta: "#000000",
    });
    assert.equal(acentoDeMarca({ colorMarca: "#bf2e1a" }, "#fc661c").tinta, "#ffffff");
  });
  it("sin color válido, el de respaldo", () => {
    assert.equal(acentoDeMarca({ colorMarca: "rojo" }, "#fc661c").acento, "#fc661c");
    assert.equal(acentoDeMarca({ colorMarca: null }, "#fc661c").acento, "#fc661c");
  });
});

describe("mediosDeKit", () => {
  it("sin nada, ni fondo ni emblema", () => {
    assert.deepEqual(mediosDeKit({ kit: undefined }), { fondo: null, emblema: null });
    assert.deepEqual(mediosDeKit({}), { fondo: null, emblema: null });
  });
  it("el emblema no se pinta si la casilla está desmarcada, aunque esté subido", () => {
    const media = { id: 1, url: "https://x.test/e.webp", width: 100, height: 50 } as never;
    assert.equal(mediosDeKit({ kit: { emblema: media, mostrarEmblema: false } }).emblema, null);
    assert.ok(mediosDeKit({ kit: { emblema: media, mostrarEmblema: true } }).emblema);
  });
});

describe("la cinta", () => {
  it("se repite hasta llenar el ancho (7 tarjetas como mínimo)", () => {
    assert.equal(repeticionesDeCinta(0), 0);
    assert.equal(repeticionesDeCinta(1), 7);
    assert.equal(repeticionesDeCinta(5), 2);
    assert.equal(repeticionesDeCinta(7), 1);
    assert.equal(repeticionesDeCinta(9), 1);
  });
});

describe("colocación de las tarjetas (regla del kit)", () => {
  it("con 4, de a 2 y centradas en escritorio", () => {
    assert.equal(enFilaDe(4), 2);
    assert.deepEqual(
      [0, 1, 2, 3].map((i) => columnaDeTarjeta(i, 4).escritorio),
      [2, 4, 2, 4],
    );
  });
  it("si sobra una va al centro y si sobran dos arrancan en la 2", () => {
    assert.equal(columnaDeTarjeta(3, 5).escritorio, 2);
    assert.equal(columnaDeTarjeta(0, 6).escritorio, null);
  });
  it("en tablet, la última impar se centra", () => {
    assert.equal(columnaDeTarjeta(4, 5).tablet, 2);
    assert.equal(columnaDeTarjeta(3, 5).tablet, null);
    assert.equal(columnaDeTarjeta(1, 2).tablet, null);
  });
});

describe("franjaDesde", () => {
  it("solo con una fila de 3 y desde el ancho en que cabe junto al título", () => {
    assert.equal(franjaDesde("Bulldozers", 6), 1280);
    assert.equal(franjaDesde("Bulldozers", 2), 0);
    assert.equal(franjaDesde("Bulldozers", 4), 0);
    assert.equal(franjaDesde("Compactador de suelo", 6), 1600);
    // Un título tan largo que no cabe nunca al lado de la franja.
    assert.equal(franjaDesde("Compactadores de doble rodillo", 6), 0);
  });
});
