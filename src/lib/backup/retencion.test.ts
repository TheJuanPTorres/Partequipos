import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decidirRetencion, fechaDeNombre, nombreRespaldo } from "./retencion";

/**
 * Lo que estas pruebas protegen es **que no borre de más**. Un fallo aquí no da
 * error en ninguna parte: se descubre el día que hace falta restaurar y el
 * respaldo ya no está.
 */

const AHORA = new Date("2026-08-13T12:00:00.000Z");
const hace = (dias: number, hora = 3) =>
  new Date(AHORA.getTime() - dias * 86400000 + (hora - 12) * 3600000);

/** Un respaldo por día durante `n` días. */
const diarios = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ fecha: hace(i), id: `d${i}` }));

describe("decidirRetencion — ventana diaria", () => {
  it("conserva los 30 últimos días completos", () => {
    const { conservar, borrar } = decidirRetencion(diarios(30), AHORA);
    assert.equal(conservar.length, 30);
    assert.equal(borrar.length, 0);
  });

  it("de varios respaldos del mismo día conserva el más reciente", () => {
    const hoy = [
      { fecha: new Date("2026-08-13T02:00:00Z"), id: "madrugada" },
      { fecha: new Date("2026-08-13T09:00:00Z"), id: "manana" },
      { fecha: new Date("2026-08-13T11:00:00Z"), id: "mediodia" },
    ];
    const { conservar } = decidirRetencion(hoy, AHORA);
    assert.equal(conservar.length, 1);
    assert.equal(conservar[0]?.id, "mediodia");
  });
});

describe("decidirRetencion — ventanas semanal y mensual", () => {
  /*
   * Cifras exactas, no rangos: con un respaldo diario durante N días la política
   * es determinista, y un rango holgado dejaría pasar justo el error que estas
   * pruebas existen para detectar (borrar de más).
   */
  it("con 90 días de respaldos diarios conserva 40 y borra 50", () => {
    const { conservar, borrar } = decidirRetencion(diarios(90), AHORA);
    assert.equal(conservar.length, 40); // 31 diarios + 9 semanales nuevos
    assert.equal(borrar.length, 50);
  });

  it("con un año de respaldos diarios conserva 49", () => {
    const { conservar, borrar } = decidirRetencion(diarios(365), AHORA);
    assert.equal(conservar.length, 49); // + los mensuales del resto del año
    assert.equal(borrar.length, 316);
  });

  it("con dos años sigue conservando 49: la política no crece sin límite", () => {
    const { conservar } = decidirRetencion(diarios(730), AHORA);
    assert.equal(conservar.length, 49);
  });

  it("borra lo que pasa del año", () => {
    const viejos = [{ fecha: hace(400), id: "antiguo" }, ...diarios(5)];
    const { borrar } = decidirRetencion(viejos, AHORA);
    assert.deepEqual(
      borrar.map((r) => r.id),
      ["antiguo"],
    );
  });
});

describe("decidirRetencion — protecciones", () => {
  it("NUNCA borra el más reciente, aunque esté fuera de toda ventana", () => {
    const solo = [{ fecha: hace(900), id: "unico-y-viejisimo" }];
    const { conservar, borrar } = decidirRetencion(solo, AHORA);
    assert.equal(borrar.length, 0);
    assert.equal(conservar[0]?.id, "unico-y-viejisimo");
  });

  it("una fecha futura (reloj desajustado) no provoca un borrado", () => {
    const futuro = [{ fecha: new Date("2027-01-01T00:00:00Z"), id: "futuro" }, ...diarios(3)];
    const { borrar } = decidirRetencion(futuro, AHORA);
    assert.equal(borrar.length, 0);
  });

  it("con la lista vacía no revienta", () => {
    assert.deepEqual(decidirRetencion([], AHORA), { conservar: [], borrar: [] });
  });

  it("conservar y borrar suman siempre el total, sin solaparse", () => {
    const todos = diarios(200);
    const { conservar, borrar } = decidirRetencion(todos, AHORA);
    assert.equal(conservar.length + borrar.length, todos.length);
    const ids = new Set([...conservar, ...borrar].map((r) => r.id));
    assert.equal(ids.size, todos.length);
  });
});

describe("nombreRespaldo y fechaDeNombre", () => {
  it("genera un nombre con marca temporal en UTC", () => {
    const n = nombreRespaldo("development", new Date("2026-08-13T20:51:31.000Z"));
    assert.equal(n, "partequipos-development-20260813-205131.ndjson.gz");
  });

  it("el orden alfabético coincide con el cronológico", () => {
    const a = nombreRespaldo("dev", new Date("2026-08-13T09:00:00Z"));
    const b = nombreRespaldo("dev", new Date("2026-08-13T21:00:00Z"));
    const c = nombreRespaldo("dev", new Date("2026-09-01T00:00:00Z"));
    assert.deepEqual([c, a, b].sort(), [a, b, c]);
  });

  it("limpia un nombre de entorno con caracteres raros", () => {
    assert.match(nombreRespaldo("Prod/../etc"), /^partequipos-prodetc-/);
  });

  it("da la vuelta: del nombre a la fecha", () => {
    const f = new Date("2026-08-13T20:51:31.000Z");
    assert.equal(fechaDeNombre(nombreRespaldo("dev", f))?.toISOString(), f.toISOString());
  });

  it("devuelve null con un nombre que no encaja", () => {
    for (const n of ["otra-cosa.gz", "partequipos-dev.ndjson.gz", ""]) {
      assert.equal(fechaDeNombre(n), null);
    }
  });
});
