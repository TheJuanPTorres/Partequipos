/**
 * FOTO DE «NUESTRO COMPROMISO» DE LA PÁGINA DE ADITAMENTOS (2026-11-13, dirección).
 *
 *   npx payload run scripts/aditamentos/compromiso-foto.ts <modo> <destino> fichero=<webp> [manifiesto=<json>]
 *
 *   modo:     aplicar | retirar
 *   destino:  preview | prueba   (el sitio publicado, desde el panel: runbook de dirección)
 *
 * Sube la foto del WordPress del cliente (el apretón de manos de «Nuestro compromiso», ya en WebP)
 * a «Imágenes», con el punto focal en las manos, y la elige en «Nuestro compromiso»: foto de la
 * marca «aditamentos». `retirar` deja el campo como estaba y borra la foto. Argumentos POSICIONALES.
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
  const e = new Error(`[compromiso-foto] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: aplicar o retirar");
if (!destino) fallar("indica el destino: preview o prueba");
if (destino === "produccion") fallar("en el sitio publicado se elige desde el panel (runbook)");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[compromiso-foto]");

const NOMBRE = "compromiso-aditamentos-apreton-de-manos.webp";
const ALT = "Apretón de manos sobre una mesa de trabajo con documentos y un portátil";
const SLUG_MARCA = "aditamentos";
const MANIFIESTO =
  valorDe("manifiesto") ??
  path.join(
    os.homedir(),
    "Desktop",
    "partequipos-cierre",
    `manifiesto-compromiso-foto-${destino}.json`,
  );
const FICHERO = valorDe("fichero");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[compromiso-foto] ${m}\n`);

type Manifiesto = { marca: number | null; mediaCreada: number | null; anterior: number | null };
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { marca: null, mediaCreada: null, anterior: null };

const marcas = await payload.find({
  collection: "marcas-maquinaria",
  where: { slug: { equals: SLUG_MARCA } },
  depth: 0,
  limit: 1,
  overrideAccess: true,
});
const marca = marcas.docs[0] ?? fallar(`no hay marca «${SLUG_MARCA}»`);
const grupo = marca.plantillaAditamentos ?? {};

if (modo === "retirar") {
  if (manifiesto.mediaCreada === null) fallar("el manifiesto no apunta nada que retirar");
  await payload.update({
    collection: "marcas-maquinaria",
    id: marca.id,
    data: { plantillaAditamentos: { ...grupo, foto: manifiesto.anterior } },
    overrideAccess: true,
  });
  await payload.delete({ collection: "media", id: manifiesto.mediaCreada!, overrideAccess: true });
  fs.rmSync(MANIFIESTO);
  log("✓ RETIRADO: el campo vuelve a su valor de antes y la foto se borra");
} else {
  if (!FICHERO || !fs.existsSync(FICHERO))
    fallar(`no existe el fichero ${FICHERO ?? "(falta fichero=)"}`);
  const bytes = fs.readFileSync(FICHERO!);
  let id = manifiesto.mediaCreada;
  if (id === null) {
    const doc = await payload.create({
      collection: "media",
      data: { alt: ALT, focalX: 47, focalY: 57 },
      file: { data: bytes, mimetype: "image/webp", name: NOMBRE, size: bytes.length },
      overrideAccess: true,
    });
    id = doc.id;
    manifiesto.marca = marca.id;
    manifiesto.mediaCreada = id;
    manifiesto.anterior = typeof grupo.foto === "number" ? grupo.foto : null;
    fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
  }
  await payload.update({
    collection: "marcas-maquinaria",
    id: marca.id,
    data: { plantillaAditamentos: { ...grupo, foto: id } },
    overrideAccess: true,
  });
  log(`✓ APLICADO: foto ${id} elegida en «Nuestro compromiso» de la marca ${marca.id}`);
}
