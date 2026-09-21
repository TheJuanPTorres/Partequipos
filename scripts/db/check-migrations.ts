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

import { veredictoMigraciones } from "../../src/lib/db/veredictoMigraciones";

/*
 * La DECISIÓN vive en `src/lib/db/veredictoMigraciones.ts`, no aquí, y tiene
 * pruebas que comprueban que **corta** cuando aparece el marcador: hacerlo
 * contra una base real exigiría plantar el marcador en un entorno, que es
 * justo lo que este guardián evita. Aquí queda el acceso a datos y el mensaje.
 */

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
    const hayTabla = Boolean(existe.rows[0]?.existe);

    /*
     * Se imprime SIEMPRE contra qué base se está comprobando.
     *
     * Este guardián se ejecuta justo antes de migrar y de sembrar, y la
     * confusión de entorno es el error que más caro sale en este proyecto
     * (ver CLAUDE.md §10.9). Saber el host de un vistazo lo previene.
     */
    const u = new URL(connectionString);
    console.log(`BASE DE DATOS: ${u.hostname}`);
    console.log(`Nombre       : ${u.pathname.slice(1)}
`);

    const filas = hayTabla
      ? (
          await pool.query<{ name: string; batch: number }>(
            "select name, batch from payload_migrations order by id",
          )
        ).rows
      : null;

    const veredicto = veredictoMigraciones(filas);

    if (veredicto.motivo === "base-nueva-sin-tabla") {
      console.log("✓ Base sin tabla payload_migrations: es una base nueva, se puede migrar.");
      return veredicto.codigo;
    }

    console.log(`Migraciones registradas: ${veredicto.aplicadas.length}`);
    veredicto.aplicadas.forEach((r) => console.log(`  · ${r.name} (batch ${r.batch})`));

    if (veredicto.motivo === "sin-marcador-dev") {
      console.log("✓ Sin marcador 'dev'. `payload migrate` puede ejecutarse sin bloquearse.");
      return veredicto.codigo;
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
    return veredicto.codigo;
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
