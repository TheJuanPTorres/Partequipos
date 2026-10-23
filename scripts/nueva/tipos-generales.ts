/**
 * PÁGINAS GENERALES DE TIPO DE MAQUINARIA NUEVA EN EL PREVIEW (2026-10-23, dirección, tarea 9):
 * lo mismo que hará Juan Pablo desde el panel del sitio publicado (`runbook-nueva-paginas-generales.md`),
 * para probarlo antes. Crea las 6 categorías de nueva que faltan —una por tipo, con los tipos que
 * agrupa—, para que «Por tipo de máquina» y el índice de tipos lleven siempre a la página GENERAL
 * del tipo (la plantilla de las categorías que mezclan marcas, #326), aunque hoy solo tenga una.
 *
 *   npm run preview:ejecutar -- payload run scripts/nueva/tipos-generales.ts listar
 *   npm run preview:ejecutar -- payload run scripts/nueva/tipos-generales.ts aplicar
 *   npm run preview:ejecutar -- payload run scripts/nueva/tipos-generales.ts retirar
 *   npm run preview:ejecutar -- payload run scripts/nueva/tipos-generales.ts probar-guarda
 *
 * `probar-guarda` comprueba por su efecto que el panel no deja crear una categoría tapada por una
 * redirección: crea un 301 de prueba, intenta la categoría (debe fallar con el mensaje) y lo borra.
 * `listar` solo lee (tipos con su marca y sus equipos, categorías y redirecciones de nueva).
 * `aplicar` guarda en un manifiesto lo que crea; `retirar` borra exactamente eso. Solo el preview
 * (guarda del hero de prueba).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const fallar = (m: string): never => {
  const e = new Error(`[tipos] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
const modo = process.argv
  .slice(2)
  .find((a) => ["listar", "aplicar", "retirar", "probar-guarda"].includes(a));
if (!modo) fallar("indica el modo: listar, aplicar, retirar o probar-guarda");
const guarda = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!guarda.permitido) fallar(`NO se hace nada: ${guarda.motivo}`);

/** Las 6 que faltan: nombre, dirección web y los tipos que agrupa (marca/tipo, por dirección). */
export const PAGINAS_GENERALES = [
  { nombre: "Bulldozers", slug: "bulldozers", tipos: ["case-construction/bulldozer"] },
  {
    nombre: "Motoniveladoras",
    slug: "motoniveladoras",
    tipos: ["case-construction/motoniveladoras-case"],
  },
  { nombre: "Miniexcavadoras", slug: "miniexcavadoras", tipos: ["yanmar/miniexcavadoras"] },
  {
    nombre: "Minicargadores",
    slug: "minicargadores",
    tipos: ["case-construction/minicargadores-case"],
  },
  {
    nombre: "Retrocargadoras",
    slug: "retrocargadoras",
    tipos: ["case-construction/retrocargadoras"],
  },
  // Como «Compactadores»: el tipo paraguas y los que agrupa (los equipos están en estos).
  {
    nombre: "Pavimentadoras",
    slug: "pavimentadoras",
    tipos: ["dynapac/pavimentadoras", "dynapac/pavimentadoras-dynapac", "dynapac/reglas-dynapac"],
  },
] as const;

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-nueva-paginas-generales-preview.json",
);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[tipos] ${m}\n`);

const idDe = (v: number | { id: number } | null | undefined) =>
  typeof v === "number" ? v : (v?.id ?? null);

const marcas = await payload.find({ collection: "marcas-maquinaria", limit: 0, depth: 0 });
const slugMarca = new Map(marcas.docs.map((m) => [m.id, m.slug]));
const tipos = await payload.find({ collection: "tipos-maquinaria", limit: 0, depth: 0 });
const idTipo = new Map(
  tipos.docs.map((t) => [`${slugMarca.get(idDe(t.marca) ?? -1)}/${t.slug}`, t.id]),
);

if (modo === "probar-guarda") {
  const SLUG = "prueba-guarda-redireccion";
  const red = await payload.create({
    collection: "redirects",
    data: {
      desde: `/maquinaria-pesada/maquinaria-pesada-nueva/${SLUG}/`,
      hacia: "/maquinaria-pesada/maquinaria-pesada-nueva/tipos/",
      tipo: "301",
      origen: "manual",
    },
  });
  let mensaje = "";
  try {
    const c = await payload.create({
      collection: "categorias-maquinaria",
      data: { nombre: "PRUEBA guarda", slug: SLUG },
    });
    await payload.delete({ collection: "categorias-maquinaria", id: c.id });
  } catch (e) {
    mensaje =
      e instanceof Error ? JSON.stringify((e as { data?: unknown }).data ?? e.message) : String(e);
  } finally {
    await payload.delete({ collection: "redirects", id: red.id });
  }
  const sinRed = await payload.create({
    collection: "categorias-maquinaria",
    data: { nombre: "PRUEBA guarda", slug: SLUG },
  });
  await payload.delete({ collection: "categorias-maquinaria", id: sinRed.id });
  if (!mensaje.includes("taparía")) fallar(`la categoría se creó con el 301 delante: ${mensaje}`);
  log(`✓ con el 301, rechazada: ${mensaje}`);
  log("✓ sin el 301, se crea (y se borra); el 301 de prueba, borrado");
} else if (modo === "listar") {
  const equipos = await payload.find({
    collection: "equipos-nuevos",
    limit: 0,
    depth: 0,
    select: { tipo: true },
  });
  const cuenta = new Map<number, number>();
  for (const e of equipos.docs) {
    const t = idDe(e.tipo);
    if (t) cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
  }
  log("tipos (id, marca/dirección, nombre, equipos, casilla):");
  for (const t of tipos.docs)
    log(
      `  ${t.id}  ${slugMarca.get(idDe(t.marca) ?? -1)}/${t.slug}  «${t.nombre}»  ${cuenta.get(t.id) ?? 0}  ${t.pestanaIndiceNueva ? "sí" : "no"}`,
    );
  const cats = await payload.find({ collection: "categorias-maquinaria", limit: 0, depth: 0 });
  log("categorías (id, dirección, nombre, tipos):");
  for (const c of cats.docs)
    log(
      `  ${c.id}  ${c.slug}  «${c.nombre}»  ${JSON.stringify((c.tiposIncluidos ?? []).map(idDe))}`,
    );
  const red = await payload.find({
    collection: "redirects",
    limit: 0,
    depth: 0,
    where: { desde: { contains: "maquinaria-pesada-nueva" } },
  });
  log("redirecciones de nueva:");
  for (const r of red.docs) log(`  ${r.id}  ${r.desde} -> ${r.hacia}`);
} else if (modo === "aplicar") {
  if (fs.existsSync(MANIFIESTO))
    fallar(`ya existe ${MANIFIESTO}: retira antes de volver a aplicar`);
  const plan = PAGINAS_GENERALES.map((p) => ({
    ...p,
    ids: p.tipos.map((t) => idTipo.get(t) ?? fallar(`no existe el tipo ${t}`)),
  }));
  const creadas: number[] = [];
  for (const p of plan) {
    const c = await payload.create({
      collection: "categorias-maquinaria",
      data: { nombre: p.nombre, slug: p.slug, tiposIncluidos: p.ids },
    });
    creadas.push(c.id);
    fs.writeFileSync(MANIFIESTO, JSON.stringify({ categorias: creadas }, null, 2));
    log(`✓ «${p.nombre}» (${c.id}): /maquinaria-pesada/maquinaria-pesada-nueva/${p.slug}/`);
  }
  log(`✓ ${creadas.length} categorías; manifiesto ${MANIFIESTO}`);
} else {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no existe ${MANIFIESTO}: nada que retirar`);
  const { categorias } = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as {
    categorias: number[];
  };
  for (const id of categorias) {
    await payload.delete({ collection: "categorias-maquinaria", id });
    log(`✓ categoría ${id} borrada`);
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
}
