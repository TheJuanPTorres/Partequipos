/**
 * SERIES DE HITACHI (2026-10-17, dirección): pone en los dos tipos de Hitachi
 * sus series de WordPress (EX y ZAXIS, en ese orden) y en cada uno de sus 46
 * modelos la serie que le toca por el prefijo de su código (EX… / ZX…), con
 * manifiesto y retirada exacta. Detalle en docs/repuestos-importacion.md §8.
 *
 *   npm run preview:repuestos:series:simular   # no escribe nada: el plan y los recuentos
 *   npm run preview:repuestos:series:aplicar
 *   npm run preview:repuestos:series:retirar   # deshace lo del manifiesto
 *
 * Para el sitio publicado, el runbook de dirección (mismo script, destino del
 * sitio publicado, con base Y almacén de ese entorno o no hace nada).
 *
 * - Fotos: la serie EX usa la foto que ya tiene el tipo (la misma de
 *   WordPress); las dos de ZAXIS se descargan del WordPress del cliente y se
 *   suben a `Media` como `wp-serie-…` (dirección: como las demás fotos de tipo).
 * - Idempotente: una segunda pasada no sube nada ni cambia nada.
 * - El manifiesto (fuera del repositorio, en `Desktop/partequipos-cierre/`)
 *   guarda las series y la serie de cada modelo ANTES de la primera pasada; la
 *   retirada las devuelve y borra las fotos que subió (y comprueba el 404).
 * - NO refresca el sitio: las páginas de marca y tipo están prerenderizadas.
 *   Después, redesplegar.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { claveSerie } from "../../src/lib/repuestos/series";
import {
  MARCA_HITACHI,
  PLAN_HITACHI,
  serieHitachi,
  type PlanFotoSerie,
} from "../../src/lib/repuestos/seriesHitachi";
import { formatoDeImagen } from "../../src/lib/repuestos/wordpress";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[series] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!destino) fallar("indica el destino: preview o el del sitio publicado");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  // Sitio publicado: base Y almacén de ese entorno, o no se hace nada (el guardián del importador).
  const v = veredictoDestino(destino!, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
if (modo === "simular") {
  // Simulación: sin token, nada puede llegar al Blob.
  process.env.BLOB_READ_WRITE_TOKEN = "";
} else {
  exigirAlmacen("[series]");
}

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const MANIFIESTO = path.join(CIERRE, `manifiesto-series-${destino}.json`);
const AGENTE = "Mozilla/5.0 (Partequipos; importación de repuestos)";

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
if (modo === "simular") {
  for (const op of ["create", "update", "delete"] as const) {
    (payload as unknown as Record<string, unknown>)[op] = () =>
      fallar(`simulación: «${op}» no está permitido`);
  }
}

const log = (m: string) => process.stdout.write(`[series] ${m}\n`);

// ---------- Manifiesto ----------

type SerieGuardada = { nombre: string; imagen: number | null };
type Manifiesto = {
  destino: string;
  /** Las series de cada tipo ANTES de la primera pasada. */
  tipos: { id: number; slug: string; antes: SerieGuardada[] }[];
  /** La serie de cada modelo ANTES de la primera pasada. */
  modelos: { id: number; antes: string | null }[];
  media: { id: number; filename: string; url: string }[];
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, tipos: [], modelos: [], media: [] };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
const guardarManifiesto = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

const idDe = (v: unknown): number | null =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? idDe(v.id) : null;

// ---------- Retirar ----------

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  let modelos = 0;
  for (const m of manifiesto.modelos) {
    await payload.update({
      collection: "modelos-repuesto",
      id: m.id,
      data: { serie: m.antes },
      overrideAccess: true,
    });
    modelos++;
  }
  log(`modelos devueltos a su serie de antes: ${modelos}`);
  for (const t of manifiesto.tipos) {
    await payload.update({
      collection: "tipos-equipo",
      id: t.id,
      data: { series: t.antes },
      overrideAccess: true,
    });
  }
  log(`tipos devueltos a sus series de antes: ${manifiesto.tipos.length}`);
  for (const f of manifiesto.media) {
    await payload.delete({ collection: "media", id: f.id, overrideAccess: true }).catch(() => null);
  }
  const urls = manifiesto.media.map((f) => f.url).filter(Boolean);
  if (urls.length > 0) {
    log(`fotos borradas: ${urls.length}; espero 70 s (propagación del Blob)`);
    await new Promise((r) => setTimeout(r, 70_000));
    const vivas: string[] = [];
    for (const u of urls) if ((await fetch(u, { method: "HEAD" })).status !== 404) vivas.push(u);
    if (vivas.length > 0) fallar(`siguen respondiendo en el Blob: ${vivas.join(", ")}`);
    log("las fotos responden 404 en el Blob");
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Redesplegar para que el sitio lo muestre.");
}

if (modo === "retirar") {
  await retirar();
} else {
  await aplicar();
}

// ---------- Simular / aplicar ----------

async function fotoEnMedia(f: PlanFotoSerie): Promise<number | null> {
  const ya = await payload.find({
    collection: "media",
    where: { filename: { contains: f.fichero } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const existente = ya.docs.find((d) => d.filename?.toLowerCase().startsWith(f.fichero));
  if (existente) return existente.id;
  const r = await fetch(f.url, { headers: { "User-Agent": AGENTE } });
  if (!r.ok) fallar(`no se puede descargar ${f.url}: HTTP ${r.status}`);
  const { default: sharp } = await import("sharp");
  let datos = Buffer.from(await r.arrayBuffer());
  const meta = await sharp(datos).metadata();
  const formato =
    formatoDeImagen(meta.format) ??
    fallar(`${f.url}: formato que Media no admite (${meta.format})`);
  if (formato.convertir) datos = await sharp(datos).webp({ quality: 82 }).toBuffer();
  const nombre = `${f.fichero}.${formato.ext}`;
  log(
    `foto ${nombre}: ${meta.format}, ${meta.width}×${meta.height}, ${Math.round(datos.length / 1024)} kB`,
  );
  if (modo === "simular") return null;
  const doc = await payload.create({
    collection: "media",
    data: { alt: f.alt, focalX: 50, focalY: 50 },
    file: { data: datos, mimetype: formato.mimetype, name: nombre, size: datos.length },
    overrideAccess: true,
  });
  const guardado = await payload.findByID({
    collection: "media",
    id: doc.id,
    depth: 0,
    overrideAccess: true,
  });
  manifiesto.media.push({
    id: doc.id,
    filename: guardado.filename ?? nombre,
    url: guardado.url ?? "",
  });
  guardarManifiesto();
  return doc.id;
}

async function aplicar(): Promise<void> {
  const marca = (
    await payload.find({
      collection: "marcas",
      where: { slug: { equals: MARCA_HITACHI } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
  if (!marca) fallar(`no está la marca ${MARCA_HITACHI}`);

  const resumen: Record<string, Record<string, number>> = {};
  for (const plan of PLAN_HITACHI) {
    const tipo = (
      await payload.find({
        collection: "tipos-equipo",
        where: { and: [{ marca: { equals: marca!.id } }, { slug: { equals: plan.tipoSlug } }] },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0];
    if (!tipo) fallar(`no está el tipo ${plan.tipoSlug}`);

    // 1. Las series del tipo, en el orden de WordPress.
    const series: SerieGuardada[] = [];
    for (const s of plan.series) {
      const imagen = s.foto ? await fotoEnMedia(s.foto) : idDe(tipo!.imagen);
      series.push({ nombre: s.nombre, imagen });
    }
    const antes: SerieGuardada[] = (tipo!.series ?? []).map((f) => ({
      nombre: f.nombre,
      imagen: idDe(f.imagen),
    }));
    const iguales = JSON.stringify(antes) === JSON.stringify(series);
    if (!manifiesto.tipos.some((t) => t.id === tipo!.id)) {
      manifiesto.tipos.push({ id: tipo!.id, slug: tipo!.slug, antes });
      guardarManifiesto();
    }
    if (!iguales && modo === "aplicar") {
      await payload.update({
        collection: "tipos-equipo",
        id: tipo!.id,
        data: { series },
        overrideAccess: true,
      });
    }
    log(
      `${plan.tipoSlug}: series ${series.map((s) => s.nombre).join(", ")}${iguales ? " (ya estaban)" : ""}`,
    );

    // 2. La serie de cada modelo, por el prefijo de su código.
    const modelos = (
      await payload.find({
        collection: "modelos-repuesto",
        where: { tipo: { equals: tipo!.id } },
        depth: 0,
        pagination: false,
        sort: "codigo",
        overrideAccess: true,
      })
    ).docs;
    const cuenta: Record<string, number> = {};
    for (const m of modelos) {
      const serie = serieHitachi(m.codigo);
      const clave = serie ?? "sin serie (Otros modelos)";
      cuenta[clave] = (cuenta[clave] ?? 0) + 1;
      if (!serie) log(`  ⚠ ${m.codigo ?? m.slug}: sin serie, irá a «Otros modelos»`);
      if (claveSerie(m.serie) === claveSerie(serie)) continue;
      if (!manifiesto.modelos.some((x) => x.id === m.id)) {
        manifiesto.modelos.push({ id: m.id, antes: m.serie ?? null });
        guardarManifiesto();
      }
      if (modo === "aplicar") {
        await payload.update({
          collection: "modelos-repuesto",
          id: m.id,
          data: { serie },
          overrideAccess: true,
        });
      }
    }
    resumen[plan.tipoSlug] = cuenta;
  }
  log(`modelos por serie: ${JSON.stringify(resumen)}`);
  log(
    modo === "simular"
      ? "SIMULACIÓN: no se ha escrito nada."
      : "APLICADO. Redesplegar para que el sitio lo muestre.",
  );
}
