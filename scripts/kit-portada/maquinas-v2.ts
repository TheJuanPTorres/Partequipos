/**
 * LAS DOS MÁQUINAS NUEVAS DE LA PORTADA (2026-10-27, diseños `portada-v2` del cliente): sube a
 * «Imágenes» el compactador Dynapac CA3500D y la miniexcavadora Yanmar ViO80 (ya optimizadas en
 * WebP, con la sombra de contacto del propio render) y las elige en la página «inicio»:
 *
 * - «Logos de marcas» → «Máquina»: el compactador Dynapac. La lista de logos NO se toca.
 * - «Venta de repuestos» → «Máquina»: la Yanmar ViO80.
 * - Los dos campos de REFLEJO quedan vacíos (el diseño nuevo no lleva reflejo ni sombras dibujadas).
 *
 *   npm run preview:ejecutar -- npx payload run scripts/kit-portada/maquinas-v2.ts <modo> <destino>
 *
 *   modo:     simular | aplicar | retirar
 *   destino:  preview | produccion (solo dirección, con runbook)
 *
 * - Las imágenes están FUERA del repositorio: `Desktop/partequipos-diseno/portada-v2/_optimizadas/`.
 * - Idempotente: una imagen ya subida (mismo nombre) no se vuelve a subir.
 * - El manifiesto guarda el valor de antes de cada campo; la retirada lo devuelve y borra solo las
 *   imágenes que subió (las del kit anterior, `kit-portada-*`, no se tocan).
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
  const e = new Error(`[maquinas-v2] ✗ ${m}`);
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
else exigirAlmacen("[maquinas-v2]");

const ESCRITORIO = path.join(os.homedir(), "Desktop");
const KIT = path.join(ESCRITORIO, "partequipos-diseno", "portada-v2", "_optimizadas");
const MANIFIESTO = path.join(
  ESCRITORIO,
  "partequipos-cierre",
  `manifiesto-portada-v2-maquinas-${destino}.json`,
);
const PREFIJO = "portada-v2-";

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
const log = (m: string) => process.stdout.write(`[maquinas-v2] ${m}\n`);

const DYNAPAC: [string, string] = [
  "marcas-compactador-dynapac-ca3500d.webp",
  "Compactador Dynapac CA3500D recortado sobre fondo transparente",
];
const YANMAR: [string, string] = [
  "repuestos-miniexcavadora-yanmar-vio80.webp",
  "Miniexcavadora Yanmar ViO80 recortada sobre fondo transparente",
];

type Manifiesto = {
  destino: string;
  /** Los campos de «inicio» tal como estaban. */
  antes: {
    logos: { maquina: number | null; maquinaReflejo: number | null };
    repuestos: { maquina: number | null; maquinaReflejo: number | null };
  } | null;
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

async function subir([fichero, alt]: [string, string]): Promise<number | null> {
  const nombre = `${PREFIJO}${fichero}`;
  const base = nombre.replace(/\.[a-z]+$/, "");
  const ya = await payload.find({
    collection: "media",
    where: { filename: { contains: base } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
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
  const repuestos = (inicio.seccionRepuestos ?? {}) as Record<string, unknown>;
  const logos = (inicio.seccionLogos ?? {}) as Record<string, unknown>;
  if (!manifiesto.antes) {
    manifiesto.antes = {
      logos: { maquina: idDe(logos.maquina), maquinaReflejo: idDe(logos.maquinaReflejo) },
      repuestos: {
        maquina: idDe(repuestos.maquina),
        maquinaReflejo: idDe(repuestos.maquinaReflejo),
      },
    };
    guardar();
  }
  const dynapac = await subir(DYNAPAC);
  const yanmar = await subir(YANMAR);
  if (modo === "aplicar") {
    await payload.update({
      collection: "paginas",
      id: inicio.id,
      data: {
        seccionLogos: { ...logos, maquina: dynapac, maquinaReflejo: null },
        seccionRepuestos: { ...repuestos, maquina: yanmar, maquinaReflejo: null },
      },
      overrideAccess: true,
    });
  }
  log(
    `${simula ? "pondría" : "pone"} la Dynapac en «Logos de marcas» y la Yanmar ViO80 en «Venta de repuestos» (sin reflejo)`,
  );
  log(simula ? "SIMULACIÓN: no se ha escrito nada." : "APLICADO. Después, POST /api/revalidar/.");
}

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO) || !manifiesto.antes) {
    fallar(`no hay manifiesto con los valores de antes (${MANIFIESTO})`);
  }
  const inicio = await paginaInicio();
  const antes = manifiesto.antes!;
  await payload.update({
    collection: "paginas",
    id: inicio.id,
    data: {
      seccionLogos: { ...(inicio.seccionLogos ?? {}), ...antes.logos },
      seccionRepuestos: { ...(inicio.seccionRepuestos ?? {}), ...antes.repuestos },
    },
    overrideAccess: true,
  });
  log("máquinas y reflejos devueltos a sus valores de antes");
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
