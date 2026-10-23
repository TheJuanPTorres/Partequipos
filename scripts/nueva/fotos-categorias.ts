/**
 * FOTOS DE LAS TARJETAS DEL ÍNDICE DE TIPOS DE NUEVA (dirección, 2026-10-23): pone la
 * «Imagen de la tarjeta» (`categorias-maquinaria.imagen`) de las 8 categorías de
 * `/maquinaria-pesada/maquinaria-pesada-nueva/tipos/` con la MISMA foto de su tarjeta
 * en el índice de nueva de WordPress (el original de mayor tamaño, no la miniatura).
 *
 *   npm run preview:ejecutar -- payload run scripts/nueva/fotos-categorias.ts <modo> <destino>
 *
 *   modo:     simular | aplicar | retirar
 *   destino:  preview | produccion (solo dirección, con runbook)
 *
 * - Las fuentes están FUERA del repositorio (`Desktop/partequipos-cierre/fotos-tipos-nueva-fuentes.json`):
 *   el nombre de un fichero de WordPress puede llevar un código de inventario (§9).
 * - No pisa una imagen elegida por un editor: solo sustituye un campo vacío o una de
 *   las suyas (`wp-tipos-`). No borra ninguna imagen que ya estuviera en «Imágenes».
 * - Una foto de más de `LADO_MAXIMO` px se reduce a ese lado (misma proporción y formato):
 *   la de Retrocargadoras pesa 10 MB en WordPress.
 * - Idempotente. El manifiesto guarda la imagen de antes de cada categoría; la retirada
 *   la devuelve y borra solo las fotos que subió.
 * - NO refresca el sitio: después, `POST /api/revalidar/`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { formatoDeImagen, puedeSustituirImagen } from "../../src/lib/repuestos/wordpress";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[fotos-tipos] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!destino) fallar("indica el destino: preview o produccion");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino!, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[fotos-tipos]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTES = path.join(CIERRE, "fotos-tipos-nueva-fuentes.json");
const MANIFIESTO = path.join(CIERRE, `manifiesto-fotos-tipos-nueva-${destino}.json`);
const PREFIJO = "wp-tipos-";
const AGENTE = "Mozilla/5.0 (Partequipos; fotos de maquinaria nueva)";
const LADO_MAXIMO = 2400;

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
const log = (m: string) => process.stdout.write(`[fotos-tipos] ${m}\n`);

type Fuente = { slug: string; origen: string; url: string; fichero: string; alt: string };
type Manifiesto = {
  destino: string;
  categorias: { id: number; slug: string; antes: number | null }[];
  media: { id: number; filename: string; url: string }[];
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, categorias: [], media: [] };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};
const idDe = (v: unknown): number | null =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? idDe(v.id) : null;

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  for (const c of manifiesto.categorias) {
    await payload.update({
      collection: "categorias-maquinaria",
      id: c.id,
      data: { imagen: c.antes },
      overrideAccess: true,
    });
  }
  log(`categorías devueltas a su imagen de antes: ${manifiesto.categorias.length}`);
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
  log("RETIRADA COMPLETA. Después, POST /api/revalidar/.");
}

async function fotoEnMedia(f: Fuente): Promise<number | null> {
  const ya = await payload.find({
    collection: "media",
    where: { filename: { contains: f.fichero } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const hallada = ya.docs.find((d) => d.filename?.toLowerCase().startsWith(f.fichero));
  if (hallada) return hallada.id;
  const r = await fetch(f.url, { headers: { "User-Agent": AGENTE } });
  if (!r.ok) fallar(`no se puede descargar la foto de «${f.slug}»: HTTP ${r.status}`);
  const { default: sharp } = await import("sharp");
  let datos = Buffer.from(await r.arrayBuffer());
  const meta = await sharp(datos).metadata();
  const formato = formatoDeImagen(meta.format) ?? fallar(`${f.slug}: formato no admitido`);
  if (formato.convertir) datos = await sharp(datos).webp({ quality: 82 }).toBuffer();
  const lado = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (lado > LADO_MAXIMO) {
    const reducida = sharp(datos).rotate().resize(LADO_MAXIMO, LADO_MAXIMO, { fit: "inside" });
    datos = await (
      formato.ext === "jpg"
        ? reducida.jpeg({ quality: 85, mozjpeg: true })
        : formato.ext === "png"
          ? reducida.png()
          : reducida.webp({ quality: 82 })
    ).toBuffer();
  }
  const final = await sharp(datos).metadata();
  const nombre = `${f.fichero}.${formato.ext}`;
  log(
    `foto ${nombre}: ${meta.format}, ${meta.width}×${meta.height}` +
      (lado > LADO_MAXIMO ? ` → ${final.width}×${final.height}` : "") +
      `, ${Math.round(datos.length / 1024)} kB`,
  );
  if (modo === "simular") return null;
  const doc = await payload.create({
    collection: "media",
    data: { alt: f.alt, focalX: 50, focalY: 50 },
    file: { data: datos, mimetype: formato.mimetype, name: nombre, size: datos.length },
    overrideAccess: true,
  });
  const g = await payload.findByID({
    collection: "media",
    id: doc.id,
    depth: 0,
    overrideAccess: true,
  });
  manifiesto.media.push({ id: doc.id, filename: g.filename ?? nombre, url: g.url ?? "" });
  guardar();
  return doc.id;
}

async function aplicar(): Promise<void> {
  const fuentes = (JSON.parse(fs.readFileSync(FUENTES, "utf8")) as { categorias: Fuente[] })
    .categorias;
  let cambiadas = 0;
  for (const f of fuentes) {
    const cat = (
      await payload.find({
        collection: "categorias-maquinaria",
        where: { slug: { equals: f.slug } },
        depth: 1,
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0];
    if (!cat) fallar(`no está la categoría «${f.slug}»`);
    const actual = typeof cat!.imagen === "object" && cat!.imagen ? cat!.imagen : null;
    if (!puedeSustituirImagen(actual?.filename ?? null, PREFIJO)) {
      log(`${f.slug}: ya tiene una imagen elegida en el panel (${actual?.filename}): no se toca`);
      continue;
    }
    const id = await fotoEnMedia(f);
    if (id !== null && idDe(cat!.imagen) === id) {
      log(`${f.slug}: ya estaba`);
      continue;
    }
    cambiadas += 1;
    log(`${modo === "simular" ? "pondría" : "pone"} ${f.slug}: ${f.fichero} (${f.origen})`);
    if (!manifiesto.categorias.some((c) => c.id === cat!.id)) {
      manifiesto.categorias.push({ id: cat!.id, slug: f.slug, antes: idDe(cat!.imagen) });
      guardar();
    }
    if (modo === "aplicar") {
      await payload.update({
        collection: "categorias-maquinaria",
        id: cat!.id,
        data: { imagen: id },
        overrideAccess: true,
      });
    }
  }
  log(`${cambiadas} categorías por cambiar`);
  log(
    modo === "simular"
      ? "SIMULACIÓN: no se ha escrito nada."
      : "APLICADO. Después, POST /api/revalidar/.",
  );
}

if (modo === "retirar") await retirar();
else await aplicar();
process.exit(0);
