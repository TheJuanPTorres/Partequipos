/**
 * MINIEXCAVADORAS DENTRO DE EXCAVADORAS (decisión del cliente, 2026-10-22):
 * las unidades usadas de «Miniexcavadoras» pasan a la categoría «Excavadoras»
 * (como en WordPress, donde salían en su listado) y «Miniexcavadoras» se oculta
 * sin borrarla, así que sale de «Otros», del menú y de las pestañas.
 *
 *   npm run preview:ejecutar -- payload run scripts/usados/miniexcavadoras-a-excavadoras.ts <modo> <destino>
 *
 *   modo:     simular | aplicar | retirar
 *   destino:  preview | produccion (solo dirección, con runbook)
 *
 * Qué hace `aplicar`, en este orden:
 *  1. Cambia SOLO la categoría de cada unidad. El slug, el SEO, las fotos y lo
 *     demás no se tocan. Como la URL de la ficha lleva la categoría, cada una
 *     pasa de `…/miniexcavadoras/<slug>/` a `…/excavadoras/<slug>/`. Antes
 *     comprueba que ningún slug choca con una unidad de Excavadoras (índice
 *     único categoría + slug); si choca, no hace nada.
 *  2. Un 301 por unidad de la URL vieja a la nueva. El gancho de «Redirecciones»
 *     aplana las cadenas: los 301 de WordPress que llevaban a la vieja pasan a
 *     llevar a la nueva (un solo salto). El manifiesto guarda cómo estaban.
 *  3. El 301 de `…/miniexcavadoras/` a `…/excavadoras/`.
 *  4. Desmarca «Mostrar en la web» de Miniexcavadoras.
 *
 * Idempotente: una segunda pasada no cambia nada. `retirar` deshace
 * exactamente lo hecho, en orden inverso, con el manifiesto
 * (`Desktop/partequipos-cierre/manifiesto-miniexcavadoras-<destino>.json`).
 * Imprime ids, nunca nombres ni slugs de unidades (algunos de WordPress
 * llevaban el número de serie, §9).
 *
 * NO refresca el sitio: después, `POST /api/revalidar/`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { normalizarRuta } from "../../src/lib/redirects/normalizar";
import { rutas } from "../../src/lib/routes";
import type { Redirect } from "../../src/payload-types";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[miniexcavadoras] ✗ ${m}`);
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
}

const ORIGEN = "miniexcavadoras";
const DESTINO = "excavadoras";
const NOTA = "Miniexcavadoras dentro de Excavadoras (cliente, 2026-10-22).";
const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  `manifiesto-miniexcavadoras-${destino}.json`,
);

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
const log = (m: string) => process.stdout.write(`[miniexcavadoras] ${m}\n`);

type Manifiesto = {
  destino: string;
  /** Unidades movidas: su id y la categoría que tenían. */
  unidades: { id: number; categoria: number }[];
  /** Redirecciones creadas por este script. */
  redirects: number[];
  /** 301 que ya existían y que el aplanado cambió: cómo estaban. */
  aplanados: {
    id: number;
    hacia: string;
    estadoDestino: Redirect["estadoDestino"];
    destinoVerificadoEn: string | null;
  }[];
  /** «Mostrar en la web» de Miniexcavadoras antes de ocultarla (null: no se tocó). */
  mostrarEnWebAntes: boolean | null;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, unidades: [], redirects: [], aplanados: [], mostrarEnWebAntes: null };
if (manifiesto.destino !== destino) fallar(`el manifiesto es de «${manifiesto.destino}»`);
const guardar = () => {
  if (modo === "simular") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

async function categoria(slug: string) {
  const { docs } = await payload.find({
    collection: "categorias-usada",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return docs[0] ?? fallar(`no está la categoría «${slug}»`);
}
const origen = await categoria(ORIGEN);
const hacia = await categoria(DESTINO);

async function unidadesDe(id: number) {
  const { docs } = await payload.find({
    collection: "equipos-usados",
    where: { categoria: { equals: id } },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { slug: true, disponible: true },
  });
  return docs;
}

async function redirectDesde(desde: string) {
  const { docs } = await payload.find({
    collection: "redirects",
    where: { desde: { equals: normalizarRuta(desde) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return docs[0] ?? null;
}

/** Los 301 que llevan a `ruta` (los que el aplanado cambiará). */
async function redirectsHacia(ruta: string) {
  const objetivo = normalizarRuta(ruta);
  const { docs } = await payload.find({
    collection: "redirects",
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  return docs.filter((r) => normalizarRuta(r.hacia) === objetivo);
}

// ---------- Retirada ----------
if (modo === "retirar") {
  let borrados = 0;
  for (const id of [...manifiesto.redirects].reverse()) {
    const r = await payload
      .delete({ collection: "redirects", id, overrideAccess: true })
      .catch(() => null);
    if (r) borrados++;
  }
  log(`redirecciones creadas y borradas: ${borrados} de ${manifiesto.redirects.length}`);
  for (const a of manifiesto.aplanados) {
    await payload.update({
      collection: "redirects",
      id: a.id,
      data: {
        hacia: a.hacia,
        estadoDestino: a.estadoDestino,
        destinoVerificadoEn: a.destinoVerificadoEn,
      },
      overrideAccess: true,
      context: { saltarAplanado: true },
    });
  }
  log(`301 aplanados devueltos a su destino de antes: ${manifiesto.aplanados.length}`);
  for (const u of manifiesto.unidades) {
    await payload.update({
      collection: "equipos-usados",
      id: u.id,
      data: { categoria: u.categoria },
      overrideAccess: true,
    });
  }
  log(`unidades devueltas a su categoría: ${manifiesto.unidades.length}`);
  if (manifiesto.mostrarEnWebAntes !== null) {
    await payload.update({
      collection: "categorias-usada",
      id: origen.id,
      data: { mostrarEnWeb: manifiesto.mostrarEnWebAntes },
      overrideAccess: true,
    });
    log(`«Mostrar en la web» de Miniexcavadoras devuelto a ${manifiesto.mostrarEnWebAntes}`);
  }
  const quedan = (await unidadesDe(origen.id)).length;
  manifiesto.unidades = [];
  manifiesto.redirects = [];
  manifiesto.aplanados = [];
  manifiesto.mostrarEnWebAntes = null;
  guardar();
  log(`RETIRADO · Miniexcavadoras tiene ${quedan} unidades`);
  process.exit(0);
}

// ---------- Estado de partida ----------
const aMover = await unidadesDe(origen.id);
const enDestino = await unidadesDe(hacia.id);
const ocupados = new Set(enDestino.flatMap((u) => (u.slug ? [u.slug] : [])));
log(
  `Miniexcavadoras (id ${origen.id}): ${aMover.length} unidades (${aMover.filter((u) => u.disponible).length} disponibles), «Mostrar en la web» ${origen.mostrarEnWeb !== false}, en «Otros» ${origen.enOtros !== false}`,
);
log(
  `Excavadoras (id ${hacia.id}): ${enDestino.length} unidades (${enDestino.filter((u) => u.disponible).length} disponibles)`,
);
const sinSlug = aMover.filter((u) => !u.slug).map((u) => u.id);
if (sinSlug.length) fallar(`unidades sin dirección web: ${sinSlug.join(", ")}`);
const chocan = aMover.filter((u) => ocupados.has(u.slug!)).map((u) => u.id);
if (chocan.length) {
  fallar(
    `la dirección web de ${chocan.length} unidades ya existe en Excavadoras (ids ${chocan.join(", ")}): no se hace nada`,
  );
}

// ---------- 1. Categoría de cada unidad ----------
// Las ya movidas en una pasada anterior están en el manifiesto con sus slugs.
const yaMovidas = new Set(manifiesto.unidades.map((u) => u.id));
for (const u of aMover) {
  if (modo === "aplicar") {
    await payload.update({
      collection: "equipos-usados",
      id: u.id,
      data: { categoria: hacia.id },
      overrideAccess: true,
    });
    if (!yaMovidas.has(u.id)) manifiesto.unidades.push({ id: u.id, categoria: origen.id });
    guardar();
  }
}
log(`${modo === "simular" ? "se moverían" : "movidas"} ${aMover.length} unidades a Excavadoras`);

// ---------- 2. 301 de cada ficha ----------
const slugsMovidos =
  modo === "simular"
    ? aMover.map((u) => u.slug!)
    : (
        await payload.find({
          collection: "equipos-usados",
          where: { id: { in: manifiesto.unidades.map((u) => u.id) } },
          limit: 0,
          pagination: false,
          depth: 0,
          overrideAccess: true,
          select: { slug: true },
        })
      ).docs.flatMap((u) => (u.slug ? [u.slug] : []));
let nuevos = 0;
let ya = 0;
let aplanar = 0;
const pares = [
  ...slugsMovidos.map((s) => ({
    desde: rutas.unidadUsada(ORIGEN, s),
    hacia: rutas.unidadUsada(DESTINO, s),
  })),
  // 3. La página de la categoría.
  { desde: rutas.categoriaUsada(ORIGEN), hacia: rutas.categoriaUsada(DESTINO) },
];
for (const p of pares) {
  if (await redirectDesde(p.desde)) {
    ya++;
    continue;
  }
  const previos = await redirectsHacia(p.desde);
  aplanar += previos.length;
  if (modo === "simular") {
    nuevos++;
    continue;
  }
  for (const r of previos) {
    if (manifiesto.aplanados.some((a) => a.id === r.id)) continue;
    manifiesto.aplanados.push({
      id: r.id,
      hacia: r.hacia,
      estadoDestino: r.estadoDestino ?? null,
      destinoVerificadoEn: r.destinoVerificadoEn ?? null,
    });
  }
  guardar();
  const doc = await payload.create({
    collection: "redirects",
    data: { desde: p.desde, hacia: p.hacia, tipo: "301", origen: "manual", notas: NOTA },
    overrideAccess: true,
  });
  manifiesto.redirects.push(doc.id);
  guardar();
  nuevos++;
}
log(
  `301: ${modo === "simular" ? "se crearían" : "creados"} ${nuevos} (${slugsMovidos.length} fichas + la categoría) · ya existían ${ya} · de WordPress que pasan a un salto: ${aplanar}`,
);

// ---------- 4. Ocultar Miniexcavadoras ----------
if (origen.mostrarEnWeb === false) {
  log("Miniexcavadoras ya estaba oculta");
} else {
  if (modo === "aplicar") {
    if (manifiesto.mostrarEnWebAntes === null) manifiesto.mostrarEnWebAntes = true;
    guardar();
    await payload.update({
      collection: "categorias-usada",
      id: origen.id,
      data: { mostrarEnWeb: false },
      overrideAccess: true,
    });
  }
  log(`Miniexcavadoras: ${modo === "simular" ? "se ocultaría" : "oculta"}`);
}

if (modo === "aplicar") {
  const quedan = (await unidadesDe(origen.id)).length;
  const total = (await unidadesDe(hacia.id)).length;
  if (quedan !== 0) fallar(`quedan ${quedan} unidades en Miniexcavadoras`);
  log(`APLICADO · Excavadoras tiene ${total} unidades; Miniexcavadoras, 0 y oculta`);
}
process.exit(0);
