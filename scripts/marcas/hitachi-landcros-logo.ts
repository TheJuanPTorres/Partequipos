/**
 * EL LOGO DE «HITACHI LANDCROS» DONDE SEGUÍA EL DE «HITACHI» (dirección, 2026-11-18), SOLO EN EL
 * PREVIEW. En el sitio publicado lo hace dirección desde el panel (runbook): es subir una imagen y
 * elegirla en tres campos.
 *
 *   npm run preview:ejecutar -- payload run scripts/marcas/hitachi-landcros-logo.ts <modo> preview
 *
 *   modo: simular | aplicar | retirar
 *
 * Sube el logo a color del kit (`ficha-repuestos-v2/…/marcas/hitachi-landcros.webp`) y lo pone en:
 *  - «Logo» de la marca de REPUESTOS (megamenú, páginas de marca y de tipo, baldosas y la banda de
 *    marcas de repuestos de la portada), sin «Pintar el logo en oscuro en el menú»;
 *  - «Logo» de la marca de maquinaria NUEVA;
 *  - el logo de Hitachi LANDCROS de la banda «Marcas Partequipos» de la portada.
 *
 * El blanco de las tarjetas de color (portada y baldosas) ya era el de LANDCROS: no se toca.
 * Manifiesto fuera del repositorio y retirada exacta. No revalida: después, redesplegar el preview.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload, type CollectionSlug } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const ETIQUETA = "[hitachi-landcros-logo]";
const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const fallar = (m: string): never => {
  const e = new Error(`${ETIQUETA} ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!args.includes("preview")) fallar("solo en el preview; en el sitio publicado, por el panel");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen(ETIQUETA);

const FICHERO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-diseno",
  "ficha-repuestos-v2",
  "public",
  "partequipos",
  "repuestos",
  "marcas",
  "hitachi-landcros.webp",
);
const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-hitachi-landcros-logo-preview.json",
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
const log = (m: string) => process.stdout.write(`${ETIQUETA} ${m}\n`);

type Cambio = { coleccion: string; id: number; campo: string; antes: unknown; despues: unknown };
type Manifiesto = { media: number | null; cambios: Cambio[] };
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { media: null, cambios: [] };
const guardar = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const idDe = (rel: unknown): number | null =>
  typeof rel === "number"
    ? rel
    : rel && typeof rel === "object"
      ? (rel as { id: number }).id
      : null;
type Doc = Record<string, unknown> & { id: number; slug?: string };

async function poner(coleccion: CollectionSlug, doc: Doc, data: Record<string, unknown>) {
  for (const [campo, despues] of Object.entries(data)) {
    const antes = doc[campo];
    if (igual(antes, despues)) continue;
    log(`${modo === "aplicar" ? "cambia" : "cambiaría"} ${coleccion} ${doc.id} · ${campo}`);
    if (modo !== "aplicar") continue;
    await payload.update({
      collection: coleccion,
      id: doc.id,
      data: { [campo]: despues } as never,
      depth: 0,
      overrideAccess: true,
    });
    manifiesto.cambios.push({ coleccion, id: doc.id, campo, antes, despues });
    guardar();
  }
}

async function aplicar(): Promise<void> {
  if (!fs.existsSync(FICHERO)) fallar(`no existe ${FICHERO}`);
  const datos = fs.readFileSync(FICHERO);
  const meta = await sharp(datos).metadata();
  let media = manifiesto.media;
  if (!media) {
    log(`subir logo-hitachi-landcros.webp: ${meta.width}×${meta.height}, ${datos.length} B`);
    if (modo === "aplicar") {
      const doc = await payload.create({
        collection: "media",
        data: { alt: "Logo de Hitachi LANDCROS" },
        file: {
          data: datos,
          mimetype: "image/webp",
          name: "logo-hitachi-landcros.webp",
          size: datos.length,
        },
        overrideAccess: true,
      });
      media = doc.id;
      manifiesto.media = media;
      guardar();
    }
  }
  // En la simulación todavía no hay imagen: -1 hace de «la que se subiría».
  const logo = media ?? -1;
  const de = async (coleccion: CollectionSlug) =>
    (
      await payload.find({ collection: coleccion, depth: 0, limit: 0, pagination: false })
    ).docs.filter((d) =>
      /(^|-)hitachi(-|$)/.test(String((d as unknown as Doc).slug)),
    ) as unknown as Doc[];
  for (const m of await de("marcas")) await poner("marcas", m, { logo, logoOscuroEnMenu: false });
  for (const m of await de("marcas-maquinaria")) {
    await poner("marcas-maquinaria", m, { logo, logoOscuroEnMenu: false });
  }
  const {
    docs: [portada],
  } = await payload.find({
    collection: "paginas",
    where: { slug: { equals: "inicio" } },
    depth: 0,
    limit: 1,
  });
  const seccion = (portada as unknown as Doc | undefined)?.seccionLogos as
    { logos?: { nombre?: string | null; logo?: unknown }[] } | undefined;
  if (portada && seccion?.logos?.some((l) => /hitachi/i.test(l.nombre ?? ""))) {
    const logos = seccion.logos.map((l) =>
      /hitachi/i.test(l.nombre ?? "") ? { ...l, logo } : { ...l, logo: idDe(l.logo) },
    );
    await poner("paginas", portada as unknown as Doc, { seccionLogos: { ...seccion, logos } });
  }
  log(modo === "simular" ? "SIMULACIÓN: no se ha escrito nada." : "APLICADO.");
}

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar("no hay manifiesto: nada que retirar");
  for (const c of [...manifiesto.cambios].reverse()) {
    const doc = (await payload
      .findByID({ collection: c.coleccion as CollectionSlug, id: c.id, depth: 0 })
      .catch(() => null)) as unknown as Doc | null;
    if (!doc || igual(doc[c.campo], c.antes)) continue;
    if (!igual(doc[c.campo], c.despues)) {
      log(`${c.coleccion} ${c.id} ${c.campo}: lo cambió alguien después; NO se toca`);
      continue;
    }
    await payload.update({
      collection: c.coleccion as CollectionSlug,
      id: c.id,
      data: { [c.campo]: c.antes } as never,
      depth: 0,
      overrideAccess: true,
    });
  }
  if (manifiesto.media) {
    await payload.delete({ collection: "media", id: manifiesto.media, overrideAccess: true });
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA.");
}

if (modo === "retirar") await retirar();
else await aplicar();
process.exit(0);
