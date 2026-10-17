/**
 * Quita el número de serie de los textos alternativos YA GUARDADOS en
 * «Imágenes» (2026-10-17, decisión de dirección). La importación de usados del
 * 2026-10-14 dejó «SN <código>» en las fotos de 3 unidades cuando el código no
 * era el del campo de la unidad (arreglado en `MENCION_SERIAL`).
 *
 *   npm run preview:usados:alt-simular   # no escribe: cuenta y dice qué haría
 *   npm run preview:usados:alt-limpiar   # escribe solo el texto alternativo
 *
 * Mira TODAS las imágenes: una mención de serial con código («SN», «S/N»,
 * «serial»…) o cualquier serial de la exportación. El texto nuevo sale de
 * `altSinSerial`: sin la mención y nunca vacío; si quedaría flojo, no se toca
 * y se informa. Imprime el id y el texto NUEVO; nunca el antiguo ni el serial.
 *
 * Sin retirada a propósito: devolver el serial no es una marcha atrás deseable.
 * El manifiesto guarda solo ids y textos nuevos.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { altSinSerial, contieneSerial, mencionaSerial } from "../../src/lib/usados/wordpress";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "limpiar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[alt-serial] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular o limpiar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
}

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "usados-wordpress.json");
const MANIFIESTO = path.join(CIERRE, `manifiesto-alt-serial-${destino}.json`);
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE}`);
const { unidades } = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as {
  unidades: { serial?: string }[];
};
const seriales = [...new Set(unidades.map((u) => (u.serial ?? "").trim()).filter(Boolean))];
if (seriales.length < 100)
  fallar(`la fuente solo trae ${seriales.length} seriales (se esperaban ~126)`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[alt-serial] ${m}\n`);
log(`seriales de la exportación: ${seriales.length}`);

const leer = async () =>
  (
    await payload.find({
      collection: "media",
      pagination: false,
      depth: 0,
      select: { alt: true },
      overrideAccess: true,
    })
  ).docs;
const conSerial = (alt: string) =>
  mencionaSerial(alt) || seriales.some((s) => contieneSerial(alt, s));

const imagenes = await leer();
const cambios: { id: number; alt: string }[] = [];
const problemas: number[] = [];
for (const m of imagenes) {
  const alt = m.alt ?? "";
  if (!conSerial(alt)) continue;
  const nuevo = altSinSerial(alt, seriales);
  if (nuevo === null || nuevo === alt) problemas.push(m.id);
  else cambios.push({ id: m.id, alt: nuevo });
}
log(`imágenes: ${imagenes.length}; con serial: ${cambios.length + problemas.length}`);
for (const c of cambios) log(`  ${c.id} → «${c.alt}»`);
for (const id of problemas) log(`  ${id}: NO se puede limpiar solo; corrígelo a mano en el panel`);

if (modo === "simular") {
  log(
    `simulación: se cambiarían ${cambios.length}; problemas ${problemas.length}. No se ha escrito nada.`,
  );
  process.exit(0);
}

const hechos: { id: number; alt: string }[] = [];
for (const c of cambios) {
  await payload.update({
    collection: "media",
    id: c.id,
    data: { alt: c.alt },
    overrideAccess: true,
  });
  hechos.push(c);
}
fs.mkdirSync(CIERRE, { recursive: true });
fs.writeFileSync(
  MANIFIESTO,
  JSON.stringify({ destino, fecha: new Date().toISOString(), cambiados: hechos }, null, 2),
);
const quedan = (await leer()).filter((m) => conSerial(m.alt ?? "")).length;
log(`limpiados ${hechos.length}; problemas ${problemas.length}; quedan con serial ${quedan}`);
if (quedan > 0) fallar(`quedan ${quedan} textos con serial: corrígelos en el panel`);
