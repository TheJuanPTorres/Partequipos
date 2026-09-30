import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

import { citarArgumento, lineaDeComando } from "./lineaDeComando";

describe("citarArgumento", () => {
  it("deja tal cual lo que no necesita comillas", () => {
    for (const p of ["win32", "linux"] as const) {
      assert.equal(citarArgumento("npx", p), "npx");
      assert.equal(citarArgumento("puppeteer-core@24.43.1", p), "puppeteer-core@24.43.1");
      assert.equal(citarArgumento("C:/Users/x/y.cjs", p), "C:/Users/x/y.cjs");
    }
  });

  it("entrecomilla una ruta con espacios (el caso que partía el cargador)", () => {
    assert.equal(
      citarArgumento("C:\\Users\\Juan Torres\\x.cjs", "win32"),
      '"C:\\Users\\Juan Torres\\x.cjs"',
    );
    assert.equal(citarArgumento("/home/juan torres/x.cjs", "linux"), "'/home/juan torres/x.cjs'");
  });

  it("escapa comillas internas y barras finales en Windows, y comillas simples en POSIX", () => {
    assert.equal(citarArgumento('di "hola"', "win32"), '"di \\"hola\\""');
    assert.equal(citarArgumento("C:\\ruta con espacio\\", "win32"), '"C:\\ruta con espacio\\\\"');
    assert.equal(citarArgumento("it's", "linux"), "'it'\\''s'");
    assert.equal(citarArgumento("", "win32"), '""');
  });
});

describe("lineaDeComando, por su efecto: los argumentos llegan enteros", () => {
  it("un proceso real recibe la ruta con espacios como UN argumento", () => {
    const partes = [
      process.execPath,
      "-e",
      "console.log(JSON.stringify(process.argv.slice(1)))",
      "C:/Users/Juan Torres/x.cjs",
      "otro",
    ];
    const r = spawnSync(lineaDeComando(partes, process.platform), {
      shell: true,
      encoding: "utf8",
    });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout.trim()), ["C:/Users/Juan Torres/x.cjs", "otro"]);
  });

  it("control: sin entrecomillar, la ruta se parte (el defecto que se corrige)", () => {
    const partes = [
      process.execPath,
      "-e",
      "console.log(JSON.stringify(process.argv.slice(1)))",
      "C:/Users/Juan Torres/x.cjs",
    ];
    const [cmd, ...args] = partes;
    const r = spawnSync(`"${cmd}"`, [args[0]!, `"${args[1]}"`, args[2]!], {
      shell: true,
      encoding: "utf8",
    });
    assert.deepEqual(JSON.parse(r.stdout.trim()), ["C:/Users/Juan", "Torres/x.cjs"]);
  });
});
