import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DESTACADAS_EN_TARJETA,
  ICONOS_FICHA,
  destacadas,
  filasCompletas,
  validarDestacadas,
  validarDestacarFila,
  contarDestacadas,
  type FilaFicha,
} from "./fichaTecnica";

const fila = (n: number, extra: Partial<FilaFicha> = {}): FilaFicha => ({
  etiqueta: `Dato ${n}`,
  valor: `${n} kg`,
  ...extra,
});

describe("ficha técnica: datos destacados", () => {
  it("la lista de iconos es corta (6 a 8) y sin repetidos", () => {
    assert.ok(ICONOS_FICHA.length >= 6 && ICONOS_FICHA.length <= 8);
    assert.equal(new Set(ICONOS_FICHA.map((i) => i.value)).size, ICONOS_FICHA.length);
  });

  it("devuelve solo las filas marcadas, en su orden, con su icono", () => {
    const filas = [
      fila(1, { destacar: true, icono: "peso" }),
      fila(2),
      fila(3, { destacar: true, icono: "motor" }),
    ];
    assert.deepEqual(destacadas(filas), [
      { etiqueta: "Dato 1", valor: "1 kg", icono: "peso" },
      { etiqueta: "Dato 3", valor: "3 kg", icono: "motor" },
    ]);
  });

  it("corta en el máximo: 4 en la tarjeta principal y 3 en las de otras referencias", () => {
    const filas = [1, 2, 3, 4, 5].map((n) => fila(n, { destacar: true, icono: "peso" }));
    assert.equal(destacadas(filas).length, 4);
    assert.equal(destacadas(filas, DESTACADAS_EN_TARJETA).length, 3);
  });

  it("una fila marcada sin icono, o con uno desconocido, usa «otro»", () => {
    assert.equal(destacadas([fila(1, { destacar: true })])[0]!.icono, "otro");
    assert.equal(destacadas([fila(1, { destacar: true, icono: "cohete" })])[0]!.icono, "otro");
  });

  it("ignora filas incompletas, también si están marcadas", () => {
    const filas = [fila(1, { destacar: true, valor: " " }), { etiqueta: null, valor: "x" }];
    assert.deepEqual(destacadas(filas), []);
    assert.equal(filasCompletas(filas).length, 0);
    assert.deepEqual(destacadas(null), []);
  });

  it("el panel acepta hasta 4 marcadas y rechaza 5 con un mensaje claro", () => {
    const cuatro = [1, 2, 3, 4].map((n) => fila(n, { destacar: true }));
    assert.equal(validarDestacadas(cuatro), true);
    assert.equal(validarDestacadas([]), true);
    assert.equal(validarDestacadas(undefined), true);
    const msg = validarDestacadas([...cuatro, fila(5, { destacar: true })]);
    assert.equal(typeof msg, "string");
    assert.match(String(msg), /hay 5 marcados/);
  });
});

describe("validarDestacarFila (la casilla «Destacar»)", () => {
  const cinco = [1, 2, 3, 4, 5].map((n) => fila(n, { destacar: true }));
  it("con 5 marcadas, el mensaje sale en cada casilla marcada", () => {
    assert.match(
      String(validarDestacarFila(true, { data: { fichaTecnica: cinco } })),
      /Solo caben 4/,
    );
  });
  it("una casilla sin marcar nunca es el error", () => {
    assert.equal(validarDestacarFila(false, { data: { fichaTecnica: cinco } }), true);
    assert.equal(validarDestacarFila(undefined, { data: { fichaTecnica: cinco } }), true);
  });
  it("con 4 o menos, o sin datos, vale", () => {
    assert.equal(validarDestacarFila(true, { data: { fichaTecnica: cinco.slice(0, 4) } }), true);
    assert.equal(validarDestacarFila(true, { data: null }), true);
  });
});

describe("contarDestacadas (el contador del panel)", () => {
  it("cuenta solo los true", () => {
    assert.equal(contarDestacadas([true, false, undefined, null, true, "true", 1]), 2);
    assert.equal(contarDestacadas([]), 0);
  });
});
