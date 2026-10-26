/**
 * Siembra en el PREVIEW la muestra del «Kit de marca» de CASE (2026-10-25): sube las imágenes del
 * kit del cliente (fondo de la cabecera, emblema —el águila Old Abe— y el render de cada tipo) a
 * «Imágenes» y las asigna a la marca y a sus tipos; pone el diseño de la marca en «Kit de marca».
 *
 *   npm run preview:ejecutar -- payload run scripts/marca-kit/case-preview.ts sembrar
 *   npm run preview:ejecutar -- payload run scripts/marca-kit/case-preview.ts retirar
 *
 * SOLO EL PREVIEW (guarda de base y de Blob de `puedeTocarHeroDePrueba`, y guarda del almacén):
 * el águila Old Abe espera la confirmación del permiso por parte del cliente y las imágenes del
 * kit no entran a producción por aquí. Producción: runbook de dirección.
 *
 * MANIFIESTO fuera del repositorio. `retirar` deshace EXACTAMENTE lo sembrado: vacía los campos
 * que siguen apuntando a nuestras imágenes, devuelve el diseño a «Plantilla 1» y borra las
 * imágenes creadas (no toca nada que el panel haya cambiado después).
 *
 * Las imágenes se leen de la carpeta del kit (`KIT_MARCA_DIR`, por defecto
 * `Desktop/partequipos-diseno/kit-marca/public/partequipos/marcas/case`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.find((a) => a === "sembrar" || a === "retirar");
const fallar = (m: string): never => {
  const e = new Error(`[marca-kit] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
const log = (m: string) => process.stdout.write(`[marca-kit] ${m}\n`);
if (!modo) fallar("indica el modo: sembrar o retirar");

const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
exigirAlmacen("[marca-kit]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";

const ESCRITORIO = path.join(os.homedir(), "Desktop");
const CARPETA =
  process.env.KIT_MARCA_DIR ??
  path.join(
    ESCRITORIO,
    "partequipos-diseno",
    "kit-marca",
    "public",
    "partequipos",
    "marcas",
    "case",
  );
const MANIFIESTO = path.join(
  ESCRITORIO,
  "partequipos-cierre",
  "manifiesto-marca-kit-case-preview.json",
);
const SLUG_MARCA = "case-construction";

/** El render del kit de cada tipo y el slug del tipo de CASE al que va. */
const RENDERS: { fichero: string; tipo: string; nombre: string }[] = [
  { fichero: "bulldozer.png", tipo: "bulldozer", nombre: "Bulldozer" },
  { fichero: "cargador.png", tipo: "cargadores", nombre: "Cargador" },
  { fichero: "excavadora.png", tipo: "excavadoras", nombre: "Excavadora" },
  { fichero: "minicargador.png", tipo: "minicargadores-case", nombre: "Minicargador" },
  { fichero: "motoniveladora.png", tipo: "motoniveladoras-case", nombre: "Motoniveladora" },
  { fichero: "retrocargadora.png", tipo: "retrocargadoras", nombre: "Retrocargadora" },
  {
    fichero: "vibrocompactador.png",
    tipo: "vibrocompactador-case-sv208",
    nombre: "Vibrocompactador",
  },
];

type Manifiesto = {
  marca: number;
  media: { id: number; para: string; url: string }[];
};

const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const idDe = (x: unknown) =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;

const { docs: marcas } = await payload.find({
  collection: "marcas-maquinaria",
  where: { slug: { equals: SLUG_MARCA } },
  depth: 0,
  limit: 1,
  overrideAccess: true,
});
const marca = marcas[0] ?? fallar(`no existe la marca «${SLUG_MARCA}»`);

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
  const nuestras = new Set(m.media.map((x) => x.id));
  const datos: Record<string, unknown> = {};
  const kit = { ...(marca.kit ?? {}) };
  if (nuestras.has(idDe(kit.fotoCabecera) ?? -1)) kit.fotoCabecera = null;
  if (nuestras.has(idDe(kit.emblema) ?? -1)) {
    kit.emblema = null;
    kit.mostrarEmblema = false;
  }
  await payload.update({
    collection: "marcas-maquinaria",
    id: marca.id,
    data: { ...datos, disenoPagina: "plantilla1", kit },
    overrideAccess: true,
  });
  for (const r of RENDERS) {
    const { docs } = await payload.find({
      collection: "tipos-maquinaria",
      where: { slug: { equals: r.tipo } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });
    const t = docs[0];
    if (t && nuestras.has(idDe(t.render) ?? -1)) {
      await payload.update({
        collection: "tipos-maquinaria",
        id: t.id,
        data: { render: null },
        overrideAccess: true,
      });
    }
  }
  for (const x of m.media) {
    await payload.delete({ collection: "media", id: x.id, overrideAccess: true }).catch(() => null);
  }
  log(`retirado: ${m.media.length} imágenes borradas y la marca, en «Plantilla 1»`);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  process.exit(0);
}

if (fs.existsSync(MANIFIESTO)) fallar("ya hay un manifiesto: retira primero lo anterior");
const creadas: Manifiesto["media"] = [];
const subir = async (fichero: string, alt: string, para: string) => {
  const ruta = path.join(CARPETA, fichero.includes("/") ? fichero : fichero);
  if (!fs.existsSync(ruta)) fallar(`falta ${ruta}`);
  const doc = await payload.create({
    collection: "media",
    data: { alt },
    filePath: ruta,
    overrideAccess: true,
  });
  creadas.push({ id: doc.id, para, url: doc.url ?? "" });
  log(`subida ${path.basename(ruta)} → media ${doc.id}`);
  return doc.id;
};

try {
  const fondo = await subir(
    "fondo.jpg",
    "Foto de fondo de la cabecera de Case Construction",
    "fondo",
  );
  const emblema = await subir(
    "mascota-tinta.webp",
    "Emblema de Case Construction, el águila Old Abe",
    "emblema",
  );
  await payload.update({
    collection: "marcas-maquinaria",
    id: marca.id,
    data: { disenoPagina: "kit", kit: { fotoCabecera: fondo, emblema, mostrarEmblema: true } },
    overrideAccess: true,
  });
  for (const r of RENDERS) {
    const { docs } = await payload.find({
      collection: "tipos-maquinaria",
      where: { slug: { equals: r.tipo } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });
    const t = docs[0];
    if (!t) {
      log(`(no existe el tipo «${r.tipo}»: se salta)`);
      continue;
    }
    const id = await subir(
      `tipos/${r.fichero}`,
      `Render recortado de ${r.nombre} Case`,
      `tipo:${r.tipo}`,
    );
    await payload.update({
      collection: "tipos-maquinaria",
      id: t.id,
      data: { render: id },
      overrideAccess: true,
    });
  }
} finally {
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify({ marca: marca.id, media: creadas }, null, 2));
}
log(
  "✓ Case con el «Kit de marca» en el preview. Falta refrescar la página (guardar en el panel o redesplegar).",
);
process.exit(0);
