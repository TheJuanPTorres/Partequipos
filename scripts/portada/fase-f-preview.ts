/**
 * Siembra o retira el contenido de PRUEBA de la sección 7 de la portada
 * (fase F), SOLO EN EL PREVIEW.
 *
 *   npm run preview:fase-f:sembrar
 *   npm run preview:fase-f:retirar
 *
 * - SOLO preview: el mismo guardián que el hero de prueba
 *   (`puedeTocarHeroDePrueba`), que se niega ANTES de conectar si la base o el
 *   Blob no son los del preview.
 * - Sube el vídeo de ux-9 REEXPORTADO a H.264 de 8 bits (3,5 MB, por debajo del
 *   tope de 4 MB de `videos`) desde `Desktop/partequipos-diseno/web/`, y su
 *   póster `2151307778.jpg` desde `assets/09/`. Los dos con licencia PENDIENTE
 *   (L3: vídeo generado por IA, foto de banco): nunca a producción.
 * - Pone en la portada el vídeo y el YouTube del botón de ux-9.
 * - `retirar` vacía la sección, borra vídeo y póster y comprueba que
 *   desaparecen del Blob.
 *
 * NO REFRESCA EL PREVIEW: sembrar ANTES del último push (o redesplegar).
 */
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
if (!modo) {
  console.error("[fase-f] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[fase-f] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
const { default: config } = await import("../../src/payload.config");
const { SLUG_PORTADA } = await import("../../src/lib/queries/getPaginas");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[fase-f] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DISENO = path.join(os.homedir(), "Desktop", "partequipos-diseno");
const VIDEO = path.join(DISENO, "web", "compania-fondo-h264-8bit.mp4");
const POSTER = path.join(DISENO, "assets", "09", "2151307778.jpg");
/** Marca en el texto: así se reconocen el vídeo y el póster de esta prueba. */
const MARCA = "PRUEBA FASE F —";
const YOUTUBE = "https://www.youtube.com/watch?v=lcIx96OBAWU";

async function portada() {
  const r = await payload.find({
    collection: "paginas",
    where: { slug: { equals: SLUG_PORTADA } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const doc = r.docs[0];
  if (!doc) throw new Error("no existe la portada (slug «inicio»)");
  return doc;
}

const videos = async () =>
  (
    await payload.find({
      collection: "videos",
      where: { descripcion: { like: MARCA } },
      depth: 0,
      limit: 10,
      overrideAccess: true,
    })
  ).docs.filter((v) => v.descripcion.startsWith(MARCA));

const posters = async () =>
  (
    await payload.find({
      collection: "media",
      where: { alt: { like: MARCA } },
      depth: 0,
      limit: 10,
      overrideAccess: true,
    })
  ).docs.filter((m) => m.alt?.startsWith(MARCA));

if (modo === "sembrar") {
  let video = (await videos())[0];
  if (!video) {
    const poster =
      (await posters())[0] ??
      (await payload.create({
        collection: "media",
        data: { alt: `${MARCA} póster del vídeo de la compañía`, focalX: 50, focalY: 50 },
        filePath: POSTER,
        overrideAccess: true,
      }));
    log(`póster: id ${poster.id}`);
    video = await payload.create({
      collection: "videos",
      data: {
        descripcion: `${MARCA} cargadora moviendo tierra en una obra, en bucle`,
        poster: poster.id,
        decorativo: true,
      },
      filePath: VIDEO,
      overrideAccess: true,
    });
    log(`vídeo: subido (id ${video.id}), ${video.filesize} bytes`);
  } else log(`vídeo: ya existía (id ${video.id})`);

  const pag = await portada();
  await payload.update({
    collection: "paginas",
    id: pag.id,
    data: { seccionCompania: { video: video.id, youtube: YOUTUBE } },
    overrideAccess: true,
  });
  log("portada: vídeo y YouTube puestos");
  log("HECHO. Redesplegar el preview (o hacer push) para que el build lo recoja.");
  process.exit(0);
}

// --- retirar ------------------------------------------------------------------
const pag = await portada();
await payload.update({
  collection: "paginas",
  id: pag.id,
  data: { seccionCompania: { video: null, youtube: null } },
  overrideAccess: true,
});
log("portada: sin vídeo ni YouTube");
const ficheros: string[] = [];
for (const v of await videos()) {
  if (v.url) ficheros.push(v.url);
  await payload.delete({ collection: "videos", id: v.id, overrideAccess: true });
}
for (const m of await posters()) {
  if (m.url) ficheros.push(m.url);
  await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
}
log(`${ficheros.length} ficheros borrados de la base`);
let fallos = 0;
for (const url of ficheros) {
  const fin = Date.now() + 150_000;
  let estado = 0;
  while (Date.now() < fin) {
    estado = (await fetch(url, { method: "HEAD" }).catch(() => null))?.status ?? 0;
    if (estado === 404) break;
    await esperar(10_000);
  }
  if (estado !== 404) {
    fallos++;
    log(`Blob ${url.split("/").pop()}: ${estado} — SIGUE AHÍ`);
  }
}
log(fallos ? `ATENCIÓN: ${fallos} ficheros siguen en el Blob.` : "HECHO. Todo fuera del Blob.");
process.exit(fallos ? 1 : 0);
