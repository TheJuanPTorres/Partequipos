/**
 * Siembra o retira los MEDIOS de ejemplo de la página Nosotros (ux-9),
 * SOLO EN EL PREVIEW.
 *
 *   npm run preview:nosotros:sembrar
 *   npm run preview:nosotros:retirar
 *
 * - SOLO preview: el mismo guardián que el hero de prueba
 *   (`puedeTocarHeroDePrueba`), que se niega ANTES de conectar si la base o el
 *   Blob no son los del preview, y la guarda del almacén (§10.37).
 * - Sube desde `Desktop/partequipos-diseno/assets/nosotros/` las imágenes de
 *   ux-9 (licencia pendiente, L3; excepción de demostración §10.38) y el vídeo
 *   de la cabecera reexportado a H.264 de 8 bits (3,6 MB, bajo el tope de 4 MB
 *   de `videos`). El mapa es el ÚLTIMO FOTOGRAMA del Lottie de ux-9, capturado
 *   de la página pintada: la animación va en un PR aparte
 *   (docs/diseno/decisiones-nosotros.md).
 * - Se reconocen por el NOMBRE DE FICHERO (`nosotros-*`), no por una marca en
 *   el texto alternativo: el `alt` es el definitivo y lo lee un lector.
 * - Idempotente. Imprime los ids y las URL para la ruta de pruebas.
 *
 * NO toca `paginas`: los bloques llegan con su migración, en la ventana.
 */
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
if (!modo) {
  console.error("[nosotros] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[nosotros] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[nosotros]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[nosotros] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CARPETA = path.join(os.homedir(), "Desktop", "partequipos-diseno", "assets", "nosotros");
const PREFIJO = "nosotros-";

const IMAGENES = [
  {
    clave: "poster",
    fichero: "nosotros-cabecera-poster.jpg",
    alt: "Excavadora trabajando al atardecer",
  },
  {
    clave: "mapa",
    fichero: "nosotros-mapa-sedes.png",
    alt: "Mapa de Colombia con las sedes de Partequipos: Barranquilla, Montería, Antioquia (Caucasia, Guarne y Medellín), Bucaramanga, Istmina, Cali, Ibagué y Bogotá; filiales en Miami (Estados Unidos) y Lima (Perú)",
  },
  {
    clave: "franjaFondo",
    fichero: "nosotros-franja-fondo.jpg",
    alt: "Carretera en obra al atardecer",
  },
  { clave: "franjaMaquina", fichero: "nosotros-franja-dynapac.png", alt: "Compactador Dynapac" },
  {
    clave: "tarjetaNueva",
    fichero: "nosotros-tarjeta-nueva.jpg",
    alt: "Compactador de doble rodillo en una vía",
  },
  {
    clave: "tarjetaUsada",
    fichero: "nosotros-tarjeta-usada.jpg",
    alt: "Excavadora usada en una obra",
  },
  {
    clave: "tarjetaRepuestos",
    fichero: "nosotros-tarjeta-repuestos.jpg",
    alt: "Llantas de maquinaria pesada",
  },
] as const;
const VIDEO = "nosotros-cabecera.mp4";

const media = async () =>
  (
    await payload.find({
      collection: "media",
      where: { filename: { like: PREFIJO } },
      depth: 0,
      limit: 50,
      overrideAccess: true,
    })
  ).docs.filter((m) => m.filename?.startsWith(PREFIJO));

const videos = async () =>
  (
    await payload.find({
      collection: "videos",
      where: { filename: { like: PREFIJO } },
      depth: 0,
      limit: 10,
      overrideAccess: true,
    })
  ).docs.filter((v) => v.filename?.startsWith(PREFIJO));

/** Payload añade `-1`, `-2`… si el nombre ya existe: se compara sin extensión ni sufijo. */
const base = (f: string) => f.replace(/\.[a-z0-9]+$/i, "");
const mismoFichero = (guardado: string | null | undefined, original: string) =>
  !!guardado && (guardado === original || base(guardado).startsWith(`${base(original)}-`));

if (modo === "sembrar") {
  const existentes = await media();
  const resultado: Record<string, unknown> = {};
  for (const img of IMAGENES) {
    let doc = existentes.find((m) => mismoFichero(m.filename, img.fichero));
    if (!doc) {
      doc = await payload.create({
        collection: "media",
        data: { alt: img.alt, focalX: 50, focalY: 50 },
        filePath: path.join(CARPETA, img.fichero),
        overrideAccess: true,
      });
      log(`${img.clave}: subida (id ${doc.id})`);
    } else log(`${img.clave}: ya existía (id ${doc.id})`);
    resultado[img.clave] = {
      id: doc.id,
      url: doc.url,
      width: doc.width,
      height: doc.height,
      alt: doc.alt,
    };
  }

  const poster = resultado.poster as { id: number };
  let video = (await videos())[0];
  if (!video) {
    video = await payload.create({
      collection: "videos",
      data: {
        descripcion: "Excavadora trabajando al atardecer, en bucle",
        poster: poster.id,
        decorativo: true,
      },
      filePath: path.join(CARPETA, VIDEO),
      overrideAccess: true,
    });
    log(`vídeo: subido (id ${video.id}), ${video.filesize} bytes`);
  } else log(`vídeo: ya existía (id ${video.id})`);
  resultado.video = { id: video.id, url: video.url };

  process.stdout.write(`${JSON.stringify(resultado, null, 2)}\n`);
  log("HECHO.");
  process.exit(0);
}

// --- retirar ------------------------------------------------------------------
const ficheros: string[] = [];
for (const v of await videos()) {
  if (v.url) ficheros.push(v.url);
  await payload.delete({ collection: "videos", id: v.id, overrideAccess: true });
}
for (const m of await media()) {
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
