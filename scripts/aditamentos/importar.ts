/**
 * Importa los ADITAMENTOS de WordPress (2026-10-16, decisiones de dirección en
 * `docs/aditamentos-importacion.md`):
 *
 * - NUEVOS: las 12 tarjetas del catálogo de 2025 → `equipos-nuevos` de la marca
 *   «aditamentos», tipos «excavadoras» (4) y «minicargadores» (8), cada uno con
 *   su ficha V2 y su foto.
 * - USADOS: las 4 unidades de `…/aditamentos/aditamentos/` → `equipos-usados`
 *   en la categoría NUEVA «Aditamentos» (`/maquinaria-pesada/maquinaria-pesada-usada/aditamentos/`,
 *   aprobada por dirección), marcadas para la pestaña «Aditamentos» de la portada.
 *
 *   npm run preview:aditamentos:simular            # sin escribir nada
 *   npm run preview:aditamentos:simular -- fotos   # además, descarga las fotos y mide las repetidas
 *   npm run preview:aditamentos:importar
 *   npm run preview:aditamentos:retirar            # deshace EXACTAMENTE lo del manifiesto
 *
 * Mismo método que los usados (`scripts/usados/importar-usados.ts`):
 * idempotente, MANIFIESTO fuera del repositorio
 * (`Desktop/partequipos-cierre/manifiesto-aditamentos-<destino>.json`) y
 * RETIRADA EXACTA: borra lo que creó (fichas, unidades, fotos, marcas de usada
 * y la categoría) y comprueba que los ficheros salen del Blob. Lo que no creó no
 * lo toca nunca: si ya existe una ficha con la misma dirección, se avisa y se salta.
 *
 * FUENTE: el JSON de `scripts/aditamentos/extraer-xml.py`, fuera del
 * repositorio (`Desktop/partequipos-cierre/aditamentos-wordpress.json`, o
 * `fuente=<ruta>`). Sin seriales: el extractor no los saca.
 *
 * DESTINO validado antes de cargar Payload: `preview` solo con la base y el
 * Blob del preview; los otros destinos, con su base y su almacén (runbook).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import {
  NOMBRE_CATEGORIA_USADA_ADITAMENTOS,
  SLUG_CATEGORIA_USADA_ADITAMENTOS,
  SLUG_MARCA_ADITAMENTOS,
  altDeAditamento,
  datosDeTitulos,
  fichaDeUsado,
  fotosDistintas,
  nombreDeAditamentoNuevo,
  nombreDeAditamentoUsado,
  nombreDeFicheroAditamento,
  type HuellaFoto,
  type TipoAditamento,
} from "../../src/lib/aditamentos/wordpress";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { direccionesDeUnidades } from "../../src/lib/usados/direcciones";
import { fechaDeWordPress } from "../../src/lib/usados/wordpress";
import { formatSlug } from "../../src/lib/utils/formatSlug";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[aditamentos] ✗ ${m}`);
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
exigirAlmacen("[aditamentos]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "aditamentos-wordpress.json");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-aditamentos-${destino}.json`);
const COMPROBAR_FOTOS = args.includes("fotos");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const AGENTE = "Partequipos-migracion/1.0 (importador de aditamentos; solo lectura)";
const PAUSA_MS = 700;
const log = (m: string) => process.stdout.write(`[aditamentos] ${m}\n`);

// ---------- Manifiesto ----------

type Fichero = { id: number; filename: string; url: string };
type Manifiesto = {
  destino: string;
  creado: {
    nuevos: { clave: string; id: number }[];
    usados: { idWp: number; id: number }[];
    media: Fichero[];
    marcasUsada: number[];
    categorias: number[];
  };
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : {
      destino: destino!,
      creado: { nuevos: [], usados: [], media: [], marcasUsada: [], categorias: [] },
    };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
function guardarManifiesto() {
  if (modo !== "importar") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
}

// ---------- Retirada ----------

async function borrarTodos(
  coleccion: "equipos-usados" | "equipos-nuevos" | "marcas-usada" | "categorias-usada",
  ids: number[],
): Promise<number> {
  let n = 0;
  for (const id of ids) {
    const r = await payload
      .delete({ collection: coleccion, id, overrideAccess: true })
      .catch(() => null);
    if (r) n++;
  }
  return n;
}

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const c = manifiesto.creado;
  log(
    `unidades usadas borradas: ${await borrarTodos(
      "equipos-usados",
      c.usados.map((u) => u.id),
    )} de ${c.usados.length}`,
  );
  log(
    `fichas nuevas borradas: ${await borrarTodos(
      "equipos-nuevos",
      c.nuevos.map((u) => u.id),
    )} de ${c.nuevos.length}`,
  );
  const urls: string[] = [];
  for (const m of c.media) {
    const r = await payload
      .delete({ collection: "media", id: m.id, overrideAccess: true })
      .catch(() => null);
    if (r && m.url) urls.push(m.url);
  }
  log(`fotos borradas: ${urls.length} de ${c.media.length}`);
  log(
    `marcas de usada borradas: ${await borrarTodos("marcas-usada", c.marcasUsada)} de ${c.marcasUsada.length}`,
  );
  log(
    `categorías borradas: ${await borrarTodos("categorias-usada", c.categorias)} de ${c.categorias.length}`,
  );
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

if (modo === "retirar") {
  await retirar();
  process.exit(0);
}

// ---------- Red, con turno ----------

let ultima = 0;
async function descargar(url: string): Promise<Buffer> {
  const espera = ultima + PAUSA_MS - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultima = Date.now();
  const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!r.ok) fallar(`no se puede descargar una foto (HTTP ${r.status}): ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Huella visual: miniatura de 8 × 8 en grises, un bit por píxel (¿más claro que la media?). */
async function huella(clave: string, datos: Buffer): Promise<HuellaFoto> {
  const { width = 0, height = 0 } = await sharp(datos).metadata();
  const px = await sharp(datos).greyscale().resize(8, 8, { fit: "fill" }).raw().toBuffer();
  const media = px.reduce((a, b) => a + b, 0) / px.length;
  return { clave, bits: [...px].map((v) => (v > media ? 1 : 0)), pixeles: width * height };
}

// ---------- Plan (sin escrituras) ----------

type FotoWp = { idWp: number; url: string; alt: string };
type Fuente = {
  categoriaUsada: { enlace: string; metadesc: string; fechaGmt?: string };
  nuevos: { tipo: TipoAditamento; titulo: string; fotos: FotoWp[] }[];
  usados: { idWp: number; categoria: string; modelo: string; datos: string[]; fotos: FotoWp[] }[];
};
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE} (ver extraer-xml.py)`);
const fuente = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as Fuente;

type Foto = { url: string; fichero: string; alt: string };
const planNuevos = fuente.nuevos.map((n) => {
  const nombre = nombreDeAditamentoNuevo(n.titulo, n.tipo);
  const slug = formatSlug(nombre);
  const fotos = n.fotos.flatMap((f, i): Foto[] => {
    const fichero = nombreDeFicheroAditamento(f.url, f.idWp, nombre);
    return fichero
      ? [{ url: f.url, fichero, alt: altDeAditamento(nombre, i + 1, n.fotos.length) }]
      : [];
  });
  return { clave: `${n.tipo}/${slug}`, tipo: n.tipo, nombre, slug, fotos };
});

const baseUsados = fuente.usados.map((u) => {
  const titulos = datosDeTitulos(u.categoria, u.modelo);
  const ficha = fichaDeUsado(u.datos);
  return { u, titulos, ficha, nombre: nombreDeAditamentoUsado(titulos, ficha.anio) };
});
const direcciones = new Map(
  direccionesDeUnidades(
    baseUsados.map((b) => ({
      idWp: b.u.idWp,
      enlace: fuente.categoriaUsada.enlace,
      categoria: SLUG_CATEGORIA_USADA_ADITAMENTOS,
      nombre: b.nombre,
    })),
  ).map((d) => [d.idWp, d]),
);
const planUsados = baseUsados.map(({ u, titulos, ficha, nombre }) => ({
  idWp: u.idWp,
  nombre,
  slug: direcciones.get(u.idWp)!.slug,
  hacia: direcciones.get(u.idWp)!.hacia,
  marca: titulos.marca,
  modelo: titulos.modelo,
  ficha,
  candidatas: u.fotos.flatMap((f) => {
    const fichero = nombreDeFicheroAditamento(f.url, f.idWp, nombre);
    return fichero ? [{ url: f.url, fichero }] : [];
  }),
}));

log(`fuente: ${path.basename(FUENTE)}`);
for (const p of planNuevos) log(`nuevo  ${p.clave} · «${p.nombre}» · ${p.fotos.length} foto`);
for (const p of planUsados) {
  const f = p.ficha;
  log(
    `usado  ${p.idWp} · «${p.nombre}» → ${p.hacia}/ · marca ${p.marca ?? "—"} · ${f.pesoOperativo ?? "—"} t · año ${f.anio ?? "—"} · ${f.horometro ?? "—"} h · ${p.candidatas.length} fotos en WordPress`,
  );
  if (f.descripcion) log(`       descripción: ${f.descripcion}`);
}

// ---------- Lo que ya existe en el destino ----------

const marca = (
  await payload.find({
    collection: "marcas-maquinaria",
    where: { slug: { equals: SLUG_MARCA_ADITAMENTOS } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
).docs[0];
if (!marca) fallar(`no existe la marca de maquinaria nueva «${SLUG_MARCA_ADITAMENTOS}»`);
const tipos = new Map<string, number>();
for (const t of ["excavadoras", "minicargadores"]) {
  const r = await payload.find({
    collection: "tipos-maquinaria",
    where: { and: [{ marca: { equals: marca!.id } }, { slug: { equals: t } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  if (!r.docs[0]) fallar(`no existe el tipo «${t}» de la marca aditamentos`);
  tipos.set(t, r.docs[0]!.id);
}

/** Ficha nueva ya existente con esa dirección en su tipo (la cree o no esta importación). */
async function nuevoExistente(tipo: number, slug: string): Promise<number | null> {
  const r = await payload.find({
    collection: "equipos-nuevos",
    where: { and: [{ tipo: { equals: tipo } }, { slug: { equals: slug } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return r.docs[0]?.id ?? null;
}

async function porSlug(
  coleccion: "categorias-usada" | "marcas-usada",
  slug: string,
): Promise<number | null> {
  const r = await payload.find({
    collection: coleccion,
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return r.docs[0]?.id ?? null;
}

const nuestrosNuevos = new Map(manifiesto.creado.nuevos.map((n) => [n.clave, n.id]));
const choques: string[] = [];
for (const p of planNuevos) {
  const id = await nuevoExistente(tipos.get(p.tipo)!, p.slug);
  if (id && nuestrosNuevos.get(p.clave) !== id) choques.push(`${p.clave} (ficha ${id})`);
}
for (const c of choques)
  log(`aviso: ya hay una ficha que no creó esta importación en ${c}; se salta`);

// ---------- Simulación ----------

if (modo === "simular") {
  const cat = await porSlug("categorias-usada", SLUG_CATEGORIA_USADA_ADITAMENTOS);
  log(
    `categoría de usada «${SLUG_CATEGORIA_USADA_ADITAMENTOS}»: ${cat ? `ya existe (id ${cat})` : "se CREARÍA"}`,
  );
  for (const m of new Set(planUsados.flatMap((p) => (p.marca ? [p.marca] : [])))) {
    const id = await porSlug("marcas-usada", formatSlug(m));
    log(`marca de usada «${m}»: ${id ? `ya existe (id ${id})` : "se CREARÍA"}`);
  }
  if (COMPROBAR_FOTOS) {
    let total = 0;
    let bytes = 0;
    for (const p of planUsados) {
      const huellas: HuellaFoto[] = [];
      for (const c of p.candidatas) {
        const d = await descargar(c.url);
        bytes += d.length;
        huellas.push(await huella(c.fichero, d));
      }
      const quedan = fotosDistintas(huellas);
      total += quedan.length;
      log(`fotos de ${p.idWp}: ${p.candidatas.length} en WordPress → ${quedan.length} distintas`);
    }
    for (const p of planNuevos) for (const f of p.fotos) bytes += (await descargar(f.url)).length;
    log(
      `fotos a subir: ${total + planNuevos.reduce((a, p) => a + p.fotos.length, 0)} · descargado: ${(bytes / 1e6).toFixed(1)} MB`,
    );
  }
  log("simulación terminada: no se ha escrito nada");
  process.exit(0);
}

// ---------- Importación ----------

/** La foto ya subida (por el id del adjunto); si no, se sube. */
async function fotoAMedia(f: Foto, datos?: Buffer): Promise<number> {
  const prefijo = f.fichero.match(/^wp-aditamento-\d+-/)![0];
  const r = await payload.find({
    collection: "media",
    where: { filename: { contains: prefijo } },
    sort: "createdAt",
    depth: 0,
    limit: 5,
    overrideAccess: true,
  });
  const ya = r.docs.find((x) => x.filename?.toLowerCase().startsWith(prefijo));
  if (ya) return ya.id;
  const buf = datos ?? (await descargar(f.url));
  const ext = f.fichero.split(".").pop();
  const doc = await payload.create({
    collection: "media",
    data: { alt: f.alt, focalX: 50, focalY: 50 },
    file: {
      data: buf,
      mimetype: ext === "jpg" ? "image/jpeg" : `image/${ext}`,
      name: f.fichero,
      size: buf.length,
    },
    overrideAccess: true,
  });
  const d = await payload.findByID({
    collection: "media",
    id: doc.id,
    depth: 0,
    overrideAccess: true,
  });
  manifiesto.creado.media.push({ id: doc.id, filename: d.filename ?? f.fichero, url: d.url ?? "" });
  guardarManifiesto();
  return doc.id;
}

// Categoría «Aditamentos» de usada.
let idCategoria = await porSlug("categorias-usada", SLUG_CATEGORIA_USADA_ADITAMENTOS);
if (!idCategoria) {
  const doc = await payload.create({
    collection: "categorias-usada",
    data: {
      nombre: NOMBRE_CATEGORIA_USADA_ADITAMENTOS,
      slug: SLUG_CATEGORIA_USADA_ADITAMENTOS,
      descripcion: fuente.categoriaUsada.metadesc || null,
    },
    overrideAccess: true,
  });
  idCategoria = doc.id;
  manifiesto.creado.categorias.push(doc.id);
  guardarManifiesto();
  log(`categoría de usada «${SLUG_CATEGORIA_USADA_ADITAMENTOS}» creada (id ${doc.id})`);
}

// Marcas de usada: se buscan o se crean AQUÍ (y no en el gancho de la unidad) para que la retirada las conozca.
const idMarca = new Map<string, number>();
for (const m of new Set(planUsados.flatMap((p) => (p.marca ? [p.marca] : [])))) {
  let id = await porSlug("marcas-usada", formatSlug(m));
  if (!id) {
    const doc = await payload.create({
      collection: "marcas-usada",
      data: { nombre: m, slug: formatSlug(m) },
      overrideAccess: true,
    });
    id = doc.id;
    manifiesto.creado.marcasUsada.push(id);
    guardarManifiesto();
    log(`marca de usada «${m}» creada (id ${id})`);
  }
  idMarca.set(m, id);
}

// Nuevos.
for (const p of planNuevos) {
  const tipo = tipos.get(p.tipo)!;
  const nuestro = nuestrosNuevos.get(p.clave);
  const existente = await nuevoExistente(tipo, p.slug);
  if (existente && existente !== nuestro) continue; // aviso ya dado: no se pisa lo ajeno
  const imagenes: number[] = [];
  for (const f of p.fotos) imagenes.push(await fotoAMedia(f));
  const data = { nombre: p.nombre, slug: p.slug, marca: marca!.id, tipo, imagenes };
  if (existente) {
    await payload.update({
      collection: "equipos-nuevos",
      id: existente,
      data,
      overrideAccess: true,
    });
    log(`nuevo actualizado ${p.clave} → ${existente}`);
  } else {
    const doc = await payload.create({ collection: "equipos-nuevos", data, overrideAccess: true });
    manifiesto.creado.nuevos.push({ clave: p.clave, id: doc.id });
    guardarManifiesto();
    log(`nuevo creado ${p.clave} → ${doc.id}: «${p.nombre}»`);
  }
}

// Usados.
for (const p of planUsados) {
  // Las fotos repetidas del carrusel se descartan antes de subir.
  const datos = new Map<string, Buffer>();
  const huellas: HuellaFoto[] = [];
  for (const c of p.candidatas) {
    const d = await descargar(c.url);
    datos.set(c.fichero, d);
    huellas.push(await huella(c.fichero, d));
  }
  const quedan = fotosDistintas(huellas);
  const imagenes: number[] = [];
  for (const [i, fichero] of quedan.entries()) {
    const c = p.candidatas.find((x) => x.fichero === fichero)!;
    imagenes.push(
      await fotoAMedia(
        { url: c.url, fichero, alt: altDeAditamento(p.nombre, i + 1, quedan.length) },
        datos.get(fichero),
      ),
    );
  }
  const data = {
    nombre: p.nombre,
    categoria: idCategoria,
    ...(p.marca ? { marcaUsada: idMarca.get(p.marca)! } : {}),
    modelo: p.modelo,
    anio: p.ficha.anio,
    horometro: p.ficha.horometro,
    pesoOperativo: p.ficha.pesoOperativo,
    descripcion: p.ficha.descripcion,
    // Fecha original de la página que las lista (WordPress no tiene la de cada unidad).
    ...(fechaDeWordPress(fuente.categoriaUsada.fechaGmt)
      ? { fechaPublicacion: fechaDeWordPress(fuente.categoriaUsada.fechaGmt)! }
      : {}),
    imagenes,
    disponible: true,
    pestanaPortada: "aditamentos" as const,
  };
  const nuestro = manifiesto.creado.usados.find((u) => u.idWp === p.idWp)?.id;
  const existe = nuestro
    ? await payload
        .findByID({ collection: "equipos-usados", id: nuestro, depth: 0, overrideAccess: true })
        .catch(() => null)
    : null;
  if (existe) {
    // Editando no se cambia la dirección web: ya puede tener enlaces.
    await payload.update({
      collection: "equipos-usados",
      id: existe.id,
      data,
      overrideAccess: true,
    });
    if (existe.slug !== p.slug)
      log(`aviso: ${p.idWp} conserva su dirección «${existe.slug}» (el plan da «${p.slug}»)`);
    log(`usado actualizado ${p.idWp} → ${existe.id} (${imagenes.length} fotos)`);
  } else {
    const doc = await payload.create({
      collection: "equipos-usados",
      data: { ...data, slug: p.slug },
      overrideAccess: true,
    });
    manifiesto.creado.usados = manifiesto.creado.usados.filter((u) => u.idWp !== p.idWp);
    manifiesto.creado.usados.push({ idWp: p.idWp, id: doc.id });
    guardarManifiesto();
    log(
      `usado creado ${p.idWp} → ${doc.id}: «${p.nombre}» en ${p.hacia}/ (${imagenes.length} fotos)`,
    );
  }
}

const c = manifiesto.creado;
log(
  `terminado · en el manifiesto: ${c.nuevos.length} nuevos, ${c.usados.length} usados, ${c.media.length} fotos, ${c.marcasUsada.length} marcas de usada, ${c.categorias.length} categorías`,
);
log("el sitio desplegado no se refresca solo con un script: redesplegar después");
process.exit(0);
