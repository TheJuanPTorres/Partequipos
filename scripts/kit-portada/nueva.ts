/**
 * «MAQUINARIA PESADA NUEVA» DEL KIT DE LA PORTADA (diseño del cliente, 2026-10-27): sube a
 * «Imágenes» la retroexcavadora Case Utility Plus y la foto de obra del fondo (ya optimizadas en
 * WebP) y las elige en la página «inicio» → «Maquinaria pesada nueva» (campos «Máquina de la
 * sección» y «Foto de obra del fondo»). Las tarjetas de marca no se tocan: salen de las marcas.
 *
 *   npm run preview:ejecutar -- npx payload run scripts/kit-portada/nueva.ts <modo> <destino>
 *
 *   modo:     simular | aplicar | retirar
 *   destino:  preview | produccion (solo dirección, con runbook)
 *
 * - Las imágenes están FUERA del repositorio: `Desktop/partequipos-diseno/portada-nueva/_optimizadas/`.
 * - Idempotente: una imagen ya subida (mismo nombre) no se vuelve a subir.
 * - El manifiesto guarda el valor de antes de los dos campos; la retirada lo devuelve y borra solo
 *   las imágenes que subió.
 * - NO refresca el sitio: después, `POST /api/revalidar/`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const args = process.argv.slice(2);
const MODOS = ["simular", "aplicar", "retirar"] as const;
const modo = args.find((a): a is (typeof MODOS)[number] =>
  (MODOS as readonly string[]).includes(a),
);
const simula = modo === "simular";
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[kit-nueva] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar(`indica el modo: ${MODOS.join(", ")}`);
if (!destino) fallar("indica el destino: preview o produccion");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino!, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
if (simula) process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[kit-nueva]");

const ESCRITORIO = path.join(os.homedir(), "Desktop");
const KIT = path.join(ESCRITORIO, "partequipos-diseno", "portada-nueva", "_optimizadas");
const MANIFIESTO = path.join(
  ESCRITORIO,
  "partequipos-cierre",
  `manifiesto-kit-nueva-${destino}.json`,
);
const PREFIJO = "kit-portada-";

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
const log = (m: string) => process.stdout.write(`[kit-nueva] ${m}\n`);

/** Las imágenes: campo de la sección, fichero optimizado y texto alternativo (descriptivo). */
const IMAGENES = [
  [
    "maquina",
    "nueva-retroexcavadora-case-utility-plus.webp",
    "Retroexcavadora Case Utility Plus de perfil, recortada sobre fondo transparente",
  ],
  [
    "fondo",
    "nueva-fondo-obra.webp",
    "Obra con montañas al fondo, el cielo fundido en blanco hacia la izquierda",
  ],
] as const;

type Manifiesto = {
  destino: string;
  /** Los dos campos de la sección tal como estaban. */
  antes: { maquina: number | null; fondo: number | null } | null;
  media: { id: number; filename: string; url: string }[];
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, antes: null, media: [] };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (!simula) fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};
const idDe = (v: unknown): number | null =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? idDe(v.id) : null;

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

/** Sube una imagen (o devuelve la ya subida con ese nombre). En simulación, `null`. */
async function subir(fichero: string, alt: string): Promise<number | null> {
  const nombre = `${PREFIJO}${fichero}`;
  const base = nombre.replace(/\.[a-z]+$/, "");
  const ya = await payload.find({
    collection: "media",
    where: { filename: { contains: base } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  // El nombre exacto, con o sin el sufijo aleatorio del Blob.
  const exacto = new RegExp(`^${base}(-[A-Za-z0-9]+)?[.]webp$`);
  const hallada = ya.docs.find((d) => exacto.test(d.filename ?? ""));
  if (hallada) return hallada.id;
  const ruta = path.join(KIT, fichero);
  if (!fs.existsSync(ruta)) fallar(`no está la imagen: ${ruta}`);
  const datos = fs.readFileSync(ruta);
  log(`sube ${nombre} (${Math.round(datos.length / 1024)} kB)`);
  if (simula) return null;
  const doc = await payload.create({
    collection: "media",
    data: { alt, focalX: 50, focalY: 50 },
    file: { data: datos, mimetype: "image/webp", name: nombre, size: datos.length },
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
  const inicio = await paginaInicio();
  const nueva = (inicio.seccionNueva ?? {}) as Record<string, unknown>;
  // El valor de antes, la primera vez (una segunda pasada no lo pisa).
  if (!manifiesto.antes) {
    manifiesto.antes = { maquina: idDe(nueva.maquina), fondo: idDe(nueva.fondo) };
    guardar();
  }
  const datos: Record<string, number | null> = {};
  for (const [campo, fichero, alt] of IMAGENES) datos[campo] = await subir(fichero, alt);
  if (!simula) {
    await payload.update({
      collection: "paginas",
      id: inicio.id,
      data: { seccionNueva: { ...nueva, ...datos } },
      overrideAccess: true,
    });
  }
  log(`${simula ? "pondría" : "pone"} la máquina y la foto de obra en «Maquinaria pesada nueva»`);
  log(simula ? "SIMULACIÓN: no se ha escrito nada." : "APLICADO. Después, POST /api/revalidar/.");
}

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  if (manifiesto.antes) {
    const inicio = await paginaInicio();
    await payload.update({
      collection: "paginas",
      id: inicio.id,
      data: { seccionNueva: { ...(inicio.seccionNueva ?? {}), ...manifiesto.antes } },
      overrideAccess: true,
    });
    log("«Maquinaria pesada nueva» devuelta a sus valores de antes");
  }
  for (const f of manifiesto.media) {
    await payload.delete({ collection: "media", id: f.id, overrideAccess: true }).catch(() => null);
  }
  const urls = manifiesto.media.map((f) => f.url).filter(Boolean);
  if (urls.length > 0) {
    log(`imágenes borradas: ${urls.length}; espero 70 s (propagación del Blob)`);
    await new Promise((r) => setTimeout(r, 70_000));
    const vivas: string[] = [];
    for (const u of urls) if ((await fetch(u, { method: "HEAD" })).status !== 404) vivas.push(u);
    if (vivas.length > 0) fallar(`siguen respondiendo en el Blob: ${vivas.join(", ")}`);
    log("las imágenes responden 404 en el Blob");
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Después, POST /api/revalidar/.");
}

if (modo === "retirar") await retirar();
else await aplicar();
process.exit(0);
