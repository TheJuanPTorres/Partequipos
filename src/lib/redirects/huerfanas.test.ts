import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { clasificarDestino } from "./destino";
import { HUERFANAS_EN_404, REDIRECTS_HUERFANAS } from "./huerfanas";
import { normalizarRuta } from "./normalizar";

const aqui = path.dirname(fileURLToPath(import.meta.url));

/** Las rutas del rastreo, sin dominio ni barra final. */
function rutasDelRastreo(): Set<string> {
  const csv = fs.readFileSync(path.resolve(aqui, "../../../docs/url-map.csv"), "utf8");
  const rutas = new Set<string>();
  for (const linea of csv.split(/\r?\n/)) {
    const url = linea.match(/^"(https:\/\/partequipos\.com[^"]*)"/)?.[1];
    if (url) rutas.add(normalizarRuta(url.slice("https://partequipos.com".length)));
  }
  return rutas;
}

/** Los desde de las otras migraciones de redirects (las heredadas de repuestos). */
function desdesDeOtrasMigraciones(): Set<string> {
  const carpeta = path.resolve(aqui, "../../migrations");
  const desdes = new Set<string>();
  for (const f of fs.readdirSync(carpeta)) {
    if (!f.endsWith(".ts") || f.endsWith("_huerfanas_y_textos_demo.ts")) continue;
    const codigo = fs.readFileSync(path.join(carpeta, f), "utf8");
    if (!codigo.includes('INSERT INTO "redirects"')) continue;
    for (const m of codigo.matchAll(/^\s*\['([^']+)', '([^']+)'\],?$/gm)) desdes.add(m[1] ?? "");
  }
  return desdes;
}

function migracion(): string {
  const carpeta = path.resolve(aqui, "../../migrations");
  const nombre = fs.readdirSync(carpeta).find((f) => f.endsWith("_huerfanas_y_textos_demo.ts"));
  assert.ok(nombre, "no existe la migración _huerfanas_y_textos_demo");
  return fs.readFileSync(path.join(carpeta, nombre), "utf8");
}

describe("redirects de las URL huérfanas del rastreo", () => {
  const desdes = REDIRECTS_HUERFANAS.map(([d]) => d);

  it("son 17, y con /maquinaria-pesada/test (que se queda en 404) suman las 18 huérfanas", () => {
    assert.equal(REDIRECTS_HUERFANAS.length, 17);
    assert.equal(new Set([...desdes, ...HUERFANAS_EN_404]).size, 18);
  });

  it("cada desde es una URL del rastreo y está normalizada como la guarda la colección", () => {
    const rastreo = rutasDelRastreo();
    for (const d of [...desdes, ...HUERFANAS_EN_404]) {
      assert.ok(rastreo.has(d), `${d} no está en el rastreo`);
      assert.equal(normalizarRuta(d), d);
    }
  });

  it("no hay desde repetidos ni ya cargados por otra migración", () => {
    assert.equal(new Set(desdes).size, desdes.length);
    const otras = desdesDeOtrasMigraciones();
    for (const d of desdes) assert.ok(!otras.has(d), `${d} ya lo carga otra migración`);
  });

  it("ningún destino es, a su vez, el origen de otra redirección (nada de cadenas)", () => {
    const origenes = new Set([...desdes, ...desdesDeOtrasMigraciones()]);
    for (const [d, h] of REDIRECTS_HUERFANAS) {
      assert.ok(!origenes.has(h), `${d} → ${h} forma una cadena`);
    }
  });

  it("cada destino lo reconoce el validador de destinos", () => {
    for (const [, h] of REDIRECTS_HUERFANAS) {
      assert.notEqual(clasificarDestino(h).clase, "sin-ruta", `${h} no corresponde a ninguna ruta`);
      assert.equal(normalizarRuta(h), h);
    }
  });

  it("la copia literal de la migración coincide con la lista, fila por fila y en orden", () => {
    const copia = [...migracion().matchAll(/^\s*\['(\/[^']*)', '(\/[^']*)'\],?$/gm)].map((m) => [
      m[1],
      m[2],
    ]);
    assert.deepEqual(
      copia,
      REDIRECTS_HUERFANAS.map(([d, h]) => [d, h]),
    );
  });

  it("la migración es idempotente y no toca el esquema", () => {
    const codigo = migracion();
    assert.match(codigo, /ON CONFLICT \("desde"\) DO NOTHING/);
    assert.doesNotMatch(codigo, /CREATE |ALTER |DROP /);
  });
});
