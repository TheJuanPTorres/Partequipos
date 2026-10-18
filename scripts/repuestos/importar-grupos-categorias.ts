/**
 * «QUÉ INCLUYE» DE LAS 10 CATEGORÍAS TÉCNICAS DE REPUESTOS, desde la web original
 * de WordPress (dirección, 2026-10-18; auditoría de B, puntos 7 y 17). Estudio y
 * decisiones: `docs/repuestos-importacion.md` §8.
 *
 *   npm run preview:grupos-categorias:simular    # no escribe nada: dice qué cambiaría y cuántas subidas
 *   npm run preview:grupos-categorias:importar   # sube las fotos y escribe los grupos
 *   npm run preview:grupos-categorias:retirar    # deshace EXACTAMENTE lo del manifiesto
 *
 * Qué toca, y nada más: el campo «Qué incluye» (`grupos`) de las 10 categorías
 * técnicas, y las fotos de los grupos en «Imágenes» (`wp-grupo-…`).
 *
 * NO pisa lo del panel: una categoría que ya tiene grupos y no son los que escribió
 * esta misma importación se deja como está (`accionGrupos`). Volver a ejecutar no
 * duplica nada: las fotos ya subidas se reconocen por su nombre.
 *
 * Como los demás importadores: MANIFIESTO fuera del repositorio
 * (`manifiesto-grupos-categorias-<destino>.json`) con lo creado y el valor de ANTES
 * de lo cambiado, y RETIRADA EXACTA. Doble cierre en la simulación: sin token del
 * Blob y con `create`/`update`/`delete` de Payload que lanzan un error.
 *
 * FUENTE, fuera del repositorio (`Desktop/partequipos-cierre/categorias-grupos-wordpress.json`,
 * o `fuente=<ruta>`): lo que saca `scripts/repuestos/extraer-categorias-grupos.py` del XML.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import {
  accionGrupos,
  ficheroGrupo,
  firmaDeGrupos,
  type FuenteGrupos,
  type GrupoEscrito,
  PREFIJO_GRUPO,
} from "../../src/lib/repuestos/gruposImportacion";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[grupos] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, importar o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[grupos]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "categorias-grupos-wordpress.json");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-grupos-categorias-${destino}.json`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
if (modo === "simular") {
  for (const op of ["create", "update", "delete", "updateGlobal"] as const) {
    (payload as unknown as Record<string, unknown>)[op] = () =>
      fallar(`simulación: «${op}» no está permitido`);
  }
}
const log = (m: string) => process.stdout.write(`[grupos] ${m}\n`);

type Id = number;
type Doc = Record<string, unknown> & { id: Id };
const idDe = (x: unknown): Id | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;

// ---------- Manifiesto ----------

type Manifiesto = {
  destino: string;
  inicio: string;
  creado: { media: { id: Id; url: string; fichero: string }[] };
  /** Por id de categoría: sus grupos de ANTES (con la foto como id y sin `id` de fila). */
  antes: Record<string, GrupoEscrito[]>;
  /** Por id de categoría: la huella de lo que escribió la importación. */
  escrito: Record<string, string>;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : {
      destino: destino!,
      inicio: new Date().toISOString(),
      creado: { media: [] },
      antes: {},
      escrito: {},
    };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
const guardar = () => {
  if (modo === "simular") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

/** Los grupos de una categoría como se vuelven a guardar: fotos como id y filas sin `id`. */
const gruposComoDatos = (filas: unknown): GrupoEscrito[] =>
  Array.isArray(filas)
    ? filas.map((g) => {
        const f = g as Record<string, unknown>;
        return {
          nombre: String(f.nombre ?? ""),
          mostrar: f.mostrar !== false,
          imagen: idDe(f.imagen),
          productos: (Array.isArray(f.productos) ? f.productos : []).map((p) => ({
            texto: String((p as Record<string, unknown>).texto ?? ""),
          })),
        };
      })
    : [];

// ================================================================== RETIRAR
if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  for (const [id, grupos] of Object.entries(manifiesto.antes)) {
    await payload.update({
      collection: "categorias-tecnicas",
      id: Number(id),
      data: { grupos } as never,
      overrideAccess: true,
    });
  }
  log(`categorías devueltas a su valor de antes: ${Object.keys(manifiesto.antes).length}`);
  const urls: string[] = [];
  for (const m of manifiesto.creado.media) {
    const r = await payload
      .delete({ collection: "media", id: m.id, overrideAccess: true })
      .catch(() => null);
    if (r && m.url) urls.push(m.url);
  }
  log(`fotos creadas y borradas: ${urls.length} de ${manifiesto.creado.media.length}`);
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
  log(`✓ RETIRADA COMPLETA: los ${urls.length} ficheros dan 404`);
  process.exit(0);
}

// ================================================================== SIMULAR / IMPORTAR
if (!fs.existsSync(FUENTE))
  fallar(`no está la fuente ${FUENTE} (ver extraer-categorias-grupos.py)`);
const fuente = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as FuenteGrupos;

const categorias = (
  await payload.find({
    collection: "categorias-tecnicas",
    where: { slug: { in: fuente.categorias.map((c) => c.slug) } },
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })
).docs as unknown as Doc[];
for (const c of fuente.categorias)
  if (!categorias.some((x) => x.slug === c.slug))
    fallar(`no existe la categoría «${c.slug}» en el destino`);

// Fotos ya subidas por una pasada anterior (el Blob añade un sufijo aleatorio).
const ya = new Map(
  (
    await payload.find({
      collection: "media",
      where: { filename: { like: PREFIJO_GRUPO } },
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
    })
  ).docs
    .filter((d) => (d.filename ?? "").startsWith(PREFIJO_GRUPO))
    .map((d) => [d.filename ?? "", d.id]),
);

const AGENTE = "Partequipos-migracion/1.0 (importador de grupos de categorías; solo lectura)";
let ultima = 0;
async function descargar(url: string): Promise<{ datos: Buffer; tipo: string }> {
  const espera = ultima + 700 - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultima = Date.now();
  const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!r.ok) throw new Error(`HTTP ${r.status} al descargar ${url}`);
  return { datos: Buffer.from(await r.arrayBuffer()), tipo: r.headers.get("content-type") ?? "" };
}

const idsPorUrl = new Map<string, Id>();
let subidas = 0;
let yaEnElAlmacen = 0;
async function foto(
  slug: string,
  posicion: number,
  img: { url: string; alt: string },
): Promise<Id | null> {
  const conocida = idsPorUrl.get(img.url);
  if (conocida !== undefined) return conocida;
  const fichero = ficheroGrupo(slug, posicion, img.url);
  const base = fichero.replace(/\.\w+$/, "");
  const previo = [...ya.entries()].find(([f]) => f === fichero || f.startsWith(`${base}-`));
  if (previo) {
    yaEnElAlmacen++;
    idsPorUrl.set(img.url, previo[1]);
    return previo[1];
  }
  subidas++;
  if (modo === "simular") {
    idsPorUrl.set(img.url, -1);
    return -1;
  }
  const { datos, tipo } = await descargar(img.url);
  const doc = await payload.create({
    collection: "media",
    data: { alt: img.alt },
    file: {
      data: datos,
      mimetype: tipo.split(";")[0] || "image/jpeg",
      name: fichero,
      size: datos.length,
    },
    overrideAccess: true,
  });
  manifiesto.creado.media.push({ id: doc.id, url: doc.url ?? "", fichero });
  guardar();
  idsPorUrl.set(img.url, doc.id);
  log(`subida ${fichero} → media ${doc.id}`);
  return doc.id;
}

const resumen: Record<string, string> = {};
let escritas = 0;
for (const c of fuente.categorias) {
  const doc = categorias.find((x) => x.slug === c.slug)!;
  const actual = gruposComoDatos(doc.grupos);
  const accion = accionGrupos(
    actual.map((g) => ({ nombre: g.nombre, productos: g.productos })),
    manifiesto.escrito[String(doc.id)] ?? null,
  );
  const productos = c.grupos.reduce((n, g) => n + g.productos.length, 0);
  if (accion === "conservar") {
    resumen[c.slug] = `se conserva lo del panel (${actual.length} grupos)`;
    continue;
  }
  const grupos: GrupoEscrito[] = [];
  for (const [i, g] of c.grupos.entries()) {
    grupos.push({
      nombre: g.nombre,
      mostrar: g.mostrar,
      imagen: await foto(c.slug, i, g.imagen),
      productos: g.productos.map((texto) => ({ texto })),
    });
  }
  resumen[c.slug] = `${grupos.length} grupos · ${productos} productos`;
  if (modo === "simular") continue;
  if (!(String(doc.id) in manifiesto.antes)) {
    manifiesto.antes[String(doc.id)] = actual;
    guardar();
  }
  await payload.update({
    collection: "categorias-tecnicas",
    id: doc.id,
    data: { grupos } as never,
    overrideAccess: true,
  });
  manifiesto.escrito[String(doc.id)] = firmaDeGrupos(grupos);
  guardar();
  escritas++;
  log(`${c.slug}: ${resumen[c.slug]}`);
}

if (modo === "simular") {
  process.stdout.write(
    JSON.stringify(
      {
        destino,
        subidasBlob: subidas,
        yaEnElAlmacen,
        categorias: resumen,
        avisosDeLaFuente: (fuente as { avisos?: string[] }).avisos ?? [],
      },
      null,
      2,
    ) + "\n",
  );
} else {
  log(`✓ QUÉ INCLUYE APLICADO · ${escritas} categorías · ${subidas} subidas al Blob`);
}
process.exit(0);
