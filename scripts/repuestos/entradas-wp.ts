/**
 * «OTRAS ENTRADAS» DE LAS LISTAS DE WORDPRESS (2026-10-17, decisión del
 * cliente): pone en cada tipo las entradas de `ENTRADAS_WP`
 * (src/lib/repuestos/entradasWp.ts), con manifiesto y retirada exacta.
 * Detalle en docs/repuestos-importacion.md §12.
 *
 *   npm run preview:repuestos:entradas:simular   # no escribe nada
 *   npm run preview:repuestos:entradas:aplicar
 *   npm run preview:repuestos:entradas:retirar
 *
 * Para el sitio publicado, el runbook de dirección. La entrada de Hitachi va en
 * la serie EX: ejecutar ANTES `scripts/repuestos/series.ts`.
 *
 * Conserva las entradas que haya puesto un editor (solo añade las que faltan,
 * por su texto). No toca el Blob. No revalida: después, redesplegar.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { ENTRADAS_WP } from "../../src/lib/repuestos/entradasWp";
import { claveSerie, seriesDeTipo } from "../../src/lib/repuestos/series";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[entradas] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!destino) fallar("indica el destino: preview o el del sitio publicado");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino!, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
// Este script no sube nada: sin token, nada puede llegar al Blob.
process.env.BLOB_READ_WRITE_TOKEN = "";

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  `manifiesto-entradas-wp-${destino}.json`,
);

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
const log = (m: string) => process.stdout.write(`[entradas] ${m}\n`);

type Entrada = { texto: string; serie?: string | null; modelo?: number | null };
type Manifiesto = { destino: string; tipos: { id: number; slug: string; antes: Entrada[] }[] };
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, tipos: [] };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};
const idDe = (v: unknown): number | null =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? idDe(v.id) : null;

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  for (const t of manifiesto.tipos) {
    await payload.update({
      collection: "tipos-equipo",
      id: t.id,
      data: { otrasEntradas: t.antes },
      overrideAccess: true,
    });
  }
  log(`tipos devueltos a sus entradas de antes: ${manifiesto.tipos.length}`);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Redesplegar para que el sitio lo muestre.");
} else {
  const uno = async <T>(
    collection: "marcas" | "tipos-equipo" | "modelos-repuesto",
    where: object,
  ) =>
    ((
      await payload.find({
        collection,
        where: where as never,
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0] as T | undefined) ?? null;

  const porTipo = new Map<string, typeof ENTRADAS_WP>();
  for (const e of ENTRADAS_WP)
    porTipo.set(`${e.marca}|${e.tipo}`, [...(porTipo.get(`${e.marca}|${e.tipo}`) ?? []), e]);

  let cambiados = 0;
  for (const [clave, entradas] of porTipo) {
    const [marcaSlug = "", tipoSlug = ""] = clave.split("|");
    const marca = await uno<{ id: number }>("marcas", { slug: { equals: marcaSlug } });
    if (!marca) fallar(`no está la marca ${marcaSlug}`);
    const tipo = await uno<{
      id: number;
      slug: string;
      series?: { nombre: string }[] | null;
      otrasEntradas?: { texto: string; serie?: string | null; modelo?: unknown }[] | null;
    }>("tipos-equipo", { and: [{ marca: { equals: marca!.id } }, { slug: { equals: tipoSlug } }] });
    if (!tipo) fallar(`no está el tipo ${tipoSlug}`);

    const antes: Entrada[] = (tipo!.otrasEntradas ?? []).map((e) => ({
      texto: e.texto,
      serie: e.serie ?? null,
      modelo: idDe(e.modelo),
    }));
    const nuevas: Entrada[] = [];
    for (const e of entradas) {
      if (antes.some((a) => a.texto.trim().toLowerCase() === e.texto.toLowerCase())) continue;
      if (
        e.serie &&
        !seriesDeTipo(tipo!).some((s) => claveSerie(s.nombre) === claveSerie(e.serie))
      ) {
        fallar(
          `${tipoSlug} no tiene la serie ${e.serie}: ejecuta antes scripts/repuestos/series.ts`,
        );
      }
      let modelo: number | null = null;
      if (e.enlace) {
        const tEnlace = await uno<{ id: number }>("tipos-equipo", {
          and: [{ marca: { equals: marca!.id } }, { slug: { equals: e.enlace.tipo } }],
        });
        const m = tEnlace
          ? await uno<{ id: number }>("modelos-repuesto", {
              and: [{ tipo: { equals: tEnlace.id } }, { slug: { equals: e.enlace.modelo } }],
            })
          : null;
        if (!m) fallar(`no está la ficha a la que enlaza «${e.texto}»: ${e.enlace.modelo}`);
        modelo = m!.id;
      }
      nuevas.push({ texto: e.texto, serie: e.serie ?? null, modelo });
    }
    for (const n of nuevas) {
      log(
        `${tipoSlug}: + «${n.texto}»${n.serie ? ` (serie ${n.serie})` : ""}${n.modelo ? ` → ficha ${n.modelo}` : " (sin enlace)"}`,
      );
    }
    if (nuevas.length === 0) {
      log(`${tipoSlug}: ya estaban`);
      continue;
    }
    if (!manifiesto.tipos.some((t) => t.id === tipo!.id)) {
      manifiesto.tipos.push({ id: tipo!.id, slug: tipo!.slug, antes });
      guardar();
    }
    if (modo === "aplicar") {
      await payload.update({
        collection: "tipos-equipo",
        id: tipo!.id,
        data: { otrasEntradas: [...antes, ...nuevas] },
        overrideAccess: true,
      });
      cambiados++;
    }
  }
  log(
    modo === "simular"
      ? "SIMULACIÓN: no se ha escrito nada."
      : `APLICADO: ${cambiados} tipos con entradas nuevas. Redesplegar para que el sitio lo muestre.`,
  );
}
