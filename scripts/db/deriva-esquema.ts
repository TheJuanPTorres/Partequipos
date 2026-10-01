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
 * tiempo (y el job, otro) y la entrada estándar cerrada (`< /dev/null`); este
 * script no la cierra por sí mismo, así que a mano conviene lanzarlo igual.
 */
import fs from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import { veredictoDeriva } from "../../src/lib/db/derivaEsquema";

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34). Aquí,
// además, no hay conexión: el push no podría correr de todos modos.
process.env.PAYLOAD_DISABLE_PUSH = "true";
// Y no lanza el proceso hijo que regenera los tipos (ver `payload.config.ts`).
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
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

/** Devuelve el código de salida: 0 si coincide, 1 si hay deriva o no hay snapshot. */
async function comparar(): Promise<number> {
  const { generateDrizzleJson, generateMigration, upSnapshot } = db.requireDrizzleKit();
  const despues = await generateDrizzleJson(db.schema);

  const snapshots = fs
    .readdirSync(db.migrationDir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const ultimo = snapshots.at(-1);
  if (!ultimo) {
    console.error("[deriva] No hay ningún snapshot en src/migrations: no hay con qué comparar.");
    return 1;
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
    return 0;
  }
  console.error(`[deriva] ✗ ${v.mensaje}`);
  for (const s of v.sentencias) console.error(`  ${s}`);
  return 1;
}

/*
 * SIN `process.exit()` (fase 5, CLAUDE.md §10.25). El run 36806029786 imprimió
 * el veredicto y no terminó hasta el tope de 5 min. `payload run` carga este
 * fichero con `tsImport` de tsx (en Node 24, hilo de ganchos de carga, porque
 * `payload/bin.js` desactiva `module.registerHooks`), y el script llamaba a
 * `process.exit()` MIENTRAS ese `import` aún se estaba evaluando: es el punto
 * en que la salida tiene que coordinarse con ese hilo.
 *
 * Ahora la salida la hace SIEMPRE `payload run`, con el `import` ya resuelto
 * (leído en `payload/dist/bin/index.js`, Payload 3.89): al terminar llama a
 * `process.exit(0)`, y si el `import` falla, a `process.exit(1)`. Por eso el
 * fallo se LANZA como error: un `process.exitCode = 1` lo pisaría su
 * `process.exit(0)`. El paso de CI conserva su tope de tiempo como red.
 */
if ((await comparar()) !== 0) {
  const error = new Error("[deriva] ✗ El guardarraíl falla: ver las líneas de arriba.");
  // Solo el mensaje: la pila de este fichero no aporta nada en el registro de CI.
  error.stack = error.message;
  throw error;
}
