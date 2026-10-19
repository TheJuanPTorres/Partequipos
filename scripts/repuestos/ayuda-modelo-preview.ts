/**
 * Sube o retira la foto de la tarjeta «ESTAMOS AQUÍ PARA AYUDARLO» de la página
 * de modelo de repuestos (MUESTRA del laboratorio, 2026-10-19), SOLO EN EL PREVIEW.
 *
 *   npm run preview:ejecutar -- payload run scripts/repuestos/ayuda-modelo-preview.ts subir
 *   npm run preview:ejecutar -- payload run scripts/repuestos/ayuda-modelo-preview.ts retirar
 *
 * - La foto es la PROPIA de WordPress de esa tarjeta (la misma en todas las
 *   marcas; decisión del cliente: se migra todo), guardada FUERA del
 *   repositorio en `Desktop/partequipos-diseno/repuestos-modelo/ayuda-whatsapp.jpg`.
 * - Se reconoce por su texto alternativo exacto (`ALT_AYUDA_MODELO`), que es
 *   como la encuentra el laboratorio. Con la migración pasará a elegirse en el
 *   panel, en un campo propio.
 * - SOLO preview: el guardián de base y almacén (`puedeTocarHeroDePrueba`) y la
 *   guarda del almacén (§10.37), antes de cargar Payload.
 * - `retirar` la borra y comprueba que el fichero sale del Blob.
 */
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { ALT_AYUDA_MODELO } from "../../src/lib/repuestos/muestraModelo";

const modo = process.argv.slice(2).find((a) => a === "subir" || a === "retirar");
if (!modo) {
  console.error("[ayuda-modelo] indica el modo: «subir» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[ayuda-modelo] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[ayuda-modelo]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[ayuda-modelo] ${m}\n`);
const FICHERO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-diseno",
  "repuestos-modelo",
  "ayuda-whatsapp.jpg",
);

const existentes = async () =>
  (
    await payload.find({
      collection: "media",
      where: { alt: { equals: ALT_AYUDA_MODELO } },
      depth: 0,
      limit: 20,
      overrideAccess: true,
    })
  ).docs;

if (modo === "subir") {
  const [ya] = await existentes();
  const media =
    ya ??
    (await payload.create({
      collection: "media",
      data: { alt: ALT_AYUDA_MODELO, focalX: 50, focalY: 50 },
      filePath: FICHERO,
      overrideAccess: true,
    }));
  log(
    `${ya ? "ya estaba" : "subida"}: media ${media.id}, ${media.filename}, ${media.width}×${media.height}`,
  );
} else {
  const urls: string[] = [];
  for (const m of await existentes()) {
    if (m.url) urls.push(m.url);
    await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
    log(`borrada: media ${m.id}`);
  }
  if (urls.length > 0) {
    log("espero 70 s (propagación del Blob)");
    await new Promise((r) => setTimeout(r, 70_000));
    for (const url of urls) {
      const r = await fetch(url, { method: "HEAD" });
      if (r.status !== 404) {
        const e = new Error(`[ayuda-modelo] ✗ el fichero sigue en el Blob (HTTP ${r.status})`);
        e.stack = e.message;
        throw e;
      }
    }
    log(`✓ ${urls.length} fichero(s) en 404`);
  } else {
    log("no había nada que retirar");
  }
}
