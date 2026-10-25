/**
 * «COMPACTADOR» → «VIBROCOMPACTADOR» EN LOS DATOS DEL PANEL (decisión del cliente, 2026-10-25). Las
 * reglas están en `src/lib/nueva/vibrocompactador.ts`; las URL (slugs) NO cambian (se comprueba).
 *
 *   npm run preview:ejecutar -- payload run scripts/nueva/vibrocompactador.ts <modo> <destino>
 *
 *   modo:     simular | aplicar | retirar
 *   destino:  preview | produccion (solo dirección, con runbook)
 *
 * Qué toca:
 * - NOMBRES (singular y mayúscula en cada palabra): categorías de nueva y de usados, tipos de nueva,
 *   equipos nuevos y usados.
 * - TEXTOS (solo la palabra): descripciones, entradillas, título y descripción para buscadores
 *   escritos a mano, títulos de documentos (PDF), textos alternativos de «Imágenes» y artículos.
 * - Una categoría OCULTA cuyo nombre nuevo chocaría con el de otra no se renombra (no puede haber dos
 *   páginas con el mismo nombre); se avisa.
 *
 * Idempotente. El manifiesto guarda el valor de antes y el de después de cada campo; la retirada
 * devuelve el de antes solo si el campo sigue con el de después. NO refresca el sitio: después,
 * `POST /api/revalidar/`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload, type CollectionSlug } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import {
  aVibrocompactadorNombre,
  aVibrocompactadorRico,
  aVibrocompactadorTexto,
  avisoNoVibratorio,
} from "../../src/lib/nueva/vibrocompactador";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[vibrocompactador] ✗ ${m}`);
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
else exigirAlmacen("[vibrocompactador]");

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  `manifiesto-vibrocompactador-${destino}.json`,
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
const log = (m: string) => process.stdout.write(`[vibrocompactador] ${m}\n`);

type Tipo = "nombre" | "texto" | "rico";
/** Un campo; `seo.metaTitle` es el subcampo de un grupo. */
type Campo = { ruta: string; tipo: Tipo };
const SEO: Campo[] = [
  { ruta: "seo.metaTitle", tipo: "texto" },
  { ruta: "seo.metaDescription", tipo: "texto" },
];
const COLECCIONES: { slug: CollectionSlug; campos: Campo[]; categoria?: boolean }[] = [
  {
    slug: "categorias-maquinaria",
    categoria: true,
    campos: [{ ruta: "nombre", tipo: "nombre" }, { ruta: "descripcion", tipo: "texto" }, ...SEO],
  },
  {
    slug: "categorias-usada",
    categoria: true,
    campos: [{ ruta: "nombre", tipo: "nombre" }, { ruta: "descripcion", tipo: "texto" }, ...SEO],
  },
  {
    slug: "tipos-maquinaria",
    campos: [{ ruta: "nombre", tipo: "nombre" }, { ruta: "descripcion", tipo: "texto" }, ...SEO],
  },
  {
    slug: "equipos-nuevos",
    campos: [
      { ruta: "nombre", tipo: "nombre" },
      { ruta: "entradilla", tipo: "texto" },
      { ruta: "descripcion", tipo: "rico" },
      ...SEO,
    ],
  },
  {
    slug: "equipos-usados",
    campos: [{ ruta: "nombre", tipo: "nombre" }, { ruta: "descripcion", tipo: "texto" }, ...SEO],
  },
  { slug: "documentos", campos: [{ ruta: "titulo", tipo: "texto" }] },
  { slug: "media", campos: [{ ruta: "alt", tipo: "texto" }] },
  {
    slug: "articulos",
    campos: [
      { ruta: "titulo", tipo: "texto" },
      { ruta: "entradilla", tipo: "texto" },
      { ruta: "contenido", tipo: "rico" },
      ...SEO,
    ],
  },
];

type Cambio = {
  coleccion: CollectionSlug;
  id: number;
  ruta: string;
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

type Doc = Record<string, unknown> & { id: number };
const leer = (doc: Doc, ruta: string): unknown =>
  ruta
    .split(".")
    .reduce<unknown>((v, k) => (v && typeof v === "object" ? (v as Doc)[k] : undefined), doc);
/** Los datos de `update` para poner `valor` en `ruta`, con el grupo entero (Payload no mezcla grupos). */
function datosPara(doc: Doc, ruta: string, valor: unknown): Record<string, unknown> {
  const [raiz, sub] = ruta.split(".");
  if (!sub) return { [raiz!]: valor };
  const grupo = (doc[raiz!] && typeof doc[raiz!] === "object" ? doc[raiz!] : {}) as Doc;
  return { [raiz!]: { ...grupo, [sub]: valor } };
}
const transformar = (tipo: Tipo, v: unknown): unknown =>
  tipo === "rico"
    ? v && typeof v === "object"
      ? aVibrocompactadorRico(v)
      : v
    : typeof v === "string"
      ? tipo === "nombre"
        ? aVibrocompactadorNombre(v)
        : aVibrocompactadorTexto(v)
      : v;
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const corto = (v: unknown) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").slice(0, 110) : "(texto enriquecido)";

async function todos(slug: CollectionSlug): Promise<Doc[]> {
  // `media` es grande: solo las que nombran la palabra en el texto alternativo.
  const where = slug === "media" ? { alt: { contains: "compactador" } } : undefined;
  const r = await payload.find({
    collection: slug,
    where,
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });
  return r.docs as unknown as Doc[];
}

async function aplicar(): Promise<void> {
  let total = 0;
  for (const col of COLECCIONES) {
    const docs = await todos(col.slug);
    // Nombres nuevos de las categorías, para no dejar dos con el mismo nombre.
    const nombreFinal = new Map<number, string>();
    if (col.categoria) {
      for (const d of docs) nombreFinal.set(d.id, transformar("nombre", d.nombre) as string);
    }
    let enColeccion = 0;
    for (const doc of docs) {
      for (const campo of col.campos) {
        const antes = leer(doc, campo.ruta);
        const despues = transformar(campo.tipo, antes);
        if (antes == null || igual(antes, despues)) continue;
        if (col.categoria && campo.ruta === "nombre") {
          const choca = docs.some(
            (o) =>
              o.id !== doc.id &&
              String(nombreFinal.get(o.id)).toLowerCase() === String(despues).toLowerCase(),
          );
          if (choca) {
            if (doc.mostrarEnWeb === false) {
              log(
                `${col.slug} ${doc.id} «${String(antes)}»: NO se renombra (oculta y chocaría con otra «${String(despues)}»)`,
              );
              nombreFinal.set(doc.id, String(antes));
              continue;
            }
            const otra = docs.find(
              (o) =>
                o.id !== doc.id &&
                String(nombreFinal.get(o.id)).toLowerCase() === String(despues).toLowerCase(),
            );
            if (otra && otra.mostrarEnWeb !== false) {
              fallar(
                `${col.slug}: «${String(antes)}» y otra visible acabarían las dos como «${String(despues)}»`,
              );
            }
          }
        }
        const aviso = avisoNoVibratorio(`${String(doc.nombre ?? "")} ${corto(antes)}`);
        log(
          `${modo === "simular" ? "cambiaría" : "cambia"} ${col.slug} ${doc.id} ${campo.ruta}: «${corto(antes)}» → «${corto(despues)}»${aviso ? `  ⚠ ${aviso}` : ""}`,
        );
        total += 1;
        enColeccion += 1;
        if (modo !== "aplicar") continue;
        const slugAntes = doc.slug;
        const nuevo = (await payload.update({
          collection: col.slug,
          id: doc.id,
          data: datosPara(doc, campo.ruta, despues) as never,
          depth: 0,
          overrideAccess: true,
        })) as unknown as Doc;
        if (slugAntes !== undefined && nuevo.slug !== slugAntes) {
          fallar(
            `${col.slug} ${doc.id}: la dirección cambió (${String(slugAntes)} → ${String(nuevo.slug)})`,
          );
        }
        manifiesto.cambios.push({
          coleccion: col.slug,
          id: doc.id,
          ruta: campo.ruta,
          antes,
          despues,
        });
        guardar();
        Object.assign(doc, nuevo);
      }
    }
    log(`${col.slug}: ${enColeccion} campos`);
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
  // Al revés, por si un mismo campo cambió dos veces.
  for (const c of [...manifiesto.cambios].reverse()) {
    const doc = (await payload
      .findByID({ collection: c.coleccion, id: c.id, depth: 0, overrideAccess: true })
      .catch(() => null)) as unknown as Doc | null;
    if (!doc) {
      log(`${c.coleccion} ${c.id}: ya no existe, se salta`);
      continue;
    }
    if (!igual(leer(doc, c.ruta), c.despues)) {
      log(`${c.coleccion} ${c.id} ${c.ruta}: lo cambió alguien después; NO se toca`);
      continue;
    }
    await payload.update({
      collection: c.coleccion,
      id: c.id,
      data: datosPara(doc, c.ruta, c.antes) as never,
      depth: 0,
      overrideAccess: true,
    });
    devueltos += 1;
  }
  log(`campos devueltos a su valor de antes: ${devueltos} de ${manifiesto.cambios.length}`);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Después, POST /api/revalidar/.");
}

if (modo === "retirar") await retirar();
else await aplicar();
process.exit(0);
