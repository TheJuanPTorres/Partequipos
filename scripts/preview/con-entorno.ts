/**
 * Ejecuta un comando con el entorno del PREVIEW (CLAUDE.md §9, «Modo de
 * trabajo»). Lee `.env.preview.local`, exige que sea el preview
 * (`veredictoEntornoPreview`) y lanza el comando con esas variables POR ENCIMA
 * de las del proceso. `payload run` y `db:check` no las pisan con `.env.local`
 * (que tiene el Blob de PRODUCCIÓN): las del entorno mandan.
 *
 *   tsx scripts/preview/con-entorno.ts <comando> [argumentos…]
 *
 * No imprime ningún valor. Los guardas de cada script siguen mandando.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  FICHERO_ENTORNO_PREVIEW,
  leerFicheroEntorno,
  veredictoEntornoPreview,
} from "../../src/lib/preview/entornoPreview";
import { lineaDeComando } from "../../src/lib/preview/lineaDeComando";

const fichero = path.resolve(FICHERO_ENTORNO_PREVIEW);
if (!fs.existsSync(fichero)) {
  console.error(`✗ Falta ${FICHERO_ENTORNO_PREVIEW} en la raíz del repo.`);
  process.exit(1);
}
const entorno = leerFicheroEntorno(fs.readFileSync(fichero, "utf8"));
const v = veredictoEntornoPreview(entorno);
if (!v.valido) {
  console.error(`✗ Entorno del preview NO válido: ${v.motivo}. No se ejecuta nada.`);
  process.exit(1);
}

const [comando, ...argumentos] = process.argv.slice(2);
if (!comando) {
  console.error("Uso: tsx scripts/preview/con-entorno.ts <comando> [argumentos…]");
  process.exit(1);
}
const env: NodeJS.ProcessEnv = { ...process.env, ENTORNO_PREVIEW: "1" };
for (const [clave, valor] of Object.entries(entorno)) if (valor) env[clave] = valor;

console.error(`entorno del preview: ${v.host} · ${v.almacen} · bypass ${v.bypass}`);
// Con `shell: true`, Node junta comando y argumentos SIN comillas: se
// entrecomilla aquí (src/lib/preview/lineaDeComando.ts) para que una ruta con
// espacios llegue entera.
const r = spawnSync(lineaDeComando([comando, ...argumentos], process.platform), {
  env,
  shell: true,
  stdio: "inherit",
});
process.exit(r.status ?? 1);
