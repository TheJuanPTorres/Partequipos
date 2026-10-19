/**
 * VÍDEO DE CABECERA DE LA MARCA DE LUBRICANTES ENI (2026-10-19, cliente).
 *
 *   npx payload run scripts/servicio-lubricantes/video-cabecera.ts <modo> <destino> [fichero=<mp4>] [manifiesto=<json>]
 *
 *   modo:     simular  → no escribe nada; comprueba el fichero y la marca
 *             aplicar  → sube el vídeo a «Vídeos» (con la imagen de cabecera de la marca como póster)
 *                        y lo elige en la marca; repetirlo no duplica (se busca por nombre)
 *             retirar  → deshace EXACTAMENTE lo que hizo (manifiesto): deja el campo como estaba y
 *                        borra el vídeo subido
 *   destino:  preview | produccion (solo dirección, con runbook) | prueba
 *
 * El fichero es el `Banner1.mp4` del WordPress (11 MB, 2560 × 1440) recomprimido a 1280 × 720 sin
 * sonido (1,5 MB): pasa el tope de 4 MB de «Vídeos» (CLAUDE.md §10.39). Vive FUERA del repositorio,
 * en `Desktop/partequipos-diseno/lubricantes-eni/`. Argumentos POSICIONALES (`payload run` descarta
 * las banderas con guiones). El destino se valida ANTES de cargar Payload y con la guarda del
 * almacén (§10.37), como el importador de servicio técnico y lubricantes.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[video-lubricantes] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[video-lubricantes]");

const MARCA_SLUG = "lubricantes-eni";
const NOMBRE_FICHERO = "lubricantes-eni-cabecera.mp4";
const TOPE_BYTES = 4 * 1024 * 1024;
const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-video-lubricantes-${destino}.json`);
const FICHERO =
  valorDe("fichero") ??
  path.join(os.homedir(), "Desktop", "partequipos-diseno", "lubricantes-eni", "Banner1-720p.mp4");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[video-lubricantes] ${m}\n`);

type Manifiesto = {
  videoCreado: number | null;
  videoAnterior: number | null;
  marca: number | null;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { videoCreado: null, videoAnterior: null, marca: null };
const guardar = () => fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));

const { docs } = await payload.find({
  collection: "marcas-lubricante",
  where: { slug: { equals: MARCA_SLUG } },
  depth: 0,
  limit: 1,
  overrideAccess: true,
});
const marca = docs[0];
if (!marca) fallar(`no existe la marca «${MARCA_SLUG}» en ese destino`);
const poster = typeof marca!.imagenCabecera === "number" ? marca!.imagenCabecera : null;

if (modo === "retirar") {
  if (manifiesto.marca === null) fallar("el manifiesto no apunta nada que retirar");
  await payload.update({
    collection: "marcas-lubricante",
    id: manifiesto.marca!,
    data: { videoCabecera: manifiesto.videoAnterior },
    overrideAccess: true,
  });
  if (manifiesto.videoCreado !== null) {
    await payload.delete({
      collection: "videos",
      id: manifiesto.videoCreado,
      overrideAccess: true,
    });
  }
  fs.rmSync(MANIFIESTO);
  log(
    "✓ RETIRADO: la marca vuelve a su valor de antes y el vídeo se borra (comprueba su 404 en el Blob tras ~70 s)",
  );
} else {
  if (!fs.existsSync(FICHERO)) fallar(`no existe el fichero ${FICHERO}`);
  const bytes = fs.readFileSync(FICHERO);
  if (bytes.length > TOPE_BYTES) fallar(`pesa ${bytes.length} bytes: el tope de «Vídeos» es 4 MB`);
  if (!poster) fallar("la marca necesita su imagen de cabecera, que hace de póster");
  const ya = await payload.find({
    collection: "videos",
    where: { filename: { like: "lubricantes-eni-cabecera" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  log(
    `fichero ${bytes.length} bytes · póster media ${poster} · ya subido: ${ya.docs[0] ? "sí" : "no"}`,
  );
  if (modo === "simular") {
    log("simulación: no se escribe nada");
  } else {
    let id = ya.docs[0]?.id ?? null;
    if (id === null) {
      const doc = await payload.create({
        collection: "videos",
        data: {
          descripcion: "Cabecera de Lubricantes Eni: engranajes y aceite",
          poster: poster!,
          decorativo: true,
        },
        file: { data: bytes, mimetype: "video/mp4", name: NOMBRE_FICHERO, size: bytes.length },
        overrideAccess: true,
      });
      id = doc.id;
      manifiesto.videoCreado = id;
    }
    if (manifiesto.marca === null) {
      manifiesto.marca = marca!.id;
      manifiesto.videoAnterior =
        typeof marca!.videoCabecera === "number" ? marca!.videoCabecera : null;
    }
    guardar();
    await payload.update({
      collection: "marcas-lubricante",
      id: marca!.id,
      data: { videoCabecera: id },
      overrideAccess: true,
    });
    log(`✓ APLICADO: vídeo ${id} elegido en la marca ${marca!.id}`);
  }
}
