import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  borrables,
  leerManifiesto,
  mismoDestino,
  sinVersion,
  type Manifiesto,
} from "./versionesIniciales";

describe("mismoDestino", () => {
  const base: Manifiesto = { creado: "x", versiones: [] };
  it("un manifiesto solo vale para su destino", () => {
    assert.equal(mismoDestino({ ...base, destino: "preview" }, "preview"), true);
    assert.equal(mismoDestino({ ...base, destino: "preview" }, "produccion"), false);
    assert.equal(mismoDestino({ ...base, destino: "produccion" }, "preview"), false);
  });
  it("sin destino es de los primeros del preview, nunca del sitio publicado", () => {
    assert.equal(mismoDestino(base, "preview"), true);
    assert.equal(mismoDestino(base, "produccion"), false);
  });
  it("leerManifiesto conserva el destino y rechaza uno que no es texto", () => {
    assert.equal(leerManifiesto({ ...base, destino: "produccion" }).destino, "produccion");
    assert.throws(() => leerManifiesto({ ...base, destino: 3 }), /destino/);
  });
});

describe("sinVersion", () => {
  it("devuelve solo los documentos sin ninguna versión, en su orden", () => {
    assert.deepEqual(sinVersion([5, 1, 3, 2], [3, 3, 1]), [5, 2]);
  });
  it("compara ids número y texto como iguales", () => {
    assert.deepEqual(sinVersion([1, 2], ["1"]), [2]);
  });
  it("segunda pasada: si todos tienen versión, no crea nada", () => {
    assert.deepEqual(sinVersion([1, 2], [1, 2]), []);
  });
});

describe("leerManifiesto", () => {
  const bueno: Manifiesto = {
    creado: "2026-11-26T00:00:00.000Z",
    versiones: [{ coleccion: "articulos", documento: 4, version: 90 }],
  };
  it("acepta uno válido", () => {
    assert.deepEqual(leerManifiesto(bueno), bueno);
  });
  it("rechaza una colección sin borradores", () => {
    assert.throws(
      () =>
        leerManifiesto({ ...bueno, versiones: [{ ...bueno.versiones[0], coleccion: "marcas" }] }),
      /no admitida/,
    );
  });
  it("rechaza entradas sin id de versión o sin estructura", () => {
    assert.throws(
      () => leerManifiesto({ ...bueno, versiones: [{ coleccion: "paginas", documento: 1 }] }),
      /version/,
    );
    assert.throws(() => leerManifiesto(null));
    assert.throws(() => leerManifiesto({ creado: "x" }), /versiones/);
  });
});

describe("borrables", () => {
  const m: Manifiesto = {
    creado: "x",
    versiones: [
      { coleccion: "articulos", documento: 1, version: 10 },
      { coleccion: "articulos", documento: 2, version: 11 },
      { coleccion: "paginas", documento: 1, version: 10 },
    ],
  };
  it("solo las de esa colección que existen y siguen siendo del mismo documento", () => {
    assert.deepEqual(
      borrables(m, "articulos", [
        { id: 10, parent: 1 },
        { id: 11, parent: 3 }, // otro documento: no se toca
        { id: 12, parent: 2 }, // no está en el manifiesto: no se toca
      ]),
      [10],
    );
  });
  it("una versión que ya no existe no se borra", () => {
    assert.deepEqual(borrables(m, "paginas", []), []);
  });
});
