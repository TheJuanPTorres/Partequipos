/**
 * Sube o retira la imagen del panel visual de la pantalla de acceso
 * (`acceso-panel.webp`), SOLO EN EL PREVIEW.
 *
 *   npm run preview:acceso:subir
 *   npm run preview:acceso:retirar
 *
 * - La imagen es la del componente `login-screen` del sistema del cliente
 *   (`https://ui.partequipos.com/login-bg.webp`, 1254 × 1254, 17,5 kB), guardada FUERA del
 *   repositorio en `Desktop/partequipos-diseno/acceso/acceso-panel.webp`.
 * - SOLO preview: el guardián de base y almacén (`puedeTocarHeroDePrueba`) y la
 *   guarda del almacén (§10.37), antes de cargar Payload.
 * - El almacén añade un sufijo aleatorio al nombre; la pantalla lo reconoce
 *   (`esImagenAcceso`).
 * - Idempotente: si ya hay un registro con ese nombre de fichero, no sube otro.
 *   `retirar` lo borra y comprueba que el fichero sale del Blob.
 * - En producción la sube dirección desde el panel (runbook
 *   `runbook-imagen-acceso.md`); la pantalla la encuentra por el nombre.
 */
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { esImagenAcceso, IMAGEN_ACCESO, PREFIJO_IMAGEN_ACCESO } from "../../src/lib/panel/acceso";

const modo = process.argv.slice(2).find((a) => a === "subir" || a === "retirar");
if (!modo) {
  console.error("[acceso] indica el modo: «subir» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[acceso] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[acceso]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[acceso] ${m}\n`);
const FICHERO = path.join(os.homedir(), "Desktop", "partequipos-diseno", "acceso", IMAGEN_ACCESO);

const existentes = async () =>
  (
    await payload.find({
      collection: "media",
      where: { filename: { contains: PREFIJO_IMAGEN_ACCESO } },
      depth: 0,
      limit: 20,
      overrideAccess: true,
    })
  ).docs.filter((d) => esImagenAcceso(d.filename));

if (modo === "subir") {
  const ya = await existentes();
  if (ya.length > 0) {
    log(`ya estaba (id ${ya.map((d) => d.id).join(", ")})`);
  } else {
    const media = await payload.create({
      collection: "media",
      data: {
        alt: "Telón rojo de fondo de la pantalla de acceso al panel",
        focalX: 50,
        focalY: 50,
      },
      filePath: FICHERO,
      overrideAccess: true,
    });
    log(`subida: id ${media.id}, ${media.filename}, ${media.width}×${media.height}`);
    if (!esImagenAcceso(media.filename)) {
      const e = new Error(`[acceso] ✗ se guardó como «${media.filename}»: la pantalla no la verá`);
      e.stack = e.message;
      throw e;
    }
  }
} else {
  const urls: string[] = [];
  for (const m of await existentes()) {
    if (m.url) urls.push(m.url);
    await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
    log(`borrada: id ${m.id}`);
  }
  if (urls.length > 0) {
    log("espero 70 s (propagación del Blob)");
    await new Promise((r) => setTimeout(r, 70_000));
    for (const u of urls) {
      if ((await fetch(u, { method: "HEAD" })).status !== 404) {
        const e = new Error(`[acceso] ✗ el fichero sigue en el Blob: ${u}`);
        e.stack = e.message;
        throw e;
      }
    }
    log("✓ el fichero da 404");
  }
}
