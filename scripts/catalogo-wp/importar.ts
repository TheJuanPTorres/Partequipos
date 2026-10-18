/**
 * Importa las TARJETAS SUELTAS del catálogo de WordPress, tal como están
 * (2026-10-18, decisión del cliente: «se migra TODO aunque esté mal»). Detalle
 * y decisiones: `docs/catalogo-wp-tal-cual.md`.
 *
 * - Cargadores CASE W20F, 621E y 821E → `equipos-nuevos`, tipo NUEVO
 *   «Cargadores» de Case, que entra en la categoría «Cargadores» de nueva.
 * - Vibrocompactadores Ammann (6) → marca NUEVA «Ammann», tipo
 *   «Vibrocompactadores», que entra en la categoría «Compactadores».
 * - Aditamentos de 2022 que no están en el catálogo de 2025 (el ahoyador) → su
 *   tipo de la marca «aditamentos».
 * - Bulldozers usados D3C y D39PX-21 → `equipos-usados`, categoría «Bulldozer».
 *
 *   npm run preview:catalogo-wp:simular
 *   npm run preview:catalogo-wp:importar
 *   npm run preview:catalogo-wp:retirar     # deshace EXACTAMENTE lo del manifiesto
 *
 * Mismo método que los aditamentos (`scripts/aditamentos/importar.ts`):
 * idempotente, MANIFIESTO fuera del repositorio
 * (`Desktop/partequipos-cierre/manifiesto-catalogo-wp-<destino>.json`) y
 * RETIRADA EXACTA: borra lo que creó, devuelve las categorías a sus tipos de
 * antes y comprueba que los ficheros salen del Blob. Lo que no creó no lo toca.
 *
 * FUENTE: el JSON de `scripts/catalogo-wp/extraer-xml.py`, fuera del
 * repositorio (`Desktop/partequipos-cierre/catalogo-wp-tal-cual.json`, o
 * `fuente=<ruta>`). Sin seriales: el extractor no los saca.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import {
  SLUG_MARCA_ADITAMENTOS,
  fichaDeUsado,
  fotosDistintas,
  nombreDeAditamentoNuevo,
  type HuellaFoto,
  type TipoAditamento,
} from "../../src/lib/aditamentos/wordpress";
import {
  MARCAS_NUEVA,
  TIPOS_DE_CATEGORIA,
  fichaDeTarjeta,
  importarAditamento2022,
  marcaDeRotulo,
  nombreDeNuevo,
  nombreDeUsado,
  pesoDeTarjeta,
} from "../../src/lib/catalogoWp/tarjetas";
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
  const e = new Error(`[catalogo-wp] ✗ ${m}`);
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
exigirAlmacen("[catalogo-wp]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "catalogo-wp-tal-cual.json");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-catalogo-wp-${destino}.json`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const AGENTE = "Partequipos-migracion/1.0 (importador de tarjetas del catálogo; solo lectura)";
const PAUSA_MS = 700;
const log = (m: string) => process.stdout.write(`[catalogo-wp] ${m}\n`);

// ---------- Manifiesto ----------

type Fichero = { id: number; filename: string; url: string };
type Manifiesto = {
  destino: string;
  creado: {
    nuevos: { clave: string; id: number }[];
    usados: { idWp: number; id: number }[];
    media: Fichero[];
    documentos: Fichero[];
    marcasMaquinaria: number[];
    tipos: number[];
    marcasUsada: number[];
  };
  /** Tipos de cada categoría de nueva ANTES de añadir los nuevos (para la retirada). */
  categoriasAntes: Record<string, number[]>;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : {
      destino: destino!,
      creado: {
        nuevos: [],
        usados: [],
        media: [],
        documentos: [],
        marcasMaquinaria: [],
        tipos: [],
        marcasUsada: [],
      },
      categoriasAntes: {},
    };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
function guardarManifiesto() {
  if (modo !== "importar") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
}

const idRel = (v: unknown): number | null =>
  typeof v === "number"
    ? v
    : v && typeof v === "object" && "id" in v
      ? (v as { id: number }).id
      : null;

// ---------- Retirada ----------

type Coleccion =
  | "equipos-usados"
  | "equipos-nuevos"
  | "documentos"
  | "media"
  | "tipos-maquinaria"
  | "marcas-maquinaria"
  | "marcas-usada";

async function borrarTodos(coleccion: Coleccion, ids: number[]): Promise<number> {
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
  for (const [slug, tipos] of Object.entries(manifiesto.categoriasAntes)) {
    const cat = (
      await payload.find({
        collection: "categorias-maquinaria",
        where: { slug: { equals: slug } },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0];
    if (cat) {
      await payload.update({
        collection: "categorias-maquinaria",
        id: cat.id,
        data: { tiposIncluidos: tipos },
        overrideAccess: true,
      });
      log(`categoría «${slug}»: devuelta a sus ${tipos.length} tipos de antes`);
    }
  }
  const pasos: [string, Coleccion, number[]][] = [
    ["unidades usadas", "equipos-usados", c.usados.map((u) => u.id)],
    ["fichas nuevas", "equipos-nuevos", c.nuevos.map((u) => u.id)],
    ["tipos", "tipos-maquinaria", c.tipos],
    ["marcas de nueva", "marcas-maquinaria", c.marcasMaquinaria],
    ["marcas de usada", "marcas-usada", c.marcasUsada],
  ];
  for (const [nombre, col, ids] of pasos) {
    log(`${nombre} borradas: ${await borrarTodos(col, ids)} de ${ids.length}`);
  }
  const urls: string[] = [];
  for (const [col, lista] of [
    ["media", c.media],
    ["documentos", c.documentos],
  ] as const) {
    for (const m of lista) {
      const r = await payload
        .delete({ collection: col, id: m.id, overrideAccess: true })
        .catch(() => null);
      if (r && m.url) urls.push(m.url);
    }
  }
  log(`ficheros borrados: ${urls.length} de ${c.media.length + c.documentos.length}`);
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
  if (!r.ok) fallar(`no se puede descargar (HTTP ${r.status}): ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Huella visual: miniatura de 8 × 8 en grises, un bit por píxel. */
async function huella(clave: string, datos: Buffer): Promise<HuellaFoto> {
  const { width = 0, height = 0 } = await sharp(datos).metadata();
  const px = await sharp(datos).greyscale().resize(8, 8, { fit: "fill" }).raw().toBuffer();
  const media = px.reduce((a, b) => a + b, 0) / px.length;
  return { clave, bits: [...px].map((v) => (v > media ? 1 : 0)), pixeles: width * height };
}

// ---------- Plan (sin escrituras) ----------

type FotoWp = { idWp: number; url: string; alt: string };
type Fuente = {
  nuevos: {
    categoria: string;
    rotulo: string;
    modelo: string;
    datos: string[];
    fotos: FotoWp[];
    pdf: string | null;
  }[];
  usados: {
    idWp: number;
    categoria: string;
    enlace: string;
    fechaGmt: string;
    rotulo: string;
    modelo: string;
    datos: string[];
    fotos: FotoWp[];
  }[];
  aditamentos2022: { tipo: TipoAditamento; titulo: string; fotos: FotoWp[] }[];
};
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE} (ver extraer-xml.py)`);
const fuente = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as Fuente;

const EXTENSIONES: Record<string, string> = { jpg: "jpg", jpeg: "jpg", png: "png", webp: "webp" };
const ficheroFoto = (f: FotoWp, nombre: string) => {
  const ext = EXTENSIONES[(f.url.split(".").pop() ?? "").toLowerCase()];
  return ext ? `wp-tarjeta-${f.idWp}-${formatSlug(nombre)}.${ext}` : null;
};

type PlanNuevo = {
  clave: string;
  marcaSlug: string;
  marcaNombre: string;
  tipoSlug: string;
  tipoNombre: string;
  /** Categoría de nueva a la que se añade el tipo (null en los aditamentos). */
  categoria: string | null;
  nombre: string;
  slug: string;
  codigo: string | null;
  ficha: { etiqueta: string; valor: string }[];
  pesoKg: number | null;
  fotos: FotoWp[];
  pdf: string | null;
};
const planNuevos: PlanNuevo[] = [
  ...fuente.nuevos.map((n): PlanNuevo => {
    const marca = MARCAS_NUEVA[n.rotulo.trim().toLowerCase()]!;
    const tipo = TIPOS_DE_CATEGORIA[n.categoria]!;
    const nombre = nombreDeNuevo(n.categoria, n.rotulo, n.modelo);
    const ficha = fichaDeTarjeta(n.datos);
    return {
      clave: `${marca.slug}/${tipo.slug}/${formatSlug(nombre)}`,
      marcaSlug: marca.slug,
      marcaNombre: marca.nombre,
      tipoSlug: tipo.slug,
      tipoNombre: tipo.nombre,
      categoria: n.categoria,
      nombre,
      slug: formatSlug(nombre),
      codigo: n.modelo.trim(),
      ficha,
      pesoKg: pesoDeTarjeta(ficha),
      fotos: n.fotos,
      pdf: n.pdf,
    };
  }),
  ...fuente.aditamentos2022
    .filter((a) => importarAditamento2022(a.titulo))
    .map((a): PlanNuevo => {
      const nombre = nombreDeAditamentoNuevo(a.titulo, a.tipo);
      return {
        clave: `${SLUG_MARCA_ADITAMENTOS}/${a.tipo}/${formatSlug(nombre)}`,
        marcaSlug: SLUG_MARCA_ADITAMENTOS,
        marcaNombre: "Aditamentos",
        tipoSlug: a.tipo,
        tipoNombre: a.tipo,
        categoria: null,
        nombre,
        slug: formatSlug(nombre),
        codigo: null,
        ficha: [],
        pesoKg: null,
        fotos: a.fotos,
        pdf: null,
      };
    }),
];

const baseUsados = fuente.usados.map((u) => {
  const ficha = fichaDeUsado(u.datos);
  const tipo = u.categoria === "bulldozer" ? "Bulldozer" : marcaDeRotulo(u.categoria);
  return {
    u,
    ficha,
    marca: marcaDeRotulo(u.rotulo),
    nombre: nombreDeUsado(tipo, u.rotulo, u.modelo, ficha.anio),
  };
});
const direcciones = new Map(
  direccionesDeUnidades(
    baseUsados.map((b) => ({
      idWp: b.u.idWp,
      enlace: b.u.enlace,
      categoria: b.u.categoria,
      nombre: b.nombre,
    })),
  ).map((d) => [d.idWp, d]),
);

log(`fuente: ${path.basename(FUENTE)}`);
for (const p of planNuevos)
  log(
    `nuevo  ${p.clave} · «${p.nombre}» · ${p.ficha.length} filas · ${p.pesoKg ?? "—"} kg · ${p.fotos.length} fotos en WordPress · PDF ${p.pdf ? "sí" : "no"}`,
  );
for (const b of baseUsados) {
  const d = direcciones.get(b.u.idWp)!;
  log(
    `usado  ${b.u.idWp} · «${b.nombre}» → ${d.hacia}/ · marca ${b.marca} · ${b.ficha.pesoOperativo ?? "—"} t · año ${b.ficha.anio ?? "—"} · ${b.ficha.horometro ?? "—"} h · ${b.u.fotos.length} fotos en WordPress`,
  );
}

// ---------- Lo que ya existe en el destino ----------

async function unoPor<
  T extends "marcas-maquinaria" | "categorias-maquinaria" | "categorias-usada" | "marcas-usada",
>(coleccion: T, slug: string) {
  return (
    await payload.find({
      collection: coleccion,
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
}
async function tipoDe(marcaId: number, slug: string) {
  return (
    await payload.find({
      collection: "tipos-maquinaria",
      where: { and: [{ marca: { equals: marcaId } }, { slug: { equals: slug } }] },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
}
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

const catBulldozer = await unoPor("categorias-usada", "bulldozer");
if (!catBulldozer) fallar("no existe la categoría de usada «bulldozer»");

if (modo === "simular") {
  for (const m of new Set(planNuevos.map((p) => p.marcaSlug))) {
    const marca = await unoPor("marcas-maquinaria", m);
    log(`marca de nueva «${m}»: ${marca ? `ya existe (id ${marca.id})` : "se CREARÍA"}`);
    for (const t of new Set(planNuevos.filter((p) => p.marcaSlug === m).map((p) => p.tipoSlug))) {
      const tipo = marca ? await tipoDe(marca.id, t) : undefined;
      log(`  tipo «${m}/${t}»: ${tipo ? `ya existe (id ${tipo.id})` : "se CREARÍA"}`);
    }
  }
  for (const c of new Set(planNuevos.flatMap((p) => (p.categoria ? [p.categoria] : [])))) {
    const cat = await unoPor("categorias-maquinaria", c);
    log(`categoría de nueva «${c}»: ${cat ? `existe; se le añade el tipo` : "NO EXISTE (para)"}`);
  }
  for (const m of new Set(baseUsados.map((b) => b.marca))) {
    const id = await unoPor("marcas-usada", formatSlug(m));
    log(`marca de usada «${m}»: ${id ? `ya existe (id ${id.id})` : "se CREARÍA"}`);
  }
  log("simulación terminada: no se ha escrito nada");
  process.exit(0);
}

// ---------- Importación ----------

/** Un fichero ya subido por esta u otra pasada (por su prefijo); si no, `null`. */
async function yaSubido(coleccion: "media" | "documentos", prefijo: string) {
  const r = await payload.find({
    collection: coleccion,
    where: { filename: { contains: prefijo } },
    depth: 0,
    limit: 5,
    overrideAccess: true,
  });
  return r.docs.find((x) => x.filename?.toLowerCase().startsWith(prefijo)) ?? null;
}

/** Las fotos distintas de un carrusel (sin repetidas por huella), subidas a `media`. */
async function fotosAMedia(fotos: FotoWp[], nombre: string): Promise<number[]> {
  const candidatas = fotos.flatMap((f) => {
    const fichero = ficheroFoto(f, nombre);
    return fichero ? [{ f, fichero }] : [];
  });
  const datos = new Map<string, Buffer>();
  const huellas: HuellaFoto[] = [];
  for (const c of candidatas) {
    const prefijo = c.fichero.match(/^wp-tarjeta-\d+-/)![0];
    if (await yaSubido("media", prefijo)) {
      huellas.push({ clave: c.fichero, bits: [], pixeles: Number.MAX_SAFE_INTEGER });
      continue;
    }
    const d = await descargar(c.f.url);
    datos.set(c.fichero, d);
    huellas.push(await huella(c.fichero, d));
  }
  const nuevas = huellas.filter((h) => h.bits.length);
  const quedan = new Set([
    ...huellas.filter((h) => !h.bits.length).map((h) => h.clave),
    ...fotosDistintas(nuevas),
  ]);
  const elegidas = candidatas.filter((c) => quedan.has(c.fichero));
  const ids: number[] = [];
  for (const [i, c] of elegidas.entries()) {
    const prefijo = c.fichero.match(/^wp-tarjeta-\d+-/)![0];
    const ya = await yaSubido("media", prefijo);
    if (ya) {
      ids.push(ya.id);
      continue;
    }
    const buf = datos.get(c.fichero) ?? (await descargar(c.f.url));
    const ext = c.fichero.split(".").pop();
    const alt = elegidas.length > 1 ? `${nombre}, foto ${i + 1} de ${elegidas.length}` : nombre;
    const doc = await payload.create({
      collection: "media",
      data: { alt, focalX: 50, focalY: 50 },
      file: {
        data: buf,
        mimetype: ext === "jpg" ? "image/jpeg" : `image/${ext}`,
        name: c.fichero,
        size: buf.length,
      },
      overrideAccess: true,
    });
    manifiesto.creado.media.push({
      id: doc.id,
      filename: doc.filename ?? c.fichero,
      url: doc.url ?? "",
    });
    guardarManifiesto();
    ids.push(doc.id);
  }
  return ids;
}

async function pdfADocumento(url: string, nombre: string): Promise<number> {
  const fichero = `wp-tarjeta-${formatSlug(path.basename(url, ".pdf"))}.pdf`;
  const ya = await yaSubido("documentos", fichero.replace(/\.pdf$/, ""));
  if (ya) return ya.id;
  const datos = await descargar(url);
  const doc = await payload.create({
    collection: "documentos",
    data: { titulo: `Ficha técnica ${nombre}` },
    file: { data: datos, mimetype: "application/pdf", name: fichero, size: datos.length },
    overrideAccess: true,
  });
  manifiesto.creado.documentos.push({
    id: doc.id,
    filename: doc.filename ?? fichero,
    url: doc.url ?? "",
  });
  guardarManifiesto();
  return doc.id;
}

// Marcas y tipos de nueva (se crean AQUÍ para que la retirada los conozca).
const idMarcaNueva = new Map<string, number>();
const idTipo = new Map<string, number>();
for (const p of planNuevos) {
  if (!idMarcaNueva.has(p.marcaSlug)) {
    let marca = await unoPor("marcas-maquinaria", p.marcaSlug);
    if (!marca) {
      marca = await payload.create({
        collection: "marcas-maquinaria",
        data: { nombre: p.marcaNombre, slug: p.marcaSlug },
        overrideAccess: true,
      });
      manifiesto.creado.marcasMaquinaria.push(marca.id);
      guardarManifiesto();
      log(`marca de nueva «${p.marcaSlug}» creada (id ${marca.id})`);
    }
    idMarcaNueva.set(p.marcaSlug, marca.id);
  }
  const claveTipo = `${p.marcaSlug}/${p.tipoSlug}`;
  if (!idTipo.has(claveTipo)) {
    const marcaId = idMarcaNueva.get(p.marcaSlug)!;
    let tipo = await tipoDe(marcaId, p.tipoSlug);
    if (!tipo) {
      if (p.marcaSlug === SLUG_MARCA_ADITAMENTOS) fallar(`no existe el tipo «${claveTipo}»`);
      tipo = await payload.create({
        collection: "tipos-maquinaria",
        data: { nombre: p.tipoNombre, slug: p.tipoSlug, marca: marcaId },
        overrideAccess: true,
      });
      manifiesto.creado.tipos.push(tipo.id);
      guardarManifiesto();
      log(`tipo «${claveTipo}» creado (id ${tipo.id})`);
    }
    idTipo.set(claveTipo, tipo.id);
  }
}

// Cada tipo nuevo entra en su categoría de nueva (guardando antes la lista de siempre).
for (const p of planNuevos) {
  if (!p.categoria) continue;
  const cat = await unoPor("categorias-maquinaria", p.categoria);
  if (!cat) fallar(`no existe la categoría de nueva «${p.categoria}»`);
  const actuales = (cat!.tiposIncluidos ?? []).map(idRel).filter((x): x is number => x !== null);
  const tipo = idTipo.get(`${p.marcaSlug}/${p.tipoSlug}`)!;
  if (actuales.includes(tipo)) continue;
  if (!manifiesto.categoriasAntes[p.categoria]) manifiesto.categoriasAntes[p.categoria] = actuales;
  await payload.update({
    collection: "categorias-maquinaria",
    id: cat!.id,
    data: { tiposIncluidos: [...actuales, tipo] },
    overrideAccess: true,
  });
  guardarManifiesto();
  log(`categoría «${p.categoria}»: añadido el tipo ${tipo}`);
}

// Fichas nuevas.
const nuestrosNuevos = new Map(manifiesto.creado.nuevos.map((n) => [n.clave, n.id]));
for (const p of planNuevos) {
  const tipo = idTipo.get(`${p.marcaSlug}/${p.tipoSlug}`)!;
  const nuestro = nuestrosNuevos.get(p.clave);
  const existente = await nuevoExistente(tipo, p.slug);
  if (existente && existente !== nuestro) {
    log(
      `aviso: ya hay una ficha que no creó esta importación en ${p.clave} (${existente}); se salta`,
    );
    continue;
  }
  const imagenes = await fotosAMedia(p.fotos, p.nombre);
  const fichaTecnicaPdf = p.pdf ? await pdfADocumento(p.pdf, p.nombre) : null;
  const data = {
    nombre: p.nombre,
    slug: p.slug,
    marca: idMarcaNueva.get(p.marcaSlug)!,
    tipo,
    codigo: p.codigo,
    fichaTecnica: p.ficha,
    pesoOperativoKg: p.pesoKg,
    imagenes,
    fichaTecnicaPdf,
  };
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
    log(
      `nuevo creado ${p.clave} → ${doc.id}: «${p.nombre}» (${imagenes.length} fotos, PDF ${fichaTecnicaPdf ? "sí" : "no"})`,
    );
  }
}

// Marcas de usada.
const idMarcaUsada = new Map<string, number>();
for (const m of new Set(baseUsados.map((b) => b.marca))) {
  let marca = await unoPor("marcas-usada", formatSlug(m));
  if (!marca) {
    marca = await payload.create({
      collection: "marcas-usada",
      data: { nombre: m, slug: formatSlug(m) },
      overrideAccess: true,
    });
    manifiesto.creado.marcasUsada.push(marca.id);
    guardarManifiesto();
    log(`marca de usada «${m}» creada (id ${marca.id})`);
  }
  idMarcaUsada.set(m, marca.id);
}

// Unidades usadas.
for (const b of baseUsados) {
  const d = direcciones.get(b.u.idWp)!;
  const imagenes = await fotosAMedia(b.u.fotos, b.nombre);
  const fecha = fechaDeWordPress(b.u.fechaGmt);
  const data = {
    nombre: b.nombre,
    categoria: catBulldozer!.id,
    marcaUsada: idMarcaUsada.get(b.marca)!,
    modelo: b.u.modelo.trim(),
    anio: b.ficha.anio,
    horometro: b.ficha.horometro,
    pesoOperativo: b.ficha.pesoOperativo,
    descripcion: b.ficha.descripcion,
    ...(fecha ? { fechaPublicacion: fecha } : {}),
    imagenes,
    disponible: true,
  };
  const nuestro = manifiesto.creado.usados.find((u) => u.idWp === b.u.idWp)?.id;
  const existe = nuestro
    ? await payload
        .findByID({ collection: "equipos-usados", id: nuestro, depth: 0, overrideAccess: true })
        .catch(() => null)
    : null;
  if (existe) {
    await payload.update({
      collection: "equipos-usados",
      id: existe.id,
      data,
      overrideAccess: true,
    });
    log(`usado actualizado ${b.u.idWp} → ${existe.id} (${imagenes.length} fotos)`);
  } else {
    const doc = await payload.create({
      collection: "equipos-usados",
      data: { ...data, slug: d.slug },
      overrideAccess: true,
    });
    manifiesto.creado.usados = manifiesto.creado.usados.filter((u) => u.idWp !== b.u.idWp);
    manifiesto.creado.usados.push({ idWp: b.u.idWp, id: doc.id });
    guardarManifiesto();
    log(
      `usado creado ${b.u.idWp} → ${doc.id}: «${b.nombre}» en ${d.hacia}/ (${imagenes.length} fotos)`,
    );
  }
}

const c = manifiesto.creado;
log(
  `terminado · en el manifiesto: ${c.nuevos.length} nuevos, ${c.usados.length} usados, ${c.media.length} fotos, ${c.documentos.length} PDF, ${c.marcasMaquinaria.length} marcas de nueva, ${c.tipos.length} tipos, ${c.marcasUsada.length} marcas de usada`,
);
log("el sitio desplegado no se refresca solo con un script: redesplegar después");
process.exit(0);
