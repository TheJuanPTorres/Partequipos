/**
 * FOTO DE «¿POR QUÉ ELEGIRNOS?» de la plantilla de Andrés (2026-10-19, MUESTRA).
 *
 *   npx payload run scripts/repuestos/por-que-foto.ts <modo> <destino> [fichero=<jpg>] [manifiesto=<json>]
 *
 *   modo:     aplicar | retirar
 *   destino:  preview | prueba   (producción NO: la licencia de la foto de Andrés, L3, está pendiente)
 *
 * Sube la foto de la plantilla (`Desktop/partequipos-diseno/wordpress/ficha-repuesto/por-que.jpg`) a
 * «Imágenes» y la elige en el campo «¿Por qué elegirnos?: foto» del global de repuestos; `retirar`
 * deja el campo como estaba y borra la foto. Solo el preview (CLAUDE.md §10.38: las fotos de Andrés
 * no pasan a producción sin licencia). Argumentos POSICIONALES.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "prueba" || a === "produccion");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[por-que-foto] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: aplicar o retirar");
if (!destino) fallar("indica el destino: preview o prueba");
if (destino === "produccion") fallar("la foto de Andrés (licencia L3) no va a producción");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[por-que-foto]");

const NOMBRE = "ejemplo-andres-por-que-elegirnos.jpg";
const MANIFIESTO =
  valorDe("manifiesto") ??
  path.join(
    os.homedir(),
    "Desktop",
    "partequipos-cierre",
    `manifiesto-por-que-foto-${destino}.json`,
  );
const FICHERO =
  valorDe("fichero") ??
  path.join(
    os.homedir(),
    "Desktop",
    "partequipos-diseno",
    "wordpress",
    "ficha-repuesto",
    "por-que.jpg",
  );

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[por-que-foto] ${m}\n`);

type Manifiesto = { mediaCreada: number | null; anterior: number | null };
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { mediaCreada: null, anterior: null };

const global = await payload.findGlobal({
  slug: "repuestos-marca",
  depth: 0,
  overrideAccess: true,
});

if (modo === "retirar") {
  if (manifiesto.mediaCreada === null) fallar("el manifiesto no apunta nada que retirar");
  await payload.updateGlobal({
    slug: "repuestos-marca",
    data: { porQueImagen: manifiesto.anterior },
    overrideAccess: true,
  });
  await payload.delete({ collection: "media", id: manifiesto.mediaCreada!, overrideAccess: true });
  fs.rmSync(MANIFIESTO);
  log("✓ RETIRADO: el campo vuelve a su valor de antes y la foto se borra");
} else {
  if (!fs.existsSync(FICHERO)) fallar(`no existe el fichero ${FICHERO}`);
  const bytes = fs.readFileSync(FICHERO);
  const ya = await payload.find({
    collection: "media",
    where: { filename: { like: "ejemplo-andres-por-que" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  let id = ya.docs[0]?.id ?? null;
  if (id === null) {
    const doc = await payload.create({
      collection: "media",
      data: { alt: "Excavación vista desde el aire (muestra de la plantilla de Andrés)" },
      file: { data: bytes, mimetype: "image/jpeg", name: NOMBRE, size: bytes.length },
      overrideAccess: true,
    });
    id = doc.id;
    manifiesto.mediaCreada = id;
    manifiesto.anterior = typeof global.porQueImagen === "number" ? global.porQueImagen : null;
    fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
  }
  await payload.updateGlobal({
    slug: "repuestos-marca",
    data: { porQueImagen: id },
    overrideAccess: true,
  });
  log(`✓ APLICADO: foto ${id} elegida en «¿Por qué elegirnos?»`);
}
