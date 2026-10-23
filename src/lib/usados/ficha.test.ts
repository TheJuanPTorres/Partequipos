import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { datosDeUnidad, parrafos } from "./ficha";

describe("datosDeUnidad", () => {
  it("peso, año, horómetro y ubicación, en ese orden", () => {
    const d = datosDeUnidad({
      pesoOperativo: 8.4,
      anio: 2016,
      horometro: 4219,
      ubicacion: "Guarne",
    });
    assert.deepEqual(
      d.map((x) => [x.etiqueta, x.icono]),
      [
        ["Peso operativo", "peso"],
        ["Año", "anio"],
        ["Horómetro", "horas"],
        ["Ubicación", "ubicacion"],
      ],
    );
    assert.equal(d[0]?.valor, "8,4 t");
    assert.equal(d[2]?.valor.endsWith(" h"), true);
  });
  it("omite lo que falta", () => {
    assert.deepEqual(
      datosDeUnidad({ anio: 2019, ubicacion: "  " }).map((x) => x.etiqueta),
      ["Año"],
    );
    assert.deepEqual(datosDeUnidad({}), []);
  });
  it("un horómetro de 0 se muestra", () => {
    assert.equal(datosDeUnidad({ horometro: 0 })[0]?.valor, "0 h");
  });
  it("el serial de un aditamento va el último y siempre cabe", () => {
    const d = datosDeUnidad(
      { pesoOperativo: 1, anio: 2000, horometro: 1, ubicacion: "x", serial: " AB-123 " },
      3,
    );
    assert.deepEqual(
      d.map((x) => [x.etiqueta, x.valor]),
      [
        ["Peso operativo", "1 t"],
        ["Año", "2000"],
        ["Serial", "AB-123"],
      ],
    );
    assert.equal(d[2]?.icono, "serial");
    assert.deepEqual(datosDeUnidad({ serial: "  " }), []);
  });
  it("respeta el máximo", () => {
    const d = datosDeUnidad({ pesoOperativo: 1, anio: 2000, horometro: 1, ubicacion: "x" }, 3);
    assert.equal(d.length, 3);
  });
});

describe("parrafos", () => {
  it("separa por líneas y quita las vacías", () => {
    assert.deepEqual(parrafos("a\n\n b \r\nc"), ["a", "b", "c"]);
    assert.deepEqual(parrafos(null), []);
  });
});
