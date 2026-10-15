import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { marcarActualizada, pendientesDeActualizar } from "./actualizacion";

const planes = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
const clave = (p: { id: number }) => String(p.id);

/** Simula ejecuciones sucesivas de `actualizar` con tandas de `tanda`. */
function ejecutar(
  anterior: Parameters<typeof pendientesDeActualizar>[2],
  huella: string,
  tanda: number,
  reiniciar = false,
) {
  const r = pendientesDeActualizar(planes, clave, anterior, huella, reiniciar);
  const hecha = r.pendientes.slice(0, tanda);
  for (const p of hecha) marcarActualizada(r.estado, clave(p));
  return { ...r, hecha: hecha.map((p) => p.id) };
}

describe("pendientesDeActualizar", () => {
  it("las tandas AVANZAN: 10, 10 y 5, y después no queda nada", () => {
    const a = ejecutar(undefined, "h1", 10);
    assert.deepEqual(a.hecha, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const b = ejecutar(a.estado, "h1", 10);
    assert.deepEqual(b.hecha, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    const c = ejecutar(b.estado, "h1", 10);
    assert.deepEqual(c.hecha, [21, 22, 23, 24, 25]);
    const d = ejecutar(c.estado, "h1", 10);
    assert.deepEqual(d.hecha, []);
    assert.equal(d.pendientes.length, 0);
  });

  // El fallo de antes: cada ejecución tomaba otra vez los primeros N.
  it("una segunda ejecución NO repite la primera tanda", () => {
    const a = ejecutar(undefined, "h1", 10);
    const b = ejecutar(a.estado, "h1", 10);
    assert.equal(
      b.hecha.some((id) => a.hecha.includes(id)),
      false,
    );
  });

  it("con una fuente nueva (otra huella) empieza de cero", () => {
    const a = ejecutar(undefined, "h1", 10);
    const b = ejecutar(a.estado, "h2", 10);
    assert.equal(b.reiniciada, true);
    assert.deepEqual(b.hecha, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(b.estado.fuente, "h2");
  });

  it("`reiniciar` empieza de cero con la misma fuente", () => {
    const a = ejecutar(undefined, "h1", 10);
    const b = ejecutar(a.estado, "h1", 10, true);
    assert.equal(b.reiniciada, true);
    assert.deepEqual(b.hecha, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("no modifica el estado anterior que recibe", () => {
    const anterior = { fuente: "h1", hechas: ["1"] };
    const r = pendientesDeActualizar(planes, clave, anterior, "h1");
    marcarActualizada(r.estado, "2");
    assert.deepEqual(anterior.hechas, ["1"]);
  });

  it("marcarActualizada no duplica", () => {
    const e = { fuente: "h", hechas: [] as string[] };
    marcarActualizada(e, "7");
    marcarActualizada(e, "7");
    assert.deepEqual(e.hechas, ["7"]);
  });
});
