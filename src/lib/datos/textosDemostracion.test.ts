import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { TEXTOS_DEMOSTRACION } from "./textosDemostracion";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const datos = path.resolve(aqui, "../../../scripts/import/data");

/** Lee un CSV de la siembra (campos entre comillas) como filas. */
function leerCsv(fichero: string): string[][] {
  const texto = fs.readFileSync(path.join(datos, fichero), "utf8");
  return texto
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((linea) =>
      [...linea.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => (m[1] ?? "").replace(/""/g, '"')),
    );
}

/** De qué CSV sale cada tabla, y en qué columna están el slug y la descripción. */
const SIEMBRA = {
  categorias_usada: { fichero: "maquinaria-usada-categorias.csv", slug: 1, descripcion: 2 },
  categorias_maquinaria: { fichero: "maquinaria-categorias.csv", slug: 1, descripcion: 2 },
  marcas_maquinaria: { fichero: "maquinaria-marcas.csv", slug: 1, descripcion: 2 },
  tipos_maquinaria: { fichero: "maquinaria-tipos.csv", slug: 1, descripcion: 3 },
} as const;

function migracion(): string {
  const carpeta = path.resolve(aqui, "../../migrations");
  const nombre = fs.readdirSync(carpeta).find((f) => f.endsWith("_huerfanas_y_textos_demo.ts"));
  assert.ok(nombre, "no existe la migración _huerfanas_y_textos_demo");
  return fs.readFileSync(path.join(carpeta, nombre), "utf8");
}

describe("textos de demostración a la vista", () => {
  it("cada texto de demostración es EXACTAMENTE el sembrado para ese slug", () => {
    for (const t of TEXTOS_DEMOSTRACION) {
      const s = SIEMBRA[t.tabla];
      const fila = leerCsv(s.fichero).find((f) => f[s.slug] === t.slug);
      assert.ok(fila, `${t.tabla}/${t.slug} no está en ${s.fichero}`);
      assert.equal(t.demo, fila[s.descripcion], `${t.tabla}/${t.slug}`);
    }
  });

  it("no hay filas repetidas, y ningún texto nuevo conserva la marca de demostración", () => {
    const claves = TEXTOS_DEMOSTRACION.map((t) => `${t.tabla}/${t.slug}`);
    assert.equal(new Set(claves).size, claves.length);
    for (const t of TEXTOS_DEMOSTRACION) {
      assert.doesNotMatch(t.nuevo ?? "", /demostraci|ADR \d|Anomal/i);
      assert.notEqual(t.nuevo, "", "vaciar es null, no la cadena vacía");
    }
  });

  it("cubre las 8 categorías de usada y la nota interna del SV208", () => {
    assert.equal(TEXTOS_DEMOSTRACION.filter((t) => t.tabla === "categorias_usada").length, 8);
    assert.ok(TEXTOS_DEMOSTRACION.some((t) => t.slug === "vibrocompactador-case-sv208"));
  });

  it("la copia literal de la migración coincide con la lista, fila por fila y en orden", () => {
    const desescapar = (s: string | undefined) =>
      s === undefined ? null : s.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
    const copia = [
      ...migracion().matchAll(
        /^\s*\['([a-z_]+)', '([^']+)', '((?:[^'\\]|\\.)*)', (?:null|'((?:[^'\\]|\\.)*)')\],?$/gm,
      ),
    ].map((m) => ({
      tabla: m[1],
      slug: m[2],
      demo: desescapar(m[3]),
      nuevo: desescapar(m[4]),
    }));
    assert.deepEqual(copia, TEXTOS_DEMOSTRACION);
  });

  it("la migración solo cambia la fila si la descripción es exactamente la de demostración", () => {
    const codigo = migracion();
    assert.match(codigo, /WHERE "slug" = \$\{slug\} AND "descripcion" = \$\{demo\}/);
    assert.doesNotMatch(codigo, /CREATE |ALTER |DROP /);
  });
});
