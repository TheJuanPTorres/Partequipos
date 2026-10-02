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
 * Hoy: la imagen decorativa del pie (export 2178, una cargadora) y las 6
 * fichas de usados de la sección 3 (export 2516: dos por pestaña, todas la
 * «Excavadora Hitachi ZX75US-7» de ux-9). Las fichas llevan la marca al
 * principio de su `descripcion`.
 * Además pone en las 3 marcas de la sección 2 el texto de ux-9 (el mismo que
 * producción; no es contenido de ejemplo y `retirar` no lo toca), y el
 * «Título en portada» de ux-9 en las 4 categorías de repuestos (ejemplo:
 * `retirar` lo vacía si sigue siendo el de ux-9).
 *
 * NO REFRESCA EL PREVIEW: sembrar ANTES del último push (o redesplegar).
 */
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { MARCA_EJEMPLO } from "../../src/lib/demo/copiaDemo";
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
/** Marca en el `alt` de todo lo que siembra este script (la que reconoce la copia). */
const MARCA = MARCA_EJEMPLO;

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

/** Fichas de usados de ejemplo (descripción marcada). */
const fichasDeEjemplo = async () =>
  (
    await payload.find({
      collection: "equipos-usados",
      where: { descripcion: { like: MARCA } },
      depth: 0,
      limit: 50,
      overrideAccess: true,
    })
  ).docs.filter((e) => e.descripcion?.startsWith(MARCA));

async function categoriaUsada(slug: string) {
  const r = await payload.find({
    collection: "categorias-usada",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const c = r.docs[0];
  if (!c) throw new Error(`[ejemplo] falta la categoría de usada «${slug}»`);
  return c.id;
}

/*
 * Sección 3 de ux-9 (export 2516): tres pestañas con dos tarjetas cada una,
 * todas la misma excavadora; la imagen alterna entre las dos del kit. La
 * portada ordena por `-updatedAt`, así que en cada pestaña se crea primero la
 * SEGUNDA tarjeta. «Otros» necesita una categoría que no sea excavadoras.
 */
const FICHAS = [
  { pestana: "excavadoras", categoria: "excavadoras", aditamento: false },
  { pestana: "otros", categoria: "retrocargadoras", aditamento: false },
  { pestana: "aditamentos", categoria: "excavadoras", aditamento: true },
] as const;
const IMAGENES_FICHA = [
  "excavadora-amarilla-aislada-archivo-png-fondo-transparente-e1788914890653-1024x1018.png",
  "014_Cut01_2560x1710v0-2-946x1024.png",
] as const;

/** Texto de la tarjeta de cada marca en ux-9 (export 2516, sección 2). */
const TEXTOS_MARCAS: Record<string, string> = {
  hitachi:
    "Maquinaria nueva Hitachi para construcción, minería e infraestructura, con tecnología, potencia y rendimiento adaptados a las exigencias de cada proyecto.",
  "case-construction":
    "Equipos nuevos CASE Construction, desarrollados para ofrecer potencia, eficiencia y versatilidad en proyectos de construcción y trabajo pesado.",
  yanmar:
    "Equipos nuevos YANMAR, reconocidos por su eficiencia, maniobrabilidad y confiabilidad para aplicaciones de construcción, agricultura e industria.",
};

/** «Título en portada» de las 4 tarjetas de repuestos de ux-9 (export 2516, sección 5). */
const TITULOS_REPUESTOS: Record<string, string> = {
  "herramienta-de-corte-gets": "Blades y corte",
  "llantas-y-rines": "Llantas y rines",
  lubricantes: "Lubricantes",
  filtracion: "Filtración",
};

async function categoriaTecnica(slug: string) {
  const r = await payload.find({
    collection: "categorias-tecnicas",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return r.docs[0] ?? null;
}

if (modo === "sembrar") {
  for (const [slug, tituloPortada] of Object.entries(TITULOS_REPUESTOS)) {
    const c = await categoriaTecnica(slug);
    if (!c || c.tituloPortada === tituloPortada) continue;
    await payload.update({
      collection: "categorias-tecnicas",
      id: c.id,
      data: { tituloPortada },
      overrideAccess: true,
    });
    log(`categoría ${slug}: título en portada «${tituloPortada}»`);
  }
  for (const [slug, descripcion] of Object.entries(TEXTOS_MARCAS)) {
    const r = await payload.find({
      collection: "marcas-maquinaria",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });
    const marca = r.docs[0];
    if (!marca || marca.descripcion === descripcion) continue;
    await payload.update({
      collection: "marcas-maquinaria",
      id: marca.id,
      data: { descripcion },
      overrideAccess: true,
    });
    log(`marca ${slug}: texto de ux-9 puesto`);
  }
  const imagenes = [
    await subir(IMAGENES_FICHA[0], "excavadora de las fichas de usados (1)"),
    await subir(IMAGENES_FICHA[1], "excavadora de las fichas de usados (2)"),
  ];
  const ya = new Set((await fichasDeEjemplo()).map((e) => e.descripcion));
  for (const f of FICHAS) {
    const categoria = await categoriaUsada(f.categoria);
    for (const n of [2, 1]) {
      const descripcion = `${MARCA} ficha ${n} de la pestaña «${f.pestana}».`;
      if (ya.has(descripcion)) continue;
      await payload.create({
        collection: "equipos-usados",
        data: {
          nombre: "Excavadora Hitachi ZX75US-7",
          categoria,
          marca: "Hitachi",
          modelo: "ZX75US-7",
          pesoOperativo: 8.4,
          potencia: 64,
          motor: "YANMAR 4TNV98CT",
          descripcion,
          imagenes: [imagenes[n - 1]!],
          disponible: true,
          pestanaPortada: f.aditamento ? "aditamentos" : "categoria",
        },
        overrideAccess: true,
      });
      log(`ficha ${n} de «${f.pestana}»: creada`);
    }
  }

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
  for (const [slug, tituloPortada] of Object.entries(TITULOS_REPUESTOS)) {
    const c = await categoriaTecnica(slug);
    if (!c || c.tituloPortada !== tituloPortada) continue;
    await payload.update({
      collection: "categorias-tecnicas",
      id: c.id,
      data: { tituloPortada: null },
      overrideAccess: true,
    });
  }
  log("títulos en portada de ejemplo: vaciados");
  for (const e of await fichasDeEjemplo()) {
    await payload.delete({ collection: "equipos-usados", id: e.id, overrideAccess: true });
  }
  log("fichas de usados de ejemplo borradas");
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
