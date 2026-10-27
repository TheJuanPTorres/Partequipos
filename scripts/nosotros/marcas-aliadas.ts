/**
 * «MARCAS ALIADAS» DE NOSOTROS CON EL DISEÑO DEL CLIENTE (2026-10-26, ronda 8, tarea 6): la franja
 * con texto en movimiento de Nosotros se SUSTITUYE por el bloque «Marcas aliadas» con las cinco
 * tarjetas del kit (`Desktop\partequipos-diseno\nosotros-aliadas\`): Partequipos Express, Tu
 * Maquinaria, Partequipos Perú, Maquitecno y Eni Lubricantes (textos, colores y enlaces tal cual).
 *
 *   npm run preview:ejecutar -- payload run scripts/nosotros/marcas-aliadas.ts listar
 *   npm run preview:ejecutar -- payload run scripts/nosotros/marcas-aliadas.ts aplicar
 *   npm run preview:ejecutar -- payload run scripts/nosotros/marcas-aliadas.ts retirar
 *
 * - `listar` solo lee (los bloques de Nosotros y las imágenes `aliadas-`).
 * - `aplicar` sube a «Imágenes» las 10 del kit (5 logos y 5 fotos; se reconocen por el nombre
 *   `aliadas-…`), guarda en un manifiesto los bloques tal como estaban y cambia la franja por el
 *   bloque nuevo, que conserva sus fotos de fondo («Imagen de fondo» y «Más fotos de fondo») y su
 *   ancla. Idempotente: con manifiesto, se niega.
 * - `retirar` devuelve los bloques, borra las imágenes subidas y comprueba que salen del Blob.
 *
 * SOLO EL PREVIEW (guardián de base y almacén y guarda del almacén, §10.37). En el sitio publicado
 * lo hace dirección desde el panel (`runbook-marcas-aliadas-nosotros.md`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { exigirAlmacen } from "../blob/exigirAlmacen";

const fallar = (m: string): never => {
  const e = new Error(`[marcas-aliadas] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
const modo = process.argv
  .slice(2)
  .find((a) => a === "listar" || a === "aplicar" || a === "retirar");
if (!modo) fallar("indica el modo: listar, aplicar o retirar");
const guarda = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!guarda.permitido) fallar(`NO se hace nada: ${guarda.motivo}`);
exigirAlmacen("[marcas-aliadas]");

const KIT = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-diseno",
  "nosotros-aliadas",
  "public",
  "partequipos",
  "marcas-aliadas",
  "web",
);
const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-marcas-aliadas-preview.json",
);

/** Las cinco tarjetas del kit, tal cual (textos, colores y enlaces). */
const ALIADAS = [
  {
    id: "partequipos-express",
    nombre: "Partequipos Express",
    texto: "Soluciones rápidas en repuestos y equipos.",
    color: "#0a5bb0",
    enlace: "https://partequiposexpress.com/",
    logo: "logo-partequipos-express.webp",
    foto: "foto-partequipos-express.jpg",
  },
  {
    id: "tu-maquinaria",
    nombre: "Tu Maquinaria",
    texto: "Especialistas en maquinaria usada.",
    color: "#e8a90e",
    enlace: "https://tumaquinaria.com.co/",
    logo: "logo-tu-maquinaria.webp",
    foto: "foto-tu-maquinaria.jpg",
  },
  {
    id: "partequipos-peru",
    nombre: "Partequipos Perú",
    texto: "Presencia en el mercado peruano.",
    color: "#d4122f",
    enlace: "https://www.partequipos.pe/",
    logo: "logo-partequipos-peru.webp",
    foto: "foto-partequipos-peru.jpg",
  },
  {
    id: "maquitecno",
    nombre: "Maquitecno",
    texto: "Distribuidor oficial LiuGong.",
    color: "#ec6c0b",
    enlace: "https://maquitecno.co/",
    logo: "logo-maquitecno.webp",
    foto: "foto-maquitecno.jpg",
  },
  {
    id: "eni",
    nombre: "Eni Lubricantes",
    texto: "Lubricantes de alto rendimiento.",
    color: "#e6c200",
    enlace: "https://enicolombiapartequipos.com/",
    logo: "logo-eni.webp",
    foto: "foto-eni.jpg",
  },
] as const;

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[marcas-aliadas] ${m}\n`);

type Bloque = Record<string, unknown> & { blockType: string };

const { docs } = await payload.find({
  collection: "paginas",
  where: { slug: { equals: "nosotros" } },
  depth: 0,
  limit: 1,
  overrideAccess: true,
});
const pagina = docs[0] ?? fallar("no hay página «nosotros»");
const bloques = (pagina.bloques ?? []) as unknown as Bloque[];

const aliadasEnMedia = async () =>
  (
    await payload.find({
      collection: "media",
      where: { filename: { like: "aliadas-" } },
      depth: 0,
      limit: 50,
      overrideAccess: true,
    })
  ).docs.filter((m) => m.filename?.startsWith("aliadas-"));

if (modo === "listar") {
  for (const b of bloques) {
    const { blockType, id, ...resto } = b;
    log(`bloque ${blockType} (${String(id)}): ${JSON.stringify(resto).slice(0, 400)}`);
  }
  for (const m of await aliadasEnMedia())
    log(`imagen ${m.id}: ${m.filename} ${m.width}×${m.height}`);
} else if (modo === "aplicar") {
  if (fs.existsSync(MANIFIESTO))
    fallar(`ya existe ${MANIFIESTO}: retira antes de volver a aplicar`);
  const franja = bloques.find((b) => b.blockType === "franjaMarquee");
  if (!franja) fallar("Nosotros no tiene la franja con texto en movimiento: nada que sustituir");

  const subidas: number[] = [];
  const subir = async (fichero: string, alt: string): Promise<number> => {
    const destino = `aliadas-${fichero}`;
    const [ya] = (await aliadasEnMedia()).filter((m) => m.filename === destino);
    if (ya) return ya.id;
    // Payload nombra el fichero como el original: se copia con el prefijo en una carpeta temporal.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aliadas-"));
    const copia = path.join(tmp, destino);
    fs.copyFileSync(path.join(KIT, fichero), copia);
    const media = await payload.create({
      collection: "media",
      data: { alt, focalX: 50, focalY: 50 },
      filePath: copia,
      overrideAccess: true,
    });
    subidas.push(media.id);
    log(`subida: media ${media.id}, ${media.filename}, ${media.width}×${media.height}`);
    return media.id;
  };

  const tarjetas: Record<string, unknown>[] = [];
  for (const a of ALIADAS) {
    tarjetas.push({
      nombre: a.nombre,
      texto: a.texto,
      color: a.color,
      enlace: a.enlace,
      logo: await subir(a.logo, `Logo de ${a.nombre}`),
      foto: await subir(a.foto, `Foto de ambiente de ${a.nombre}`),
    });
  }

  const nuevos = bloques.map((b): Bloque => {
    if (b !== franja) return b;
    return {
      blockType: "marcasAliadas",
      ancla: franja.ancla ?? null,
      titulo: "Marcas aliadas",
      imagenFondo: franja.imagenFondo ?? null,
      fondosExtra: franja.fondosExtra ?? [],
      tarjetas,
    };
  });
  fs.writeFileSync(MANIFIESTO, JSON.stringify({ paginaId: pagina.id, bloques, subidas }, null, 2));
  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { bloques: nuevos } as never,
    overrideAccess: true,
  });
  log(`✓ aplicado: 5 tarjetas, ${subidas.length} imágenes subidas (manifiesto: ${MANIFIESTO})`);
} else {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no existe ${MANIFIESTO}: nada que retirar`);
  const antes = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as {
    bloques: Bloque[];
    subidas: number[];
  };
  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { bloques: antes.bloques } as never,
    overrideAccess: true,
  });
  log("bloques devueltos a como estaban");
  const urls: string[] = [];
  for (const m of await aliadasEnMedia()) {
    if (m.url) urls.push(m.url);
    await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
    log(`borrada: media ${m.id} (${m.filename})`);
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  if (urls.length > 0) {
    log("espero 70 s (propagación del Blob)");
    await new Promise((r) => setTimeout(r, 70_000));
    for (const u of urls) {
      if ((await fetch(u, { method: "HEAD" })).status !== 404)
        fallar(`el fichero sigue en el Blob: ${u}`);
    }
    log("✓ los ficheros dan 404");
  }
}
