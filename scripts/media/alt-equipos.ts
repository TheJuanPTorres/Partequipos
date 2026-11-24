/**
 * TEXTOS ALTERNATIVOS DE LAS FOTOS DE MAQUINARIA NUEVA Y USADA (informe de QA externo del
 * 2026-11-17, punto 25). La regla y las pruebas, en `src/lib/media/altEquipos.ts`: el alt de una
 * foto con «partequipos» de relleno o una errata («Ezcabadora…») pasa a ser el NOMBRE REAL del
 * equipo de su galería (desde la segunda foto, «(foto N)»). En el sitio publicado lo ejecuta Juan
 * Pablo con su runbook.
 *
 *   npx payload run scripts/media/alt-equipos.ts <modo> <destino> [lista=<fichero.md>]
 *
 *   modo:     simular  → por defecto; no escribe nada; saca la lista antes/después
 *             aplicar  → cambia SOLO el texto alternativo de esas fotos; repetirlo no cambia nada.
 *                        Guarda el manifiesto (id, antes, después) en partequipos-cierre
 *             retirar  → con el manifiesto, devuelve cada alt al de antes si sigue con el nuestro
 *   destino:  preview | produccion (Juan Pablo, con runbook) | prueba
 *
 * No toca una foto que compartan fichas de distinto nombre (se avisa), ni el fichero, ni nada que
 * no sea el alt. No revalida: después, `POST /api/revalidar/` (en el runbook).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { propuestas, type Uso } from "../../src/lib/media/altEquipos";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const ETIQUETA = "[alt-equipos]";
const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar") ?? "simular";
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const lista = args.find((a) => a.startsWith("lista="))?.slice("lista=".length);
const fallar = (m: string): never => {
  const e = new Error(`${ETIQUETA} ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen(ETIQUETA);

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  `manifiesto-alt-equipos-${destino}.json`,
);
type Cambio = { mediaId: number; antes: string; despues: string };

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
if (modo === "simular") {
  for (const op of ["create", "update", "delete"] as const) {
    (payload as unknown as Record<string, unknown>)[op] = () =>
      fallar(`simulación: «${op}» no está permitido`);
  }
}
const log = (m: string) => process.stdout.write(`${ETIQUETA} ${m}\n`);
const idDe = (v: unknown): number | null =>
  typeof v === "number"
    ? v
    : v && typeof v === "object" && "id" in v
      ? Number((v as { id: unknown }).id)
      : null;

async function altActual(id: number): Promise<{ alt: string; filename: string } | null> {
  try {
    const m = (await payload.findByID({
      collection: "media",
      id,
      depth: 0,
      overrideAccess: true,
    })) as {
      alt?: string | null;
      filename?: string | null;
    };
    return { alt: m.alt ?? "", filename: m.filename ?? "" };
  } catch {
    return null;
  }
}

async function ponerAlt(id: number, alt: string): Promise<void> {
  await payload.update({ collection: "media", id, data: { alt }, depth: 0, overrideAccess: true });
}

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no está el manifiesto ${MANIFIESTO}`);
  const cambios = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Cambio[];
  let devueltos = 0;
  for (const c of cambios) {
    const actual = await altActual(c.mediaId);
    if (!actual) log(`AVISO, la foto ${c.mediaId} ya no existe`);
    else if (actual.alt !== c.despues)
      log(
        `AVISO, no se devuelve la foto ${c.mediaId}: su alt ya no es el nuestro («${actual.alt}»)`,
      );
    else {
      await ponerAlt(c.mediaId, c.antes);
      devueltos++;
    }
  }
  log(`retirar: ${devueltos} de ${cambios.length} devueltos al alt de antes`);
  process.exit(0);
}

// Las galerías: qué ficha usa cada foto y en qué posición.
const usos = new Map<number, Uso[]>();
for (const coleccion of ["equipos-nuevos", "equipos-usados"] as const) {
  const { docs } = await payload.find({
    collection: coleccion,
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    // orden-libre: un recorrido de todas las fichas, no un listado.
    sort: "id",
    select: { nombre: true, imagenes: true },
  });
  for (const d of docs as unknown as { id: number; nombre?: string; imagenes?: unknown[] }[]) {
    (d.imagenes ?? []).forEach((img, indice) => {
      const id = idDe(img);
      if (id === null || !d.nombre) return;
      usos.set(id, [...(usos.get(id) ?? []), { coleccion, id: d.id, nombre: d.nombre, indice }]);
    });
  }
}
const ids = [...usos.keys()];
const fotos: { mediaId: number; alt: string }[] = [];
for (let i = 0; i < ids.length; i += 200) {
  const { docs } = await payload.find({
    collection: "media",
    where: { id: { in: ids.slice(i, i + 200) } },
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    select: { alt: true },
  });
  for (const m of docs as unknown as { id: number; alt?: string | null }[])
    fotos.push({ mediaId: m.id, alt: m.alt ?? "" });
}

const lasPropuestas = propuestas(fotos, usos);
const filas: string[] = [];
const hechos: Cambio[] = [];
const cuenta = { cambiar: 0, "ya-estaba": 0, compartida: 0 };
const verbo = modo === "simular" ? "cambiaría" : "cambia";
for (const p of lasPropuestas) {
  cuenta[p.decision]++;
  const ficha = `${p.uso.coleccion} ${p.uso.id}`;
  if (p.decision === "compartida") {
    filas.push(
      `| ${p.mediaId} | ${ficha} | ${p.antes} | — (compartida: ${p.otros.join(" / ")}) | saltada |`,
    );
    log(`AVISO, no se toca la foto ${p.mediaId}: la comparten ${p.otros.join(", ")}`);
    continue;
  }
  filas.push(`| ${p.mediaId} | ${ficha} | ${p.antes} | ${p.despues} | ${p.decision} |`);
  if (p.decision !== "cambiar") continue;
  log(`${verbo}: foto ${p.mediaId} «${p.antes}» → «${p.despues}»`);
  if (modo === "simular") continue;
  await ponerAlt(p.mediaId, p.despues);
  const tras = await altActual(p.mediaId);
  if (tras?.alt !== p.despues)
    fallar(`la foto ${p.mediaId} no quedó con el alt nuevo («${tras?.alt}»)`);
  hechos.push({ mediaId: p.mediaId, antes: p.antes, despues: p.despues });
}

if (modo === "aplicar" && hechos.length) {
  // Se AÑADE a un manifiesto anterior (una segunda pasada no pierde la primera).
  const previos = fs.existsSync(MANIFIESTO)
    ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Cambio[])
    : [];
  const juntos = [
    ...previos.filter((c) => !hechos.some((h) => h.mediaId === c.mediaId)),
    ...hechos,
  ];
  fs.writeFileSync(MANIFIESTO, JSON.stringify(juntos, null, 2));
  log(`manifiesto: ${MANIFIESTO} (${juntos.length} fotos)`);
}

const tabla = [
  "| Foto (id) | Ficha | Antes | Después | Estado |",
  "| --- | --- | --- | --- | --- |",
  ...filas,
].join("\n");
process.stdout.write(`\n${tabla}\n\n`);
if (lista) {
  fs.writeFileSync(
    lista,
    `# Textos alternativos de nueva y usada (${modo}, ${destino})\n\n${tabla}\n`,
  );
  log(`lista guardada en ${lista}`);
}
log(
  `${modo}: ${cuenta.cambiar} por cambiar · ${cuenta["ya-estaba"]} ya estaban · ${cuenta.compartida} compartidas (saltadas)`,
);
process.exit(0);
