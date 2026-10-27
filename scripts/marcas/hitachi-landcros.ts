/**
 * «HITACHI» → «HITACHI LANDCROS» EN LOS DATOS DEL PANEL (decisión del cliente, 2026-10-26). La regla
 * está en `src/lib/marca/hitachiLandcros.ts`; las URL (slugs) NO cambian (se comprueba y para).
 *
 *   npm run preview:ejecutar -- payload run scripts/marcas/hitachi-landcros.ts <modo> <destino>
 *
 *   modo:     simular | aplicar | retirar
 *   destino:  preview | produccion (solo dirección, con runbook)
 *
 * Qué toca: TODOS los textos de todas las colecciones y globales del contenido (nombres, descripciones,
 * títulos y descripciones para buscadores escritos a mano, textos alternativos, títulos de documentos,
 * artículos, filas de fichas y listas…), salvo direcciones, ficheros y anclas. No toca Usuarios,
 * Solicitudes, Redirecciones, Fuentes ni «Correo y formularios». Las marcas van primero: el texto de la
 * marca de una unidad usada se iguala al nombre de su marca al guardarla.
 *
 * Idempotente. El manifiesto guarda el valor de antes y el de después de cada campo; la retirada
 * devuelve el de antes solo si el campo sigue con el de después. NO refresca el sitio: después,
 * `POST /api/revalidar/`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload, type CollectionSlug, type GlobalSlug } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import {
  aHitachiLandcrosProfundo,
  esModeloAntiguoHitachi,
} from "../../src/lib/marca/hitachiLandcros";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[hitachi-landcros] ✗ ${m}`);
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
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
// Cambiar el texto alternativo de una imagen pasa por la guarda del almacén de `media`.
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[hitachi-landcros]");

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  `manifiesto-hitachi-landcros-${destino}.json`,
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
const log = (m: string) => process.stdout.write(`[hitachi-landcros] ${m}\n`);

/** Lo que nunca se toca: datos de personas, direcciones, ficheros de fuentes y la configuración del correo. */
const FUERA = new Set<string>([
  "users",
  "solicitudes",
  "redirects",
  "fuentes",
  "correo-formularios",
]);
/** Primero las marcas (el texto de marca de las unidades usadas sigue al nombre de su marca). */
const PRIMERO = ["marcas", "marcas-maquinaria", "marcas-usada"];
const CLAVES_SISTEMA = new Set(["id", "createdAt", "updatedAt", "globalType", "slug", "slugPadre"]);

type Doc = Record<string, unknown> & { id?: number };
type Cambio = {
  /** Colección o global. */
  sitio: string;
  global?: true;
  id?: number;
  campo: string;
  antes: unknown;
  despues: unknown;
};
type Manifiesto = { destino: string; cambios: Cambio[] };
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, cambios: [] };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** Los textos de un valor que nombran la marca, para enseñarlos en una línea. */
function textos(v: unknown, fuera: string[] = []): string[] {
  if (typeof v === "string") {
    if (/hitachi|landcros/i.test(v)) fuera.push(v);
  } else if (Array.isArray(v)) v.forEach((x) => textos(x, fuera));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => textos(x, fuera));
  return fuera;
}
const corto = (s: string) => s.replace(/\s+/g, " ").slice(0, 140);
/** Pares «antes → después» de los textos que cambian dentro de un campo. */
function diferencias(antes: unknown, despues: unknown): string[] {
  const a = textos(antes);
  const d = textos(despues);
  return a.flatMap((t, i) => (t !== d[i] ? [`«${corto(t)}» → «${corto(d[i] ?? "")}»`] : []));
}

const colecciones = (payload.config.collections ?? [])
  .map((c) => c.slug)
  .filter((s) => !s.startsWith("payload-") && !FUERA.has(s))
  .sort((a, b) => {
    const pa = PRIMERO.indexOf(a);
    const pb = PRIMERO.indexOf(b);
    return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
  });
const globales = (payload.config.globals ?? []).map((g) => g.slug).filter((s) => !FUERA.has(s));

/** Los campos de primer nivel de `doc` que cambian, con su valor nuevo. */
function cambiosDe(doc: Doc): { campo: string; antes: unknown; despues: unknown }[] {
  return Object.entries(doc).flatMap(([campo, antes]) => {
    if (CLAVES_SISTEMA.has(campo) || campo.startsWith("_")) return [];
    const despues = aHitachiLandcrosProfundo(antes, campo);
    return igual(antes, despues) ? [] : [{ campo, antes, despues }];
  });
}

/** Claves donde es normal que la marca siga igual (direcciones y ficheros): no se listan. */
const ESPERADAS = /^(slug|slugPadre|url|filename|thumbnailURL|sizes)$/;
/** Lo que queda nombrando «Hitachi» sin «LANDCROS» después del cambio, fuera de las claves esperadas. */
function sinCambiar(v: unknown, clave = "", fuera: string[] = []): string[] {
  if (ESPERADAS.test(clave)) return fuera;
  if (typeof v === "string") {
    if (/hitachi/i.test(v.replace(/Hitachi LANDCROS/g, ""))) fuera.push(`${clave}: ${v}`);
  } else if (Array.isArray(v)) v.forEach((x) => sinCambiar(x, clave, fuera));
  else if (v && typeof v === "object") {
    Object.entries(v).forEach(([k, x]) => sinCambiar(x, k, fuera));
  }
  return fuera;
}

const antiguos: string[] = [];
let total = 0;

async function aplicarColeccion(slug: CollectionSlug): Promise<void> {
  const { docs } = await payload.find({
    collection: slug,
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });
  let campos = 0;
  for (const doc of docs as unknown as Doc[]) {
    const cambios = cambiosDe(doc);
    for (const t of sinCambiar(aHitachiLandcrosProfundo(doc)))
      log(`  · se queda ${slug} ${doc.id} ${corto(t)}`);
    if (cambios.length === 0) continue;
    if (slug === "modelos-repuesto" && esModeloAntiguoHitachi(doc.codigo as string | undefined)) {
      antiguos.push(
        `${doc.id} · ${String(doc.nombre ?? "")} (${String(doc.codigo ?? "")}) · ${String(doc.slug ?? "")}`,
      );
    }
    for (const c of cambios) {
      for (const d of diferencias(c.antes, c.despues)) {
        log(`${modo === "aplicar" ? "cambia" : "cambiaría"} ${slug} ${doc.id} ${c.campo}: ${d}`);
      }
    }
    campos += cambios.length;
    if (modo !== "aplicar") continue;
    const slugAntes = doc.slug;
    const nuevo = (await payload.update({
      collection: slug,
      id: doc.id!,
      data: Object.fromEntries(cambios.map((c) => [c.campo, c.despues])) as never,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Doc;
    if (slugAntes !== undefined && nuevo.slug !== slugAntes) {
      fallar(
        `${slug} ${doc.id}: la dirección cambió (${String(slugAntes)} → ${String(nuevo.slug)})`,
      );
    }
    for (const c of cambios) {
      manifiesto.cambios.push({
        sitio: slug,
        id: doc.id,
        campo: c.campo,
        antes: c.antes,
        despues: c.despues,
      });
    }
    guardar();
  }
  if (campos > 0) log(`${slug}: ${campos} campos`);
  total += campos;
}

async function aplicarGlobal(slug: GlobalSlug): Promise<void> {
  const doc = (await payload.findGlobal({
    slug,
    depth: 0,
    overrideAccess: true,
  })) as unknown as Doc;
  const cambios = cambiosDe(doc);
  for (const t of sinCambiar(aHitachiLandcrosProfundo(doc)))
    log(`  · se queda global ${slug} ${corto(t)}`);
  if (cambios.length === 0) return;
  for (const c of cambios) {
    for (const d of diferencias(c.antes, c.despues)) {
      log(`${modo === "aplicar" ? "cambia" : "cambiaría"} global ${slug} ${c.campo}: ${d}`);
    }
  }
  total += cambios.length;
  log(`global ${slug}: ${cambios.length} campos`);
  if (modo !== "aplicar") return;
  await payload.updateGlobal({
    slug,
    data: Object.fromEntries(cambios.map((c) => [c.campo, c.despues])) as never,
    depth: 0,
    overrideAccess: true,
  });
  for (const c of cambios) {
    manifiesto.cambios.push({
      sitio: slug,
      global: true,
      campo: c.campo,
      antes: c.antes,
      despues: c.despues,
    });
  }
  guardar();
}

async function aplicar(): Promise<void> {
  for (const slug of colecciones) await aplicarColeccion(slug as CollectionSlug);
  for (const slug of globales) await aplicarGlobal(slug as GlobalSlug);
  if (antiguos.length > 0) {
    log(
      `MODELOS ANTIGUOS de repuestos (no ZAXIS), para que decida el cliente; se cambian igual: ${antiguos.length}`,
    );
    for (const a of antiguos) log(`  antiguo: ${a}`);
  }
  log(`${total} campos por cambiar`);
  log(
    modo === "simular"
      ? "SIMULACIÓN: no se ha escrito nada."
      : "APLICADO. Después, POST /api/revalidar/.",
  );
}

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  let devueltos = 0;
  // Las marcas PRIMERO (al guardar una unidad usada, su texto de marca se iguala al nombre de su
  // marca); después el resto, al revés, por si un mismo campo cambió dos veces.
  const alReves = [...manifiesto.cambios].reverse();
  const orden = [
    ...alReves.filter((c) => PRIMERO.includes(c.sitio)),
    ...alReves.filter((c) => !PRIMERO.includes(c.sitio)),
  ];
  for (const c of orden) {
    const doc = (c.global
      ? await payload.findGlobal({ slug: c.sitio as GlobalSlug, depth: 0, overrideAccess: true })
      : await payload
          .findByID({
            collection: c.sitio as CollectionSlug,
            id: c.id!,
            depth: 0,
            overrideAccess: true,
          })
          .catch(() => null)) as unknown as Doc | null;
    if (!doc) {
      log(`${c.sitio} ${c.id}: ya no existe, se salta`);
      continue;
    }
    if (!igual(doc[c.campo], c.despues)) {
      log(`${c.sitio} ${c.id ?? ""} ${c.campo}: lo cambió alguien después; NO se toca`);
      continue;
    }
    const data = { [c.campo]: c.antes } as never;
    if (c.global) {
      await payload.updateGlobal({
        slug: c.sitio as GlobalSlug,
        data,
        depth: 0,
        overrideAccess: true,
      });
    } else {
      await payload.update({
        collection: c.sitio as CollectionSlug,
        id: c.id!,
        data,
        depth: 0,
        overrideAccess: true,
      });
    }
    devueltos += 1;
  }
  log(`campos devueltos a su valor de antes: ${devueltos} de ${manifiesto.cambios.length}`);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Después, POST /api/revalidar/.");
}

if (modo === "retirar") await retirar();
else await aplicar();
process.exit(0);
