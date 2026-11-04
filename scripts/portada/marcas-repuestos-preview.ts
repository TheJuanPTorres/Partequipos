/**
 * Pone la máquina de la sección «Marcas de repuestos» de la portada (Yanmar ViO80) en el PREVIEW.
 *
 *   npm run preview:ejecutar -- npx.cmd payload run scripts/portada/marcas-repuestos-preview.ts ver
 *   npm run preview:ejecutar -- npx.cmd payload run scripts/portada/marcas-repuestos-preview.ts sembrar
 *   npm run preview:ejecutar -- npx.cmd payload run scripts/portada/marcas-repuestos-preview.ts retirar
 *
 * - `ver`: lista las imágenes de «Imágenes» con «vio80» en el nombre y lo que hay en el grupo.
 * - `sembrar`: elige la Yanmar ViO80 que ya está en «Imágenes» (`portada-v2-repuestos-…`) o, si no
 *   estuviera, sube `yanmar-vio80.webp` del diseño del cliente
 *   (`Desktop/partequipos-diseno/portada-marcas-repuestos/public/partequipos/repuestos/`) como
 *   `marcas-repuestos-yanmar-vio80.webp` (una vez) y la elige en el grupo de la página «inicio».
 * - `retirar`: vacía el campo y borra la imagen subida por este script (y solo esa).
 *
 * SOLO preview: el mismo guardián que el hero de prueba, antes de conectar. No toca el esquema.
 * NO REFRESCA EL PREVIEW: guardar el grupo desde aquí no revalida; redesplegar o guardar la página.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => ["ver", "sembrar", "retirar"].includes(a));
if (!modo) {
  console.error("[marcas-repuestos] indica el modo: «ver», «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[marcas-repuestos] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[marcas-repuestos]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const { SLUG_PORTADA } = await import("../../src/lib/queries/getPaginas");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[marcas-repuestos] ${m}\n`);
const FICHERO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-diseno",
  "portada-marcas-repuestos",
  "public",
  "partequipos",
  "repuestos",
  "yanmar-vio80.webp",
);
const NOMBRE = "marcas-repuestos-yanmar-vio80.webp";
const ALT = "Miniexcavadora Yanmar ViO80";

const buscarPagina = async () => {
  const { docs } = await payload.find({
    collection: "paginas",
    where: { slug: { equals: SLUG_PORTADA } },
    depth: 0,
    limit: 1,
  });
  return docs[0] ?? null;
};
/** La Yanmar ViO80 de la portada v2 (la de «Venta de repuestos»), si ya está en «Imágenes»: se reutiliza. */
const buscarExistente = async () => {
  const { docs } = await payload.find({
    collection: "media",
    where: { filename: { contains: "portada-v2-repuestos-miniexcavadora-yanmar-vio80" } },
    depth: 0,
    limit: 1,
  });
  return docs[0] ?? null;
};
/** La que sube este script (solo esta se borra al retirar). */
const buscarImagen = async () => {
  const { docs } = await payload.find({
    collection: "media",
    where: { filename: { contains: "marcas-repuestos-yanmar-vio80" } },
    depth: 0,
    limit: 5,
  });
  return docs[0] ?? null;
};

const pagina = await buscarPagina();
if (!pagina) {
  console.error("[marcas-repuestos] no hay página «inicio».");
  process.exit(1);
}

if (modo === "ver") {
  const { docs } = await payload.find({
    collection: "media",
    where: { filename: { contains: "vio80" } },
    depth: 0,
    limit: 20,
  });
  log(`imágenes con «vio80»: ${docs.map((d) => `${d.id}:${d.filename}`).join(", ") || "ninguna"}`);
  log(`grupo: ${JSON.stringify(pagina.seccionMarcasRepuestos ?? null)}`);
  log(
    `máquina de «Venta de repuestos»: ${JSON.stringify(pagina.seccionRepuestos?.maquina ?? null)}`,
  );
} else if (modo === "sembrar") {
  let imagen = (await buscarExistente()) ?? (await buscarImagen());
  if (!imagen) {
    if (!fs.existsSync(FICHERO)) {
      console.error(`[marcas-repuestos] falta el fichero del diseño: ${FICHERO}`);
      process.exit(1);
    }
    imagen = await payload.create({
      collection: "media",
      data: { alt: ALT },
      file: {
        data: fs.readFileSync(FICHERO),
        mimetype: "image/webp",
        name: NOMBRE,
        size: fs.statSync(FICHERO).size,
      },
    });
    log(`imagen subida: id ${imagen.id} (${imagen.filename})`);
  } else {
    log(`imagen ya subida: id ${imagen.id}`);
  }
  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { seccionMarcasRepuestos: { ...pagina.seccionMarcasRepuestos, maquina: imagen.id } },
  });
  log("máquina elegida en el grupo «Marcas de repuestos» de la portada.");
} else {
  const imagen = await buscarImagen();
  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { seccionMarcasRepuestos: { ...pagina.seccionMarcasRepuestos, maquina: null } },
  });
  log("campo vaciado.");
  if (imagen) {
    await payload.delete({ collection: "media", id: imagen.id });
    log(`imagen ${imagen.id} borrada.`);
  }
}
