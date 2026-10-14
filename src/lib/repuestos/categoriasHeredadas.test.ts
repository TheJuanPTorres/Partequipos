import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { clasificarDestino } from "../redirects/destino";

import { CATEGORIAS_CON_PAGINA, OTROS_DESTINOS, REDIRECTS_HEREDADAS } from "./categoriasHeredadas";

const RAIZ = "/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada";
const aqui = path.dirname(fileURLToPath(import.meta.url));

/** Las URL de categoría del rastreo, sin dominio ni barra final, y sin el índice. */
function urlsDeCategoriaDelRastreo(): string[] {
  const csv = fs.readFileSync(path.resolve(aqui, "../../../docs/url-map.csv"), "utf8");
  const base = `https://partequipos.com${RAIZ}/`;
  const urls: string[] = [];
  for (const linea of csv.split(/\r?\n/)) {
    const m = linea.match(/^"([^"]+)"/);
    const url = m?.[1];
    if (url?.startsWith(base))
      urls.push(url.slice("https://partequipos.com".length).replace(/\/$/, ""));
  }
  return urls;
}

describe("redirects de las URL heredadas de categoría", () => {
  // Con página: el índice y las 10 categorías.
  const conPagina = new Set([RAIZ, ...CATEGORIAS_CON_PAGINA.map((s) => `${RAIZ}/${s}`)]);
  const desdes = REDIRECTS_HEREDADAS.map(([d]) => d);

  it("el rastreo tiene 32 URL bajo la raíz: el índice, las 10 con página y las 21 heredadas", () => {
    assert.equal(urlsDeCategoriaDelRastreo().length, 32);
    assert.equal(REDIRECTS_HEREDADAS.length, 21);
  });

  it("cada URL de categoría del rastreo tiene página o redirección (ninguna queda en 404)", () => {
    const sinCubrir = urlsDeCategoriaDelRastreo().filter(
      (u) => !conPagina.has(u) && !desdes.includes(u),
    );
    assert.deepEqual(sinCubrir, []);
  });

  it("toda redirección sale de una URL del rastreo y ninguna sale de una página que existe", () => {
    const rastreo = new Set(urlsDeCategoriaDelRastreo());
    for (const d of desdes) {
      assert.ok(rastreo.has(d), `${d} no está en el rastreo`);
      assert.ok(!conPagina.has(d), `${d} es una página que existe: no se redirige`);
    }
  });

  it("no hay desde repetidos", () => {
    assert.equal(new Set(desdes).size, desdes.length);
  });

  it("cada destino es una de las 10 categorías, el índice, el servicio técnico o aditamentos", () => {
    const permitidos = new Set<string>([...conPagina, ...Object.values(OTROS_DESTINOS)]);
    for (const [d, h] of REDIRECTS_HEREDADAS) {
      assert.ok(permitidos.has(h), `${d} → ${h} no es un destino permitido`);
    }
  });

  it("ningún destino es, a su vez, el origen de otra redirección (nada de cadenas)", () => {
    const origenes = new Set(desdes);
    for (const [d, h] of REDIRECTS_HEREDADAS) {
      assert.ok(!origenes.has(h), `${d} → ${h} forma una cadena`);
    }
  });

  it("los destinos de categoría los reconoce el validador de destinos", () => {
    for (const [, h] of REDIRECTS_HEREDADAS) {
      const d = clasificarDestino(h);
      assert.notEqual(d.clase, "sin-ruta", `${h} no corresponde a ninguna ruta`);
    }
  });

  it("la copia literal de la migración coincide con la lista, fila por fila y en orden", () => {
    const carpeta = path.resolve(aqui, "../../migrations");
    const nombre = fs
      .readdirSync(carpeta)
      .find((f) => f.endsWith("_redirects_categorias_heredadas.ts"));
    assert.ok(nombre, "no existe la migración _redirects_categorias_heredadas");
    const codigo = fs.readFileSync(path.join(carpeta, nombre), "utf8");
    const copia = [...codigo.matchAll(/^\s*\['([^']+)', '([^']+)'\],?$/gm)].map((m) => [
      m[1],
      m[2],
    ]);
    assert.deepEqual(
      copia,
      REDIRECTS_HEREDADAS.map(([d, h]) => [d, h]),
    );
  });

  it("la migración es idempotente y no toca el esquema", () => {
    const carpeta = path.resolve(aqui, "../../migrations");
    const nombre = fs
      .readdirSync(carpeta)
      .find((f) => f.endsWith("_redirects_categorias_heredadas.ts"));
    const codigo = fs.readFileSync(path.join(carpeta, nombre ?? ""), "utf8");
    assert.match(codigo, /ON CONFLICT \("desde"\) DO NOTHING/);
    assert.doesNotMatch(codigo, /CREATE |ALTER |DROP /);
  });
});
