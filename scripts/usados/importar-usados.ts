/**
 * Importa la maquinaria USADA de WordPress (tipo «maquinaria», 128 unidades)
 * a `equipos-usados`, con sus fotos en `Media`. Mismo método que el blog
 * (`scripts/blog/importar-wordpress.ts`): simulación, idempotencia, manifiesto
 * y retirada exacta. Detalle y decisiones: `docs/usados-importacion.md`.
 *
 *   npm run preview:usados:simular            # sin escribir ni pedir nada
 *   npm run preview:usados:importar           # una tanda (10 unidades)
 *   npm run preview:usados:importar -- tanda=20
 *   npm run preview:usados:retirar            # deshace lo del manifiesto
 *
 * FUENTE: el JSON que saca `scripts/usados/extraer-xml.py` de la exportación
 * XML (los campos ACF no salen por la API pública). Vive FUERA del repositorio
 * (`Desktop/partequipos-cierre/usados-wordpress.json`, o `fuente=<ruta>`): la
 * exportación completa tiene datos personales, y este JSON no.
 *
 * El NÚMERO DE SERIE no se publica (dirección, 2026-10-07): no va en el
 * nombre, ni en la descripción, ni en el texto alternativo, ni en el nombre
 * del fichero. Este script tampoco lo imprime: identifica cada unidad por su
 * id de WordPress.
 *
 * POR TANDAS: cada ejecución importa como mucho `tanda` unidades (10 por
 * defecto, unas 120 fotos) y termina; la siguiente sigue donde se quedó. Así
 * la memoria del proceso no crece con las 1.493 fotos.
 *
 * DESTINO validado antes de cargar Payload, como el blog: `preview` solo con
 * la base y el Blob del preview; los otros destinos, con su base y su almacén.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import {
  altDeFoto,
  categoriaDeUnidad,
  descripcionSinSerial,
  limpiarReferencia,
  nombreCompuesto,
  nombreDeFicheroUsado,
  nombreDeMarca,
  anioDeUnidad,
  normalizarHoras,
  normalizarPeso,
} from "../../src/lib/usados/wordpress";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[usados] ✗ ${m}`);
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
exigirAlmacen("[usados]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "usados-wordpress.json");
const MANIFIESTO = valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-usados-${destino}.json`);
const TANDA = Number(valorDe("tanda") ?? 10);
if (!Number.isInteger(TANDA) || TANDA < 1) fallar("tanda=<n> tiene que ser un entero positivo");
/** Con `fotos`, la simulación comprueba además que cada foto se puede descargar (~17 min). */
const COMPROBAR_FOTOS = args.includes("fotos");
/** Con `actualizar`, la importación vuelve a aplicar los datos a las unidades ya importadas (sin volver a subir fotos). */
const ACTUALIZAR = args.includes("actualizar");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const AGENTE = "Partequipos-migracion/1.0 (importador de usados; solo lectura)";
const PAUSA_MS = 700;
const log = (m: string) => process.stdout.write(`[usados] ${m}\n`);

// ---------- Manifiesto ----------

type Fichero = { id: number; filename: string; url: string };
type Manifiesto = {
  destino: string;
  creado: {
    /** Cada unidad creada, con su id de WordPress (para no duplicarla). */
    usados: { idWp: number; id: number }[];
    media: Fichero[];
    categorias: number[];
  };
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, creado: { usados: [], media: [], categorias: [] } };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
function guardarManifiesto() {
  if (modo !== "importar") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
}

// ---------- Retirada ----------

/**
 * Deshace EXACTAMENTE lo que apunta el manifiesto: borra las unidades, las
 * fotos y la categoría que creó la importación, y comprueba que los ficheros
 * salen del Blob. Lo que no creó la importación no se borra nunca.
 */
async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  let unidades = 0;
  for (const { id } of manifiesto.creado.usados) {
    const r = await payload
      .delete({ collection: "equipos-usados", id, overrideAccess: true })
      .catch(() => null);
    if (r) unidades++;
  }
  log(`unidades creadas y borradas: ${unidades} de ${manifiesto.creado.usados.length}`);
  const urls: string[] = [];
  for (const m of manifiesto.creado.media) {
    const r = await payload
      .delete({ collection: "media", id: m.id, overrideAccess: true })
      .catch(() => null);
    if (r && m.url) urls.push(m.url);
  }
  log(`fotos creadas y borradas: ${urls.length} de ${manifiesto.creado.media.length}`);
  let categorias = 0;
  for (const id of manifiesto.creado.categorias) {
    const r = await payload
      .delete({ collection: "categorias-usada", id, overrideAccess: true })
      .catch(() => null);
    if (r) categorias++;
  }
  log(`categorías creadas y borradas: ${categorias} de ${manifiesto.creado.categorias.length}`);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("manifiesto retirado; espero 70 s (propagación del Blob)");
  await new Promise((r) => setTimeout(r, 70_000));
  // Como en el blog: algún fichero tarda algo más de 60 s; hasta 3 vueltas más, cada 30 s.
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
async function turno() {
  const espera = ultima + PAUSA_MS - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultima = Date.now();
}

async function descargar(url: string): Promise<{ datos: Buffer } | { error: string }> {
  await turno();
  try {
    const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    return { datos: Buffer.from(await r.arrayBuffer()) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function existe(url: string): Promise<string | null> {
  await turno();
  try {
    const r = await fetch(url, { method: "HEAD", headers: { "User-Agent": AGENTE } });
    return r.ok ? null : `HTTP ${r.status}`;
  } catch (e) {
    return (e as Error).message;
  }
}

// ---------- Plan: cada unidad, normalizada (sin red ni escrituras) ----------

type UnidadWp = {
  idWp: number;
  slug: string;
  enlace: string;
  categoria: string | null;
  marca: string | null;
  anio: string | null;
  referencia: string;
  peso: string;
  horas: string;
  serial: string;
  descripcionequipo: string;
  fotos: { idWp: number; url: string; alt: string }[];
};
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE} (ver extraer-xml.py)`);
const { unidades } = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as { unidades: UnidadWp[] };

type Foto = { url: string; fichero: string; alt: string };
type Plan = {
  idWp: number;
  enlace: string;
  categoria: string;
  deducida: boolean;
  datos: {
    nombre: string;
    marca: string | null;
    modelo: string | null;
    anio: number | null;
    horometro: number | null;
    pesoOperativo: number | null;
    descripcion: string | null;
  };
  origenHoras: string;
  fotos: Foto[];
  noFotos: number;
};
const omitidas: { idWp: number; motivo: string }[] = [];
const avisos: string[] = [];
const planes: Plan[] = [];
for (const u of unidades) {
  const marca = nombreDeMarca(u.marca);
  const modelo = limpiarReferencia(u.referencia, marca);
  const peso = normalizarPeso(u.peso);
  const categoria = categoriaDeUnidad(u.categoria, peso);
  if (!categoria) {
    omitidas.push({ idWp: u.idWp, motivo: `categoría «${u.categoria ?? ""}» sin equivalente` });
    continue;
  }
  const anioUnidad = anioDeUnidad(u.anio, u.descripcionequipo);
  const anio = anioUnidad.valor;
  if (anioUnidad.origen !== "campo") {
    avisos.push(
      `${u.idWp}: sin año en WordPress; ${anio ? `${anio}, de la descripción` : "va sin año"}`,
    );
  }
  const nombre = nombreCompuesto(categoria.tipo, marca, modelo, anio);
  const horas = normalizarHoras(u.horas, u.descripcionequipo);
  const descripcion = descripcionSinSerial(u.descripcionequipo, u.serial);
  if (!descripcion)
    avisos.push(`${u.idWp}: descripción sin importar (el serial no se pudo quitar)`);
  // Datos que no cuadran entre el campo y la descripción: se importa el campo y se avisa.
  const texto = u.descripcionequipo.replace(/<[^>]+>/g, " ");
  const enTexto = texto
    .match(/([\d.,]+)\s*horas/i)?.[1]
    ?.replace(/[.,]$/, "")
    .replace(/[.,]/g, "");
  if (horas.valor !== null && enTexto && Number(enTexto) !== horas.valor) {
    avisos.push(`${u.idWp}: horas ${horas.valor} en el campo y ${enTexto} en la descripción`);
  }
  if (modelo && !texto.toUpperCase().includes(modelo.toUpperCase())) {
    avisos.push(`${u.idWp}: la referencia «${modelo}» no aparece en la descripción`);
  }
  if (categoria.deducida) {
    avisos.push(`${u.idWp}: sin categoría en WordPress; va a «${categoria.slug}» por su peso`);
  }
  const fotosValidas = u.fotos
    .map((f) => ({ f, fichero: nombreDeFicheroUsado(f.url, f.idWp, nombre) }))
    .filter((x): x is { f: UnidadWp["fotos"][number]; fichero: string } => x.fichero !== null);
  planes.push({
    idWp: u.idWp,
    enlace: u.enlace,
    categoria: categoria.slug,
    deducida: categoria.deducida,
    datos: {
      nombre,
      marca,
      modelo,
      anio,
      horometro: horas.valor,
      pesoOperativo: peso,
      descripcion,
    },
    origenHoras: horas.origen,
    fotos: fotosValidas.map(({ f, fichero }, i) => ({
      url: f.url,
      fichero,
      alt: altDeFoto(f.alt, u.serial, nombre, i + 1, fotosValidas.length),
    })),
    noFotos: u.fotos.length - fotosValidas.length,
  });
}

const cuenta = (f: (p: Plan) => string) =>
  planes.reduce<Record<string, number>>((a, p) => ({ ...a, [f(p)]: (a[f(p)] ?? 0) + 1 }), {});
log(`fuente: ${path.basename(FUENTE)} · ${unidades.length} unidades`);
log(`por categoría: ${JSON.stringify(cuenta((p) => p.categoria))}`);
log(`horómetro: ${JSON.stringify(cuenta((p) => p.origenHoras))}`);
log(
  `fotos: ${planes.reduce((a, p) => a + p.fotos.length, 0)} · ficheros que no son foto (omitidos): ${planes.reduce((a, p) => a + p.noFotos, 0)}`,
);
for (const o of omitidas) log(`OMITIDA ${o.idWp}: ${o.motivo}`);
for (const a of avisos) log(`aviso ${a}`);

// ---------- Categorías ----------

async function categoriaPorSlug(slug: string): Promise<number | null> {
  const r = await payload.find({
    collection: "categorias-usada",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return r.docs[0]?.id ?? null;
}

const idCategoria = new Map<string, number>();
for (const slug of new Set(planes.map((p) => p.categoria))) {
  const id = await categoriaPorSlug(slug);
  if (id) {
    idCategoria.set(slug, id);
    continue;
  }
  // Solo se crea «Miniexcavadoras» (aprobada por dirección, 2026-10-07); otra que falte es un error.
  if (slug !== "miniexcavadoras") fallar(`no existe la categoría de usada «${slug}»`);
  if (modo === "simular") {
    log(`categoría «${slug}»: se CREARÍA (dato, sin esquema)`);
    continue;
  }
  const doc = await payload.create({
    collection: "categorias-usada",
    data: { nombre: "Miniexcavadoras", slug },
    overrideAccess: true,
  });
  idCategoria.set(slug, doc.id);
  manifiesto.creado.categorias.push(doc.id);
  guardarManifiesto();
  log(`categoría «${slug}» creada (id ${doc.id})`);
}

// ---------- Simulación ----------

if (modo === "simular") {
  const ya = new Set(manifiesto.creado.usados.map((u) => u.idWp));
  log(
    `ya importadas según el manifiesto: ${ya.size}; quedan ${planes.filter((p) => !ya.has(p.idWp)).length}`,
  );
  for (const p of planes.slice(0, 3)) {
    log(
      `ejemplo ${p.idWp}: «${p.datos.nombre}» · ${p.datos.horometro ?? "—"} h · ${p.datos.pesoOperativo ?? "—"} t · ${p.fotos.length} fotos`,
    );
    log(`  descripción: ${(p.datos.descripcion ?? "—").slice(0, 160)}…`);
    log(`  1.ª foto: ${p.fotos[0]?.fichero} · «${p.fotos[0]?.alt}»`);
  }
  if (COMPROBAR_FOTOS) {
    let fallos = 0;
    for (const p of planes)
      for (const f of p.fotos) {
        const e = await existe(f.url);
        if (e) {
          fallos++;
          log(`foto que no se puede descargar (unidad ${p.idWp}): ${e}`);
        }
      }
    log(`fotos que no se pueden descargar: ${fallos}`);
  }
  log("simulación terminada: no se ha escrito nada");
  process.exit(0);
}

// ---------- Importación, por tandas ----------

/** Copias repetidas de una foto, creadas por esta importación (se borran al final). */
const sobrantes = new Set<number>();

/**
 * La foto ya subida: la más antigua cuyo nombre empieza por `wp-usado-<id del
 * adjunto>-`. Se busca por el id y no por el nombre entero, porque el nombre
 * lleva el de la unidad y este puede cambiar (un año que aparece, una
 * referencia corregida): así no se sube otra copia.
 */
async function mediaExistente(fichero: string): Promise<{ id: number; alt: string } | null> {
  const prefijo = fichero.match(/^wp-usado-\d+-/)?.[0];
  if (!prefijo) return null;
  const r = await payload.find({
    collection: "media",
    where: { filename: { contains: prefijo } },
    sort: "createdAt",
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const d = r.docs.find((x) => x.filename?.toLowerCase().startsWith(prefijo));
  // Otras copias de la misma foto que creó esta importación (p. ej. tras cambiar el
  // nombre de la unidad): se borran al final de la tanda.
  const nuestras = new Set(manifiesto.creado.media.map((m) => m.id));
  for (const x of r.docs)
    if (x.id !== d?.id && x.filename?.toLowerCase().startsWith(prefijo) && nuestras.has(x.id))
      sobrantes.add(x.id);
  return d ? { id: d.id, alt: d.alt ?? "" } : null;
}

/** El nombre y la URL REALES tras subir (el Blob añade un sufijo, como en el blog). */
async function ficheroGuardado(id: number, pedido: string): Promise<Fichero> {
  const d = await payload.findByID({ collection: "media", id, depth: 0, overrideAccess: true });
  return { id, filename: d.filename ?? pedido, url: d.url ?? "" };
}

async function fotoAMedia(f: Foto): Promise<number | { error: string }> {
  const ya = await mediaExistente(f.fichero);
  if (ya) {
    // Solo con `actualizar` se rehace el texto alternativo: sin ella, lo que haya
    // cambiado un editor se respeta.
    if (ACTUALIZAR && ya.alt !== f.alt) {
      await payload.update({
        collection: "media",
        id: ya.id,
        data: { alt: f.alt },
        overrideAccess: true,
      });
    }
    return ya.id;
  }
  const d = await descargar(f.url);
  if ("error" in d) return { error: `no se puede descargar (${d.error})` };
  const ext = f.fichero.split(".").pop();
  try {
    const doc = await payload.create({
      collection: "media",
      data: { alt: f.alt, focalX: 50, focalY: 50 },
      file: {
        data: d.datos,
        mimetype: ext === "jpg" ? "image/jpeg" : `image/${ext}`,
        name: f.fichero,
        size: d.datos.length,
      },
      overrideAccess: true,
    });
    manifiesto.creado.media.push(await ficheroGuardado(doc.id, f.fichero));
    guardarManifiesto();
    return doc.id;
  } catch (e) {
    return { error: `Media la rechaza: ${(e as Error).message}` };
  }
}

/** La unidad ya importada: por el manifiesto o, sin él, por su primera foto. */
async function unidadExistente(p: Plan, primeraFoto: number | null): Promise<number | null> {
  const delManifiesto = manifiesto.creado.usados.find((u) => u.idWp === p.idWp)?.id;
  if (delManifiesto) {
    const d = await payload
      .findByID({ collection: "equipos-usados", id: delManifiesto, depth: 0, overrideAccess: true })
      .catch(() => null);
    if (d) return d.id;
  }
  if (!primeraFoto) return null;
  const r = await payload.find({
    collection: "equipos-usados",
    where: { imagenes: { in: [primeraFoto] } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return r.docs[0]?.id ?? null;
}

const hechas = new Set(manifiesto.creado.usados.map((u) => u.idWp));
const pendientes = ACTUALIZAR ? planes : planes.filter((p) => !hechas.has(p.idWp));
const tanda = pendientes.slice(0, TANDA);
log(
  `importadas antes: ${hechas.size} · esta tanda: ${tanda.length} · quedan después: ${pendientes.length - tanda.length}`,
);
let fallosFotos = 0;
for (const p of tanda) {
  const ids: number[] = [];
  for (const f of p.fotos) {
    const r = await fotoAMedia(f);
    if (typeof r === "number") ids.push(r);
    else {
      fallosFotos++;
      log(`  foto omitida (unidad ${p.idWp}): ${r.error}`);
    }
  }
  const data = {
    ...p.datos,
    categoria: idCategoria.get(p.categoria)!,
    imagenes: ids,
    disponible: true,
  };
  const existente = await unidadExistente(p, ids[0] ?? null);
  if (existente) {
    await payload.update({
      collection: "equipos-usados",
      id: existente,
      data,
      overrideAccess: true,
    });
    if (!manifiesto.creado.usados.some((u) => u.idWp === p.idWp)) {
      manifiesto.creado.usados.push({ idWp: p.idWp, id: existente });
    }
    log(`actualizada ${p.idWp} → ${existente}: «${p.datos.nombre}» (${ids.length} fotos)`);
  } else {
    const doc = await payload.create({ collection: "equipos-usados", data, overrideAccess: true });
    manifiesto.creado.usados.push({ idWp: p.idWp, id: doc.id });
    log(`creada ${p.idWp} → ${doc.id}: «${p.datos.nombre}» (${ids.length} fotos)`);
  }
  guardarManifiesto();
}
// Las copias sobrantes ya no las usa ninguna unidad de esta tanda: se borran
// (solo las que creó esta importación) y salen del manifiesto.
for (const id of sobrantes) {
  const usada = await payload.find({
    collection: "equipos-usados",
    where: { imagenes: { in: [id] } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  if (usada.docs.length) continue;
  await payload.delete({ collection: "media", id, overrideAccess: true });
  manifiesto.creado.media = manifiesto.creado.media.filter((m) => m.id !== id);
  guardarManifiesto();
  log(`copia repetida borrada: media ${id}`);
}
log(
  `tanda terminada · fotos omitidas: ${fallosFotos} · unidades en el manifiesto: ${manifiesto.creado.usados.length} de ${planes.length}`,
);
if (pendientes.length > tanda.length) log("quedan unidades: vuelve a ejecutar la importación");
process.exit(0);
