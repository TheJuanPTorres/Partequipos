import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { medidaCompartida } from "./medidaCompartida";

const sinEspera = () => 0;

describe("medidaCompartida", () => {
  it("las llamadas simultáneas con la misma clave miden una sola vez", async () => {
    let veces = 0;
    const medir = medidaCompartida({
      medir: async (clave) => {
        veces++;
        await new Promise((listo) => setTimeout(listo, 5));
        return clave.length;
      },
      espera: sinEspera,
    });
    const resultados = await Promise.all(Array.from({ length: 50 }, () => medir("logo.png")));
    assert.equal(veces, 1);
    assert.deepEqual(new Set(resultados), new Set([8]));
  });

  it("un acierto se queda: la llamada siguiente no vuelve a medir", async () => {
    let veces = 0;
    const medir = medidaCompartida({ medir: async () => ++veces, espera: sinEspera });
    assert.equal(await medir("a"), 1);
    assert.equal(await medir("a"), 1);
    assert.equal(await medir("b"), 2);
    assert.equal(veces, 2);
  });

  it("reintenta y acierta sin avisar", async () => {
    let veces = 0;
    const avisos: string[] = [];
    const medir = medidaCompartida({
      medir: async () => {
        if (++veces < 3) throw new Error("HTTP 403");
        return "medido";
      },
      espera: sinEspera,
      alFallar: (clave) => avisos.push(clave),
    });
    assert.equal(await medir("a"), "medido");
    assert.equal(veces, 3);
    assert.deepEqual(avisos, []);
  });

  it("agotados los intentos devuelve null, avisa UNA vez y no guarda el fallo", async () => {
    let veces = 0;
    let falla = true;
    const avisos: string[] = [];
    const medir = medidaCompartida({
      medir: async () => {
        veces++;
        if (falla) throw new Error("HTTP 403");
        return "medido";
      },
      espera: sinEspera,
      alFallar: (clave, error) => avisos.push(`${clave}: ${String(error)}`),
    });
    // Veinte páginas esperando el mismo logo: tres intentos y un aviso, no sesenta y veinte.
    const resultados = await Promise.all(Array.from({ length: 20 }, () => medir("a")));
    assert.deepEqual(new Set(resultados), new Set([null]));
    assert.equal(veces, 3);
    assert.deepEqual(avisos, ["a: Error: HTTP 403"]);
    // El fallo no se quedó: la siguiente llamada vuelve a medir.
    falla = false;
    assert.equal(await medir("a"), "medido");
    assert.equal(veces, 4);
  });
});
