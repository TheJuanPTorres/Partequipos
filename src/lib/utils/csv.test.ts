import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { leerCsv } from "./csv";

describe("leerCsv", () => {
  it("comillas, comas dentro, comilla escapada y CRLF", () => {
    assert.deepEqual(leerCsv('"a","b"\r\n"1, uno","dice ""hola"""\r\n\r\n2,\n'), [
      { a: "1, uno", b: 'dice "hola"' },
      { a: "2", b: "" },
    ]);
  });
  it("sin cabecera no hay filas", () => {
    assert.deepEqual(leerCsv(""), []);
  });
});
