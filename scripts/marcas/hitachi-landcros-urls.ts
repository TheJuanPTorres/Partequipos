/**
 * «HITACHI» → «HITACHI LANDCROS» EN LAS DIRECCIONES (dirección, 2026-11-18). El nombre ya lo cambió
 * `hitachi-landcros.ts`; este script cambia las URL. La regla está en
 * `src/lib/marca/hitachiLandcrosUrls.ts`.
 *
 *   npm run preview:ejecutar -- payload run scripts/marcas/hitachi-landcros-urls.ts <modo> <destino>
 *
 *   modo:     simular | aplicar | retirar
 *   destino:  preview | produccion (solo dirección, con runbook)
 *
 * Qué hace, en este orden:
 *  1. DIRECCIONES: la marca de repuestos y la de maquinaria nueva, con sus tipos, modelos y equipos
 *     (`hitachi` → `hitachi-landcros` dentro del slug). NO toca las unidades usadas, la marca de
 *     usados ni los artículos: los lista para que decida dirección.
 *  2. REDIRECCIONES: un 301 de cada URL antigua a la nueva; las que ya apuntaban a una URL antigua
 *     pasan a apuntar DIRECTO a la nueva (sin cadenas). Las crea este script: los guardados van con
 *     `SIN_REDIRECT_AUTOMATICO`, para que los ganchos de repuestos no lancen su cascada.
 *  3. ENLACES: los enlaces relativos a una URL antigua escritos en el panel (hero, menús, textos
 *     enriquecidos…) pasan a la nueva.
 *
 * Idempotente (la segunda pasada no cambia nada). El manifiesto guarda lo de antes; la retirada lo
 * devuelve. NO refresca el sitio: después, `POST /api/revalidar/`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload, type CollectionSlug, type GlobalSlug } from "payload";

import { SIN_REDIRECT_AUTOMATICO } from "../../src/collections/hooks/autoRedirect";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import {
  leFaltaLandcros,
  reescribirRutas,
  reescribirRutasProfundo,
  slugConLandcros,
} from "../../src/lib/marca/hitachiLandcrosUrls";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { normalizarRuta } from "../../src/lib/redirects/normalizar";
import { segmentoDeTipo } from "../../src/lib/repuestos/anidado";
import { rutas } from "../../src/lib/routes";

const ETIQUETA = "[hitachi-landcros-urls]";
const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`${ETIQUETA} ✗ ${m}`);
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
// Este script no escribe en el almacén de ficheros: sin token, cualquier intento falla.
process.env.BLOB_READ_WRITE_TOKEN = "";

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  `manifiesto-hitachi-landcros-urls-${destino}.json`,
);

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
const log = (m: string) => process.stdout.write(`${ETIQUETA} ${m}\n`);
const verbo = modo === "aplicar" ? "cambia" : "cambiaría";

type Doc = Record<string, unknown> & { id: number; slug?: string };
type CambioSlug = { coleccion: string; id: number; antes: string; despues: string };
type CambioCampo = {
  sitio: string;
  global?: true;
  id?: number;
  campo: string;
  antes: unknown;
  despues: unknown;
};
type RedirectTocado = { desde: string; antes: string | null; despues: string };
type Manifiesto = {
  destino: string;
  slugs: CambioSlug[];
  /** Ruta antigua → ruta nueva, sin barra final. */
  pares: [string, string][];
  /** Redirecciones creadas (`antes: null`) o reapuntadas (`antes`: su destino de antes). */
  redirects: RedirectTocado[];
  campos: CambioCampo[];
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, slugs: [], pares: [], redirects: [], campos: [] };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const idDe = (rel: unknown): number | null =>
  typeof rel === "number" ? rel : rel && typeof rel === "object" ? (rel as Doc).id : null;

async function todos(coleccion: CollectionSlug): Promise<Doc[]> {
  const { docs } = await payload.find({
    collection: coleccion,
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });
  return docs as unknown as Doc[];
}

/** La marca «Hitachi» de una colección: por la palabra `hitachi` en su slug (antes o después). */
const esHitachi = (slug: string | undefined) => /(^|-)hitachi(-|$)/.test(slug ?? "");

// ---------------------------------------------------------------------------
// 1. El plan: qué slugs cambian y qué ruta antigua lleva a qué ruta nueva
// ---------------------------------------------------------------------------
const slugs: CambioSlug[] = [];
const pares = new Map<string, string>(manifiesto.pares);
/**
 * El slug de ANTES del cambio: el que guardó el manifiesto o, si el documento no se ha tocado, el
 * que tiene. Así el plan sale igual con el cambio sin hacer, a medias o hecho.
 */
const viejo = (coleccion: string, d: Doc): string =>
  manifiesto.slugs.find((c) => c.coleccion === coleccion && c.id === d.id)?.antes ??
  String(d.slug ?? "");
/** El slug de DESPUÉS, y apunta el cambio si el documento todavía no lo tiene. */
const nuevo = (coleccion: string, d: Doc): string => {
  const antes = String(d.slug ?? "");
  const despues = slugConLandcros(antes);
  if (antes !== despues) slugs.push({ coleccion, id: d.id, antes, despues });
  return despues;
};
const par = (antes: string, despues: string) => {
  const a = normalizarRuta(antes);
  const d = normalizarRuta(despues);
  if (a !== d) pares.set(a, d);
};

async function planRepuestos(): Promise<void> {
  const marcas = (await todos("marcas")).filter((m) => esHitachi(m.slug));
  const tipos = await todos("tipos-equipo");
  const modelos = await todos("modelos-repuesto");
  for (const marca of marcas) {
    const mAntes = viejo("marcas", marca);
    const mDespues = nuevo("marcas", marca);
    par(rutas.marca(mAntes), rutas.marca(mDespues));
    const suyos = tipos.filter((t) => idDe(t.marca) === marca.id);
    for (const tipo of suyos) {
      const padre = suyos.find((t) => t.id === idDe(tipo.tipoPadre));
      const segAntes = segmentoDeTipo({
        slug: viejo("tipos-equipo", tipo),
        slugPadre: padre ? viejo("tipos-equipo", padre) : null,
      });
      const segDespues = segmentoDeTipo({
        slug: nuevoSinApuntar(tipo),
        slugPadre: padre ? nuevoSinApuntar(padre) : null,
      });
      nuevo("tipos-equipo", tipo);
      par(rutas.tipo(mAntes, segAntes), rutas.tipo(mDespues, segDespues));
      for (const modelo of modelos.filter((x) => idDe(x.tipo) === tipo.id)) {
        par(
          rutas.modelo(mAntes, segAntes, viejo("modelos-repuesto", modelo)),
          rutas.modelo(mDespues, segDespues, nuevo("modelos-repuesto", modelo)),
        );
      }
    }
  }
}
const nuevoSinApuntar = (d: Doc) => slugConLandcros(String(d.slug ?? ""));

async function planNueva(): Promise<void> {
  const marcas = (await todos("marcas-maquinaria")).filter((m) => esHitachi(m.slug));
  const tipos = await todos("tipos-maquinaria");
  const equipos = await todos("equipos-nuevos");
  for (const marca of marcas) {
    const mAntes = viejo("marcas-maquinaria", marca);
    const mDespues = nuevo("marcas-maquinaria", marca);
    par(rutas.marcaMaquinaria(mAntes), rutas.marcaMaquinaria(mDespues));
    for (const tipo of tipos.filter((t) => idDe(t.marca) === marca.id)) {
      const tAntes = viejo("tipos-maquinaria", tipo);
      const tDespues = nuevo("tipos-maquinaria", tipo);
      par(rutas.tipoMaquinaria(mAntes, tAntes), rutas.tipoMaquinaria(mDespues, tDespues));
      for (const equipo of equipos.filter((e) => idDe(e.tipo) === tipo.id)) {
        par(
          rutas.equipoNuevo(mAntes, tAntes, viejo("equipos-nuevos", equipo)),
          rutas.equipoNuevo(mDespues, tDespues, nuevo("equipos-nuevos", equipo)),
        );
      }
    }
    const sinTipo = equipos.filter(
      (e) => idDe(e.marca) === marca.id && !tipos.some((t) => t.id === idDe(e.tipo)),
    );
    for (const e of sinTipo) log(`  · equipo ${e.id} (${e.slug}) de la marca sin tipo: no se toca`);
  }
}

// ---------------------------------------------------------------------------
// 2. Slugs
// ---------------------------------------------------------------------------
/** Marcas primero, después tipos y al final modelos y equipos: así los ganchos ven al padre ya cambiado. */
const ORDEN = [
  "marcas",
  "marcas-maquinaria",
  "tipos-equipo",
  "tipos-maquinaria",
  "modelos-repuesto",
  "equipos-nuevos",
];

async function cambiarSlugs(): Promise<void> {
  const ordenados = [...slugs].sort(
    (a, b) => ORDEN.indexOf(a.coleccion) - ORDEN.indexOf(b.coleccion),
  );
  for (const c of ordenados) {
    log(`${verbo} dirección ${c.coleccion} ${c.id}: ${c.antes} → ${c.despues}`);
    if (modo !== "aplicar") continue;
    const doc = (await payload.update({
      collection: c.coleccion as CollectionSlug,
      id: c.id,
      data: { slug: c.despues } as never,
      depth: 0,
      overrideAccess: true,
      // Las redirecciones las crea el paso 3, no los ganchos (ver `autoRedirect.ts`).
      context: { [SIN_REDIRECT_AUTOMATICO]: true },
    })) as unknown as Doc;
    if (doc.slug !== c.despues) {
      fallar(`${c.coleccion} ${c.id}: quedó «${String(doc.slug)}» y no «${c.despues}»`);
    }
    if (!manifiesto.slugs.some((x) => x.coleccion === c.coleccion && x.id === c.id)) {
      manifiesto.slugs.push(c);
    }
    guardar();
  }
  log(`direcciones: ${slugs.length}`);
}

// ---------------------------------------------------------------------------
// 3. Redirecciones
// ---------------------------------------------------------------------------
type Redirect = { id: number; desde: string; hacia: string; origen?: string };
const PREFIJOS = [`${rutas.marcas()}/`, `${rutas.marcasMaquinaria()}/`];
const NOTA = "Hitachi → Hitachi LANDCROS en las direcciones (2026-11-18).";

async function redirecciones(): Promise<void> {
  let existentes = (await todos("redirects")) as unknown as Redirect[];
  const nuevas = new Set(pares.values());
  let creadas = 0;
  let reapuntadas = 0;
  let quitadas = 0;

  // Una URL nueva nunca es ORIGEN de una redirección: ni las vivas ni las intermedias (marca nueva
  // con tipo antiguo) que deja un cambio hecho a mano o a medias; no fueron nunca una URL publicada.
  for (const r of existentes) {
    const esNuestra =
      PREFIJOS.some((p) => r.desde.startsWith(p)) && r.desde.includes("hitachi-landcros");
    if (!esNuestra && !nuevas.has(r.desde)) continue;
    log(`${modo === "aplicar" ? "quita" : "quitaría"} redirección sobrante: ${r.desde}`);
    quitadas += 1;
    if (modo === "aplicar") {
      await payload.delete({ collection: "redirects", id: r.id, overrideAccess: true });
    }
  }
  if (modo === "aplicar" && quitadas > 0) {
    existentes = (await todos("redirects")) as unknown as Redirect[];
  }

  // De cada URL antigua a su nueva.
  for (const [desde, hacia] of pares) {
    const r = existentes.find((x) => x.desde === desde);
    if (r?.hacia === hacia) continue;
    log(`${r ? "reapunta" : "crea"} 301: ${desde} → ${hacia}`);
    if (r) reapuntadas += 1;
    else creadas += 1;
    if (modo !== "aplicar") continue;
    if (r) {
      await payload.update({
        collection: "redirects",
        id: r.id,
        data: { hacia, tipo: "301" },
        overrideAccess: true,
      });
    } else {
      await payload.create({
        collection: "redirects",
        data: { desde, hacia, tipo: "301", origen: "cambio-de-slug", notas: NOTA },
        overrideAccess: true,
      });
    }
    if (!manifiesto.redirects.some((x) => x.desde === desde)) {
      // Si ya existía con otro destino, la retirada la devuelve a él en vez de borrarla.
      manifiesto.redirects.push({ desde, antes: r ? r.hacia : null, despues: hacia });
    }
    guardar();
  }

  // Las que ya apuntaban a una URL antigua (las del WordPress): directas a la nueva, sin cadenas.
  for (const r of existentes) {
    if (pares.has(r.desde) || /^https?:\/\//i.test(r.hacia)) continue;
    const hacia = reescribirRutas(r.hacia, pares);
    if (hacia === r.hacia) continue;
    log(`reapunta sin cadena: ${r.desde} → ${hacia} (antes ${r.hacia})`);
    reapuntadas += 1;
    if (modo !== "aplicar") continue;
    await payload.update({
      collection: "redirects",
      id: r.id,
      data: { hacia },
      overrideAccess: true,
    });
    if (!manifiesto.redirects.some((x) => x.desde === r.desde)) {
      manifiesto.redirects.push({ desde: r.desde, antes: r.hacia, despues: hacia });
    }
    guardar();
  }
  log(`redirecciones: ${creadas} por crear, ${reapuntadas} por reapuntar, ${quitadas} por quitar`);
}

// ---------------------------------------------------------------------------
// 4. Enlaces escritos en el panel
// ---------------------------------------------------------------------------
/** Sin enlaces que tocar: personas, redirecciones (paso 3), ficheros y la configuración del correo. */
const FUERA = new Set<string>([
  "users",
  "solicitudes",
  "redirects",
  "fuentes",
  "correo-formularios",
  "media",
  "videos",
  "animaciones",
  "documentos",
]);
const CLAVES_SISTEMA = new Set(["id", "createdAt", "updatedAt", "globalType", "slug", "slugPadre"]);
let camposCambiados = 0;

function cambiosDe(doc: Record<string, unknown>) {
  return Object.entries(doc).flatMap(([campo, antes]) => {
    if (CLAVES_SISTEMA.has(campo) || campo.startsWith("_")) return [];
    const despues = reescribirRutasProfundo(antes, pares);
    return igual(antes, despues) ? [] : [{ campo, antes, despues }];
  });
}

async function enlaces(): Promise<void> {
  const colecciones = (payload.config.collections ?? [])
    .map((c) => c.slug)
    .filter((s) => !s.startsWith("payload-") && !FUERA.has(s));
  for (const slug of colecciones) {
    for (const doc of await todos(slug as CollectionSlug)) {
      const cambios = cambiosDe(doc);
      if (cambios.length === 0) continue;
      for (const c of cambios) log(`${verbo} enlace en ${slug} ${doc.id} · ${c.campo}`);
      camposCambiados += cambios.length;
      if (modo !== "aplicar") continue;
      await payload.update({
        collection: slug as CollectionSlug,
        id: doc.id,
        data: Object.fromEntries(cambios.map((c) => [c.campo, c.despues])) as never,
        depth: 0,
        overrideAccess: true,
      });
      for (const c of cambios) manifiesto.campos.push({ sitio: slug, id: doc.id, ...c });
      guardar();
    }
  }
  const globales = (payload.config.globals ?? []).map((g) => g.slug).filter((s) => !FUERA.has(s));
  for (const slug of globales) {
    const doc = (await payload.findGlobal({
      slug: slug as GlobalSlug,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>;
    const cambios = cambiosDe(doc);
    if (cambios.length === 0) continue;
    for (const c of cambios) log(`${verbo} enlace en global ${slug} · ${c.campo}`);
    camposCambiados += cambios.length;
    if (modo !== "aplicar") continue;
    await payload.updateGlobal({
      slug: slug as GlobalSlug,
      data: Object.fromEntries(cambios.map((c) => [c.campo, c.despues])) as never,
      depth: 0,
      overrideAccess: true,
    });
    for (const c of cambios) manifiesto.campos.push({ sitio: slug, global: true, ...c });
    guardar();
  }
  log(`enlaces del panel: ${camposCambiados} campos`);
}

// ---------------------------------------------------------------------------
// 5. Lo que NO se toca, para que decida dirección
// ---------------------------------------------------------------------------
async function pendientes(): Promise<void> {
  const grupos: [CollectionSlug, string][] = [
    ["marcas-usada", "marca de usados"],
    ["equipos-usados", "unidades usadas"],
    ["articulos", "artículos del blog"],
  ];
  for (const [coleccion, nombre] of grupos) {
    const docs = (await todos(coleccion)).filter((d) => leFaltaLandcros(String(d.slug ?? "")));
    log(`SIN TOCAR (decide dirección) · ${nombre}: ${docs.length} direcciones con «hitachi»`);
    if (coleccion !== "equipos-usados") for (const d of docs) log(`  · ${String(d.slug)}`);
  }
}

async function aplicar(): Promise<void> {
  await planRepuestos();
  await planNueva();
  const antesDePares = manifiesto.pares.length;
  await cambiarSlugs();
  manifiesto.pares = [...pares];
  guardar();
  await redirecciones();
  await enlaces();
  await pendientes();
  const nuevosPares = pares.size - antesDePares;
  log(
    `TOTAL: ${slugs.length} direcciones, ${nuevosPares} URL nuevas con su 301 y ${camposCambiados} campos con enlaces`,
  );
  log(
    modo === "simular"
      ? "SIMULACIÓN: no se ha escrito nada."
      : "APLICADO. Después, POST /api/revalidar/.",
  );
}

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  // Enlaces.
  for (const c of [...manifiesto.campos].reverse()) {
    const doc = (c.global
      ? await payload.findGlobal({ slug: c.sitio as GlobalSlug, depth: 0, overrideAccess: true })
      : await payload
          .findByID({
            collection: c.sitio as CollectionSlug,
            id: c.id!,
            depth: 0,
            overrideAccess: true,
          })
          .catch(() => null)) as unknown as Record<string, unknown> | null;
    if (!doc || igual(doc[c.campo], c.antes)) continue;
    if (!igual(doc[c.campo], c.despues)) {
      log(`${c.sitio} ${c.id ?? ""} ${c.campo}: lo cambió alguien después; NO se toca`);
      continue;
    }
    const data = { [c.campo]: c.antes } as never;
    if (c.global) {
      await payload.updateGlobal({ slug: c.sitio as GlobalSlug, data, overrideAccess: true });
    } else {
      await payload.update({
        collection: c.sitio as CollectionSlug,
        id: c.id!,
        data,
        depth: 0,
        overrideAccess: true,
      });
    }
  }
  // Slugs, al revés: primero modelos y equipos, al final las marcas.
  const alReves = [...manifiesto.slugs].sort(
    (a, b) => ORDEN.indexOf(b.coleccion) - ORDEN.indexOf(a.coleccion),
  );
  for (const c of alReves) {
    const doc = (await payload
      .findByID({ collection: c.coleccion as CollectionSlug, id: c.id, depth: 0 })
      .catch(() => null)) as unknown as Doc | null;
    if (!doc || doc.slug === c.antes) continue;
    if (doc.slug !== c.despues) {
      log(`${c.coleccion} ${c.id}: su dirección la cambió alguien después; NO se toca`);
      continue;
    }
    await payload.update({
      collection: c.coleccion as CollectionSlug,
      id: c.id,
      data: { slug: c.antes } as never,
      depth: 0,
      overrideAccess: true,
      context: { [SIN_REDIRECT_AUTOMATICO]: true },
    });
  }
  // Redirecciones: fuera las del cambio (y las que crean los ganchos al volver), y las reapuntadas,
  // a su destino de antes.
  const antiguas = new Set(manifiesto.pares.map(([a]) => a));
  for (const r of (await todos("redirects")) as unknown as Redirect[]) {
    const tocada = manifiesto.redirects.find((x) => x.desde === r.desde);
    const delCambio =
      antiguas.has(r.desde) ||
      (PREFIJOS.some((p) => r.desde.startsWith(p)) && r.desde.includes("hitachi-landcros"));
    if (tocada?.antes) {
      if (r.hacia !== tocada.antes) {
        await payload.update({
          collection: "redirects",
          id: r.id,
          data: { hacia: tocada.antes },
          overrideAccess: true,
        });
      }
    } else if (delCambio) {
      await payload.delete({ collection: "redirects", id: r.id, overrideAccess: true });
    } else if (r.hacia.includes("hitachi-landcros")) {
      log(`  · OJO, queda una redirección hacia una URL nueva: ${r.desde} → ${r.hacia}`);
    }
  }
  log(
    `devuelto: ${manifiesto.slugs.length} direcciones, ${manifiesto.redirects.length} redirecciones y ${manifiesto.campos.length} campos`,
  );
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Después, POST /api/revalidar/.");
}

if (modo === "retirar") await retirar();
else await aplicar();
process.exit(0);
