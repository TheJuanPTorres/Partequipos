/**
 * Restauración de un respaldo.
 *
 * Uso:  RESTORE_FILE=respaldos/xxx.ndjson.gz DATABASE_URI="<destino>" npm run restore
 *
 * ANTES: la base destino debe tener el ESQUEMA creado (`npm run migrate`). Este
 * script mueve datos, nunca estructura — igual que el importador.
 *
 * ─── PROTECCIONES ────────────────────────────────────────────────────────────
 * Restaurar es destructivo: vacía las tablas antes de cargar. Por eso:
 *
 *  1. Si el destino tiene datos, exige `RESTORE_CONFIRMAR=true`.
 *  2. Si el destino parece producción, exige además `RESTORE_PRODUCCION=true`.
 *  3. Compara el entorno del respaldo con el del destino y avisa si no coinciden
 *     — restaurar producción sobre desarrollo, o al revés, es un error caro.
 *
 * Ninguna de las tres se puede saltar por accidente: son variables explícitas.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ORDEN DE INSERCIÓN. Las claves foráneas de Payload no son diferibles y no
 * podemos desactivar los disparadores sin ser superusuario, así que las tablas
 * se insertan en orden topológico calculado desde `pg_constraint`. El vaciado va
 * en el orden inverso.
 */
import fs from "node:fs";
import readline from "node:readline";
import { createGunzip } from "node:zlib";

import { Client } from "pg";

import { leerConexion, nombreDeEntorno, pareceProduccion } from "./comun";
import { ordenTopologico } from "../../src/lib/backup/orden";

const FICHERO = process.env.RESTORE_FILE ?? "";
const CONFIRMAR = process.env.RESTORE_CONFIRMAR === "true";
const PERMITIR_PRODUCCION = process.env.RESTORE_PRODUCCION === "true";

type Manifiesto = {
  fecha: string;
  entorno: string;
  base: string;
  sinDatosPersonales: boolean;
  migraciones: string[];
  tablas: string[];
};

async function main(): Promise<number> {
  if (!FICHERO || !fs.existsSync(FICHERO)) {
    console.error(`✗ No se encontró el respaldo: ${FICHERO || "(RESTORE_FILE sin definir)"}`);
    return 1;
  }

  const conexion = leerConexion();
  if (!conexion) {
    console.error("✗ Falta DATABASE_URI (destino de la restauración).");
    return 1;
  }

  if (pareceProduccion(conexion) && !PERMITIR_PRODUCCION) {
    console.error("✗ El destino parece PRODUCCIÓN. Exige RESTORE_PRODUCCION=true.");
    return 1;
  }

  const cliente = new Client({ connectionString: conexion, statement_timeout: 300_000 });
  await cliente.connect();

  try {
    // --- Lectura del respaldo ------------------------------------------------
    const lector = readline.createInterface({
      input: fs.createReadStream(FICHERO).pipe(createGunzip()),
      crlfDelay: Infinity,
    });

    let manifiesto: Manifiesto | null = null;
    const columnasPorTabla = new Map<string, string[]>();
    const filasPorTabla = new Map<string, unknown[][]>();
    let tablaActual = "";

    for await (const linea of lector) {
      if (!linea.trim()) continue;
      const obj = JSON.parse(linea) as Record<string, unknown>;

      if (obj.t === "manifiesto") manifiesto = obj as unknown as Manifiesto;
      else if (obj.t === "tabla") {
        tablaActual = obj.n as string;
        columnasPorTabla.set(tablaActual, obj.cols as string[]);
        filasPorTabla.set(tablaActual, []);
      } else if (obj.t === "f") {
        filasPorTabla.get(tablaActual)?.push(obj.v as unknown[]);
      }
    }

    if (!manifiesto) {
      console.error("✗ El fichero no tiene manifiesto: no es un respaldo válido.");
      return 1;
    }

    const entornoDestino = nombreDeEntorno(conexion);
    console.log("\n=========== RESTAURACIÓN ===========");
    console.log(`Respaldo   : ${FICHERO}`);
    console.log(`  tomado el: ${manifiesto.fecha}`);
    console.log(`  entorno  : ${manifiesto.entorno}`);
    console.log(`Destino    : ${entornoDestino}`);
    if (manifiesto.sinDatosPersonales) {
      console.log("AVISO: el respaldo NO incluye datos personales (users, solicitudes).");
    }
    if (manifiesto.entorno !== entornoDestino) {
      console.log(`⚠ El entorno NO coincide: ${manifiesto.entorno} -> ${entornoDestino}`);
    }

    // --- Comprobación del esquema -------------------------------------------
    const { rows: existentes } = await cliente.query<{ nombre: string }>(
      `select table_name as nombre from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'`,
    );
    const enDestino = new Set(existentes.map((r) => r.nombre));
    const faltantes = manifiesto.tablas.filter((t) => !enDestino.has(t));

    if (faltantes.length > 0) {
      console.error(`\n✗ Faltan ${faltantes.length} tabla(s) en el destino:`);
      faltantes.slice(0, 8).forEach((t) => console.error(`    ${t}`));
      console.error("  Crea el esquema primero con `npm run migrate`.");
      return 1;
    }

    // --- ¿El destino tiene datos? -------------------------------------------
    let filasDestino = 0;
    for (const t of manifiesto.tablas) {
      const { rows } = await cliente.query<{ n: string }>(`select count(*)::text as n from "${t}"`);
      filasDestino += Number(rows[0]?.n ?? 0);
    }
    if (filasDestino > 0 && !CONFIRMAR) {
      console.error(
        `\n✗ El destino ya tiene ${filasDestino} fila(s). Se BORRARÍAN.\n` +
          "  Si es lo que quieres, repite con RESTORE_CONFIRMAR=true.",
      );
      return 1;
    }

    // --- Orden de inserción --------------------------------------------------
    const { rows: fks } = await cliente.query<{ hija: string; padre: string }>(
      `select c.conrelid::regclass::text as hija, c.confrelid::regclass::text as padre
         from pg_constraint c
         join pg_namespace n on n.oid = c.connamespace
        where c.contype = 'f' and n.nspname = 'public'`,
    );

    const limpiar = (s: string) => s.replace(/^public\./, "").replace(/"/g, "");
    const orden = ordenTopologico(
      manifiesto.tablas,
      fks.map((f) => ({ hija: limpiar(f.hija), padre: limpiar(f.padre) })),
    );

    // --- Vaciado y carga -----------------------------------------------------
    await cliente.query("begin");
    try {
      // CASCADE resuelve el orden del vaciado y reinicia las secuencias.
      const lista = orden.map((t) => `"${t}"`).join(", ");
      await cliente.query(`truncate table ${lista} restart identity cascade`);

      let insertadas = 0;
      for (const tabla of orden) {
        const columnas = columnasPorTabla.get(tabla) ?? [];
        const filas = filasPorTabla.get(tabla) ?? [];
        if (filas.length === 0 || columnas.length === 0) continue;

        const cols = columnas.map((c) => `"${c}"`).join(", ");

        // Por lotes: un INSERT por fila multiplicaría las idas y vueltas.
        const LOTE = 200;
        for (let i = 0; i < filas.length; i += LOTE) {
          const lote = filas.slice(i, i + LOTE);
          const valores: unknown[] = [];
          const marcadores = lote
            .map((fila) => {
              const m = fila.map((v) => {
                valores.push(v);
                return `$${valores.length}`;
              });
              return `(${m.join(", ")})`;
            })
            .join(", ");

          await cliente.query(
            `insert into "${tabla}" (${cols}) values ${marcadores}`,
            valores as never[],
          );
        }
        insertadas += filas.length;
      }

      /*
       * Secuencias. `restart identity` las dejó en 1; sin reajustarlas, el
       * primer registro nuevo chocaría con un id existente. Es el fallo clásico
       * de una restauración "que funcionó" hasta que alguien crea algo.
       */
      await cliente.query(`
        do $$
        declare r record;
        begin
          for r in
            select c.relname as tabla, a.attname as columna,
                   pg_get_serial_sequence(c.relname, a.attname) as sec
              from pg_class c
              join pg_namespace n on n.oid = c.relnamespace
              join pg_attribute a on a.attrelid = c.oid
             where n.nspname = 'public' and c.relkind = 'r' and a.attnum > 0
               and pg_get_serial_sequence(c.relname, a.attname) is not null
          loop
            execute format(
              'select setval(%L, coalesce((select max(%I) from %I), 0) + 1, false)',
              r.sec, r.columna, r.tabla);
          end loop;
        end $$;
      `);

      await cliente.query("commit");

      console.log(`\n✓ Restauradas ${insertadas} filas en ${orden.length} tablas.`);
      console.log("====================================\n");
      return 0;
    } catch (error) {
      await cliente.query("rollback");
      throw error;
    }
  } finally {
    await cliente.end();
  }
}

try {
  process.exit(await main());
} catch (error) {
  console.error("✗ Restauración abortada:");
  console.error(error);
  process.exit(1);
}
