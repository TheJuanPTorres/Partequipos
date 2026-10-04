/**
 * Siembra o retira el contenido de PRUEBA de las secciones 10 y 11 de la
 * portada (fase H), SOLO EN EL PREVIEW.
 *
 *   npm run preview:fase-h:sembrar
 *   npm run preview:fase-h:retirar
 *
 * - SOLO preview: el mismo guardián que el hero de prueba
 *   (`puedeTocarHeroDePrueba`), que se niega ANTES de conectar si la base o el
 *   Blob no son los del preview.
 * - Los 4 testimonios y las 5 preguntas de ux-9, con sus textos, y las fotos
 *   y la máquina de ux-9 desde `Desktop/partequipos-diseno/assets/09/`.
 *   Testimonios con la autorización de uso PENDIENTE (L4) y fotos L3: nunca a
 *   producción. La «autorización» de estos registros es de prueba y lo dice.
 * - `retirar` borra testimonios, preguntas e imágenes de esta prueba, vacía la
 *   imagen de la sección 11 y comprueba que los ficheros salen del Blob.
 *
 * NO REFRESCA EL PREVIEW: sembrar ANTES del último push (o redesplegar).
 */
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { buscarPorMarca } from "../../src/lib/portada/porMarca";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
if (!modo) {
  console.error("[fase-h] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[fase-h] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[fase-h]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
const { default: config } = await import("../../src/payload.config");
const { SLUG_PORTADA } = await import("../../src/lib/queries/getPaginas");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[fase-h] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ASSETS = path.join(os.homedir(), "Desktop", "partequipos-diseno", "assets", "09");
/** Marca: en el `alt` de las imágenes y en la referencia de la autorización. */
const MARCA = "PRUEBA FASE H —";

const SENTRAC = {
  empresa: "Sentrac Ingeniería SAS",
  ciudad: "Casanare",
  nombre: "Contacto de Sentrac Ingeniería",
  cita: "A lo largo de los años, han encontrado en Partequipos un aliado confiable, su distribuidor de repuestos para maquinaria pesada.",
  youtube: "https://www.youtube.com/watch?v=hBeMsx5WEko&t=21s",
};
/** En el orden de ux-9 (widget `4d701aa3`). Tres son el mismo relleno. */
const TESTIMONIOS = [
  { ...SENTRAC, foto: "Video-Testimonio.jpg" },
  {
    empresa: "EMT SAS",
    ciudad: "Cali",
    nombre: "Alejandro Morales",
    cita: "Alejandro Morales de EMT Edwin Martínez comparte su experiencia operando la Yanmar ViO80-1, una excavadora reconocida por su versatilidad, facilidad de mantenimiento y excelente desempeño en obra.",
    youtube: "https://www.youtube.com/watch?v=hV33sXph6sU",
    foto: "Testimono-24.jpg",
  },
  { ...SENTRAC, foto: "345345.jpg" },
  { ...SENTRAC, foto: "Case.jpg" },
];

/** Las 5 de ux-9 (widget `5a2d8e5d`). */
const PREGUNTAS: [string, string][] = [
  [
    "¿Qué productos y servicios ofrece Partequipos?",
    "En Partequipos ofrecemos maquinaria, repuestos originales y soluciones para el mantenimiento y operación de equipos de construcción y maquinaria pesada.",
  ],
  [
    "¿Qué marcas de maquinaria comercializan?",
    "Trabajamos con marcas reconocidas del sector como CASE, Yanmar, Hitachi y Komatsu, ofreciendo equipos y repuestos según las necesidades de cada operación.",
  ],
  [
    "¿Venden repuestos originales?",
    "Sí. Contamos con repuestos originales para diferentes líneas y modelos de maquinaria, buscando garantizar el rendimiento, confiabilidad y vida útil de los equipos.",
  ],
  [
    "¿Qué tipo de repuestos puedo encontrar en Partequipos?",
    "Contamos con diferentes categorías de repuestos, incluyendo filtros, trenes de rodaje, componentes hidráulicos, repuestos para motor, lubricantes, correas y otros componentes para maquinaria.",
  ],
  [
    "¿Cómo puedo saber qué repuesto necesita mi máquina?",
    "Nuestro equipo puede ayudarte a identificar el repuesto adecuado. Es recomendable tener a la mano la marca, modelo y número de serie del equipo para agilizar la búsqueda.",
  ],
];

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

const imagenes = () => buscarPorMarca(payload, "media", "alt", MARCA);

// Antes sin filtro de prefijo: la retirada podía borrar testimonios ajenos.
const testimonios = () => buscarPorMarca(payload, "testimonios", "referenciaAutorizacion", MARCA);

async function subir(fichero: string, alt: string) {
  const ya = (await imagenes()).find((m) => m.alt === alt);
  if (ya) return ya.id;
  const creado = await payload.create({
    collection: "media",
    data: { alt, focalX: 50, focalY: 50 },
    filePath: path.join(ASSETS, fichero),
    overrideAccess: true,
  });
  log(`${fichero}: subida (id ${creado.id})`);
  return creado.id;
}

if (modo === "sembrar") {
  if ((await testimonios()).length === 0) {
    for (const [i, t] of TESTIMONIOS.entries()) {
      const foto = await subir(t.foto, `${MARCA} foto del testimonio ${i + 1}`);
      await payload.create({
        collection: "testimonios",
        data: {
          nombre: t.nombre,
          empresa: t.empresa,
          ciudad: t.ciudad,
          cita: t.cita,
          youtube: t.youtube,
          foto,
          orden: i + 1,
          autorizacionUso: true,
          fechaAutorizacion: new Date().toISOString(),
          referenciaAutorizacion: `${MARCA} sin autorización real; solo para el preview`,
          publicado: true,
        },
        overrideAccess: true,
      });
      log(`testimonio ${i + 1}: ${t.empresa}`);
    }
  } else log("testimonios: ya estaban");

  for (const [i, [pregunta, respuesta]] of PREGUNTAS.entries()) {
    const ya = await payload.find({
      collection: "preguntas-frecuentes",
      where: { pregunta: { equals: pregunta } },
      limit: 1,
      overrideAccess: true,
    });
    if (ya.docs.length) continue;
    await payload.create({
      collection: "preguntas-frecuentes",
      data: { pregunta, respuesta, orden: i + 1, publicada: true },
      overrideAccess: true,
    });
  }
  log(`${PREGUNTAS.length} preguntas`);

  const imagen = await subir("P1415_6500-2_red_211111.png", `${MARCA} máquina de la sección 11`);
  const pag = await portada();
  await payload.update({
    collection: "paginas",
    id: pag.id,
    data: { seccionFaq: { imagen } },
    overrideAccess: true,
  });
  log("portada: máquina de la sección 11 puesta");
  log("HECHO. Redesplegar el preview (o hacer push) para que el build lo recoja.");
  process.exit(0);
}

// --- retirar ------------------------------------------------------------------
const pag = await portada();
await payload.update({
  collection: "paginas",
  id: pag.id,
  data: { seccionFaq: { imagen: null } },
  overrideAccess: true,
});
for (const t of await testimonios()) {
  await payload.delete({ collection: "testimonios", id: t.id, overrideAccess: true });
}
for (const [pregunta] of PREGUNTAS) {
  await payload.delete({
    collection: "preguntas-frecuentes",
    where: { pregunta: { equals: pregunta } },
    overrideAccess: true,
  });
}
log("testimonios y preguntas de la prueba borrados");
const fotos = await imagenes();
for (const m of fotos) {
  await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
}
let fallos = 0;
for (const m of fotos) {
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
