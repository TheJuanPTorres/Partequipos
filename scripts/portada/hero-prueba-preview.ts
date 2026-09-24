/**
 * Siembra o retira la DIAPOSITIVA DE PRUEBA del hero en el PREVIEW, con las fotos
 * de Andrés (ux-9). Sirve para medir el LCP tras cada fase (CLAUDE.md §10.3 p.14)
 * y para enseñarle el hero. Lógica y guardián: `src/lib/portada/heroPrueba.ts`.
 *
 * Uso (las DOS variables del preview, explícitas):
 *
 *   DATABASE_URI="<pooled de la rama preview>" BLOB_READ_WRITE_TOKEN="<token del Blob del preview>" \
 *     npm run preview:hero-prueba -- sembrar
 *   … npm run preview:hero-prueba -- retirar
 *
 * - SOLO preview: se niega ANTES de conectar si la base o el Blob no son los del
 *   preview. `payload run` carga `.env.local`, cuyo Blob es el de PRODUCCIÓN.
 * - Idempotente: si las imágenes o la diapositiva ya existen, no las duplica.
 * - Punto focal en el centro (50/50), como en el diseño.
 * - `retirar`: quita PRIMERO la diapositiva y DESPUÉS las imágenes (la imagen de
 *   fondo es obligatoria en la diapositiva), y comprueba que los ficheros
 *   desaparecen del Blob.
 *
 * NO REFRESCA LA PORTADA DEL PREVIEW: el script corre fuera de Next y su
 * `revalidatePath` no llega al despliegue (§10.6). Al acabar, guardar la portada
 * en el panel del preview (sin cambios) o redesplegar.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import {
  DIAPOSITIVA_PRUEBA,
  FOCAL_PRUEBA,
  IMAGENES_PRUEBA,
  MARCA_PRUEBA,
  esDiapositivaDePrueba,
  puedeTocarHeroDePrueba,
  sinDiapositivasDePrueba,
} from "../../src/lib/portada/heroPrueba";
import { SLUG_PORTADA } from "../../src/lib/queries/getPaginas";

const modo = process.argv[process.argv.length - 1];
if (modo !== "sembrar" && modo !== "retirar") {
  console.error("[hero-prueba] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[hero-prueba] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}

// Un script de datos no toca el esquema (CLAUDE.md §10.9).
process.env.PAYLOAD_DISABLE_PUSH = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[hero-prueba] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Busca el fichero bajo Desktop/partequipos-diseno/assets (el kit viene en subcarpetas). */
function rutaDeFichero(nombre: string): string {
  const base =
    process.env.HERO_PRUEBA_ASSETS ??
    path.join(os.homedir(), "Desktop", "partequipos-diseno", "assets");
  const pendientes = [base];
  while (pendientes.length) {
    const dir = pendientes.pop()!;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) pendientes.push(p);
      else if (e.name === nombre) return p;
    }
  }
  throw new Error(`no encuentro ${nombre} bajo ${base}`);
}

/** Registros de prueba de `media`: por nombre de fichero Y marca en el texto alternativo. */
async function mediaDePrueba() {
  const r = await payload.find({
    collection: "media",
    where: {
      and: [
        { filename: { in: IMAGENES_PRUEBA.map((i) => i.fichero) } },
        { alt: { like: MARCA_PRUEBA } },
      ],
    },
    depth: 0,
    limit: 20,
    overrideAccess: true,
  });
  return r.docs;
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
  if (!doc) throw new Error("no existe la portada (slug «inicio») en el preview");
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
  const existentes = await mediaDePrueba();
  const ids: Record<string, number> = {};

  for (const img of IMAGENES_PRUEBA) {
    const ya = existentes.find((m) => m.filename === img.fichero);
    if (ya) {
      ids[img.papel] = ya.id;
      if (ya.focalX !== FOCAL_PRUEBA.focalX || ya.focalY !== FOCAL_PRUEBA.focalY) {
        await payload.update({
          collection: "media",
          id: ya.id,
          data: { ...FOCAL_PRUEBA },
          overrideAccess: true,
        });
        log(`${img.fichero}: ya existía (id ${ya.id}); punto focal devuelto al centro`);
      } else {
        log(`${img.fichero}: ya existía (id ${ya.id}), sin cambios`);
      }
      continue;
    }
    const creado = await payload.create({
      collection: "media",
      data: { alt: img.alt, ...FOCAL_PRUEBA },
      filePath: rutaDeFichero(img.fichero),
      overrideAccess: true,
    });
    ids[img.papel] = creado.id;
    log(`${img.fichero}: subida (id ${creado.id}) → ${creado.url}`);
  }

  const pag = await portada();
  const diapositivas = pag.hero?.diapositivas ?? [];
  const idsPrueba = Object.values(ids);
  if (diapositivas.some((d) => esDiapositivaDePrueba(d, idsPrueba))) {
    log("la diapositiva de prueba ya estaba en la portada: no se duplica");
  } else {
    // PRIMERA: la medición del LCP es la de la primera diapositiva.
    await payload.update({
      collection: "paginas",
      id: pag.id,
      data: {
        hero: {
          diapositivas: [
            { ...DIAPOSITIVA_PRUEBA, imagenFondo: ids.fondo!, imagenFrontal: ids.frontal! },
            ...diapositivas,
          ],
        },
      },
      overrideAccess: true,
    });
    log("diapositiva «Potencia Hitachi» añadida como PRIMERA de la portada");
  }

  for (const m of await mediaDePrueba()) {
    const estado = await esperarEstado(m.url!, 200, 30);
    log(`Blob ${m.filename}: ${estado}`);
  }
  log("HECHO. Para verla: guarda la portada en el panel del preview (sin cambios) o redespliega.");
} else {
  const medias = await mediaDePrueba();
  const idsPrueba = medias.map((m) => m.id);

  // 1. PRIMERO la diapositiva: la imagen de fondo es obligatoria en ella.
  const pag = await portada();
  const antes = pag.hero?.diapositivas ?? [];
  const despues = sinDiapositivasDePrueba(antes, idsPrueba);
  if (despues.length !== antes.length) {
    await payload.update({
      collection: "paginas",
      id: pag.id,
      data: { hero: { diapositivas: despues } },
      overrideAccess: true,
    });
    log(`diapositiva de prueba quitada (${antes.length} → ${despues.length})`);
  } else {
    log("no había diapositiva de prueba en la portada");
  }

  // 2. DESPUÉS las imágenes. El plugin de Blob borra el fichero al borrar el registro.
  for (const m of medias) {
    await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
    log(`${m.filename}: registro ${m.id} borrado`);
  }

  // 3. Que los ficheros desaparezcan del Blob (hasta 150 s por la caché).
  let fallos = 0;
  for (const m of medias) {
    const estado = await esperarEstado(m.url!, 404);
    if (estado !== 404) fallos++;
    log(`Blob ${m.filename}: ${estado === 404 ? "404, borrado" : `SIGUE RESPONDIENDO ${estado}`}`);
  }
  if (fallos) {
    console.error(
      `[hero-prueba] ${fallos} fichero(s) siguen en el Blob tras 150 s: revisar a mano.`,
    );
    process.exit(1);
  }
  log("HECHO. Para que la portada deje de mostrarla: guárdala en el panel o redespliega.");
}
process.exit(0);
