/**
 * Siembra o retira el CONTENIDO DE EJEMPLO de la página Nosotros (ux-9),
 * SOLO EN EL PREVIEW: sus medios y los bloques de la página «nosotros».
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
 *   de la página pintada (docs/diseno/decisiones-nosotros.md), y el Lottie
 *   mismo va a `animaciones` (desde `wordpress/nosotros/`) como
 *   `nosotros-mapa-sedes.json`.
 * - Los medios se reconocen por el NOMBRE DE FICHERO (`nosotros-*`), no por
 *   una marca en el texto alternativo: el `alt` es el definitivo.
 * - Pone los cinco bloques en la página «nosotros»; su «Contenido» y sus
 *   «Secciones» no se tocan (dejan de pintarse, no se borran).
 * - Idempotente: los medios que ya están no se vuelven a subir y los bloques
 *   se sustituyen enteros.
 * - `retirar` deja la página sin bloques, borra los medios (también la
 *   animación) y comprueba que
 *   desaparecen del Blob.
 *
 * NO REFRESCA EL PREVIEW: las páginas institucionales están prerenderizadas.
 * Sembrar ANTES del último push, o redesplegar.
 */
import fs from "node:fs";
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
const SLUG = "nosotros";

const IMAGENES = {
  poster: {
    fichero: "nosotros-cabecera-poster.jpg",
    alt: "Excavadora trabajando al atardecer",
  },
  mapa: {
    fichero: "nosotros-mapa-sedes.png",
    alt: "Mapa de Colombia con las sedes de Partequipos: Barranquilla, Montería, Antioquia (Caucasia, Guarne y Medellín), Bucaramanga, Istmina, Cali, Ibagué y Bogotá; filiales en Miami (Estados Unidos) y Lima (Perú)",
  },
  franjaFondo: { fichero: "nosotros-franja-fondo.jpg", alt: "Carretera en obra al atardecer" },
  franjaMaquina: { fichero: "nosotros-franja-dynapac.png", alt: "Compactador Dynapac" },
  tarjetaNueva: {
    fichero: "nosotros-tarjeta-nueva.jpg",
    alt: "Compactador de doble rodillo en una vía",
  },
  tarjetaUsada: { fichero: "nosotros-tarjeta-usada.jpg", alt: "Excavadora usada en una obra" },
  tarjetaRepuestos: {
    fichero: "nosotros-tarjeta-repuestos.jpg",
    alt: "Llantas de maquinaria pesada",
  },
} as const;
type ClaveImagen = keyof typeof IMAGENES;
const VIDEO = "nosotros-cabecera.mp4";
const ANIMACION = {
  origen: path.join(
    os.homedir(),
    "Desktop",
    "partequipos-diseno",
    "wordpress",
    "nosotros",
    "mapa-sedes-2025-negro-rojo.json",
  ),
  fichero: "nosotros-mapa-sedes.json",
  descripcion:
    "Mapa de Colombia en el que aparecen, una a una, las sedes de Partequipos y sus filiales (Lottie de ux-9).",
};

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

const animaciones = async () =>
  (
    await payload.find({
      collection: "animaciones",
      where: { filename: { like: PREFIJO } },
      depth: 0,
      limit: 10,
      overrideAccess: true,
    })
  ).docs.filter((a) => a.filename?.startsWith(PREFIJO));

async function paginaNosotros() {
  const r = await payload.find({
    collection: "paginas",
    where: { slug: { equals: SLUG } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const doc = r.docs[0];
  if (!doc) throw new Error(`no existe la página «${SLUG}»`);
  return doc;
}

/** Payload añade `-1`, `-2`… si el nombre ya existe: se compara sin extensión ni sufijo. */
const base = (f: string) => f.replace(/\.[a-z0-9]+$/i, "");
const mismoFichero = (guardado: string | null | undefined, original: string) =>
  !!guardado && (guardado === original || base(guardado).startsWith(`${base(original)}-`));

/** Texto enriquecido de Lexical con párrafos de texto plano. */
const parrafos = (...textos: string[]) => ({
  root: {
    type: "root",
    format: "" as const,
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children: textos.map((text) => ({
      type: "paragraph",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      textFormat: 0,
      textStyle: "",
      children: [
        { type: "text", text, format: 0, style: "", mode: "normal", detail: 0, version: 1 },
      ],
    })),
  },
});

const DYNAPAC =
  "Equipos DYNAPAC para compactación y pavimentación, desarrollados para lograr precisión y uniformidad en obras de infraestructura y construcción.";

/** Los cinco bloques de ejemplo de Nosotros, con las erratas de ux-9 corregidas. */
function bloques(ids: Record<ClaveImagen, number>, video: number, animacion: number) {
  return [
    {
      blockType: "cabeceraVideo" as const,
      antetitulo: "Partequipos",
      titulo: "Quiénes somos",
      video,
      imagen: ids.poster,
    },
    {
      blockType: "presentacionImagen" as const,
      imagen: ids.mapa,
      lottie: animacion,
      antetitulo: "PARTEQUIPOS",
      titulo: "Ofrecemos Soluciones para tus Proyectos",
      texto: parrafos(
        "Somos una empresa que brinda soluciones integrales a los sectores de la construcción, infraestructura, agroindustria y agregados; especializándonos en la venta de maquinaria pesada, repuestos, servicio técnico y lubricantes.",
        "Trabajamos de la mano con nuestras filiales: Partequipos Express (Miami) y Partequipos Perú.",
      ),
      botonTexto: "Conoce más",
      botonEnlace: "/contactanos/",
    },
    {
      blockType: "cifras" as const,
      cifras: [
        { prefijo: "+", numero: 25, etiqueta: "Años de experiencia" },
        { numero: 100, sufijo: "%", etiqueta: "Cobertura nacional*" },
        { numero: 10000, sufijo: "+", etiqueta: "Repuestos disponibles" },
      ],
    },
    {
      blockType: "franjaMarquee" as const,
      texto: "Marcas Aliadas",
      imagenFondo: ids.franjaFondo,
      imagenFrontal: ids.franjaMaquina,
    },
    {
      blockType: "tarjetasExpandibles" as const,
      antetitulo: "En Partequipos",
      titulo: "Ofrecemos soluciones para tus proyectos",
      tarjetas: [
        {
          titulo: "Maquinaria pesada nueva",
          texto: DYNAPAC,
          imagen: ids.tarjetaNueva,
          enlace: "/maquinaria-pesada/maquinaria-pesada-nueva/",
        },
        {
          titulo: "Maquinaria pesada usada",
          texto: DYNAPAC,
          imagen: ids.tarjetaUsada,
          enlace: "/maquinaria-pesada/maquinaria-pesada-usada/",
        },
        {
          titulo: "Repuestos para maquinaria",
          texto: DYNAPAC,
          imagen: ids.tarjetaRepuestos,
          enlace: "/repuestos-maquinaria-pesada-colombia/",
        },
      ],
      botonTexto: "Ver todo",
      botonEnlace: "/maquinaria-pesada/",
    },
  ];
}

if (modo === "sembrar") {
  const existentes = await media();
  const ids = {} as Record<ClaveImagen, number>;
  for (const [clave, img] of Object.entries(IMAGENES) as [
    ClaveImagen,
    (typeof IMAGENES)[ClaveImagen],
  ][]) {
    let doc = existentes.find((m) => mismoFichero(m.filename, img.fichero));
    if (!doc) {
      doc = await payload.create({
        collection: "media",
        data: { alt: img.alt, focalX: 50, focalY: 50 },
        filePath: path.join(CARPETA, img.fichero),
        overrideAccess: true,
      });
      log(`${clave}: subida (id ${doc.id})`);
    } else log(`${clave}: ya existía (id ${doc.id})`);
    ids[clave] = doc.id;
  }

  let video = (await videos())[0];
  if (!video) {
    video = await payload.create({
      collection: "videos",
      data: {
        descripcion: "Excavadora trabajando al atardecer, en bucle",
        poster: ids.poster,
        decorativo: true,
      },
      filePath: path.join(CARPETA, VIDEO),
      overrideAccess: true,
    });
    log(`vídeo: subido (id ${video.id}), ${video.filesize} bytes`);
  } else log(`vídeo: ya existía (id ${video.id})`);

  let animacion = (await animaciones())[0];
  if (!animacion) {
    const data = fs.readFileSync(ANIMACION.origen);
    animacion = await payload.create({
      collection: "animaciones",
      data: { descripcion: ANIMACION.descripcion },
      file: { data, name: ANIMACION.fichero, mimetype: "application/json", size: data.length },
      overrideAccess: true,
    });
    log(`animación: subida (id ${animacion.id}), ${animacion.ancho}×${animacion.alto}`);
  } else log(`animación: ya existía (id ${animacion.id})`);

  const pagina = await paginaNosotros();
  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { bloques: bloques(ids, video.id, animacion.id) },
    overrideAccess: true,
  });
  log(`página «${SLUG}» (id ${pagina.id}): 5 bloques puestos`);
  log("HECHO. Redesplegar el preview (o hacer push) para que el build lo recoja.");
  process.exit(0);
}

// --- retirar ------------------------------------------------------------------
const pagina = await paginaNosotros();
await payload.update({
  collection: "paginas",
  id: pagina.id,
  data: { bloques: [] },
  overrideAccess: true,
});
log(`página «${SLUG}»: sin bloques`);
const ficheros: string[] = [];
for (const v of await videos()) {
  if (v.url) ficheros.push(v.url);
  await payload.delete({ collection: "videos", id: v.id, overrideAccess: true });
}
for (const a of await animaciones()) {
  if (a.url) ficheros.push(a.url);
  await payload.delete({ collection: "animaciones", id: a.id, overrideAccess: true });
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
