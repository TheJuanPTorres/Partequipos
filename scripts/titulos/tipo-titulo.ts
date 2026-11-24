/**
 * LOS 18 TÍTULOS EN MAYÚSCULAS A TIPO TÍTULO (decisión de Juan Pablo, 2026-11-23). La lista y la
 * regla, en `src/lib/titulos/tipoTitulo.ts` (con pruebas). En el sitio publicado lo ejecuta
 * Juan Pablo con su runbook.
 *
 *   npx payload run scripts/titulos/tipo-titulo.ts <modo> <destino> [lista=<fichero.md>]
 *
 *   modo:     simular  → por defecto; no escribe nada; saca la lista antes/después
 *             aplicar  → cambia SOLO el nombre o el título; repetirlo no cambia nada
 *             retirar  → devuelve cada título al de antes, si sigue con el nuestro
 *   destino:  preview | produccion (Juan Pablo, con runbook) | prueba
 *
 * No toca la dirección web: la lee antes y después de cada cambio y, si cambiara, devuelve el
 * título y para. No pisa lo editado en el panel (un título distinto del esperado se salta y se
 * avisa) ni una página con un borrador sin publicar. No sube ficheros. No revalida: después,
 * `POST /api/revalidar/` (en el runbook).
 */
import fs from "node:fs";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import {
  TITULOS_EN_MAYUSCULAS,
  aTipoTitulo,
  decidir,
  type ColeccionTitulo,
} from "../../src/lib/titulos/tipoTitulo";

const ETIQUETA = "[tipo-titulo]";
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
const campoDe = (c: ColeccionTitulo) => (c === "paginas" ? "titulo" : "nombre");

type Doc = { id: number; slug?: string | null } & Record<string, unknown>;
const leer = async (coleccion: ColeccionTitulo, id: number): Promise<Doc | null> => {
  try {
    return (await payload.findByID({
      collection: coleccion,
      id,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Doc;
  } catch {
    return null;
  }
};

/** Una página con un borrador más nuevo que lo publicado: guardar publicaría encima, así que se salta. */
async function conBorrador(id: number): Promise<boolean> {
  const { docs } = await payload.findVersions({
    collection: "paginas",
    where: { parent: { equals: id }, latest: { equals: true } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return docs[0]?.version?._status === "draft";
}

const filas: string[] = [];
const cuenta = { cambiar: 0, "ya-estaba": 0, distinto: 0 };
const verbo = modo === "simular" ? "cambiaría" : modo === "aplicar" ? "cambia" : "devuelve";
for (const t of TITULOS_EN_MAYUSCULAS) {
  const despues = aTipoTitulo(t.antes);
  const campo = campoDe(t.coleccion);
  const doc = await leer(t.coleccion, t.id);
  const actual = doc ? (doc[campo] as string | null | undefined) : null;
  const d = decidir(modo === "retirar" ? "retirar" : "aplicar", actual, t.antes, despues);
  let estado: string = d;
  if (d === "cambiar" && t.coleccion === "paginas" && (await conBorrador(t.id))) {
    estado = "borrador";
  }
  filas.push(`| ${t.coleccion} | ${t.id} | ${t.antes} | ${despues} | ${estado} |`);
  if (estado === "borrador") {
    cuenta.distinto++;
    log(`AVISO, no se toca (tiene un borrador sin publicar): ${t.coleccion} ${t.id}`);
    continue;
  }
  cuenta[d]++;
  if (d === "distinto") {
    log(
      `AVISO, no se toca (${doc ? `título distinto del esperado: «${actual}»` : "no existe"}): ${t.coleccion} ${t.id}`,
    );
    continue;
  }
  if (d === "ya-estaba") {
    log(`ya estaba: ${t.coleccion} ${t.id} «${actual}»`);
    continue;
  }
  const nuevo = modo === "retirar" ? t.antes : despues;
  log(`${verbo}: ${t.coleccion} ${t.id} «${actual}» → «${nuevo}»`);
  if (modo === "simular" || !doc) continue;
  await payload.update({
    collection: t.coleccion,
    id: t.id,
    data: { [campo]: nuevo } as never,
    depth: 0,
    overrideAccess: true,
  });
  const tras = await leer(t.coleccion, t.id);
  if (tras?.slug !== doc.slug) {
    await payload.update({
      collection: t.coleccion,
      id: t.id,
      data: { [campo]: actual, slug: doc.slug } as never,
      depth: 0,
      overrideAccess: true,
    });
    fallar(
      `${t.coleccion} ${t.id}: la dirección web cambió («${doc.slug}» → «${tras?.slug}»); devuelto y parado`,
    );
  }
  log(`  ✓ guardado; dirección web igual («${doc.slug}»)`);
}

const tabla = [
  "| Colección | id | Antes | Después | Estado |",
  "| --- | --- | --- | --- | --- |",
  ...filas,
].join("\n");
process.stdout.write(`\n${tabla}\n\n`);
if (lista) {
  fs.writeFileSync(
    lista,
    `# Títulos en mayúsculas a tipo título (${modo}, ${destino})\n\n${tabla}\n`,
  );
  log(`lista guardada en ${lista}`);
}
log(
  `${modo}: ${cuenta.cambiar} por cambiar · ${cuenta["ya-estaba"]} ya estaban · ${cuenta.distinto} saltados`,
);
process.exit(0);
