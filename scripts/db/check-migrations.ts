/**
 * Guardián previo a `payload migrate`. SOLO LEE: no altera nada.
 *
 * Uso:  npm run db:check   (y como primer paso del Build Command)
 *
 * PROBLEMA QUE RESUELVE
 * `payload migrate` abre un prompt interactivo si `payload_migrations` contiene
 * el marcador `dev` (batch -1) que deja el push de desarrollo:
 *
 *   "It looks like you've run Payload in dev mode… data loss will occur.
 *    Would you like to proceed?"
 *
 * En un build de Vercel no hay stdin, así que el comando **se queda colgado**
 * hasta que alguien cancela (nos costó 20 minutos el 2026-08-09) o, peor, sale
 * con código 0 sin migrar y el despliegue queda "Ready" pero desactualizado.
 *
 * Este guardián detecta esa condición ANTES y corta con código 1 y un mensaje
 * accionable. Falla ruidoso, que es lo que se quiere en un build.
 *
 * Se usa `pg` directamente en vez de cargar Payload: es una consulta de lectura,
 * arranca en milisegundos y no puede tocar el esquema ni por accidente.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Pool } from "pg";

const MARCADOR_DEV = -1;

/**
 * Lee `DATABASE_URI` del entorno y, si no está, de los ficheros `.env` locales.
 *
 * En Vercel la variable llega por el entorno del build. En una máquina de
 * desarrollo vive en `.env.local`, que `tsx` no carga solo (a diferencia de
 * `payload run`). Se resuelve aquí para que el guardián funcione igual en ambos
 * sitios sin depender de cómo se invoque.
 */
function leerConexion(): string {
  const delEntorno = process.env.DATABASE_URI?.trim();
  if (delEntorno) return delEntorno;

  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  for (const fichero of [".env.local", ".env"]) {
    const ruta = path.join(raiz, fichero);
    if (!fs.existsSync(ruta)) continue;
    const match = fs.readFileSync(ruta, "utf8").match(/^DATABASE_URI=(.+)$/m);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

async function main(): Promise<number> {
  const connectionString = leerConexion();
  if (!connectionString) {
    console.error(
      "✗ DATABASE_URI no está definida. No se puede comprobar el estado de migraciones.",
    );
    return 1;
  }

  const pool = new Pool({ connectionString, connectionTimeoutMillis: 20000 });

  try {
    const existe = await pool.query(
      "select to_regclass('public.payload_migrations') is not null as existe",
    );
    if (!existe.rows[0]?.existe) {
      console.log("✓ Base sin tabla payload_migrations: es una base nueva, se puede migrar.");
      return 0;
    }

    const { rows } = await pool.query<{ name: string; batch: number }>(
      "select name, batch from payload_migrations order by id",
    );

    const dev = rows.filter((r) => Number(r.batch) === MARCADOR_DEV);
    const aplicadas = rows.filter((r) => Number(r.batch) > 0);

    console.log(`Migraciones registradas: ${aplicadas.length}`);
    aplicadas.forEach((r) => console.log(`  · ${r.name} (batch ${r.batch})`));

    if (dev.length === 0) {
      console.log("✓ Sin marcador 'dev'. `payload migrate` puede ejecutarse sin bloquearse.");
      return 0;
    }

    console.error("");
    console.error("✗ ABORTADO: hay marcador 'dev' (batch -1) en payload_migrations.");
    console.error("");
    console.error("  Significa que alguien ejecutó Payload con el push de esquema activo");
    console.error("  contra esta base. Si se continúa, `payload migrate` abrirá un prompt");
    console.error("  interactivo y el build quedará colgado sin avisar.");
    console.error("");
    console.error("  Cómo resolverlo (requiere decisión humana, NO lo automatiza este script):");
    console.error("");
    console.error("  a) Si el esquema de la base YA coincide con las migraciones del repo,");
    console.error("     basta eliminar el marcador:");
    console.error("       DELETE FROM payload_migrations WHERE batch = -1;");
    console.error("");
    console.error("  b) Si el esquema divergió, hay que reconciliarlo antes: revisar qué");
    console.error("     cambió el push y generar la migración correspondiente.");
    console.error("");
    console.error("  Ver CLAUDE.md §10.9 (incidente del 2026-08-09).");
    return 1;
  } catch (error) {
    console.error("✗ No se pudo comprobar el estado de migraciones:");
    console.error(`  ${(error as Error).message}`);
    return 1;
  } finally {
    await pool.end();
  }
}

try {
  process.exit(await main());
} catch (error) {
  console.error("✗ Guardián de migraciones abortado:");
  console.error(error);
  process.exit(1);
}
