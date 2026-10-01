/**
 * DERIVA DE ESQUEMA (CLAUDE.md §10.33 p.5): falla si el esquema que declara el
 * código no coincide con el último snapshot de `src/migrations`, es decir, si
 * hay un cambio de colección sin su migración.
 *
 *   npm run db:deriva
 *
 * Hace lo mismo que `payload migrate:create` hasta el punto de escribir
 * (leído en `@payloadcms/drizzle/dist/utilities/buildCreateMigration.js`):
 * construye el esquema Drizzle desde la config, carga el snapshot más reciente
 * y pide a drizzle-kit las sentencias de la diferencia. **No conecta a ninguna
 * base** (`disableDBConnect`), así que corre en CI sin secretos.
 *
 * Riesgo cubierto: ante un posible renombrado de columna, drizzle-kit
 * PREGUNTA, y sin TTY se quedaría esperando. El paso de CI lleva un tope de
 * tiempo y la entrada estándar cerrada (`< /dev/null`); este script no la
 * cierra por sí mismo, así que a mano conviene lanzarlo igual.
 */
import fs from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import { veredictoDeriva } from "../../src/lib/db/derivaEsquema";

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34). Aquí,
// además, no hay conexión: el push no podría correr de todos modos.
process.env.PAYLOAD_DISABLE_PUSH = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config, disableDBConnect: true });

type DrizzleKit = {
  generateDrizzleJson: (schema: unknown) => Promise<{ version: string }> | { version: string };
  generateMigration: (antes: unknown, despues: unknown) => Promise<string[]>;
  upSnapshot?: (s: unknown) => unknown;
};
type Adaptador = {
  migrationDir: string;
  schema: unknown;
  requireDrizzleKit: () => DrizzleKit;
};

const db = payload.db as unknown as Adaptador;
const { generateDrizzleJson, generateMigration, upSnapshot } = db.requireDrizzleKit();
const despues = await generateDrizzleJson(db.schema);

const snapshots = fs
  .readdirSync(db.migrationDir)
  .filter((f) => f.endsWith(".json"))
  .sort();
const ultimo = snapshots.at(-1);
if (!ultimo) {
  console.error("[deriva] No hay ningún snapshot en src/migrations: no hay con qué comparar.");
  process.exit(1);
}
let antes = JSON.parse(fs.readFileSync(path.join(db.migrationDir, ultimo), "utf8")) as {
  version: string;
};
if (upSnapshot && antes.version < despues.version) antes = upSnapshot(antes) as typeof antes;

const sentencias = await generateMigration(antes, despues);
const v = veredictoDeriva(sentencias);
process.stdout.write(`[deriva] Último snapshot: ${ultimo}\n`);
if (v.coincide) {
  process.stdout.write("[deriva] ✓ El esquema del código coincide con las migraciones.\n");
  process.exit(0);
}
console.error(`[deriva] ✗ ${v.mensaje}`);
for (const s of v.sentencias) console.error(`  ${s}`);
process.exit(1);
