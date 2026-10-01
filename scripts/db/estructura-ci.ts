/**
 * MIGRAR DESDE CERO — comprobación de estructura (CLAUDE.md §10.33 p.5).
 *
 * Se ejecuta en CI DESPUÉS de `payload migrate` sobre un Postgres de servicio
 * vacío. Compara la base resultante con el snapshot de la última migración
 * (`src/lib/db/estructuraSnapshot.ts`) y exige **cero filas**.
 *
 *   DATABASE_URI=postgres://…@127.0.0.1:5432/… npx tsx scripts/db/estructura-ci.ts
 *
 * - Solo LEE, dentro de una transacción de solo lectura.
 * - Se niega con cualquier host que no sea local: está pensada para el
 *   Postgres efímero de CI, no para Neon.
 */
import fs from "node:fs";
import path from "node:path";

import { Client } from "pg";

import { consultaEstructura, type Snapshot } from "../../src/lib/db/estructuraSnapshot";

const uri = process.env.DATABASE_URI ?? "";
const host = (() => {
  try {
    return new URL(uri).hostname;
  } catch {
    return "";
  }
})();
if (!["127.0.0.1", "localhost"].includes(host)) {
  console.error(
    `[estructura] Solo contra el Postgres local de CI; host recibido: «${host || "ninguno"}».`,
  );
  process.exit(1);
}

const dir = path.join(process.cwd(), "src", "migrations");
const ultimo = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .at(-1);
if (!ultimo) {
  console.error("[estructura] No hay snapshot en src/migrations.");
  process.exit(1);
}
const snap = JSON.parse(fs.readFileSync(path.join(dir, ultimo), "utf8")) as Snapshot;

const cliente = new Client({ connectionString: uri });
await cliente.connect();
try {
  await cliente.query("BEGIN TRANSACTION READ ONLY");
  const { rows } = await cliente.query<{ que: string; donde: string; detalle: string }>(
    consultaEstructura(snap),
  );
  const migraciones = await cliente.query<{ n: string }>(
    "SELECT count(*)::text AS n FROM payload_migrations WHERE batch > 0",
  );
  await cliente.query("ROLLBACK");
  process.stdout.write(
    `[estructura] Snapshot: ${ultimo} · migraciones aplicadas: ${migraciones.rows[0]?.n}\n`,
  );
  if (rows.length === 0) {
    process.stdout.write("[estructura] ✓ La base migrada desde cero coincide con el snapshot.\n");
    process.exit(0);
  }
  console.error(`[estructura] ✗ ${rows.length} diferencia(s) entre la base y el snapshot:`);
  for (const r of rows) console.error(`  ${r.que} ${r.donde}: ${r.detalle}`);
  process.exit(1);
} finally {
  await cliente.end().catch(() => undefined);
}
