/**
 * Escribe en un fichero LOCAL el origen de cada redirect de la base, uno por
 * línea, para `LANZAMIENTO_RUTAS_EXTRA` de `npm run lanzamiento:urls`
 * (2026-10-17). Desde ese día el mapa del dominio no lleva las URL antiguas
 * (solo su resumen con clave), y sin esta lista el comprobador no vería las
 * que no están en `docs/url-map.csv` (las 128 de las unidades usadas).
 *
 *   npm run preview:redirects:origenes -- "salida=<fichero>"
 *   npx tsx scripts/redirects/origenes.ts produccion "salida=<fichero>"   (runbook)
 *
 * SOLO LEE (`pg`, sin Payload). Imprime el recuento, nunca las rutas: algunas
 * llevan el serial de una unidad. El fichero va FUERA del repositorio
 * (`Desktop\partequipos-cierre\`, como los manifiestos) y se borra después.
 */
import fs from "node:fs";
import path from "node:path";

import { Client } from "pg";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const args = process.argv.slice(2);
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const salida = args.find((a) => a.startsWith("salida="))?.slice("salida=".length);
const fallar = (m: string): never => {
  const e = new Error(`[origenes] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (!salida) fallar('indica el fichero: "salida=<ruta>"');
const raiz = path.resolve(import.meta.dirname, "../..");
// En Windows las rutas no distinguen mayúsculas: se comparan en minúsculas.
const comparable = (p: string) => (process.platform === "win32" ? p.toLowerCase() : p);
if (comparable(path.resolve(salida!)).startsWith(comparable(raiz)))
  fallar("el fichero va fuera del repositorio");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
}

const cliente = new Client({
  connectionString: process.env.DATABASE_URI,
  connectionTimeoutMillis: 20000,
});
await cliente.connect();
const { rows } = await cliente.query<{ desde: string }>("SELECT desde FROM redirects ORDER BY id");
await cliente.end();

fs.writeFileSync(salida!, rows.map((r) => r.desde).join("\n") + "\n");
process.stdout.write(
  `[origenes] ${rows.length} orígenes escritos en ${salida} (sin imprimirlos)\n`,
);
