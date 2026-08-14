/**
 * Respaldo de la base de datos.
 *
 * Uso:  npm run backup
 *       BACKUP_SIN_DATOS_PERSONALES=true npm run backup   (para compartir)
 *       BACKUP_DIR=D:/respaldos npm run backup
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ NO USA pg_dump
 *
 * pg_dump exige un binario cliente de versión **igual o mayor** que el servidor.
 * El servidor de Neon corre PostgreSQL 18.4; esta máquina no tiene ningún
 * cliente de PostgreSQL instalado, y la base va a mudarse a la infraestructura
 * del cliente, cuya versión no controlamos. Depender de que cada máquina y cada
 * runner de CI tenga el binario correcto es una fragilidad que se paga el día
 * peor: el día que hay que restaurar.
 *
 * Este script usa el cliente `pg` que el proyecto ya trae. Funciona contra
 * **cualquier PostgreSQL** desde cualquier sitio donde corra el proyecto, sin
 * instalar nada.
 *
 * QUÉ IMPLICA: es un volcado de **datos**, no de esquema. Y puede serlo porque
 * el esquema ya está versionado en `src/migrations/`. Restaurar es, por tanto:
 *
 *     1. crear la base            2. `npm run migrate`            3. `npm run restore`
 *
 * El manifiesto guarda qué migraciones estaban aplicadas al respaldar, para
 * poder reconstruir el esquema exacto de ese momento.
 *
 * Si el equipo de sistemas del cliente prefiere un volcado físico con pg_dump,
 * los dos mecanismos conviven sin estorbarse: este no impide aquel.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import fs from "node:fs";
import path from "node:path";
import { createGzip } from "node:zlib";

import { Client } from "pg";

import { leerConexion, nombreDeEntorno } from "./comun";
import { nombreRespaldo } from "../../src/lib/backup/retencion";

/**
 * Tablas con DATOS PERSONALES.
 *
 * `users` lleva correos y hashes; `solicitudes`, los leads con nombre, teléfono
 * y mensaje. Con `BACKUP_SIN_DATOS_PERSONALES=true` se vuelca su estructura pero
 * ninguna fila, para poder pasarle una copia a alguien sin repartir datos de
 * clientes. Ver README §9.
 */
const TABLAS_PERSONALES = new Set(["users", "users_sessions", "solicitudes", "solicitudes_rels"]);

const SIN_PERSONALES = process.env.BACKUP_SIN_DATOS_PERSONALES === "true";
const DESTINO = process.env.BACKUP_DIR || "respaldos";

async function main(): Promise<number> {
  const conexion = leerConexion();
  if (!conexion) {
    console.error("✗ Falta DATABASE_URI.");
    return 1;
  }

  const cliente = new Client({ connectionString: conexion, statement_timeout: 120_000 });
  await cliente.connect();

  try {
    // Tablas de datos del esquema público, en orden alfabético estable.
    const { rows: tablas } = await cliente.query<{ nombre: string }>(
      `select table_name as nombre
         from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'
        order by table_name`,
    );

    const { rows: migraciones } = await cliente.query<{ name: string; batch: number }>(
      `select name, batch from payload_migrations order by id`,
    );

    fs.mkdirSync(DESTINO, { recursive: true });
    const ahora = new Date();
    const entorno = nombreDeEntorno(conexion);
    const ruta = path.join(DESTINO, nombreRespaldo(entorno, ahora));

    const gz = createGzip({ level: 9 });
    const salida = fs.createWriteStream(ruta);
    gz.pipe(salida);

    const escribir = (obj: unknown) =>
      new Promise<void>((resolve, reject) => {
        gz.write(JSON.stringify(obj) + "\n", (e) => (e ? reject(e) : resolve()));
      });

    const conteos: Record<string, number> = {};
    let filasTotales = 0;

    await escribir({
      t: "manifiesto",
      version: 1,
      fecha: ahora.toISOString(),
      entorno,
      // NUNCA la cadena completa: lleva usuario y contraseña.
      servidor: new URL(conexion).hostname,
      base: new URL(conexion).pathname.slice(1),
      sinDatosPersonales: SIN_PERSONALES,
      migraciones: migraciones.map((m) => `${m.name}#${m.batch}`),
      tablas: tablas.map((t) => t.nombre),
    });

    for (const { nombre } of tablas) {
      const omitir = SIN_PERSONALES && TABLAS_PERSONALES.has(nombre);

      const { rows: cols } = await cliente.query<{ column_name: string }>(
        `select column_name
           from information_schema.columns
          where table_schema = 'public' and table_name = $1
          order by ordinal_position`,
        [nombre],
      );
      const columnas = cols.map((c) => c.column_name);

      await escribir({ t: "tabla", n: nombre, cols: columnas, omitida: omitir });

      if (omitir) {
        conteos[nombre] = 0;
        continue;
      }

      // Comillas dobles en el identificador: hay tablas con guiones bajos y
      // palabras reservadas (`users`).
      const { rows } = await cliente.query(`select * from "${nombre}"`);
      for (const fila of rows) {
        await escribir({ t: "f", v: columnas.map((c) => (fila as Record<string, unknown>)[c]) });
      }
      conteos[nombre] = rows.length;
      filasTotales += rows.length;
    }

    await escribir({ t: "fin", conteos, filasTotales });

    await new Promise<void>((resolve, reject) => {
      gz.end(() => salida.on("close", resolve));
      salida.on("error", reject);
    });

    const bytes = fs.statSync(ruta).size;
    console.log("\n=========== RESPALDO ===========");
    console.log(`Fichero    : ${ruta}`);
    console.log(`Tamaño     : ${(bytes / 1024).toFixed(1)} KB`);
    console.log(`Entorno    : ${entorno}`);
    console.log(`Tablas     : ${tablas.length}`);
    console.log(`Filas      : ${filasTotales}`);
    console.log(`Migraciones: ${migraciones.length}`);
    if (SIN_PERSONALES) {
      console.log("Datos personales: OMITIDOS (users, solicitudes)");
    }
    console.log("================================\n");

    if (filasTotales === 0) {
      console.error("✗ El respaldo salió VACÍO. Revisa la conexión antes de darlo por bueno.");
      return 1;
    }
    return 0;
  } finally {
    await cliente.end();
  }
}

process.exit(await main());
