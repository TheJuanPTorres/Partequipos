/**
 * Inventario de los archivos almacenados (Vercel Blob).
 *
 * Uso:  npm run backup:blob
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
 * Se lee desde la colección `media` de Payload, no desde la API del proveedor:
 * así el inventario **no depende de Vercel Blob** y seguirá funcionando si el
 * cliente se muda a S3, R2 o a un disco propio.
 */
process.env.PAYLOAD_DISABLE_PUSH = "true";

const { default: config } = await import("../../src/payload.config");

import fs from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

const DIRECTORIO = process.env.BACKUP_DIR || "respaldos";
const COMPROBAR = process.env.BLOB_COMPROBAR === "true";

const payload = await getPayload({ config });

const { docs } = await payload.find({ collection: "media", limit: 0, depth: 0 });

type Entrada = {
  id: number;
  filename: string | null | undefined;
  url: string | null | undefined;
  mimeType: string | null | undefined;
  filesize: number | null | undefined;
  alt: string | null | undefined;
  ancho: number | null | undefined;
  alto: number | null | undefined;
  actualizado: string;
  /** Solo si BLOB_COMPROBAR=true: código HTTP al pedir el archivo. */
  http?: number | "error";
};

const entradas: Entrada[] = [];

for (const d of docs) {
  const e: Entrada = {
    id: d.id,
    filename: d.filename,
    url: d.url,
    mimeType: d.mimeType,
    filesize: d.filesize,
    alt: d.alt,
    ancho: d.width,
    alto: d.height,
    actualizado: d.updatedAt,
  };

  if (COMPROBAR && d.url) {
    try {
      const r = await fetch(d.url, { method: "HEAD", signal: AbortSignal.timeout(10_000) });
      e.http = r.status;
    } catch {
      e.http = "error";
    }
  }

  entradas.push(e);
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
    { fecha: new Date().toISOString(), archivos: entradas.length, bytes, entradas },
    null,
    2,
  ),
);

console.log("\n===== INVENTARIO DE ARCHIVOS =====");
console.log(`Fichero  : ${ruta}`);
console.log(`Archivos : ${entradas.length}`);
console.log(`Tamaño   : ${(bytes / 1024).toFixed(1)} KB`);

if (COMPROBAR) {
  const rotos = entradas.filter((e) => e.http !== 200);
  console.log(`Accesibles: ${entradas.length - rotos.length}/${entradas.length}`);
  if (rotos.length > 0) {
    console.log("\n--- NO responden 200 ---");
    rotos.forEach((e) => console.error(`  ✗ [${e.http}] ${e.filename}`));
  }
} else {
  console.log("(sin comprobar accesibilidad; usa BLOB_COMPROBAR=true)");
}
console.log("==================================\n");

process.exit(0);
