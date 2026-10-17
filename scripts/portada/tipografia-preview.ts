/**
 * TIPOGRAFÍA DEL TÍTULO EN EL PREVIEW (2026-10-17): siembra o retira una
 * prueba de «Tipografía del título» para medirla pintada.
 *
 *   npm run preview:tipografia -- sembrar
 *   npm run preview:tipografia -- retirar
 *
 * - Sube dos fuentes de prueba («PRUEBA TIPOGRAFÍA —»): Geist Mono y Geist, de
 *   los ficheros que trae el propio `next` (licencia OFL).
 * - Diapositiva 1: Geist Mono, amarillo, 700, «como está escrito», a la
 *   izquierda, con tamaños y posición propios. Diapositiva 3: Geist, para
 *   comprobar que al cargar la portada NO se descarga (no se ve).
 * - SOLO el preview (`puedeTocarHeroDePrueba` y la guarda del almacén). Guarda
 *   la tipografía de antes de cada diapositiva en un manifiesto fuera del
 *   repositorio; `retirar` la devuelve, borra las fuentes y comprueba el 404.
 * - No revalida: después, redesplegar el preview (§10.6).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
const fallar = (m: string): never => {
  const e = new Error(`[tipografia] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: «sembrar» o «retirar»");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
exigirAlmacen("[tipografia]");

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-tipografia-preview.json",
);
const FUENTES = path.join(process.cwd(), "node_modules/next/dist/next-devtools/server/font");
type Manifiesto = {
  paginaId: number;
  antes: { id: string; tipografia: unknown }[];
  fuentes: { id: number; url: string }[];
};

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[tipografia] ${m}\n`);

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
const diapositivas = (portada.hero?.diapositivas ?? []) as Record<string, unknown>[];

const leer = (): Manifiesto | null =>
  fs.existsSync(MANIFIESTO)
    ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
    : null;
const guardar = (m: Manifiesto) => fs.writeFileSync(MANIFIESTO, JSON.stringify(m, null, 2));

/** Guarda el hero con la tipografía de cada fila cambiada por `tipo(fila)`. */
async function conTipografia(tipo: (d: Record<string, unknown>, i: number) => unknown) {
  await payload.update({
    collection: "paginas",
    id: portada.id,
    data: {
      hero: { diapositivas: diapositivas.map((d, i) => ({ ...d, tipografia: tipo(d, i) })) },
    } as never,
    overrideAccess: true,
  });
}

if (modo === "retirar") {
  const m = leer() ?? fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const previa = new Map(m.antes.map((a) => [a.id, a.tipografia]));
  await conTipografia((d) => previa.get(String(d.id)) ?? null);
  log("tipografía de las diapositivas devuelta a la de antes");
  for (const f of m.fuentes)
    await payload
      .delete({ collection: "fuentes", id: f.id, overrideAccess: true })
      .catch(() => null);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("fuentes borradas; espero 70 s (propagación del Blob)");
  await new Promise((r) => setTimeout(r, 70_000));
  const vivas: string[] = [];
  for (const f of m.fuentes)
    if ((await fetch(f.url, { method: "HEAD" })).status !== 404) vivas.push(f.url);
  if (vivas.length) fallar(`siguen en el Blob: ${vivas.join(" ")}`);
  log(`✓ RETIRADO: las ${m.fuentes.length} fuentes dan 404`);
  process.exit(0);
}

if (leer()) {
  log("ya sembrado (hay manifiesto): nada que hacer");
  process.exit(0);
}
if (diapositivas.length < 3) fallar("hacen falta 3 diapositivas en el hero del preview");
const m: Manifiesto = {
  paginaId: portada.id,
  antes: diapositivas.map((d) => ({ id: String(d.id), tipografia: d.tipografia ?? null })),
  fuentes: [],
};
guardar(m);
const ids: number[] = [];
for (const [fichero, nombre] of [
  ["geist-mono-latin.woff2", "PRUEBA TIPOGRAFÍA — Geist Mono"],
  ["geist-latin.woff2", "PRUEBA TIPOGRAFÍA — Geist"],
] as const) {
  const datos = fs.readFileSync(path.join(FUENTES, fichero));
  const doc = await payload.create({
    collection: "fuentes",
    data: { nombre },
    file: { data: datos, mimetype: "font/woff2", name: `prueba-${fichero}`, size: datos.length },
    overrideAccess: true,
  });
  m.fuentes.push({ id: doc.id, url: doc.url ?? "" });
  guardar(m);
  ids.push(doc.id);
  log(`subida ${fichero} → fuentes ${doc.id} (${doc.formato})`);
}

await conTipografia((d, i) => {
  if (i === 0)
    return {
      fuente: ids[0],
      peso: "700",
      color: "#FFD200",
      mayusculas: "normal",
      alineacion: "izquierda",
      interlineado: 1.1,
      interletrado: 2,
      tamanoEscritorio: 96,
      tamanoMovil: 44,
      posicionXEscritorio: 0,
      posicionYEscritorio: 35,
      posicionXMovil: 0,
    };
  if (i === 2) return { fuente: ids[1] };
  return d.tipografia ?? null;
});
log(`✓ SEMBRADO en la portada ${portada.id}. Manifiesto: ${MANIFIESTO}`);
log("No revalida: redesplegar el preview.");
