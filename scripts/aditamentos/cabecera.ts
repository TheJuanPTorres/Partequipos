/**
 * CABECERA DE LA PÁGINA DE MARCA «ADITAMENTOS» (2026-10-20, dirección): trae la
 * foto de la cabecera de la página de Aditamentos de WordPress (id 1441,
 * `Imagen-ppal-v-1.jpg`, del propio WordPress del cliente) a «Imagen de la
 * tarjeta» de la marca de maquinaria nueva «aditamentos», que la plantilla de
 * Andrés pinta de fondo de la cabecera.
 *
 *   npm run preview:aditamentos:cabecera -- simular   # sin escribir nada
 *   npm run preview:aditamentos:cabecera -- importar
 *   npm run preview:aditamentos:cabecera -- retirar   # deshace EXACTAMENTE lo del manifiesto
 *
 * - No pisa lo elegido en el panel: si la marca ya tiene imagen de tarjeta, avisa y no hace nada.
 * - Idempotente: si la foto ya está en «Imágenes» (por su nombre), la reutiliza.
 * - MANIFIESTO fuera del repositorio (`Desktop/partequipos-cierre/manifiesto-aditamentos-cabecera-<destino>.json`)
 *   y RETIRADA EXACTA: devuelve el campo a vacío solo si sigue con nuestra foto, borra
 *   la foto si la creó y comprueba que el fichero da 404.
 *
 * DESTINO validado antes de cargar Payload: `preview` solo con la base y el Blob del
 * preview; los otros destinos, con su base y su almacén (runbook de dirección).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const fallar = (m: string): never => {
  const e = new Error(`[aditamentos-cabecera] ✗ ${m}`);
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
exigirAlmacen("[aditamentos-cabecera]");

const URL_WP = "https://partequipos.com/wp-content/uploads/2022/03/Imagen-ppal-v-1.jpg";
const FICHERO = "wp-aditamentos-cabecera.jpg";
const ALT = "Aditamentos para maquinaria pesada de Partequipos";
const SLUG_MARCA = "aditamentos";
const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  `manifiesto-aditamentos-cabecera-${destino}.json`,
);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[aditamentos-cabecera] ${m}\n`);

type Manifiesto = {
  destino: string;
  marca: number;
  media: { id: number; url: string; creada: boolean };
};

const { docs: marcas } = await payload.find({
  collection: "marcas-maquinaria",
  where: { slug: { equals: SLUG_MARCA } },
  depth: 0,
  limit: 1,
  overrideAccess: true,
});
const marca = marcas[0] ?? fallar(`no existe la marca de maquinaria nueva «${SLUG_MARCA}»`);
const idDe = (v: unknown) =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? Number(v.id) : null;

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
  if (m.destino !== destino) fallar(`el manifiesto es del destino «${m.destino}»`);
  if (idDe(marca.imagenTarjeta) === m.media.id) {
    await payload.update({
      collection: "marcas-maquinaria",
      id: marca.id,
      data: { imagenTarjeta: null },
      overrideAccess: true,
    });
    log("«Imagen de la tarjeta» de la marca, vacía otra vez");
  } else {
    log("la marca ya no tiene nuestra foto (la cambió alguien en el panel): no se toca");
  }
  if (m.media.creada) {
    await payload.delete({ collection: "media", id: m.media.id, overrideAccess: true });
    log("foto borrada; espero 70 s (propagación del Blob)");
    await new Promise((r) => setTimeout(r, 70_000));
    let estado = 0;
    for (let i = 0; i < 4; i++) {
      estado = (await fetch(m.media.url, { method: "HEAD" })).status;
      if (estado === 404) break;
      await new Promise((r) => setTimeout(r, 30_000));
    }
    if (estado !== 404) fallar(`el fichero sigue en el Blob (HTTP ${estado}): ${m.media.url}`);
    log("✓ el fichero da 404");
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  process.exit(0);
}

const actual = idDe(marca.imagenTarjeta);
if (actual) {
  log(
    `la marca ya tiene «Imagen de la tarjeta» (media ${actual}): no se pisa lo elegido. Nada que hacer.`,
  );
  process.exit(0);
}

const { docs: ya } = await payload.find({
  collection: "media",
  where: { filename: { contains: "wp-aditamentos-cabecera" } },
  depth: 0,
  limit: 1,
  overrideAccess: true,
});
if (modo === "simular") {
  log(
    ya[0]
      ? `se reutilizaría la foto ya subida (media ${ya[0].id}) y se pondría en la marca ${marca.id}`
      : `se descargaría ${URL_WP}, se subiría como ${FICHERO} y se pondría en la marca ${marca.id}`,
  );
  process.exit(0);
}

let media = ya[0] ? { id: ya[0].id, url: ya[0].url ?? "", creada: false } : null;
if (!media) {
  const r = await fetch(URL_WP, {
    headers: { "User-Agent": "Partequipos-migracion/1.0 (cabecera de aditamentos; solo lectura)" },
  });
  if (!r.ok) fallar(`no se puede descargar la foto (HTTP ${r.status}): ${URL_WP}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const doc = await payload.create({
    collection: "media",
    data: { alt: ALT, focalX: 50, focalY: 50 },
    file: { data: buf, mimetype: "image/jpeg", name: FICHERO, size: buf.length },
    overrideAccess: true,
  });
  media = { id: doc.id, url: doc.url ?? "", creada: true };
  log(`foto subida: media ${doc.id} (${Math.round(buf.length / 1024)} KiB)`);
}
// El manifiesto, ANTES de tocar la marca: si algo falla después, la retirada sabe qué borrar.
fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
fs.writeFileSync(
  MANIFIESTO,
  JSON.stringify({ destino: destino!, marca: marca.id, media } satisfies Manifiesto, null, 2),
);
await payload.update({
  collection: "marcas-maquinaria",
  id: marca.id,
  data: { imagenTarjeta: media.id },
  overrideAccess: true,
});
log(`✓ «Imagen de la tarjeta» de la marca ${marca.id} = media ${media.id}`);
process.exit(0);
