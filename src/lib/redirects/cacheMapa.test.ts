import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { crearCacheMapa } from "./cacheMapa";

/** Reloj de mentira y un cargador que responde lo que se le diga, contando llamadas. */
function montar() {
  let t = 0;
  const cache = crearCacheMapa<string>({ ahora: () => t, avisar: () => {}, ttlMs: 60_000 });
  let llamadas = 0;
  const cargador = (respuesta: string | Error) => () => {
    llamadas++;
    return respuesta instanceof Error ? Promise.reject(respuesta) : Promise.resolve(respuesta);
  };
  return {
    avanzar: (ms: number) => (t += ms),
    cache,
    cargador,
    llamadas: () => llamadas,
  };
}

describe("caché del mapa de redirects (un fallo no se guarda)", () => {
  it("una carga buena se guarda durante el TTL", async () => {
    const m = montar();
    assert.equal(await m.cache.obtener(m.cargador("A")), "A");
    m.avanzar(59_000);
    assert.equal(await m.cache.obtener(m.cargador("B")), "A");
    assert.equal(m.llamadas(), 1);
  });

  it("un fallo sin mapa anterior sube, y la petición SIGUIENTE reintenta", async () => {
    const m = montar();
    await assert.rejects(m.cache.obtener(m.cargador(new Error("HTTP 503"))));
    // Sin esperar al TTL: el fallo no quedó guardado.
    assert.equal(await m.cache.obtener(m.cargador("A")), "A");
    assert.equal(m.llamadas(), 2);
  });

  it("un fallo con un mapa bueno anterior sigue usándolo y reintenta después", async () => {
    const m = montar();
    await m.cache.obtener(m.cargador("A"));
    m.avanzar(61_000);
    assert.equal(await m.cache.obtener(m.cargador(new Error("HTTP 503"))), "A");
    // El anterior no se «renueva» con el fallo: la siguiente vuelve a cargar.
    assert.equal(await m.cache.obtener(m.cargador("B")), "B");
    assert.equal(m.llamadas(), 3);
  });

  it("varias peticiones a la vez comparten una sola carga", async () => {
    const m = montar();
    const cargar = m.cargador("A");
    const [a, b] = await Promise.all([m.cache.obtener(cargar), m.cache.obtener(cargar)]);
    assert.equal(a, "A");
    assert.equal(b, "A");
    assert.equal(m.llamadas(), 1);
  });
});

describe("la ruta del mapa no disfraza un fallo de mapa vacío", () => {
  it("el catch del GET responde 503, no 200, y el proxy usa la caché común", () => {
    const raiz = path.resolve(import.meta.dirname, "../../..");
    const ruta = fs.readFileSync(
      path.join(raiz, "src/app/(site)/api/redirects-map/route.ts"),
      "utf8",
    );
    const get = (ruta.split("export async function GET")[1] ?? "").split(
      "export async function POST",
    )[0]!;
    const captura = get.split("catch")[1] ?? "";
    assert.match(captura, /status:\s*503/);
    assert.doesNotMatch(captura, /status:\s*200/);
    const proxy = fs.readFileSync(path.join(raiz, "src/proxy.ts"), "utf8");
    assert.match(proxy, /crearCacheMapa/);
  });
});
