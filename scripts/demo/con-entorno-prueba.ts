/**
 * Ejecuta un comando contra el DESTINO DE PRUEBA de la copia de demostración
 * (CLAUDE.md §10.38): una rama TEMPORAL de Neon que crea dirección.
 *
 *   tsx scripts/demo/con-entorno-prueba.ts <comando> [argumentos…]
 *
 * - La base sale de `.env.prueba-copia.local` (solo `DATABASE_URI`, la cadena
 *   pooled de esa rama temporal; lo rellena dirección).
 * - El token del Blob y el secreto de derivación salen de `.env.preview.local`:
 *   la prueba escribe en el almacén del PREVIEW, nunca en el de producción.
 * - Se niega si la base es la de producción, la del preview o la de development
 *   (`veredictoDestino("prueba", …)`). No imprime ningún valor.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { FICHERO_ENTORNO_PREVIEW, leerFicheroEntorno } from "../../src/lib/preview/entornoPreview";
import { lineaDeComando } from "../../src/lib/preview/lineaDeComando";

const FICHERO_PRUEBA = ".env.prueba-copia.local";

const leer = (f: string) => {
  const r = path.resolve(f);
  if (!fs.existsSync(r)) {
    console.error(`✗ Falta ${f} en la raíz del repo.`);
    process.exit(1);
  }
  return leerFicheroEntorno(fs.readFileSync(r, "utf8"));
};
const preview = leer(FICHERO_ENTORNO_PREVIEW);
const prueba = leer(FICHERO_PRUEBA);

const env: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URI: prueba.DATABASE_URI,
  BLOB_READ_WRITE_TOKEN: preview.BLOB_READ_WRITE_TOKEN,
  VERCEL_AUTOMATION_BYPASS_SECRET: preview.VERCEL_AUTOMATION_BYPASS_SECRET,
};
const v = veredictoDestino("prueba", env.DATABASE_URI, env.BLOB_READ_WRITE_TOKEN);
if (!v.valido) {
  console.error(`✗ Destino de prueba NO válido: ${v.motivo}. No se ejecuta nada.`);
  process.exit(1);
}

const [comando, ...argumentos] = process.argv.slice(2);
if (!comando) {
  console.error("Uso: tsx scripts/demo/con-entorno-prueba.ts <comando> [argumentos…]");
  process.exit(1);
}
console.error(`destino de prueba: ${v.host} · almacén ${v.almacen}`);
const r = spawnSync(lineaDeComando([comando, ...argumentos], process.platform), {
  env,
  shell: true,
  stdio: "inherit",
});
process.exit(r.status ?? 1);
