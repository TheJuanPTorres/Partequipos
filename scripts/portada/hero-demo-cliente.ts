/**
 * Siembra o retira la DEMO DEL HERO con las fotos del cliente, SOLO EN EL
 * PREVIEW (datos y lógica: `src/lib/portada/heroDemoCliente.ts`).
 *
 *   npm run preview:demo:sembrar
 *   npm run preview:demo:retirar
 *
 * - SOLO preview: el mismo guardián que el hero de prueba
 *   (`puedeTocarHeroDePrueba`), que se niega ANTES de conectar si la base o el
 *   Blob no son los del preview.
 * - Sube las 4 fotos YA REDUCIDAS desde
 *   `Desktop/partequipos-diseno/cliente-hero/web/` (JPG de 2560 px, calidad 80,
 *   sin metadatos). Los originales no se suben nunca.
 * - `sembrar` deja en el hero SOLO las diapositivas de la demo, en su orden:
 *   quita la de prueba «Potencia Hitachi» (sus fotos se quedan en Media).
 *   Idempotente: lo que ya existe no se duplica; el punto focal se corrige.
 * - `retirar` quita las diapositivas de la demo y DESPUÉS sus imágenes, y
 *   comprueba que los ficheros desaparecen del Blob. Para volver a la
 *   diapositiva de prueba: `npm run preview:sembrar`, que la pone la primera.
 *
 * NO REFRESCA EL PREVIEW: el HTML se genera en el build. Sembrar ANTES del
 * último push (o redesplegar después).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import {
  DIAPOSITIVAS_DEMO,
  MARCA_DEMO,
  esDiapositivaDeDemo,
  esImagenDeDemo,
} from "../../src/lib/portada/heroDemoCliente";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
if (!modo) {
  console.error("[hero-demo] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[hero-demo] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
const { default: config } = await import("../../src/payload.config");
const { SLUG_PORTADA } = await import("../../src/lib/queries/getPaginas");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[hero-demo] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CARPETA =
  process.env.HERO_DEMO_FOTOS ??
  path.join(os.homedir(), "Desktop", "partequipos-diseno", "cliente-hero", "web");
/** Recortes verticales para móvil (§10.36). Si falta el fichero, la diapositiva va sin él. */
const CARPETA_MOVIL = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-diseno",
  "cliente-hero",
  "movil",
);

async function mediaDeDemo() {
  const r = await payload.find({
    collection: "media",
    where: { alt: { like: MARCA_DEMO } },
    depth: 0,
    limit: 50,
    overrideAccess: true,
  });
  return r.docs.filter((m) => esImagenDeDemo(m.alt));
}

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

/** Espera a que la URL pública responda lo esperado; la caché tarda hasta 60 s. */
async function esperarEstado(url: string, esperado: number, topeSeg = 150): Promise<number> {
  const fin = Date.now() + topeSeg * 1000;
  let estado = 0;
  while (Date.now() < fin) {
    estado = (await fetch(url, { method: "HEAD" }).catch(() => null))?.status ?? 0;
    if (estado === esperado) return estado;
    await esperar(10_000);
  }
  return estado;
}

if (modo === "sembrar") {
  const existentes = await mediaDeDemo();
  const ids: number[] = [];
  for (const s of DIAPOSITIVAS_DEMO) {
    const ya = existentes.find((m) => m.alt === s.alt);
    if (ya) {
      if (ya.focalX !== s.focalX || ya.focalY !== s.focalY) {
        await payload.update({
          collection: "media",
          id: ya.id,
          data: { focalX: s.focalX, focalY: s.focalY },
          overrideAccess: true,
        });
        log(`${s.fichero}: ya existía (id ${ya.id}); punto focal ${s.focalX}/${s.focalY}`);
      } else log(`${s.fichero}: ya existía (id ${ya.id}), sin cambios`);
      ids.push(ya.id);
      continue;
    }
    const creado = await payload.create({
      collection: "media",
      data: { alt: s.alt, focalX: s.focalX, focalY: s.focalY },
      filePath: path.join(CARPETA, s.fichero),
      overrideAccess: true,
    });
    log(`${s.fichero}: subida (id ${creado.id}), ${creado.width}×${creado.height}`);
    ids.push(creado.id);
  }

  // Recortes para móvil: subidos una vez, foco en el centro (el recorte ya va centrado).
  const idsMovil: (number | null)[] = [];
  for (const s of DIAPOSITIVAS_DEMO) {
    const ya = existentes.find((m) => m.alt === s.altMovil);
    if (ya) {
      idsMovil.push(ya.id);
      log(`${s.ficheroMovil}: ya existía (id ${ya.id})`);
      continue;
    }
    const ruta = path.join(CARPETA_MOVIL, s.ficheroMovil);
    if (!fs.existsSync(ruta)) {
      idsMovil.push(null);
      log(`${s.ficheroMovil}: no está en ${CARPETA_MOVIL}; la diapositiva va sin recorte`);
      continue;
    }
    const creado = await payload.create({
      collection: "media",
      data: { alt: s.altMovil, focalX: 50, focalY: 50 },
      filePath: ruta,
      overrideAccess: true,
    });
    log(`${s.ficheroMovil}: subida (id ${creado.id}), ${creado.width}×${creado.height}`);
    idsMovil.push(creado.id);
  }

  const pag = await portada();
  const antes = pag.hero?.diapositivas ?? [];
  const nuevas = DIAPOSITIVAS_DEMO.map((s, i) => ({
    titulo: s.titulo,
    parrafo: s.parrafo,
    imagenFondo: ids[i]!,
    imagenFondoMovil: idsMovil[i] ?? null,
  }));
  await payload.update({
    collection: "paginas",
    id: pag.id,
    data: { hero: { diapositivas: nuevas } },
    overrideAccess: true,
  });
  const quitadas = antes.filter((x) => !esDiapositivaDeDemo(x, ids)).map((x) => x.titulo);
  log(
    `hero: ${nuevas.length} diapositivas de la demo${quitadas.length ? `; quitadas del hero: ${quitadas.join(", ")} (sus fotos siguen en Media)` : ""}`,
  );
  const despues = await portada();
  log(`comprobado: ${(despues.hero?.diapositivas ?? []).map((x) => x.titulo).join(" · ")}`);
  log("HECHO. Redesplegar el preview (o hacer push) para que el build lo recoja.");
  process.exit(0);
}

// --- retirar ------------------------------------------------------------------
const imagenes = await mediaDeDemo();
const ids = imagenes.map((m) => m.id);
const pag = await portada();
const quedan = (pag.hero?.diapositivas ?? []).filter((x) => !esDiapositivaDeDemo(x, ids));
await payload.update({
  collection: "paginas",
  id: pag.id,
  data: { hero: { diapositivas: quedan } },
  overrideAccess: true,
});
log(`hero: quedan ${quedan.length} diapositivas`);
for (const m of imagenes) {
  await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
  log(`${m.filename}: registro ${m.id} borrado`);
}
let fallos = 0;
for (const m of imagenes) {
  if (!m.url) continue;
  const estado = await esperarEstado(m.url, 404);
  if (estado !== 404) fallos++;
  log(`Blob ${m.filename}: ${estado}${estado === 404 ? ", borrado" : " — SIGUE AHÍ"}`);
}
log(
  fallos
    ? `ATENCIÓN: ${fallos} ficheros siguen en el Blob.`
    : "HECHO. Para volver a la diapositiva de prueba: npm run preview:sembrar",
);
process.exit(fallos ? 1 : 0);
