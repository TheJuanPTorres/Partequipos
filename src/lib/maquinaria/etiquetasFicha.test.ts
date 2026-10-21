import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { corregirFilas, deshacerFilas, leerTabla } from "./etiquetasFicha";

const TABLA = `# Título

| Etiqueta | Efecto |
| --- | --- |
| otra tabla | no cuenta |

## Tabla

| Etiqueta actual | Propuesta | N.º de fichas | Nota |
| --- | --- | --: | --- |
| ALANCE MAXIMO EN EL SUELO | Alcance máximo en el suelo | 8 | errata |
| Motor | _sin cambio_ | 12 |  |
| Caudal a \\| b | Caudal a \\| b corregido | 1 |  |

Texto después.
`;

describe("leerTabla", () => {
  it("lee solo las filas con propuesta de la tabla principal, con `\\|` como barra", () => {
    const t = leerTabla(TABLA);
    assert.deepEqual(
      [...t],
      [
        ["ALANCE MAXIMO EN EL SUELO", "Alcance máximo en el suelo"],
        ["Caudal a | b", "Caudal a | b corregido"],
      ],
    );
  });

  it("falla sin la cabecera y con una etiqueta repetida", () => {
    assert.throws(() => leerTabla("| a | b |"), /cabecera/);
    assert.throws(
      () => leerTabla("| Etiqueta actual | Propuesta |\n| --- | --- |\n| A | a |\n| A | b |\n"),
      /repetida/,
    );
  });
});

describe("corregirFilas", () => {
  const tabla = new Map([["MOTOR", "Motor"]]);
  const filas = [
    { id: "f1", etiqueta: "MOTOR", valor: "Isuzu AM-4JJ1X", destacar: true },
    { id: "f2", etiqueta: "Peso operativo", valor: "13 t" },
    { id: "f3", etiqueta: "MOTOR ", valor: "x" },
  ];

  it("cambia solo la etiqueta exacta; el valor y lo demás, intactos", () => {
    const r = corregirFilas(7, filas, tabla);
    assert.deepEqual(r.filas[0], {
      id: "f1",
      etiqueta: "Motor",
      valor: "Isuzu AM-4JJ1X",
      destacar: true,
    });
    assert.equal(r.filas[1], filas[1]);
    assert.equal(r.filas[2], filas[2]);
    assert.deepEqual(r.cambios, [{ equipo: 7, fila: "f1", antes: "MOTOR", despues: "Motor" }]);
  });

  it("una segunda pasada no cambia nada", () => {
    const una = corregirFilas(7, filas, tabla);
    assert.equal(corregirFilas(7, una.filas, tabla).cambios.length, 0);
  });

  it("deshacer devuelve la etiqueta de antes, salvo si alguien la cambió después", () => {
    const una = corregirFilas(7, filas, tabla);
    const d = deshacerFilas(7, una.filas, una.cambios);
    assert.deepEqual(d.filas, filas);
    assert.equal(d.devueltas.length, 1);
    const editada = una.filas.map((f) => (f.id === "f1" ? { ...f, etiqueta: "Motor diésel" } : f));
    const e = deshacerFilas(7, editada, una.cambios);
    assert.equal(e.filas[0]!.etiqueta, "Motor diésel");
    assert.equal(e.saltadas.length, 1);
  });

  it("una fila del manifiesto que ya no existe sale como saltada", () => {
    const d = deshacerFilas(7, [], [{ equipo: 7, fila: "x", antes: "A", despues: "a" }]);
    assert.equal(d.saltadas.length, 1);
  });
});
