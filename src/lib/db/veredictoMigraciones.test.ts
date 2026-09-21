import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MARCADOR_DEV, veredictoMigraciones } from "./veredictoMigraciones";

/**
 * Este guardián es el único de §10.25 que **corta un build**, así que lo que
 * importa no es que pase cuando todo está bien: es que **falle cuando debe**.
 * Plantar el marcador en una base real para comprobarlo tendría efectos
 * secundarios sobre un entorno; con la decisión aislada se prueba sin base.
 */
const INICIAL = { batch: 1, name: "20260728_072955_inicial" };
const PAGINAS = { batch: 2, name: "20260729_042128_paginas_institucionales" };
const DEV = { batch: MARCADOR_DEV, name: "dev" };

describe("veredicto del guardián de migraciones", () => {
  it("sigue adelante con migraciones normales", () => {
    const v = veredictoMigraciones([INICIAL, PAGINAS]);
    assert.equal(v.codigo, 0);
    assert.equal(v.motivo, "sin-marcador-dev");
    assert.equal(v.aplicadas.length, 2);
    assert.equal(v.marcadores.length, 0);
  });

  it("ABORTA si aparece el marcador dev (comprobación del propio guardián)", () => {
    const v = veredictoMigraciones([INICIAL, DEV, PAGINAS]);
    assert.equal(v.codigo, 1, "el guardián no cortó con el marcador presente");
    assert.equal(v.motivo, "hay-marcador-dev");
    assert.deepEqual(v.marcadores, [DEV]);
    // Las aplicadas se siguen listando: el mensaje de error las imprime.
    assert.equal(v.aplicadas.length, 2);
  });

  it("aborta también si el marcador llega como cadena, que es lo que hace el driver", () => {
    const v = veredictoMigraciones([{ batch: "-1", name: "dev" }]);
    assert.equal(v.codigo, 1, '"-1" como cadena burló la comparación');
    assert.equal(v.marcadores.length, 1);
  });

  it("una base sin la tabla es una base nueva: se puede migrar", () => {
    const v = veredictoMigraciones(null);
    assert.equal(v.codigo, 0);
    assert.equal(v.motivo, "base-nueva-sin-tabla");
  });

  it("una tabla vacía no es un marcador", () => {
    const v = veredictoMigraciones([]);
    assert.equal(v.codigo, 0);
    assert.equal(v.motivo, "sin-marcador-dev");
  });

  it("no confunde el batch 0 ni un batch negativo distinto de -1", () => {
    const v = veredictoMigraciones([
      { batch: 0, name: "cero" },
      { batch: -2, name: "raro" },
    ]);
    assert.equal(v.codigo, 0, "solo -1 es el marcador de push de desarrollo");
    assert.equal(v.aplicadas.length, 0, "ni 0 ni -2 cuentan como aplicadas");
  });
});
