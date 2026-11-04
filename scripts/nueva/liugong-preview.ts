/**
 * LIUGONG SIN PÁGINA PROPIA, MUESTRA EN EL PREVIEW (2026-11-03, dirección, tarea 2a): crea la
 * marca de maquinaria nueva «LiuGong» con el «Enlace externo» a su distribuidor oficial
 * (https://maquitecno.co/) y su logo, y añade su fila a «Logos de marcas» de la página «inicio».
 *
 *   npm run preview:ejecutar -- npx payload run scripts/nueva/liugong-preview.ts <modo> preview
 *
 *   modo: simular | aplicar | retirar
 *   revalidar=<origen del preview>   opcional: vacía la caché de ese preview al terminar
 *
 * SOLO EL PREVIEW: en el sitio publicado lo hace dirección desde el panel (runbook). Este script
 * no tiene modo para otro destino a propósito.
 *
 * - El logo es el SVG del kit (`liugong-on-light.svg`, azul y naranja para fondo blanco), FUERA
 *   del repositorio; «Imágenes» no admite SVG, así que se rasteriza a PNG transparente con sharp.
 * - Idempotente: la marca o la imagen ya creadas por una pasada anterior no se repiten.
 * - El manifiesto guarda la lista de logos de antes; la retirada la devuelve tal cual y borra la
 *   marca y la imagen que creó. Una marca «liugong» que ya existiera NO se toca: el script para.
 * - NO refresca el sitio: después, `POST /api/revalidar/`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

const args = process.argv.slice(2);
const MODOS = ["simular", "aplicar", "retirar"] as const;
const modo = args.find((a): a is (typeof MODOS)[number] =>
  (MODOS as readonly string[]).includes(a),
);
const simula = modo === "simular";
const fallar = (m: string): never => {
  const e = new Error(`[liugong] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar(`indica el modo: ${MODOS.join(", ")}`);
if (!args.includes("preview")) fallar("este script solo trabaja en el preview: añade «preview»");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
const REVALIDAR = args.find((a) => a.startsWith("revalidar="))?.slice("revalidar=".length);
if (REVALIDAR && !origenDePreview(REVALIDAR)) fallar("`revalidar=` solo con la URL de un preview");
if (simula) process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[liugong]");

const ESCRITORIO = path.join(os.homedir(), "Desktop");
const SVG = path.join(
  ESCRITORIO,
  "partequipos-diseno",
  "portada-marcas-repuestos",
  "public",
  "partequipos",
  "brands",
  "liugong-on-light.svg",
);
const MANIFIESTO = path.join(ESCRITORIO, "partequipos-cierre", "manifiesto-liugong-preview.json");
const FICHERO = "marca-nueva-liugong-logo.png";
const NOMBRE = "LiuGong";
const SLUG = "liugong";
const ENLACE = "https://maquitecno.co/";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
if (simula) {
  for (const op of ["create", "update", "delete"] as const) {
    (payload as unknown as Record<string, unknown>)[op] = () =>
      fallar(`simulación: «${op}» no está permitido`);
  }
}
const log = (m: string) => process.stdout.write(`[liugong] ${m}\n`);

type FilaLogo = { id?: string | null; nombre: string; logo: number };
type Manifiesto = {
  /** Las filas de «Logos de marcas» tal como estaban (logo por id). */
  logosAntes: FilaLogo[] | null;
  marca: number | null;
  media: { id: number; filename: string; url: string } | null;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { logosAntes: null, marca: null, media: null };
const guardar = () => {
  if (!simula) fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};
const idDe = (x: unknown): number | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? idDe(x.id) : null;

async function paginaInicio() {
  const r = await payload.find({
    collection: "paginas",
    where: { slug: { equals: "inicio" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return r.docs[0] ?? fallar("no está la página «inicio»");
}

/** Solo informa: con la regla común del logo, el de la marca de repuestos del mismo nombre gana. */
async function avisoLogoRepuestos() {
  const r = await payload.find({
    collection: "marcas",
    where: { nombre: { like: "liugong" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const m = r.docs[0];
  if (!m) return log("no hay marca de repuestos «liugong»: se verá el logo del kit");
  log(
    idDe(m.logo)
      ? `la marca de repuestos «${m.nombre}» tiene logo (id ${idDe(m.logo)}): con la regla común, ESE es el que se pinta`
      : `la marca de repuestos «${m.nombre}» no tiene logo: se verá el del kit`,
  );
}

async function subirLogo(): Promise<number | null> {
  if (manifiesto.media) return manifiesto.media.id;
  if (!fs.existsSync(SVG)) fallar(`no está el SVG: ${SVG}`);
  // 571 × 105 en el SVG: a 1142 px de ancho (2×), transparente.
  const datos = await sharp(fs.readFileSync(SVG), { density: 144 })
    .resize({ width: 1142 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  log(`sube ${FICHERO} (${Math.round(datos.length / 1024)} kB, PNG desde el SVG del kit)`);
  if (simula) return null;
  const doc = await payload.create({
    collection: "media",
    data: { alt: "Logo de LiuGong", focalX: 50, focalY: 50 },
    file: { data: datos, mimetype: "image/png", name: FICHERO, size: datos.length },
    overrideAccess: true,
  });
  manifiesto.media = { id: doc.id, filename: doc.filename ?? FICHERO, url: doc.url ?? "" };
  guardar();
  return doc.id;
}

async function aplicar(): Promise<void> {
  await avisoLogoRepuestos();
  const inicio = await paginaInicio();
  const filas = (
    (inicio.seccionLogos?.logos ?? []) as { id?: string | null; nombre: string; logo: unknown }[]
  ).map((f) => ({
    id: f.id,
    nombre: f.nombre,
    logo: idDe(f.logo) ?? fallar(`fila «${f.nombre}» sin logo`),
  }));
  if (!manifiesto.logosAntes) {
    manifiesto.logosAntes = filas;
    guardar();
  }
  const ya = await payload.find({
    collection: "marcas-maquinaria",
    where: { slug: { equals: SLUG } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  if (ya.docs[0] && ya.docs[0].id !== manifiesto.marca) {
    fallar(
      `ya existe una marca de nueva «${SLUG}» (id ${ya.docs[0].id}) que no es de este script: no la toco`,
    );
  }
  const logo = await subirLogo();
  if (!ya.docs[0]) {
    log(`crea la marca de nueva «${NOMBRE}» con enlace externo ${ENLACE}`);
    if (!simula) {
      const m = await payload.create({
        collection: "marcas-maquinaria",
        data: { nombre: NOMBRE, slug: SLUG, enlaceExterno: ENLACE, logo, mostrarEnWeb: true },
        overrideAccess: true,
      });
      manifiesto.marca = m.id;
      guardar();
    }
  } else log(`la marca «${NOMBRE}» ya está (id ${ya.docs[0].id})`);
  if (filas.some((f) => f.nombre.trim().toLowerCase() === NOMBRE.toLowerCase())) {
    log("«Logos de marcas» ya tiene la fila de LiuGong");
  } else {
    log(`añade «${NOMBRE}» al final de «Logos de marcas» (${filas.length} → ${filas.length + 1})`);
    if (!simula) {
      await payload.update({
        collection: "paginas",
        id: inicio.id,
        data: {
          seccionLogos: {
            ...(inicio.seccionLogos ?? {}),
            logos: [...filas, { nombre: NOMBRE, logo: logo! }],
          },
        },
        overrideAccess: true,
      });
    }
  }
  log(simula ? "SIMULACIÓN: no se ha escrito nada." : "APLICADO. Después, POST /api/revalidar/.");
}

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  if (manifiesto.logosAntes) {
    const inicio = await paginaInicio();
    await payload.update({
      collection: "paginas",
      id: inicio.id,
      data: { seccionLogos: { ...(inicio.seccionLogos ?? {}), logos: manifiesto.logosAntes } },
      overrideAccess: true,
    });
    log(`«Logos de marcas» devuelta a sus ${manifiesto.logosAntes.length} filas de antes`);
  }
  if (manifiesto.marca) {
    await payload.delete({
      collection: "marcas-maquinaria",
      id: manifiesto.marca,
      overrideAccess: true,
    });
    log(`marca de nueva borrada (id ${manifiesto.marca})`);
  }
  if (manifiesto.media) {
    await payload.delete({ collection: "media", id: manifiesto.media.id, overrideAccess: true });
    log("imagen borrada; espero 70 s (propagación del Blob)");
    await new Promise((r) => setTimeout(r, 70_000));
    const st = (await fetch(manifiesto.media.url, { method: "HEAD" })).status;
    if (st !== 404)
      fallar(`la imagen sigue respondiendo ${st} en el Blob: ${manifiesto.media.url}`);
    log("la imagen responde 404 en el Blob");
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Después, POST /api/revalidar/.");
}

async function revalidar() {
  if (!REVALIDAR || simula) return;
  const token = process.env.REVALIDACION_TOKEN ?? "";
  if (!token) fallar("sin REVALIDACION_TOKEN del preview: no se revalida");
  const r = await fetchAlPreview(
    `${REVALIDAR.replace(/\/$/, "")}/api/revalidar/`,
    REVALIDAR,
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
    { method: "POST", headers: { [CABECERA_REVALIDACION]: token } },
  );
  log(`POST /api/revalidar/: HTTP ${r.status}`);
  if (r.status !== 200) fallar("la revalidación del preview no respondió 200");
}

if (modo === "retirar") await retirar();
else await aplicar();
await revalidar();
process.exit(0);
