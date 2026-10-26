/**
 * FASE 2 del «Kit de marca» (2026-10-26): pone Dynapac, Hitachi y Yanmar en el diseño «Kit de
 * marca» con SUS datos y los respaldos del diseño: sin foto de fondo (panel oscuro liso), sin
 * emblema y, en cada tipo, el render que haya; si no, la imagen de tarjeta del tipo y, si tampoco,
 * la primera foto de sus equipos. No sube ninguna imagen: el kit del cliente solo trae las de Case.
 *
 *   payload run scripts/marca-kit/marcas-kit-fase2.ts <modo> <destino>
 *
 *   modo:    simular (no escribe) · aplicar · retirar
 *   destino: preview · produccion
 *
 * DESTINO validado ANTES de cargar Payload, como `marca-kit.ts`. No pisa una marca cuyo diseño ya
 * no sea «Plantilla 1» (alguien la cambió en el panel). MANIFIESTO fuera del repositorio con el
 * diseño de antes de cada marca; `retirar` lo devuelve (y solo si la marca sigue en «Kit de marca»).
 * Idempotente: una segunda pasada no cambia nada.
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
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[marcas-kit-fase2] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
const log = (m: string) => process.stdout.write(`[marcas-kit-fase2] ${m}\n`);
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!destino) fallar("indica el destino: preview o produccion");

if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(
    "produccion",
    process.env.DATABASE_URI,
    process.env.BLOB_READ_WRITE_TOKEN,
  );
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[marcas-kit-fase2]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  `manifiesto-marcas-kit-fase2-${destino}.json`,
);
const NOMBRES = ["dynapac", "hitachi", "yanmar"];

type Entrada = { id: number; slug: string; antes: string };
const sinTildes = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const { docs: todas } = await payload.find({
  collection: "marcas-maquinaria",
  depth: 0,
  limit: 100,
  overrideAccess: true,
});
const marcas = NOMBRES.map((n) => {
  const m = todas.find((x) => sinTildes(x.nombre).startsWith(n) || x.slug.startsWith(n));
  return m ?? fallar(`no existe la marca «${n}»`);
});

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as {
    destino: string;
    marcas: Entrada[];
  };
  if (m.destino !== destino) fallar(`el manifiesto es del destino «${m.destino}»`);
  for (const e of m.marcas) {
    const actual = marcas.find((x) => x.id === e.id);
    if (!actual || actual.disenoPagina !== "kit") {
      log(`${e.slug}: ya no está en «Kit de marca» (${actual?.disenoPagina}), no se toca`);
      continue;
    }
    await payload.update({
      collection: "marcas-maquinaria",
      id: e.id,
      data: { disenoPagina: e.antes as "plantilla1" },
      overrideAccess: true,
    });
    log(`${e.slug}: vuelve a «${e.antes}»`);
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("retirado");
} else {
  const hechas: Entrada[] = fs.existsSync(MANIFIESTO)
    ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as { marcas: Entrada[] }).marcas
    : [];
  for (const marca of marcas) {
    if (marca.disenoPagina === "kit") {
      log(`${marca.slug}: ya estaba en «Kit de marca»`);
      continue;
    }
    if (marca.disenoPagina && marca.disenoPagina !== "plantilla1") {
      log(`${marca.slug}: tiene el diseño «${marca.disenoPagina}» elegido en el panel, no se toca`);
      continue;
    }
    const { totalDocs } = await payload.count({
      collection: "tipos-maquinaria",
      where: { marca: { equals: marca.id } },
      overrideAccess: true,
    });
    log(`${marca.slug} (marca ${marca.id}, ${totalDocs} tipos): «${marca.disenoPagina}» → «kit»`);
    if (modo === "aplicar") {
      await payload.update({
        collection: "marcas-maquinaria",
        id: marca.id,
        data: { disenoPagina: "kit" },
        overrideAccess: true,
      });
      hechas.push({ id: marca.id, slug: marca.slug, antes: marca.disenoPagina ?? "plantilla1" });
    }
  }
  if (modo === "aplicar") {
    fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
    fs.writeFileSync(MANIFIESTO, JSON.stringify({ destino, marcas: hechas }, null, 2));
    log(
      "✓ hecho. Falta vaciar la caché del sitio (POST /api/revalidar/) para que la página lo muestre.",
    );
  } else {
    log("simulación terminada: no se escribió nada");
  }
}
