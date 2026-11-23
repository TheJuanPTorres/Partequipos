import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/*
 * GUARDARRAÍL: TODO SCRIPT QUE ESCRIBE TIENE GUARDA (tanda 21, tarea 8, 2026-11-23; dirección).
 * Un script de `scripts/` que crea, cambia o borra datos (API local de Payload o SQL) tiene que
 * comprobar a qué base va ANTES de escribir, con una de las guardas del repositorio. Los de
 * runbook (los ejecuta dirección contra el sitio publicado, a propósito) van en la lista de abajo,
 * cada uno con su motivo: añadir uno es una decisión que queda escrita en el diff.
 */

const RAIZ = path.resolve(process.cwd(), "scripts");

/** Lo que cuenta como escribir. */
const ESCRIBE =
  /payload\.(create|update|delete|updateGlobal)\(|db\.(deleteVersions|execute)\(|\.query\(\s*[`"'](INSERT|UPDATE|DELETE)/;

/** Las guardas del repositorio (base, almacén o entorno del preview). */
const GUARDAS =
  /\b(exigirBaseDePrueba|esBaseDePrueba|puedeTocarHeroDePrueba|exigirPreview|soloPreview|entornoPreview|puedeVaciarSolicitudes|vaciadoSolicitudes)\b/;

/** Scripts de runbook o de rescate, que escriben sin guarda a propósito. Ruta desde `scripts/`. */
export const SIN_GUARDA_POR_RUNBOOK: Record<string, string> = {
  "import/import.ts": "importador CSV del catálogo; dirección lo corre por runbook (§10.9)",
  "import/seed-paginas.ts": "siembra de las páginas institucionales; por runbook (§10.9)",
  "redirects/verificar-destinos.ts": "solo escribe el estado del destino de cada redirección",
  "usuarios/asignar-rol.ts": "rescate cuando una base se queda sin administrador (§10.17)",
  "usuarios/borrar-preferencia.ts": "borra UNA preferencia por id, por runbook (§10.26)",
};

function ficheros(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : ficheros(p);
    return /\.(ts|mts|mjs|cjs|js)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });
}

/** Los scripts que escriben sin guarda y sin estar en la lista. */
export function sinGuarda(archivos: { ruta: string; texto: string }[]): string[] {
  return archivos
    .filter(({ texto }) => ESCRIBE.test(texto) && !GUARDAS.test(texto))
    .map(({ ruta }) => ruta)
    .filter((r) => !(r in SIN_GUARDA_POR_RUNBOOK));
}

describe("guarda en los scripts que escriben", () => {
  const archivos = ficheros(RAIZ).map((p) => ({
    ruta: path.relative(RAIZ, p).split(path.sep).join("/"),
    texto: fs.readFileSync(p, "utf8"),
  }));

  it("todo script que escribe tiene guarda o está en la lista de runbook", () => {
    assert.ok(archivos.length > 50, "no encontró los scripts");
    assert.deepEqual(sinGuarda(archivos), []);
  });

  it("la lista de runbook no tiene entradas viejas (cada una existe y escribe)", () => {
    for (const r of Object.keys(SIN_GUARDA_POR_RUNBOOK)) {
      const a = archivos.find((x) => x.ruta === r);
      assert.ok(a, `${r} ya no existe: quítalo de la lista`);
      assert.ok(ESCRIBE.test(a.texto), `${r} ya no escribe: quítalo de la lista`);
    }
  });

  it("y falla cuando uno escribe sin guarda (comprobación del guardián)", () => {
    const malo = {
      ruta: "qa/nuevo.ts",
      texto: `await payload.create({ collection: "x", data: {} });`,
    };
    const sql = { ruta: "qa/sql.ts", texto: "await c.query(`DELETE FROM x`);" };
    const bueno = { ruta: "qa/bien.ts", texto: `exigirBaseDePrueba("qa");\n${malo.texto}` };
    const lector = { ruta: "qa/lee.ts", texto: `await payload.find({ collection: "x" });` };
    assert.deepEqual(sinGuarda([malo, sql, bueno, lector]), ["qa/nuevo.ts", "qa/sql.ts"]);
  });
});
