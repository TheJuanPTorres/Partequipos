import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  altDeAditamento,
  datosDeTitulos,
  fichaDeUsado,
  fotosDistintas,
  nombreDeAditamentoNuevo,
  nombreDeAditamentoUsado,
  nombreDeFicheroAditamento,
} from "./wordpress";

describe("nombreDeAditamentoNuevo", () => {
  it("quita «para maquinaria pesada» y añade el tipo", () => {
    assert.equal(
      nombreDeAditamentoNuevo("MARTILLO PARA MAQUINARIA PESADA", "minicargadores"),
      "MARTILLO PARA MINICARGADORES",
    );
    assert.equal(
      nombreDeAditamentoNuevo("BRAZO LARGO PARA MAQUINARIA PESADA ", "excavadoras"),
      "BRAZO LARGO PARA EXCAVADORAS",
    );
  });
  it("deja las tildes y las erratas como en WordPress («RAPIDO»)", () => {
    assert.equal(
      nombreDeAditamentoNuevo("LÍNEA HÚMEDA PARA MAQUINARIA PESADA", "minicargadores"),
      "LÍNEA HÚMEDA PARA MINICARGADORES",
    );
    assert.equal(
      nombreDeAditamentoNuevo("ACOPLE RAPIDO PARA MAQUINARIA PESADA", "excavadoras"),
      "ACOPLE RAPIDO PARA EXCAVADORAS",
    );
  });
});

describe("datosDeTitulos y nombreDeAditamentoUsado", () => {
  it("la marca como primer título y repetida en el modelo", () => {
    const d = datosDeTitulos("OKADA", "OKADA TOP 100");
    assert.deepEqual(d, { tipo: null, marca: "Okada", modelo: "TOP 100" });
    assert.equal(nombreDeAditamentoUsado(d, null), "OKADA TOP 100");
  });
  it("tipo y marca; marca y modelo en el segundo título", () => {
    assert.equal(
      nombreDeAditamentoUsado(datosDeTitulos("MARTILLO", "NPK"), 2015),
      "MARTILLO NPK 2015",
    );
    assert.equal(
      nombreDeAditamentoUsado(datosDeTitulos("CRUSHER", "NPK G-17"), 2012),
      "CRUSHER NPK G-17 2012",
    );
  });
  it("«AFTER MARKET» no es una marca", () => {
    const d = datosDeTitulos("AFTER MARKET", "ACOPLE RÁPIDO PARA EXCAVADORA");
    assert.deepEqual(d, { tipo: "ACOPLE RÁPIDO PARA EXCAVADORA", marca: null, modelo: null });
    assert.equal(nombreDeAditamentoUsado(d, null), "ACOPLE RÁPIDO PARA EXCAVADORA");
  });
});

describe("fichaDeUsado", () => {
  it("peso, horas y año; «N/A», «-» y 0 toneladas son «sin dato»", () => {
    assert.deepEqual(fichaDeUsado(["Peso: 1.1 toneladas", "Horas: N/A", "Año: -"]), {
      pesoOperativo: 1.1,
      anio: null,
      horometro: null,
      descripcion: null,
    });
    const f = fichaDeUsado(["Peso: 0 toneladas", "Horas: N/A", "Año: 2012"]);
    assert.equal(f.pesoOperativo, null);
    assert.equal(f.anio, 2012);
  });
  it("lo demás pasa a la descripción, tal cual, como la escribe WordPress", () => {
    assert.deepEqual(
      fichaDeUsado(["Para maquinaria de: 20 toneladas", "Horas: - N/A", "Año: 2015"]),
      {
        pesoOperativo: null,
        anio: 2015,
        horometro: null,
        descripcion: "Para maquinaria de: 20 toneladas",
      },
    );
    assert.equal(
      fichaDeUsado(["Para Excavadoras de 7- 9 y 12 toneladas"]).descripcion,
      "Para Excavadoras de 7- 9 y 12 toneladas",
    );
  });
  it("una línea de serial nunca llega a la descripción", () => {
    assert.equal(fichaDeUsado(["Serial: X1234", "Año: 2015"]).descripcion, null);
  });
});

describe("ficheros y texto alternativo", () => {
  it("nombre determinista con el id del adjunto", () => {
    assert.equal(
      nombreDeFicheroAditamento(
        "https://x/uploads/2025/04/a.JPG",
        41,
        "LÍNEA HÚMEDA PARA MINICARGADORES",
      ),
      "wp-aditamento-41-linea-humeda-para-minicargadores.jpg",
    );
    assert.equal(nombreDeFicheroAditamento("https://x/a.zip", 1, "x"), null);
  });
  it("«foto n de N» solo con varias", () => {
    assert.equal(altDeAditamento("Martillo NPK 2015", 2, 5), "Martillo NPK 2015, foto 2 de 5");
    assert.equal(altDeAditamento("Pontones para excavadoras", 1, 1), "Pontones para excavadoras");
  });
});

describe("fotosDistintas", () => {
  const bits = (n: number) => Array.from({ length: 64 }, (_, i) => (i < n ? 1 : 0));
  it("de cada grupo de parecidas queda la de más píxeles, en el orden original", () => {
    const fotos = [
      { clave: "a-pequena", bits: bits(10), pixeles: 768 * 576 },
      { clave: "a-grande", bits: bits(11), pixeles: 1600 * 1200 },
      { clave: "b", bits: bits(40), pixeles: 1600 * 1200 },
      { clave: "a-copia", bits: bits(10), pixeles: 1600 * 1200 },
    ];
    assert.deepEqual(fotosDistintas(fotos), ["a-grande", "b"]);
  });
  it("no junta fotos distintas", () => {
    assert.deepEqual(
      fotosDistintas([
        { clave: "x", bits: bits(0), pixeles: 1 },
        { clave: "y", bits: bits(20), pixeles: 1 },
      ]),
      ["x", "y"],
    );
  });
});
