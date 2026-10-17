import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { destinosDe, mapaConClave, resumenDeRuta } from "./mapaConClave";

// Rutas y secretos INVENTADOS (CLAUDE.md §9).
const SECRETO = "secreto-de-prueba";
const ANTIGUA = "/maquinaria-pesada-usada/excavadora-ejemplo-zx000-sn-q4321";
const GUARDADOS = [
  {
    desde: ANTIGUA,
    hacia: "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/ejemplo/",
    tipo: "301",
  },
  { desde: "/gracias", hacia: "/contactanos/", tipo: "302" },
];

describe("mapa de redirects con resumen", () => {
  it("el resumen no depende de cómo se escriba la ruta", async () => {
    const a = await resumenDeRuta(`${ANTIGUA}/`, SECRETO);
    assert.equal(a, await resumenDeRuta(ANTIGUA.slice(1), SECRETO));
    assert.equal(a, await resumenDeRuta(`${ANTIGUA}/?utm=x#y`, SECRETO));
    assert.match(a, /^[0-9a-f]{64}$/);
  });

  it("cambia con el secreto y con la ruta, y sin secreto falla", async () => {
    const a = await resumenDeRuta(ANTIGUA, SECRETO);
    assert.notEqual(a, await resumenDeRuta(ANTIGUA, "otro-secreto"));
    assert.notEqual(a, await resumenDeRuta(`${ANTIGUA}x`, SECRETO));
    await assert.rejects(resumenDeRuta(ANTIGUA, ""));
    await assert.rejects(resumenDeRuta(ANTIGUA, undefined));
  });

  it("el mapa no lleva el origen ni ningún trozo de él", async () => {
    const mapa = await mapaConClave(GUARDADOS, SECRETO);
    const json = JSON.stringify(mapa);
    assert.equal(json.includes("desde"), false);
    assert.equal(json.includes("q4321"), false);
    assert.equal(json.includes("zx000"), false);
    assert.deepEqual(Object.keys(mapa[0]!).sort(), ["clave", "hacia", "tipo"]);
  });

  it("ninguna 301 se pierde: el proxy encuentra cada destino por su resumen", async () => {
    const mapa = new Map((await mapaConClave(GUARDADOS, SECRETO)).map((e) => [e.clave, e]));
    for (const r of GUARDADOS) {
      for (const pedida of [r.desde, `${r.desde}/`, `${r.desde}/?q=1`]) {
        const e = mapa.get(await resumenDeRuta(pedida, SECRETO));
        assert.equal(e?.hacia, r.hacia, pedida);
        assert.equal(e?.tipo, r.tipo, pedida);
      }
    }
    assert.equal(mapa.get(await resumenDeRuta("/otra/", SECRETO)), undefined);
  });

  it("la consulta del comprobador solo responde por las rutas que se le dan", () => {
    assert.deepEqual(destinosDe(GUARDADOS, ["/gracias/", "/no-existe/"]), [
      { ruta: "/gracias/", hacia: "/contactanos/", tipo: "302" },
    ]);
    assert.deepEqual(destinosDe(GUARDADOS, []), []);
  });

  it("la ruta del mapa y el proxy usan el resumen, no el origen", () => {
    const raiz = path.resolve(import.meta.dirname, "../../..");
    const ruta = fs.readFileSync(
      path.join(raiz, "src/app/(site)/api/redirects-map/route.ts"),
      "utf8",
    );
    const proxy = fs.readFileSync(path.join(raiz, "src/proxy.ts"), "utf8");
    // El GET (lo que lee cualquiera con la cabecera) solo sirve el mapa con resumen.
    const get = (ruta.split("export async function GET")[1] ?? "")
      .split("export async function POST")[0]!
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    assert.match(get, /mapaConClave\(/);
    assert.doesNotMatch(get, /desde/);
    assert.match(proxy, /resumenDeRuta\(/);
    assert.doesNotMatch(proxy, /entrada\.desde/);
  });
});
