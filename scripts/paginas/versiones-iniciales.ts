/**
 * VERSIONES INICIALES DE ARTÍCULOS Y PÁGINAS (2026-11-26, Juan Pablo; urgente).
 *
 * La lista del panel de una colección con borradores solo muestra los documentos que tienen una
 * versión «latest» en su tabla `_<colección>_v` (Payload 3.89, `find` con `draft: true` →
 * `db.queryDrafts`). Las migraciones que activaron los borradores no crearon versiones, así que lo
 * importado antes no sale en la lista. Detalle en `src/lib/versionesIniciales.ts`.
 *
 *   npm run preview:ejecutar -- payload run scripts/paginas/versiones-iniciales.ts <modo> preview [manifiesto.json]
 *   npx payload run scripts/paginas/versiones-iniciales.ts <modo> produccion [manifiesto.json]   (runbook)
 *
 * Modos:
 * - `simular`: lista, por colección, los documentos SIN ninguna versión. No escribe nada.
 * - `aplicar <manifiesto.json>`: crea para cada uno su versión inicial y guarda los ids creados en
 *   el manifiesto (CONSERVARLO: sin él no se puede revertir). Repetible: la segunda pasada no crea
 *   nada.
 * - `comprobar`: lo que ve la lista del panel (`find` con `draft: true`, como la lista) frente a la
 *   tabla principal: mismo número de documentos y, para los que no tienen un borrador pendiente,
 *   el mismo contenido. No escribe nada.
 * - `revertir <manifiesto.json>`: borra SOLO las versiones del manifiesto que siguen siendo del
 *   documento que dice. Nada más.
 *
 * QUÉ ESCRIBE, Y QUÉ NO: solo filas nuevas en las tablas de versiones (`_articulos_v`,
 * `_paginas_v` y sus tablas de bloques y relaciones), con `saveVersion` de Payload, el mismo
 * guardado que usa «Publicar». El documento se lee con el adaptador (`db.findOne`), sin ganchos, y
 * `saveVersion` llama solo a `db.createVersion` (y a `enforceMaxVersions`, que no borra nada con
 * una sola versión): NO corre ganchos de colección, no revalida, no envía correo y no toca la tabla
 * principal (ni `_status` ni `updatedAt` del documento). La versión copia el documento tal cual,
 * con su `_status` y su `updatedAt`; la fecha de la versión es la del momento en que se crea.
 *
 * DESTINO, comprobado ANTES de cargar Payload (como `scripts/fotos/fotos-ampliadas.ts`):
 * - `preview`: solo con `preview:ejecutar` y la base y el Blob del preview (`veredictoEntornoPreview`).
 * - `produccion`: solo con la base (host pooler) y el almacén del sitio publicado
 *   (`veredictoDestino`); fija `ALMACEN_BLOB_ESPERADO` y lo exige (`exigirAlmacen`). Lo ejecuta
 *   Juan Pablo con `runbook-versiones-iniciales.md`; los agentes, nunca.
 * En los dos, se niega si `payload_migrations` tiene el marcador «dev» (§10.9), y el manifiesto
 * lleva su destino: `revertir` no acepta el de otro destino.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoMigraciones } from "../../src/lib/db/veredictoMigraciones";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { veredictoEntornoPreview } from "../../src/lib/preview/entornoPreview";
import { COLECCIONES_CON_BORRADORES } from "../../src/lib/borradores";
import {
  borrables,
  leerManifiesto,
  mismoDestino,
  sinVersion,
  type Id,
  type Manifiesto,
} from "../../src/lib/versionesIniciales";

const MODOS = ["simular", "aplicar", "comprobar", "revertir"] as const;
type Modo = (typeof MODOS)[number];
const args = process.argv.slice(2);
const modo = MODOS.find((m) => args.includes(m)) as Modo | undefined;
const destino = args.find((a) => a === "preview" || a === "produccion");
const archivo = args.find((a) => a.endsWith(".json"));
const fallar = (m: string): never => {
  const e = new Error(`[versiones-iniciales] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) {
  fallar(
    "indica el modo: simular, aplicar <manifiesto.json>, comprobar o revertir <manifiesto.json>",
  );
}
if (!destino) fallar("indica el destino: preview o produccion");
if ((modo === "aplicar" || modo === "revertir") && !archivo) {
  fallar(`el modo ${modo} necesita el manifiesto (<ruta>.json)`);
}
if (destino === "preview") {
  if (process.env.ENTORNO_PREVIEW !== "1") {
    fallar("el destino preview, solo con npm run preview:ejecutar (entorno del preview)");
  }
  const v = veredictoEntornoPreview({
    DATABASE_URI: process.env.DATABASE_URI,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    VERCEL_AUTOMATION_BYPASS_SECRET: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  });
  if (!v.valido) fallar(`no es el preview: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
  exigirAlmacen("[versiones-iniciales]");
}

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const { createLocalReq, getPayload, saveVersion } = await import("payload");
const payload = await getPayload({ config });

// Sin marcador «dev» en `payload_migrations` (§10.9): con él, la base no está como dicen las
// migraciones, y no se toca.
{
  const { docs } = await payload.find({
    collection: "payload-migrations",
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });
  const m = veredictoMigraciones(docs.map((d) => ({ batch: d.batch ?? 0, name: d.name ?? "" })));
  if (m.codigo !== 0) fallar("la base tiene el marcador «dev» en payload_migrations: no se toca");
  console.log(
    `[versiones-iniciales] destino ${destino} · ${m.aplicadas.length} migraciones · sin marcador «dev» ✓`,
  );
}

async function faltan(coleccion: (typeof COLECCIONES_CON_BORRADORES)[number]): Promise<Id[]> {
  const docs = await payload.db.find({ collection: coleccion, limit: 0, pagination: false });
  const versiones = await payload.db.findVersions({
    collection: coleccion,
    limit: 0,
    pagination: false,
  });
  return sinVersion(
    docs.docs.map((d) => d.id as Id),
    versiones.docs.map((x) => x.parent as Id),
  );
}

if (modo === "simular" || modo === "aplicar") {
  if (modo === "aplicar" && archivo && existsSync(archivo)) {
    throw new Error(`El manifiesto ${archivo} ya existe: usa otro nombre (no se pisa).`);
  }
  const manifiesto: Manifiesto = {
    creado: new Date().toISOString(),
    destino: destino!,
    versiones: [],
  };
  for (const coleccion of COLECCIONES_CON_BORRADORES) {
    const ids = await faltan(coleccion);
    console.log(
      `${coleccion}: ${ids.length} sin versión${ids.length ? ` (ids ${ids.join(", ")})` : ""}`,
    );
    if (modo === "simular") continue;
    const collection = payload.collections[coleccion].config;
    for (const id of ids) {
      const req = await createLocalReq({}, payload);
      const doc = await payload.db.findOne({
        collection: coleccion,
        where: { id: { equals: id } },
        req,
      });
      if (!doc) throw new Error(`${coleccion} ${id}: no se encontró al releerlo.`);
      await saveVersion({
        id,
        collection,
        docWithLocales: doc,
        operation: "update",
        payload,
        req,
        returning: false,
      });
      // `returning: false` no devuelve el id: se busca la versión recién creada de ese documento.
      const nueva = await payload.db.findVersions({
        collection: coleccion,
        where: { parent: { equals: id } },
        limit: 0,
        pagination: false,
      });
      if (nueva.docs.length !== 1) {
        throw new Error(`${coleccion} ${id}: se esperaba 1 versión y hay ${nueva.docs.length}.`);
      }
      manifiesto.versiones.push({ coleccion, documento: id, version: nueva.docs[0]!.id as Id });
      writeFileSync(archivo!, JSON.stringify(manifiesto, null, 2));
    }
  }
  if (modo === "aplicar") {
    writeFileSync(archivo!, JSON.stringify(manifiesto, null, 2));
    console.log(`Creadas ${manifiesto.versiones.length} versiones. Manifiesto: ${archivo}`);
  } else {
    console.log("Simulación: no se ha escrito nada.");
  }
} else if (modo === "comprobar") {
  // Sin los ids de bloques y filas (cambian entre la tabla principal y la de versiones).
  const sinIds = (o: unknown): string =>
    JSON.stringify(o, (k, valor: unknown) =>
      k === "id" && typeof valor === "string" ? undefined : valor,
    );
  for (const coleccion of COLECCIONES_CON_BORRADORES) {
    const comun = {
      collection: coleccion,
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
    } as const;
    const principal = await payload.find(comun);
    const lista = await payload.find({ ...comun, draft: true });
    const enLista = new Map(lista.docs.map((d) => [String(d.id), d]));
    const faltanEnLista = principal.docs.filter((d) => !enLista.has(String(d.id))).map((d) => d.id);
    // Un borrador guardado sobre algo publicado es distinto a propósito: solo se cuentan los demás.
    const distintos = principal.docs
      .filter((d) => enLista.has(String(d.id)) && enLista.get(String(d.id))!._status === d._status)
      .filter((d) => sinIds(enLista.get(String(d.id))) !== sinIds(d))
      .map((d) => d.id);
    console.log(
      `${coleccion}: tabla principal ${principal.totalDocs}, lista del panel ${lista.totalDocs}` +
        `, faltan en la lista ${faltanEnLista.length}${faltanEnLista.length ? ` (${faltanEnLista.join(", ")})` : ""}` +
        `, contenido distinto ${distintos.length}${distintos.length ? ` (${distintos.join(", ")})` : ""}`,
    );
  }
} else {
  const manifiesto = leerManifiesto(JSON.parse(readFileSync(archivo!, "utf8")));
  if (!mismoDestino(manifiesto, destino!)) {
    fallar(`el manifiesto es del destino «${manifiesto.destino ?? "preview"}», no de «${destino}»`);
  }
  for (const coleccion of COLECCIONES_CON_BORRADORES) {
    const delManifiesto = manifiesto.versiones.filter((x) => x.coleccion === coleccion);
    if (!delManifiesto.length) continue;
    const existentes = await payload.db.findVersions({
      collection: coleccion,
      where: { id: { in: delManifiesto.map((x) => x.version) } },
      limit: 0,
      pagination: false,
    });
    const ids = borrables(
      manifiesto,
      coleccion,
      existentes.docs.map((x) => ({ id: x.id as Id, parent: x.parent as Id })),
    );
    if (ids.length) {
      await payload.db.deleteVersions({ collection: coleccion, where: { id: { in: ids } } });
    }
    console.log(
      `${coleccion}: borradas ${ids.length} de ${delManifiesto.length} versiones del manifiesto` +
        (ids.length < delManifiesto.length ? " (las demás ya no existían o no cuadraban)" : ""),
    );
  }
}
