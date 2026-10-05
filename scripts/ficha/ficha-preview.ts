/**
 * CONTENIDO DE EJEMPLO DE LA FICHA DE PRODUCTO V2 EN EL PREVIEW (CLAUDE.md
 * §10.38), para verificar la ficha pintada contra ux-9. SOLO EN EL PREVIEW.
 *
 *   npm run preview:ficha:sembrar
 *   npm run preview:ficha:retirar
 *
 * - SOLO preview: guardián de base y almacén (`puedeTocarHeroDePrueba`) y la
 *   guarda del almacén (§10.37), antes de cargar Payload.
 * - Assets de ux-9 desde `Desktop/partequipos-diseno/wordpress/ficha-producto/
 *   assets/`; nunca en el repositorio ni en `public/`.
 * - Lo que sube lleva la marca `EJEMPLO UX-9 —` (en el `alt` de las imágenes y
 *   en el título del PDF), y `retirar` lo quita y comprueba que los ficheros
 *   salen del Blob.
 *
 * Qué hace: en los 4 primeros equipos Hitachi del tipo de excavadoras (por
 * nombre, para que cada uno tenga a los otros 3 en «Otras referencias») pone
 * fotos, una ficha técnica con 4 filas destacadas, la descripción de ux-9 y un
 * PDF de prueba; y la imagen de la llamada a contactar en el global
 * `ficha-producto`. Los valores ANTERIORES de esos equipos se guardan en un
 * manifiesto (fuera del repositorio) y `retirar` los restaura tal cual.
 *
 * NO REFRESCA EL PREVIEW: sembrar ANTES del último push (o redesplegar).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import type { EquiposNuevo } from "../../src/payload-types";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { MARCA_EJEMPLO } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { buscarPorMarca } from "../../src/lib/portada/porMarca";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
if (!modo) {
  console.error("[ficha] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}
const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[ficha] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[ficha]");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[ficha] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CARPETA = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-diseno",
  "wordpress",
  "ficha-producto",
);
const ASSETS = path.join(CARPETA, "assets");
const MANIFIESTO = path.join(CARPETA, "manifiesto-preview.json");
const MARCA = MARCA_EJEMPLO;

/** Los 4 primeros equipos del tipo, por nombre (ver arriba). */
const SLUG_TIPO = "excavadoras-hitachi";
const CUANTOS = 4;

const FOTOS = {
  obra: ["ZX130-7H_working_jobsite-14-scaled-3.jpg", "excavadora Hitachi trabajando en una obra"],
  obra2: ["ZX130-7H_jobsite_0001-1_4-3.webp", "excavadora Hitachi cargando material"],
  detalle: ["ZX130-7H_Close-Up_0006.jpg", "detalle de la cabina de una excavadora Hitachi"],
  estudio: ["ZX50U-5N_Machine-Photo_0001.webp", "miniexcavadora Hitachi sobre fondo blanco"],
  contacto: ["CTA-contactoi.png", "asesor de Partequipos con casco y tableta"],
} as const;
/** Solo lo que sube ESTE script: otros scripts usan la misma marca (§10.38). */
const FOTOS_ALT = new Set(Object.values(FOTOS).map(([, alt]) => `${MARCA} ${alt}`));
const TITULO_PDF = `${MARCA} ficha técnica de prueba`;

/** Ficha técnica de ux-9 (tarjetas de «Otras referencias»), con 4 filas destacadas. */
const FICHA = [
  { etiqueta: "Peso operativo", valor: "8,4 t", destacar: true, icono: "peso" },
  { etiqueta: "Potencia", valor: "64 hp", destacar: true, icono: "potencia" },
  { etiqueta: "Motor", valor: "YANMAR 4TNV98CT", destacar: true, icono: "motor" },
  { etiqueta: "Alcance máximo", valor: "7,6 m", destacar: true, icono: "alcance" },
  { etiqueta: "Profundidad máxima de excavación", valor: "5,1 m", destacar: false },
  { etiqueta: "Capacidad del cucharón", valor: "0,28 m³", destacar: false },
] as const;

/** Texto de ux-9 (export 3166), con la marca al principio. */
function descripcion(): NonNullable<EquiposNuevo["descripcion"]> {
  const parrafo = (partes: { text: string; bold?: boolean }[]) => ({
    type: "paragraph",
    format: "" as const,
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    textFormat: 0,
    textStyle: "",
    children: partes.map((p) => ({
      type: "text",
      text: p.text,
      format: p.bold ? 1 : 0,
      detail: 0,
      mode: "normal",
      style: "",
      version: 1,
    })),
  });
  return {
    root: {
      type: "root",
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: [
        parrafo([{ text: `${MARCA} texto de la ficha de ux-9.` }]),
        parrafo([
          { text: "Partequipos Premium: ", bold: true },
          { text: "venta de excavadoras certificadas en Colombia." },
        ]),
        parrafo([
          {
            text: "Equipo revisado, en excelente estado y listo para obra, con inspección técnica y disponibilidad inmediata.",
          },
        ]),
      ],
    },
  };
}

type Anterior = {
  id: number;
  slug: string;
  imagenes: number[];
  fichaTecnica: unknown[];
  descripcion: unknown;
  fichaTecnicaPdf: number | null;
};
type Manifiesto = { equipos: Anterior[] };

const imagenesMarcadas = () => buscarPorMarca(payload, "media", "alt", MARCA);
const documentosMarcados = () => buscarPorMarca(payload, "documentos", "titulo", MARCA);

async function subir(clave: keyof typeof FOTOS) {
  const [fichero, alt] = FOTOS[clave];
  const completo = `${MARCA} ${alt}`;
  const ya = (await imagenesMarcadas()).find((m) => m.alt === completo);
  if (ya) return ya.id;
  const doc = await payload.create({
    collection: "media",
    data: { alt: completo, focalX: 50, focalY: 50 },
    filePath: path.join(ASSETS, fichero),
    overrideAccess: true,
  });
  log(`${fichero}: subida (id ${doc.id})`);
  return doc.id;
}

async function subirPdf() {
  const titulo = TITULO_PDF;
  const ya = (await documentosMarcados()).find((d) => d.titulo === titulo);
  if (ya) return ya.id;
  const doc = await payload.create({
    collection: "documentos",
    data: { titulo },
    filePath: path.join(ASSETS, "ejemplo-ficha-tecnica.pdf"),
    overrideAccess: true,
  });
  log(`PDF de prueba: subido (id ${doc.id})`);
  return doc.id;
}

async function equiposDelTipo() {
  const t = await payload.find({
    collection: "tipos-maquinaria",
    where: { slug: { equals: SLUG_TIPO } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const tipo = t.docs[0];
  if (!tipo) throw new Error(`[ficha] falta el tipo «${SLUG_TIPO}»`);
  const r = await payload.find({
    collection: "equipos-nuevos",
    where: { tipo: { equals: tipo.id } },
    sort: "nombre",
    depth: 0,
    limit: CUANTOS,
    overrideAccess: true,
  });
  return r.docs;
}

const marcado = (d: unknown) => JSON.stringify(d ?? null).includes(MARCA);

if (modo === "sembrar") {
  const equipos = await equiposDelTipo();
  const previo: Manifiesto | null = fs.existsSync(MANIFIESTO)
    ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
    : null;
  // El manifiesto guarda lo de ANTES de la primera siembra: nunca se pisa.
  const manifiesto: Manifiesto = previo ?? {
    equipos: equipos.map((e) => ({
      id: e.id,
      slug: e.slug,
      imagenes: (e.imagenes ?? []).map((i) => (typeof i === "number" ? i : i.id)),
      fichaTecnica: (e.fichaTecnica ?? []).map((fila) => ({ ...fila, id: undefined })),
      descripcion: e.descripcion ?? null,
      fichaTecnicaPdf:
        typeof e.fichaTecnicaPdf === "number" ? e.fichaTecnicaPdf : (e.fichaTecnicaPdf?.id ?? null),
    })),
  };
  if (!previo) {
    if (equipos.some((e) => marcado(e.descripcion))) {
      throw new Error("[ficha] hay equipos ya sembrados y no hay manifiesto: no se siembra");
    }
    fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
    log(`manifiesto guardado (${manifiesto.equipos.length} equipos)`);
  }

  const obra = await subir("obra");
  const obra2 = await subir("obra2");
  const detalle = await subir("detalle");
  const estudio = await subir("estudio");
  const pdf = await subirPdf();

  for (const [i, e] of equipos.entries()) {
    await payload.update({
      collection: "equipos-nuevos",
      id: e.id,
      data: {
        // El primero, con las fotos de obra de ux-9; los demás, con la de estudio delante.
        imagenes: i === 0 ? [obra, obra2, detalle] : [estudio, obra, obra2],
        fichaTecnica: FICHA.map((f) => ({ ...f })),
        descripcion: descripcion(),
        fichaTecnicaPdf: pdf,
      },
      overrideAccess: true,
    });
    log(`${e.slug}: fotos, ficha técnica (4 destacadas), texto y PDF puestos`);
  }

  const contacto = await subir("contacto");
  await payload.updateGlobal({
    slug: "ficha-producto",
    data: { imagenContacto: contacto },
    overrideAccess: true,
  });
  log("global ficha-producto: imagen de la llamada a contactar puesta");
} else {
  if (!fs.existsSync(MANIFIESTO)) {
    throw new Error(`[ficha] no hay manifiesto (${MANIFIESTO}): nada que restaurar`);
  }
  const manifiesto = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
  for (const a of manifiesto.equipos) {
    const actual = await payload.findByID({
      collection: "equipos-nuevos",
      id: a.id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    });
    if (!actual) continue;
    if (!marcado(actual.descripcion)) {
      log(`${a.slug}: no lleva el texto de ejemplo; no se toca`);
      continue;
    }
    await payload.update({
      collection: "equipos-nuevos",
      id: a.id,
      data: {
        imagenes: a.imagenes,
        fichaTecnica: a.fichaTecnica as never,
        descripcion: a.descripcion as never,
        fichaTecnicaPdf: a.fichaTecnicaPdf,
      },
      overrideAccess: true,
    });
    log(`${a.slug}: restaurado como estaba`);
  }

  const ids = new Set(
    (await imagenesMarcadas()).filter((m) => FOTOS_ALT.has(m.alt ?? "")).map((m) => m.id),
  );
  const global = await payload.findGlobal({
    slug: "ficha-producto",
    depth: 0,
    overrideAccess: true,
  });
  if (typeof global.imagenContacto === "number" && ids.has(global.imagenContacto)) {
    await payload.updateGlobal({
      slug: "ficha-producto",
      data: { imagenContacto: null },
      overrideAccess: true,
    });
    log("global ficha-producto: imagen quitada");
  }

  const urls: string[] = [];
  for (const d of await documentosMarcados()) {
    if (d.titulo !== TITULO_PDF) continue;
    if (d.url) urls.push(d.url);
    await payload.delete({ collection: "documentos", id: d.id, overrideAccess: true });
  }
  for (const m of await imagenesMarcadas()) {
    if (!FOTOS_ALT.has(m.alt ?? "")) continue;
    if (m.url) urls.push(m.url);
    await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
  }
  fs.rmSync(MANIFIESTO);
  log(`${urls.length} ficheros borrados y manifiesto retirado; espero 70 s (propagación del Blob)`);
  await esperar(70_000);
  const vivos: string[] = [];
  for (const u of urls) if ((await fetch(u, { method: "HEAD" })).status !== 404) vivos.push(u);
  if (vivos.length) {
    const e = new Error(`[ficha] ✗ ${vivos.length} ficheros siguen en el Blob`);
    e.stack = e.message;
    throw e;
  }
  log("✓ todos los ficheros dan 404");
}
