/**
 * FOTOS DE PRODUCTO DE LUBRICANTES CON EL MISMO FORMATO (2026-10-22, dirección).
 *
 * Rehace la «Foto del producto» de cada producto de las líneas de lubricante: recorta el fondo
 * (transparente o casi blanco) y centra la botella en un lienzo blanco cuadrado de
 * `LADO_LIENZO` px, ocupando `FRACCION_CONTENIDO` del lado (`src/lib/lubricantes/fotoUniforme.ts`).
 * Sube cada foto NUEVA a «Imágenes» (WebP, mismo texto alternativo) y la pone en los productos
 * que usaban la original. Las originales NO se borran: la retirada vuelve a ellas.
 *
 *      npm run preview:ejecutar -- payload run scripts/lubricantes/fotos-uniformes.ts preview simular
 *      npm run preview:ejecutar -- payload run scripts/lubricantes/fotos-uniformes.ts preview
 *      npm run preview:ejecutar -- payload run scripts/lubricantes/fotos-uniformes.ts retirar preview
 *
 * `simular` enseña lo que haría sin escribir nada. Se puede relanzar: lo ya hecho (en el
 * manifiesto) se reutiliza. Una foto elegida a mano en el panel después de la pasada no se pisa:
 * solo se cambia la que sigue siendo la ORIGINAL del manifiesto.
 *
 * MANIFIESTO fuera del repositorio:
 * `Desktop/partequipos-cierre/manifiesto-lubricantes-fotos-<destino>.json`.
 * Destinos: `preview` (con la guarda del hero de prueba) o `produccion` (por runbook de dirección,
 * con la guarda de destino y del almacén). El script corre fuera de Next y no revalida: al
 * terminar, `POST /api/revalidar/`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import {
  cajaDelContenido,
  encajeEnLienzo,
  FRACCION_CONTENIDO,
  LADO_LIENZO,
} from "../../src/lib/lubricantes/fotoUniforme";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const retirarModo = args.includes("retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const simular = args.includes("simular");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  // `payload run` sale con 0 tras el import: para fallar, hay que lanzar (CLAUDE.md §10.25).
  const e = new Error(`[fotos-lubricantes] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!destino) fallar("indica el destino: preview o produccion");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[fotos-lubricantes]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-lubricantes-fotos-${destino}.json`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[fotos-lubricantes] ${m}\n`);

// ---------- Manifiesto ----------

type Manifiesto = {
  destino: string;
  /** Por foto original: la nueva subida. */
  fotos: { original: number; nueva: number; filename: string; url: string }[];
  /** Por producto cambiado: su línea, su fila y la foto de antes. */
  productos: { linea: number; fila: string; antes: number }[];
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, fotos: [], productos: [] };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
function guardarManifiesto() {
  if (simular) return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
}

const idDe = (v: unknown): number | null =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? Number(v.id) : null;

// ---------- Rehacer una foto ----------

/** La foto rehecha: recorta el fondo y centra el contenido en el lienzo blanco. */
async function rehacer(buf: Buffer): Promise<{ webp: Buffer; info: string }> {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const caja = cajaDelContenido(data, info.width, info.height, info.channels);
  if (!caja) fallar("la imagen es toda fondo");
  const encaje = encajeEnLienzo(caja!);
  const botella = await sharp(buf)
    .extract({ left: caja!.x, top: caja!.y, width: caja!.ancho, height: caja!.alto })
    .flatten({ background: "#ffffff" })
    .resize(encaje.ancho, encaje.alto, { fit: "fill", kernel: "lanczos3" })
    .toBuffer();
  const webp = await sharp({
    create: {
      width: LADO_LIENZO,
      height: LADO_LIENZO,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([{ input: botella, left: encaje.x, top: encaje.y }])
    .webp({ quality: 86 })
    .toBuffer();
  const escala = encaje.alto / caja!.alto;
  return {
    webp,
    info: `${info.width}×${info.height}, contenido ${caja!.ancho}×${caja!.alto} → ${encaje.ancho}×${encaje.alto}${escala > 1.5 ? ` (ampliada ×${escala.toFixed(1)})` : ""}`,
  };
}

// ---------- Pasada ----------

async function pasada(): Promise<void> {
  const lineas = (
    await payload.find({
      collection: "categorias-lubricante",
      depth: 0,
      limit: 0,
      overrideAccess: true,
    })
  ).docs;
  // Fotos originales en uso: las del manifiesto (ya rehechas) se excluyen.
  const nuevas = new Set(manifiesto.fotos.map((f) => f.nueva));
  const originales = new Set<number>();
  for (const l of lineas) {
    for (const p of l.productos ?? []) {
      const id = idDe(p.imagen);
      if (id && !nuevas.has(id)) originales.add(id);
    }
  }
  const pendientes = [...originales].filter(
    (id) => !manifiesto.fotos.some((f) => f.original === id),
  );
  log(
    `${lineas.length} líneas; ${originales.size} fotos originales en uso; ${pendientes.length} por rehacer (lienzo ${LADO_LIENZO} px, contenido ${Math.round(FRACCION_CONTENIDO * 100)} %)${simular ? " (simulación)" : ""}`,
  );

  // En la simulación no se sube nada: cuentan como rehechas para el recuento final.
  const simuladas = new Map<number, number>();
  for (const id of pendientes) {
    const media = await payload.findByID({
      collection: "media",
      id,
      depth: 0,
      overrideAccess: true,
    });
    if (!media.url) fallar(`la imagen ${id} no tiene URL`);
    const respuesta = await fetch(media.url!);
    if (!respuesta.ok) fallar(`la imagen ${id} responde ${respuesta.status}`);
    const { webp, info } = await rehacer(Buffer.from(await respuesta.arrayBuffer()));
    // Sin el sufijo aleatorio que el Blob puso al fichero («-AbC…» de 30 caracteres).
    const base = path
      .basename(media.filename ?? `imagen-${id}`)
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/-[A-Za-z0-9]{30}$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60)
      .replace(/-$/, "");
    const nombre = `lub-uniforme-${base}.webp`;
    log(`  imagen ${id} «${media.filename}»: ${info}`);
    if (simular) {
      simuladas.set(id, -1);
      continue;
    }
    const creada = await payload.create({
      collection: "media",
      data: { alt: media.alt, focalX: 50, focalY: 50 },
      file: { data: webp, mimetype: "image/webp", name: nombre, size: webp.length },
      overrideAccess: true,
    });
    // La URL, leída después de crear: la que devuelve `create` no lleva el sufijo del Blob.
    const guardada = await payload.findByID({
      collection: "media",
      id: creada.id,
      depth: 0,
      overrideAccess: true,
    });
    manifiesto.fotos.push({
      original: id,
      nueva: creada.id,
      filename: guardada.filename ?? nombre,
      url: guardada.url ?? "",
    });
    guardarManifiesto();
    log(`    → media ${creada.id} (${Math.round(webp.length / 1024)} KB)`);
  }

  // Poner las nuevas en los productos que siguen con la ORIGINAL.
  const nuevaDe = new Map([
    ...manifiesto.fotos.map((f) => [f.original, f.nueva] as const),
    ...simuladas,
  ]);
  let cambiados = 0;
  for (const l of lineas) {
    let cambio = false;
    const productos = (l.productos ?? []).map((p) => {
      const id = idDe(p.imagen);
      const nueva = id ? nuevaDe.get(id) : undefined;
      if (!id || !nueva || !p.id) return p;
      cambio = true;
      cambiados++;
      if (!manifiesto.productos.some((m) => m.linea === l.id && m.fila === p.id)) {
        manifiesto.productos.push({ linea: l.id, fila: p.id, antes: id });
      }
      return { ...p, imagen: nueva };
    });
    if (!cambio || simular) continue;
    guardarManifiesto();
    await payload.update({
      collection: "categorias-lubricante",
      id: l.id,
      data: { productos } as never,
      overrideAccess: true,
    });
    log(`  línea «${l.nombre}»: fotos cambiadas`);
  }
  log(
    `✓ ${cambiados} productos ${simular ? "cambiarían" : "cambiados"} de foto; ${manifiesto.fotos.length} fotos rehechas en el manifiesto`,
  );
}

// ---------- Retirada ----------

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const porLinea = new Map<number, Map<string, number>>();
  for (const m of manifiesto.productos) {
    if (!porLinea.has(m.linea)) porLinea.set(m.linea, new Map());
    porLinea.get(m.linea)!.set(m.fila, m.antes);
  }
  const nuevas = new Map(manifiesto.fotos.map((f) => [f.nueva, f.original]));
  for (const [lineaId, filas] of porLinea) {
    const linea = await payload
      .findByID({
        collection: "categorias-lubricante",
        id: lineaId,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null);
    if (!linea) continue;
    let n = 0;
    const productos = (linea.productos ?? []).map((p) => {
      const antes = p.id ? filas.get(p.id) : undefined;
      // Solo se devuelve si sigue con la foto que puso este script (no pisa lo elegido después).
      if (antes === undefined || !nuevas.has(idDe(p.imagen) ?? -1)) return p;
      n++;
      return { ...p, imagen: antes };
    });
    if (!simular && n) {
      await payload.update({
        collection: "categorias-lubricante",
        id: lineaId,
        data: { productos } as never,
        overrideAccess: true,
      });
    }
    log(`línea «${linea.nombre}»: ${n} productos devueltos a su foto original`);
  }
  const urls: string[] = [];
  for (const f of manifiesto.fotos) {
    const r = simular
      ? null
      : await payload
          .delete({ collection: "media", id: f.nueva, overrideAccess: true })
          .catch(() => null);
    if (r && f.url) urls.push(f.url);
  }
  log(`${manifiesto.fotos.length} fotos rehechas a borrar`);
  if (simular) return;
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("manifiesto retirado; espero 70 s (propagación del Blob)");
  await new Promise((r) => setTimeout(r, 70_000));
  let vivos = [...urls];
  for (let intento = 0; ; intento++) {
    const quedan: string[] = [];
    for (const u of vivos) if ((await fetch(u, { method: "HEAD" })).status !== 404) quedan.push(u);
    vivos = quedan;
    if (!vivos.length || intento === 3) break;
    log(`${vivos.length} ficheros aún responden; vuelvo a mirar en 30 s`);
    await new Promise((r) => setTimeout(r, 30_000));
  }
  if (vivos.length) fallar(`${vivos.length} ficheros siguen en el Blob: ${vivos.join(" ")}`);
  log(`✓ los ${urls.length} ficheros dan 404`);
}

if (retirarModo) await retirar();
else await pasada();
