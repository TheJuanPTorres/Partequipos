/**
 * Inventario de los archivos almacenados (Vercel Blob): `media` y `videos`.
 *
 * Uso:  npm run backup:blob
 *       Contra PRODUCCIÓN desde una máquina local, declarando su almacén:
 *       DATABASE_URI="<pooled de producción>" ALMACEN_BLOB_ESPERADO=<id del almacén de producción> npm run backup:blob
 *
 * POR QUÉ UN INVENTARIO Y NO UNA COPIA. Sincronizar el contenido binario
 * exigiría descargar todo el store en cada respaldo y decidir dónde guardarlo —
 * es decir, contratar almacenamiento, que es justo lo que está pendiente de
 * decidir. El inventario cabe en unos kilobytes, se versiona junto al volcado y
 * responde a la pregunta que importa el día del incidente: **qué archivos
 * existían, con qué nombre, tamaño y a qué registro pertenecían**.
 *
 * Con el inventario y el volcado de base se puede reconstruir el catálogo
 * entero; lo único que habría que reponer a mano son los bytes de las imágenes.
 *
 * LA URL ES LA GUARDADA EN LA BASE, no la que devuelve la API local: el plugin
 * de Blob la recalcula al leer con el almacén del token del proceso (CLAUDE.md
 * §10.37), así que con otro token el inventario listaría otro almacén sin
 * avisar. Y FALLA si algún registro no está en el almacén esperado del entorno
 * (`src/lib/blob/inventario.ts`): un respaldo de producción hecho desde una
 * máquina local tiene que declarar `ALMACEN_BLOB_ESPERADO`.
 *
 * Se lee de la base, no de la API del proveedor: el inventario **no depende de
 * Vercel Blob** y seguirá funcionando si el cliente se muda a S3, R2 o a un
 * disco propio.
 */
import fs from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import { almacenEsperado } from "../../src/lib/blob/almacen";
import { veredictoInventario, type FilaInventario } from "../../src/lib/blob/inventario";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");

const DIRECTORIO = process.env.BACKUP_DIR || "respaldos";
const COMPROBAR = process.env.BLOB_COMPROBAR === "true";

const payload = await getPayload({ config });

type Fila = {
  id: number;
  filename: string | null;
  url: string | null;
  mime_type: string | null;
  filesize: number | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  updated_at: string;
};
const pool = (
  payload.db as unknown as { pool: { query: (q: string) => Promise<{ rows: Fila[] }> } }
).pool;

type Entrada = {
  coleccion: string;
  id: number;
  filename: string | null;
  url: string | null;
  mimeType: string | null;
  filesize: number | null;
  alt: string | null;
  ancho: number | null;
  alto: number | null;
  actualizado: string;
  /** Solo si BLOB_COMPROBAR=true: código HTTP al pedir el archivo. */
  http?: number | "error";
};

const entradas: Entrada[] = [];
for (const coleccion of ["media", "videos"]) {
  // `to_jsonb` para las columnas que una de las dos tablas no tiene (alt, medidas).
  const { rows } = await pool.query(
    `SELECT id, filename, url, mime_type, filesize, to_jsonb(t)->>'alt' AS alt,
            (to_jsonb(t)->>'width')::numeric AS width, (to_jsonb(t)->>'height')::numeric AS height,
            updated_at
       FROM ${coleccion} t ORDER BY id`,
  );
  for (const r of rows) {
    entradas.push({
      coleccion,
      id: r.id,
      filename: r.filename,
      url: r.url,
      mimeType: r.mime_type,
      filesize: r.filesize === null ? null : Number(r.filesize),
      alt: r.alt,
      ancho: r.width === null ? null : Number(r.width),
      alto: r.height === null ? null : Number(r.height),
      actualizado: new Date(r.updated_at).toISOString(),
    });
  }
}

const esperado = almacenEsperado(process.env);
const v = veredictoInventario(
  entradas.map((e): FilaInventario => ({ id: e.id, coleccion: e.coleccion, url: e.url })),
  esperado,
);
if (!v.valido) {
  for (const f of v.fuera)
    console.error(`  ✗ ${f.coleccion} ${f.id}: almacén ${f.almacen ?? "ninguno"}`);
  const error = new Error(
    `[inventario] ✗ ${v.motivo}. No se escribe el inventario. Si es un respaldo de otro entorno, declara su almacén con ALMACEN_BLOB_ESPERADO.`,
  );
  error.stack = error.message;
  // Se LANZA: `payload run` sale con 1. Un exitCode lo pisaría su exit(0) (§10.25).
  throw error;
}

if (COMPROBAR) {
  for (const e of entradas) {
    if (!e.url) continue;
    try {
      const r = await fetch(e.url, { method: "HEAD", signal: AbortSignal.timeout(10_000) });
      e.http = r.status;
    } catch {
      e.http = "error";
    }
  }
}

fs.mkdirSync(DIRECTORIO, { recursive: true });
// `YYYYMMDD-HHMMSS`, igual que el nombre del volcado, para poder emparejarlos.
const iso = new Date().toISOString();
const marca = `${iso.slice(0, 10).replace(/-/g, "")}-${iso.slice(11, 19).replace(/:/g, "")}`;
const ruta = path.join(DIRECTORIO, `inventario-blob-${marca}.json`);

const bytes = entradas.reduce((s, e) => s + (e.filesize ?? 0), 0);

fs.writeFileSync(
  ruta,
  JSON.stringify(
    { fecha: iso, almacen: esperado, archivos: entradas.length, bytes, entradas },
    null,
    2,
  ),
);

console.log("\n===== INVENTARIO DE ARCHIVOS =====");
console.log(`Fichero  : ${ruta}`);
console.log(`Almacén  : ${esperado} (todas las URL guardadas coinciden)`);
console.log(`Archivos : ${entradas.length}`);
console.log(`Tamaño   : ${(bytes / 1024).toFixed(1)} KB`);

if (COMPROBAR) {
  const rotos = entradas.filter((e) => e.http !== 200);
  console.log(`Accesibles: ${entradas.length - rotos.length}/${entradas.length}`);
  if (rotos.length > 0) {
    console.log("\n--- NO responden 200 ---");
    rotos.forEach((e) => console.error(`  ✗ [${e.http}] ${e.coleccion} ${e.filename}`));
  }
} else {
  console.log("(sin comprobar accesibilidad; usa BLOB_COMPROBAR=true)");
}
console.log("==================================\n");
