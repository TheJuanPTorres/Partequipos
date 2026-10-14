/**
 * HERO DE SLIDERS DE ANDRÉS EN EL PREVIEW (2026-10-14): siembra o retira las
 * diapositivas 1 (Hitachi LANDCROS) y 2 (CASE «Versatilidad. Fuerza.
 * Experiencia.») del diseño, para medirlas contra su referencia pintada. Las
 * demás del diseño están sin terminar y no se siembran.
 *
 *   npm run preview:hero-sliders -- sembrar
 *   npm run preview:hero-sliders -- retirar
 *
 * - SOLO el preview: las fotos son del diseño de Andrés y su licencia para el
 *   sitio publicado no está confirmada. Se niega ANTES de conectar si la base o
 *   el Blob no son los del preview (`puedeTocarHeroDePrueba`), y la guarda del
 *   almacén lo vuelve a comprobar.
 * - Pone las dos diapositivas DELANTE de las que haya y guarda las de antes en
 *   el manifiesto (fuera del repositorio); `retirar` las devuelve tal cual,
 *   borra las 4 imágenes y comprueba que dan 404.
 * - Idempotente: con el manifiesto ya sembrado, no hace nada.
 * - No revalida: después, guardar la portada en el panel o redesplegar (§10.6).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
const fallar = (m: string): never => {
  const e = new Error(`[hero-sliders] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: «sembrar» o «retirar»");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
exigirAlmacen("[hero-sliders]");

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-hero-sliders-preview.json",
);
const ORIGEN = "https://partequipos.uxdesign.website/wp-content/uploads/2026/10/";
/** Los ficheros del diseño (`elementor-3388`), con su texto alternativo. */
const IMAGENES = {
  fondo1: ["324545-1-scaled.jpg", "Terreno de obra con huellas de orugas, visto desde arriba"],
  maquina1: ["Maquinaria.png", "Excavadora Hitachi LANDCROS vista desde arriba"],
  fondo2: ["Fondo-10-1-scaled.jpg", "Terreno de obra despejado con árboles al fondo"],
  maquina2: ["Imagen-destacada-1-1.png", "Minicargador CASE con pinza para troncos"],
} as const;
type Clave = keyof typeof IMAGENES;
type Manifiesto = {
  paginaId: number;
  antes: Record<string, unknown>[];
  media: { clave: Clave; id: number; url: string }[];
};

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[hero-sliders] ${m}\n`);

const portada =
  (
    await payload.find({
      collection: "paginas",
      where: { slug: { equals: "inicio" } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0] ?? fallar("el preview no tiene portada");

const leer = (): Manifiesto | null =>
  fs.existsSync(MANIFIESTO)
    ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
    : null;
const guardar = (m: Manifiesto) => fs.writeFileSync(MANIFIESTO, JSON.stringify(m, null, 2));

if (modo === "retirar") {
  const m = leer() ?? fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  await payload.update({
    collection: "paginas",
    id: m.paginaId,
    data: { hero: { diapositivas: m.antes } } as never,
    overrideAccess: true,
  });
  log(`hero devuelto a sus ${m.antes.length} diapositivas de antes`);
  for (const x of m.media)
    await payload.delete({ collection: "media", id: x.id, overrideAccess: true }).catch(() => null);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("imágenes borradas; espero 70 s (propagación del Blob)");
  await new Promise((r) => setTimeout(r, 70_000));
  const vivos: string[] = [];
  for (const x of m.media)
    if ((await fetch(x.url, { method: "HEAD" })).status !== 404) vivos.push(x.url);
  if (vivos.length) fallar(`siguen en el Blob: ${vivos.join(" ")}`);
  log(`✓ RETIRADO: las ${m.media.length} imágenes dan 404`);
  process.exit(0);
}

if (leer()) {
  log("ya sembrado (hay manifiesto): nada que hacer");
  process.exit(0);
}
/** Las diapositivas de hoy, sin el `id` de cada fila (Payload las renumera). */
const antes = (portada.hero?.diapositivas ?? []).map((d) => {
  const resto = { ...(d as Record<string, unknown>) };
  delete resto.id;
  return resto;
});
const m: Manifiesto = { paginaId: portada.id, antes, media: [] };
guardar(m);
const ids = {} as Record<Clave, number>;
for (const [clave, [fichero, alt]] of Object.entries(IMAGENES) as [
  Clave,
  readonly [string, string],
][]) {
  const r = await fetch(ORIGEN + fichero);
  if (!r.ok) fallar(`HTTP ${r.status} al descargar ${fichero}`);
  const datos = Buffer.from(await r.arrayBuffer());
  const doc = await payload.create({
    collection: "media",
    data: { alt },
    file: {
      data: datos,
      mimetype: fichero.endsWith(".png") ? "image/png" : "image/jpeg",
      name: `hero-sliders-${clave}${path.extname(fichero)}`,
      size: datos.length,
    },
    overrideAccess: true,
  });
  m.media.push({ clave, id: doc.id, url: doc.url ?? "" });
  guardar(m);
  ids[clave] = doc.id;
  log(`subida ${clave} → media ${doc.id}`);
  await new Promise((r2) => setTimeout(r2, 700));
}

// Los textos son los del diseño (elementor-3388); el «+» del diseño no enlaza a
// nada: aquí lleva a la marca (desviación anotada para Andrés).
const nuevas = [
  {
    titulo: "Hitachi LANDCROS",
    parrafo:
      "En Partequipos encuentras maquinaria Hitachi, diseñada para ofrecer rendimiento, precisión y confiabilidad en cada operación.",
    imagenFondo: ids.fondo1,
    imagenFrontal: ids.maquina1,
    posicionMaquina: "sobre",
    textoCircular: "Fuerza. Tradición. Respaldo.",
    enlace: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/",
    enlaceNombre: "Ver maquinaria Hitachi",
  },
  {
    titulo: "Versatilidad. Fuerza. Experiencia.",
    tituloArriba: "Versatilidad. Fuerza",
    tituloAbajo: "Experiencia.",
    parrafo:
      "Explora la maquinaria CASE Construction: retroexcavadoras, excavadoras, minicargadores y cargadores frontales de alto rendimiento.",
    imagenFondo: ids.fondo2,
    imagenFrontal: ids.maquina2,
    posicionMaquina: "debajo",
    enlace: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/",
    enlaceNombre: "Ver maquinaria CASE Construction",
  },
];
await payload.update({
  collection: "paginas",
  id: portada.id,
  data: { hero: { diapositivas: [...nuevas, ...antes] } } as never,
  overrideAccess: true,
});
log(
  `✓ SEMBRADO: 2 diapositivas delante de las ${antes.length} de antes. Manifiesto: ${MANIFIESTO}`,
);
log("No revalida: guardar la portada en el panel del preview o redesplegar.");
