/**
 * ETIQUETAS DE LA FICHA TÉCNICA DE LOS EQUIPOS NUEVOS (dirección, 2026-10-21):
 * minúsculas normales, tildes y erratas según la tabla aprobada. SOLO la
 * etiqueta de cada fila, nunca el valor. La lógica, en
 * `src/lib/maquinaria/etiquetasFicha.ts` (con pruebas).
 *
 *   npx payload run scripts/maquinaria/etiquetas-fichas.ts <modo> <destino> [tabla=<ruta>] [manifiesto=<ruta>]
 *
 *   modo:     simular  → no escribe nada; dice cuántas filas cambiarían
 *             aplicar  → escribe y apunta cada cambio en el manifiesto;
 *                        repetirlo da 0 cambios
 *             retirar  → devuelve cada fila del manifiesto a su etiqueta de
 *                        antes, si sigue con la nuestra
 *   destino:  preview | produccion (solo dirección, con runbook) | prueba
 *
 * Tabla por defecto: `Desktop/partequipos-cierre/informes/2026-10-21-etiquetas-fichas-nuevas.md`.
 * Manifiesto por defecto: `Desktop/partequipos-cierre/manifiesto-etiquetas-fichas-<destino>.json`.
 * Se guarda tras cada equipo: si se corta, se vuelve a lanzar y sigue.
 * Después hay que vaciar la caché del sitio (`POST /api/revalidar/`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import {
  corregirFilas,
  deshacerFilas,
  leerTabla,
  type CambioEtiqueta,
} from "../../src/lib/maquinaria/etiquetasFicha";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[etiquetas] ✗ ${m}`);
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
exigirAlmacen("[etiquetas]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const TABLA =
  valorDe("tabla") ?? path.join(CIERRE, "informes", "2026-10-21-etiquetas-fichas-nuevas.md");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-etiquetas-fichas-${destino}.json`);

type Manifiesto = { destino: string; cambios: CambioEtiqueta[] };
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? JSON.parse(fs.readFileSync(MANIFIESTO, "utf8"))
  : { destino: destino!, cambios: [] };
if (manifiesto.destino !== destino)
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
if (modo === "retirar" && !fs.existsSync(MANIFIESTO))
  fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
const tabla =
  modo === "retirar" ? new Map<string, string>() : leerTabla(fs.readFileSync(TABLA, "utf8"));

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[etiquetas] ${m}\n`);
const guardar = () => fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));

log(
  modo === "retirar"
    ? `manifiesto: ${manifiesto.cambios.length} filas a devolver`
    : `tabla: ${tabla.size} etiquetas con corrección`,
);

const { docs } = await payload.find({
  collection: "equipos-nuevos",
  depth: 0,
  limit: 0,
  pagination: false,
  overrideAccess: true,
});

let filas = 0;
let equipos = 0;
let saltadas = 0;
for (const e of docs) {
  const actuales = (e.fichaTecnica ?? []) as { id?: string | null; etiqueta?: string | null }[];
  let nuevas = actuales;
  let n = 0;
  if (modo === "retirar") {
    if (!manifiesto.cambios.some((c) => c.equipo === e.id)) continue;
    const r = deshacerFilas(e.id, actuales, manifiesto.cambios);
    for (const s of r.saltadas)
      log(`AVISO, no se toca (cambiada después o borrada): equipo ${e.id}, «${s.despues}»`);
    saltadas += r.saltadas.length;
    nuevas = r.filas;
    n = r.devueltas.length;
  } else {
    const r = corregirFilas(e.id, actuales, tabla);
    nuevas = r.filas;
    n = r.cambios.length;
    for (const c of r.cambios) log(`  ${e.id} «${c.antes}» → «${c.despues}»`);
    if (modo === "aplicar") manifiesto.cambios.push(...r.cambios);
  }
  if (n === 0) continue;
  filas += n;
  equipos++;
  if (modo === "simular") continue;
  await payload.update({
    collection: "equipos-nuevos",
    id: e.id,
    data: { fichaTecnica: nuevas as never },
    overrideAccess: true,
  });
  if (modo === "aplicar") guardar();
  log(`✓ equipo ${e.id} («${e.nombre}»): ${n} etiquetas`);
}

const verbo = { simular: "cambiarían", aplicar: "cambiadas", retirar: "devueltas" }[modo!];
log(`${filas} filas ${verbo} en ${equipos} equipos${saltadas ? ` · ${saltadas} saltadas` : ""}`);
if (modo === "retirar" && saltadas === 0 && filas > 0) {
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("manifiesto retirado (renombrado)");
}
process.exit(0);
