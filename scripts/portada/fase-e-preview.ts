/**
 * Siembra o retira el contenido de PRUEBA de las secciones 4 y 5 de la portada
 * (fase E), SOLO EN EL PREVIEW.
 *
 *   npm run preview:fase-e:sembrar
 *   npm run preview:fase-e:retirar
 *
 * - SOLO preview: el mismo guardián que el hero de prueba
 *   (`puedeTocarHeroDePrueba`), que se niega ANTES de conectar si la base o el
 *   Blob no son los del preview.
 * - Sube los 9 logos y las 4 fotos de tarjeta de ux-9 desde
 *   `Desktop/partequipos-diseno/assets/` (fuera del repositorio, que es
 *   público). Logos de fabricantes y fotos de banco o IA con licencia
 *   PENDIENTE (L3 y §6): nunca a producción.
 * - Pone a 4 categorías técnicas su posición, icono, enlace y foto, como en
 *   ux-9. NO toca su nombre ni su descripción: el texto sale de Payload.
 * - `retirar` vacía los logos de la portada, devuelve esas 4 categorías a
 *   «sin portada», borra las imágenes y comprueba que desaparecen del Blob.
 *
 * NO REFRESCA EL PREVIEW: el HTML se genera en el build. Sembrar ANTES del
 * último push (o redesplegar después).
 */
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { buscarPorMarca } from "../../src/lib/portada/porMarca";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
if (!modo) {
  console.error("[fase-e] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[fase-e] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[fase-e]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
const { default: config } = await import("../../src/payload.config");
const { SLUG_PORTADA } = await import("../../src/lib/queries/getPaginas");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[fase-e] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ASSETS = path.join(os.homedir(), "Desktop", "partequipos-diseno", "assets");
/** Marca del texto alternativo: así se reconocen las imágenes de esta prueba. */
const MARCA = "PRUEBA FASE E —";

/** En el orden del carrusel de ux-9 (galería del widget `351c67f0`). */
const LOGOS: [fichero: string, nombre: string][] = [
  ["Mesa-de-trabajo-1.png", "Hitachi"],
  ["Mesa-de-trabajo-2.png", "CASE"],
  ["Mesa-de-trabajo-3.png", "Yanmar"],
  ["Mesa-de-trabajo-4.png", "Dynapac"],
  ["Mesa-de-trabajo-5.png", "Donaldson"],
  ["Mesa-de-trabajo-6.png", "Volvo"],
  ["Mesa-de-trabajo-7-copia-2.png", "Caterpillar"],
  ["Mesa-de-trabajo-7-copia.png", "Hyundai"],
  ["Mesa-de-trabajo-7.png", "Komatsu"],
];

type Icono = "corte" | "llanta" | "lubricante" | "filtro";
/** Las 4 tarjetas de ux-9, en su orden, sobre las categorías que ya existen. */
const TARJETAS: [slug: string, icono: Icono, foto: string][] = [
  ["herramienta-de-corte-gets", "corte", "235553.jpg"],
  ["llantas-y-rines", "llanta", "hf_20260914_202250_1bca5eef-162c-464d-a803-daf5e2392e50.jpg"],
  ["lubricantes", "lubricante", "hf_20260914_202415_d9a38261-e2c7-4506-aa58-f7dfc0eae28e.jpg"],
  ["filtracion", "filtro", "hf_20260914_202425_e32f9a5b-2aae-4c6a-be03-a8b5ba798e60.jpg"],
];
const ENLACE_TARJETA = "/repuestos-maquinaria-pesada-colombia/";

function imagenesDePrueba() {
  return buscarPorMarca(payload, "media", "alt", MARCA);
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

async function categoria(slug: string) {
  const r = await payload.find({
    collection: "categorias-tecnicas",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const doc = r.docs[0];
  if (!doc) throw new Error(`no existe la categoría técnica «${slug}»`);
  return doc;
}

/** Sube (o reutiliza) una imagen marcada como de prueba. */
async function subir(
  existentes: Awaited<ReturnType<typeof imagenesDePrueba>>,
  ruta: string,
  alt: string,
) {
  const ya = existentes.find((m) => m.alt === alt);
  if (ya) return ya.id;
  const creado = await payload.create({
    collection: "media",
    data: { alt, focalX: 50, focalY: 50 },
    filePath: ruta,
    overrideAccess: true,
  });
  log(`${path.basename(ruta)}: subida (id ${creado.id}), ${creado.width}×${creado.height}`);
  return creado.id;
}

if (modo === "sembrar") {
  const existentes = await imagenesDePrueba();

  const logos = [];
  for (const [fichero, nombre] of LOGOS) {
    const id = await subir(existentes, path.join(ASSETS, "08", fichero), `${MARCA} logo ${nombre}`);
    logos.push({ logo: id, nombre });
  }
  const pag = await portada();
  await payload.update({
    collection: "paginas",
    id: pag.id,
    data: { seccionLogos: { logos } },
    overrideAccess: true,
  });
  log(`portada: ${logos.length} logos`);

  for (const [i, [slug, icono, foto]] of TARJETAS.entries()) {
    const cat = await categoria(slug);
    const imagen = await subir(existentes, path.join(ASSETS, "09", foto), `${MARCA} ${cat.nombre}`);
    await payload.update({
      collection: "categorias-tecnicas",
      id: cat.id,
      data: { ordenPortada: i + 1, icono, enlace: ENLACE_TARJETA, imagen },
      overrideAccess: true,
    });
    log(`${cat.nombre}: posición ${i + 1}, icono «${icono}»`);
  }
  log("HECHO. Redesplegar el preview (o hacer push) para que el build lo recoja.");
  process.exit(0);
}

// --- retirar ------------------------------------------------------------------
const pag = await portada();
await payload.update({
  collection: "paginas",
  id: pag.id,
  data: { seccionLogos: { logos: [] } },
  overrideAccess: true,
});
log("portada: sin logos");
for (const [slug] of TARJETAS) {
  const cat = await categoria(slug);
  await payload.update({
    collection: "categorias-tecnicas",
    id: cat.id,
    data: { ordenPortada: null, icono: null, enlace: null, imagen: null },
    overrideAccess: true,
  });
  log(`${cat.nombre}: fuera de la portada`);
}
const imagenes = await imagenesDePrueba();
for (const m of imagenes) {
  await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
}
log(`${imagenes.length} imágenes borradas de Media`);
let fallos = 0;
for (const m of imagenes) {
  if (!m.url) continue;
  const fin = Date.now() + 150_000;
  let estado = 0;
  while (Date.now() < fin) {
    estado = (await fetch(m.url, { method: "HEAD" }).catch(() => null))?.status ?? 0;
    if (estado === 404) break;
    await esperar(10_000);
  }
  if (estado !== 404) {
    fallos++;
    log(`Blob ${m.filename}: ${estado} — SIGUE AHÍ`);
  }
}
log(fallos ? `ATENCIÓN: ${fallos} ficheros siguen en el Blob.` : "HECHO. Todo fuera del Blob.");
process.exit(fallos ? 1 : 0);
