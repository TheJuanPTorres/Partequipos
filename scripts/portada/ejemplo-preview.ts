/**
 * CONTENIDO DE EJEMPLO DE UX-9 EN EL PREVIEW (CLAUDE.md §10.38), para que la
 * home pintada sea idéntica a ux-9. SOLO EN EL PREVIEW.
 *
 *   npm run preview:ejemplo:sembrar
 *   npm run preview:ejemplo:retirar
 *
 * - SOLO preview: guardián de base y almacén (`puedeTocarHeroDePrueba`) y la
 *   guarda del almacén (§10.37), antes de cargar Payload.
 * - Assets de ux-9 desde `Desktop/partequipos-diseno/assets/09/`; nunca en el
 *   repositorio ni en `public/`.
 * - Idempotente. Lo que siembra lleva la marca `EJEMPLO UX-9 —` en el `alt` de
 *   sus imágenes; `retirar` lo quita y comprueba que los ficheros salen del Blob.
 *
 * Hoy: la imagen decorativa del pie (export 2178, una cargadora).
 *
 * NO REFRESCA EL PREVIEW: sembrar ANTES del último push (o redesplegar).
 */
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
if (!modo) {
  console.error("[ejemplo] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}
const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[ejemplo] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[ejemplo]");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[ejemplo] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ASSETS = path.join(os.homedir(), "Desktop", "partequipos-diseno", "assets", "09");
/** Marca en el `alt` de todo lo que siembra este script. */
const MARCA = "EJEMPLO UX-9 —";

const marcadas = async () =>
  (
    await payload.find({
      collection: "media",
      where: { alt: { like: MARCA } },
      depth: 0,
      limit: 200,
      overrideAccess: true,
    })
  ).docs.filter((m) => m.alt?.startsWith(MARCA));

/** Sube un fichero del kit (o reutiliza el ya subido con el mismo `alt`). */
async function subir(fichero: string, alt: string) {
  const completo = `${MARCA} ${alt}`;
  const ya = (await marcadas()).find((m) => m.alt === completo);
  if (ya) return ya.id;
  const doc = await payload.create({
    collection: "media",
    data: { alt: completo, focalX: 50, focalY: 50 },
    filePath: path.join(ASSETS, fichero),
    overrideAccess: true,
  });
  log(`${fichero}: subida (id ${doc.id})`);
  return doc.id;
}

if (modo === "sembrar") {
  // Pie: la cargadora del export 2178 (en ux-9 se sirve la de 1024 px).
  const cargadora = await subir(
    "cargadores-versatiles-maquinaria-pesada-construccion-manipulacion-materiales-movimiento-tierra-preparacion-sitio-1024x682.png",
    "cargadora decorativa del pie",
  );
  await payload.updateGlobal({
    slug: "pie",
    data: { imagenDecorativa: cargadora },
    overrideAccess: true,
  });
  log("pie: imagen decorativa puesta");
} else {
  const pie = await payload.findGlobal({ slug: "pie", depth: 0, overrideAccess: true });
  const ids = new Set((await marcadas()).map((m) => m.id));
  if (typeof pie.imagenDecorativa === "number" && ids.has(pie.imagenDecorativa)) {
    await payload.updateGlobal({
      slug: "pie",
      data: { imagenDecorativa: null },
      overrideAccess: true,
    });
    log("pie: imagen decorativa quitada");
  }
  const urls: string[] = [];
  for (const m of await marcadas()) {
    if (m.url) urls.push(m.url);
    await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
  }
  log(`${urls.length} imágenes borradas; espero 70 s (propagación del Blob)`);
  await esperar(70_000);
  const vivas: string[] = [];
  for (const u of urls) if ((await fetch(u, { method: "HEAD" })).status !== 404) vivas.push(u);
  if (vivas.length) {
    const e = new Error(`[ejemplo] ✗ ${vivas.length} ficheros siguen en el Blob`);
    e.stack = e.message;
    throw e;
  }
  log("✓ todos los ficheros dan 404");
}
