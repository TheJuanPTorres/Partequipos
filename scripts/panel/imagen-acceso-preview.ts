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
 * - `subir` la sube a `Media` (se reconoce por su texto alternativo exacto) y
 *   la elige en «SEO y datos de la empresa» → «Imágenes» → «Imagen de la
 *   pantalla de acceso» (`imagenAcceso`). Idempotente.
 * - `retirar` vacía ese campo, borra la imagen y comprueba que el fichero sale
 *   del Blob.
 * - En producción la sube y la elige dirección desde el panel (runbook
 *   `runbook-imagen-acceso.md`).
 */
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

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
const FICHERO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-diseno",
  "acceso",
  "acceso-panel.webp",
);
/** Texto alternativo exacto: así se reconoce la imagen que sube este script. */
const ALT = "Telón rojo de fondo de la pantalla de acceso al panel";

const existentes = async () =>
  (
    await payload.find({
      collection: "media",
      where: { alt: { equals: ALT } },
      depth: 0,
      limit: 20,
      overrideAccess: true,
    })
  ).docs;

const elegida = async () => {
  const seo = await payload.findGlobal({ slug: "seo", depth: 0, overrideAccess: true });
  return typeof seo.imagenAcceso === "number" ? seo.imagenAcceso : null;
};

if (modo === "subir") {
  const actual = await elegida();
  if (actual !== null) {
    log(`ya elegida en el global seo (media ${actual})`);
  } else {
    const [ya] = await existentes();
    const media =
      ya ??
      (await payload.create({
        collection: "media",
        data: { alt: ALT, focalX: 50, focalY: 50 },
        filePath: FICHERO,
        overrideAccess: true,
      }));
    log(
      `${ya ? "ya estaba" : "subida"}: media ${media.id}, ${media.filename}, ${media.width}×${media.height}`,
    );
    await payload.updateGlobal({
      slug: "seo",
      data: { imagenAcceso: media.id },
      overrideAccess: true,
    });
    if ((await elegida()) !== media.id) {
      const e = new Error("[acceso] ✗ el global seo no quedó con la imagen elegida");
      e.stack = e.message;
      throw e;
    }
    log(`✓ elegida en «Imagen de la pantalla de acceso» (media ${media.id})`);
  }
} else {
  if ((await elegida()) !== null) {
    await payload.updateGlobal({ slug: "seo", data: { imagenAcceso: null }, overrideAccess: true });
    log("campo «Imagen de la pantalla de acceso» vaciado");
  }
  const urls: string[] = [];
  for (const m of await existentes()) {
    if (m.url) urls.push(m.url);
    await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
    log(`borrada: media ${m.id}`);
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
