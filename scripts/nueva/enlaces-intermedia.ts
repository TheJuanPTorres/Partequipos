/**
 * ENLACES DE DATOS A LA ANTIGUA PÁGINA INTERMEDIA DE NUEVA (2026-10-23, cliente): desde el
 * 2026-10-23 `/maquinaria-pesada/maquinaria-pesada-nueva/` da 301 a `…/tipos/`. Los enlaces del
 * CÓDIGO ya van directos; este script busca los que son DATOS del panel (pie, «Páginas índice y
 * contacto», páginas como Nosotros o la portada…) y, en el preview, los cambia a `/tipos/`: lo
 * mismo que hará Juan Pablo desde el panel del sitio publicado (`runbook-nueva-paginas-generales.md`).
 *
 *   npm run preview:ejecutar -- payload run scripts/nueva/enlaces-intermedia.ts buscar
 *   npm run preview:ejecutar -- payload run scripts/nueva/enlaces-intermedia.ts aplicar
 *   npm run preview:ejecutar -- payload run scripts/nueva/enlaces-intermedia.ts retirar
 *
 * Recorre TODO el documento (también el texto enriquecido): cualquier texto que sea la URL de la
 * página intermedia, con o sin barra final o con el dominio delante. `buscar` solo lee. `aplicar`
 * guarda en un manifiesto cada valor que cambia; `retirar` lo devuelve. Solo el preview.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload, type CollectionSlug, type GlobalSlug } from "payload";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const fallar = (m: string): never => {
  const e = new Error(`[enlaces] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
const modo = process.argv
  .slice(2)
  .find((a) => a === "buscar" || a === "aplicar" || a === "retirar");
if (!modo) fallar("indica el modo: buscar, aplicar o retirar");
const guarda = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!guarda.permitido) fallar(`NO se hace nada: ${guarda.motivo}`);

const INTERMEDIA = /^(https?:\/\/[^/]+)?\/maquinaria-pesada\/maquinaria-pesada-nueva\/?$/;
const TIPOS = "/maquinaria-pesada/maquinaria-pesada-nueva/tipos/";
const GLOBALES: GlobalSlug[] = [
  "cabecera",
  "pie",
  "paginas-indice",
  "seo",
  "repuestos-marca",
  "ficha-producto",
];
const COLECCIONES: CollectionSlug[] = [
  "paginas",
  "articulos",
  "testimonios",
  "preguntas-frecuentes",
];

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-nueva-enlaces-intermedia-preview.json",
);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[enlaces] ${m}\n`);

type Cambio = { donde: string; ruta: (string | number)[]; antes: string };

/** Las rutas dentro de `v` cuyo texto es la URL de la página intermedia. */
function buscarEn(v: unknown, ruta: (string | number)[] = []): Cambio[] {
  if (typeof v === "string")
    return INTERMEDIA.test(v.trim()) ? [{ donde: "", ruta, antes: v }] : [];
  if (Array.isArray(v)) return v.flatMap((x, i) => buscarEn(x, [...ruta, i]));
  if (v && typeof v === "object")
    return Object.entries(v).flatMap(([k, x]) => buscarEn(x, [...ruta, k]));
  return [];
}

function poner(doc: Record<string, unknown>, ruta: (string | number)[], valor: string) {
  let nodo: Record<string | number, unknown> = doc;
  for (const k of ruta.slice(0, -1)) nodo = nodo[k] as Record<string | number, unknown>;
  nodo[ruta.at(-1)!] = valor;
}

/** Los campos de primer nivel que se tocan (Payload actualiza por campo). */
const camposDe = (doc: Record<string, unknown>, cambios: Cambio[]) =>
  Object.fromEntries([...new Set(cambios.map((c) => String(c.ruta[0])))].map((k) => [k, doc[k]]));

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no existe ${MANIFIESTO}: nada que retirar`);
  const cambios = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Cambio[];
  const porDonde = Map.groupBy(cambios, (c) => c.donde);
  for (const [donde, suyos] of porDonde) {
    const [tipo, slug, id] = donde.split(":");
    const doc = (tipo === "global"
      ? await payload.findGlobal({ slug: slug as GlobalSlug, depth: 0 })
      : await payload.findByID({
          collection: slug as CollectionSlug,
          id: Number(id),
          depth: 0,
        })) as unknown as Record<string, unknown>;
    for (const c of suyos) poner(doc, c.ruta, c.antes);
    const data = camposDe(doc, suyos);
    if (tipo === "global") await payload.updateGlobal({ slug: slug as GlobalSlug, data });
    else await payload.update({ collection: slug as CollectionSlug, id: Number(id), data });
    log(`✓ ${donde}: ${suyos.length} devueltos`);
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
} else {
  if (modo === "aplicar" && fs.existsSync(MANIFIESTO))
    fallar(`ya existe ${MANIFIESTO}: retira antes de volver a aplicar`);
  const todos: Cambio[] = [];
  const tratar = async (
    donde: string,
    doc: Record<string, unknown>,
    guardar: (data: Record<string, unknown>) => Promise<unknown>,
  ) => {
    const cambios = buscarEn(doc).map((c) => ({ ...c, donde }));
    for (const c of cambios) log(`${donde}  ${c.ruta.join(".")}  «${c.antes}»`);
    if (modo !== "aplicar" || cambios.length === 0) return;
    for (const c of cambios) poner(doc, c.ruta, TIPOS);
    todos.push(...cambios);
    fs.writeFileSync(MANIFIESTO, JSON.stringify(todos, null, 2));
    await guardar(camposDe(doc, cambios));
    log(`✓ ${donde}: ${cambios.length} cambiados a ${TIPOS}`);
  };
  for (const slug of GLOBALES) {
    const doc = (await payload.findGlobal({ slug, depth: 0 })) as unknown as Record<
      string,
      unknown
    >;
    await tratar(`global:${slug}`, doc, (data) => payload.updateGlobal({ slug, data }));
  }
  for (const collection of COLECCIONES) {
    const { docs } = await payload.find({ collection, limit: 0, depth: 0, pagination: false });
    for (const d of docs as unknown as Record<string, unknown>[]) {
      const id = Number(d.id);
      await tratar(`col:${collection}:${id}`, d, (data) =>
        payload.update({ collection, id, data }),
      );
    }
  }
  log(`${modo === "aplicar" ? "cambiados" : "encontrados"}: ${todos.length || "ver arriba"}`);
}
