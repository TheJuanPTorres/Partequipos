/**
 * Compara dos bases y dice si los datos coinciden.
 *
 * Uso:  ORIGEN_URI="<origen>" DESTINO_URI="<restaurada>" npm run backup:verify
 *
 * POR QUÉ EXISTE. Un respaldo que nadie ha restaurado no es un respaldo: es un
 * fichero. Y una restauración que "no dio error" tampoco prueba nada — puede
 * haber cargado la mitad de las filas, o haber dejado las secuencias mal.
 *
 * Se comparan DOS cosas por tabla:
 *   1. el número de filas;
 *   2. una huella MD5 del contenido completo, calculada EN EL SERVIDOR sobre
 *      las filas ordenadas. Así se detecta un valor cambiado, no solo una fila
 *      de menos.
 *
 * La huella se calcula con `md5(string_agg(...))` sobre la representación de
 * texto de la fila entera, ordenada por esa misma representación: es
 * independiente del orden físico y del id, así que no da falsos negativos por
 * el orden de inserción.
 */
import crypto from "node:crypto";

import { Client } from "pg";

import { leerConexion } from "./comun";

const ORIGEN = process.env.ORIGEN_URI || leerConexion();
const DESTINO = process.env.DESTINO_URI || "";

type Huella = { tabla: string; filas: number; md5: string };

async function huellas(conexion: string): Promise<Map<string, Huella>> {
  const c = new Client({ connectionString: conexion, statement_timeout: 300_000 });
  await c.connect();
  try {
    const { rows: tablas } = await c.query<{ nombre: string }>(
      `select table_name as nombre from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'
        order by table_name`,
    );

    const mapa = new Map<string, Huella>();
    for (const { nombre } of tablas) {
      const { rows } = await c.query<{ filas: string; md5: string | null }>(
        `select count(*)::text as filas,
                md5(coalesce(string_agg(t::text, '|' order by t::text), '')) as md5
           from "${nombre}" t`,
      );
      mapa.set(nombre, {
        tabla: nombre,
        filas: Number(rows[0]?.filas ?? 0),
        md5: rows[0]?.md5 ?? "",
      });
    }
    return mapa;
  } finally {
    await c.end();
  }
}

async function main(): Promise<number> {
  if (!ORIGEN || !DESTINO) {
    console.error("✗ Faltan ORIGEN_URI y/o DESTINO_URI.");
    return 1;
  }

  const [a, b] = await Promise.all([huellas(ORIGEN), huellas(DESTINO)]);

  const todas = [...new Set([...a.keys(), ...b.keys()])].sort();

  const iguales: string[] = [];
  const distintas: string[] = [];
  const soloEnOrigen: string[] = [];
  const soloEnDestino: string[] = [];

  for (const t of todas) {
    const x = a.get(t);
    const y = b.get(t);
    if (!y) {
      soloEnOrigen.push(t);
      continue;
    }
    if (!x) {
      soloEnDestino.push(t);
      continue;
    }
    if (x.filas === y.filas && x.md5 === y.md5) iguales.push(t);
    else
      distintas.push(
        `${t}: ${x.filas} filas/${x.md5.slice(0, 8)} vs ${y.filas}/${y.md5.slice(0, 8)}`,
      );
  }

  const filasOrigen = [...a.values()].reduce((s, h) => s + h.filas, 0);
  const filasDestino = [...b.values()].reduce((s, h) => s + h.filas, 0);

  /*
   * Huella global: encadena las huellas de tabla en orden alfabético. Un solo
   * valor que resume la comparación entera y se puede pegar en un informe.
   */
  const global = (m: Map<string, Huella>) =>
    crypto
      .createHash("md5")
      .update(
        [...m.keys()]
          .sort()
          .map((k) => `${k}:${m.get(k)?.md5}`)
          .join("|"),
      )
      .digest("hex");

  console.log("\n===== VERIFICACIÓN DE RESTAURACIÓN =====");
  console.log(`Tablas comparadas : ${todas.length}`);
  console.log(`  idénticas       : ${iguales.length}`);
  console.log(`  distintas       : ${distintas.length}`);
  console.log(`  solo en origen  : ${soloEnOrigen.length}`);
  console.log(`  solo en destino : ${soloEnDestino.length}`);
  console.log(`Filas origen      : ${filasOrigen}`);
  console.log(`Filas destino     : ${filasDestino}`);
  console.log(`Huella origen     : ${global(a)}`);
  console.log(`Huella destino    : ${global(b)}`);

  if (distintas.length > 0) {
    console.log("\n--- Tablas con diferencias ---");
    distintas.forEach((d) => console.error(`  ✗ ${d}`));
  }
  if (soloEnOrigen.length > 0)
    console.error(`\n✗ Faltan en el destino: ${soloEnOrigen.join(", ")}`);
  if (soloEnDestino.length > 0)
    console.log(`\n⚠ Sobran en el destino: ${soloEnDestino.join(", ")}`);

  const ok = distintas.length === 0 && soloEnOrigen.length === 0 && global(a) === global(b);
  console.log(`\n${ok ? "✓ LOS DATOS COINCIDEN" : "✗ LOS DATOS NO COINCIDEN"}`);
  console.log("========================================\n");

  return ok ? 0 : 1;
}

try {
  process.exit(await main());
} catch (error) {
  console.error("✗ Verificación abortada:");
  console.error(error);
  process.exit(1);
}
