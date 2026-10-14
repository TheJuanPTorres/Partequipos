/**
 * Siembra o retira las IMÁGENES de las páginas índice de repuestos y de
 * maquinaria y de Contáctanos (global `paginas-indice`), SOLO EN EL PREVIEW.
 *
 *   npm run preview:indices:sembrar
 *   npm run preview:indices:retirar
 *
 * - SOLO preview: el mismo guardián que el hero de prueba
 *   (`puedeTocarHeroDePrueba`), que se niega ANTES de conectar si la base o el
 *   Blob no son los del preview, y la guarda del almacén (§10.37).
 * - Sube desde `Desktop/partequipos-diseno/wordpress/indices/assets/` con el
 *   prefijo `indices-`:
 *     · las FOTOS DE LAS TARJETAS, de la web original del cliente
 *       (partequipos.com): son suyas, con su texto alternativo real;
 *     · las de ANDRÉS (fondos de los encabezados, foto de Contáctanos y máquina
 *       decorativa), con licencia pendiente (L3, excepción de demostración
 *       §10.38) y el texto «EJEMPLO UX-9 —».
 * - Las tarjetas se emparejan POR ORDEN con las del global (las seis que sembró
 *   la migración): no se cambian sus títulos ni enlaces, solo la foto.
 * - Antes de tocar nada guarda en un MANIFIESTO (fuera del repositorio) la foto
 *   previa de cada campo; «retirar» la restaura y borra las imágenes del Blob.
 *   Idempotente.
 *
 * NO REFRESCA EL PREVIEW: las páginas están prerenderizadas. Sembrar ANTES del
 * último push, o redesplegar. PARA PRODUCCIÓN: runbook-indices-produccion.md.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
if (!modo) {
  console.error("[indices] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[indices] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[indices]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[indices] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RAIZ = path.join(os.homedir(), "Desktop", "partequipos-diseno", "wordpress", "indices");
const CARPETA = path.join(RAIZ, "assets");
const MANIFIESTO = path.join(RAIZ, "manifiesto-preview.json");
const PREFIJO = "indices-";
const EJEMPLO = "EJEMPLO UX-9 — ";

type Imagen = { origen: string; alt: string };
const IMAGENES = {
  // Web original del cliente (fotos de las tarjetas).
  repMarcas: { origen: "repuestos-marcas.jpg", alt: "Excavadora trabajando al atardecer" },
  repCategorias: { origen: "repuestos-categorias.jpg", alt: "Pasadores de acero para maquinaria" },
  repTren: { origen: "repuestos-tren-de-rodaje.png", alt: "Cadena y pasadores de tren de rodaje" },
  repFiltracion: { origen: "repuestos-filtracion.jpg", alt: "Filtros Donaldson para maquinaria" },
  repGets: { origen: "repuestos-gets.png", alt: "Dientes y puntas de herramienta de corte" },
  lubricantes: { origen: "lubricantes.jpg", alt: "Aceite cayendo sobre engranajes y rodamientos" },
  maqNueva: { origen: "maquinaria-nueva.jpg", alt: "Dos excavadoras Hitachi nuevas en una obra" },
  maqUsada: { origen: "maquinaria-usada.jpg", alt: "Excavadora Hitachi trabajando en una obra" },
  maqAditamentos: {
    origen: "maquinaria-aditamentos.jpg",
    alt: "Excavadora Hitachi cargando un balde en una cantera",
  },
  servicio: {
    origen: "servicio-tecnico.jpg",
    alt: "Técnico revisando un componente de una excavadora",
  },
  // De Andrés (L3, solo preview).
  heroRepuestos: {
    origen: "hero-repuestos.jpg",
    alt: `${EJEMPLO}Cabina de una excavadora vista desde dentro`,
  },
  heroMaquinaria: {
    origen: "hero-maquinaria.jpg",
    alt: `${EJEMPLO}Excavadora Hitachi en una mina de carbón`,
  },
  contactoFoto: {
    origen: "contacto-foto.jpg",
    alt: `${EJEMPLO}Dos asesores de Partequipos con cascos amarillos`,
  },
  contactoDecorativa: {
    origen: "contacto-decorativa.png",
    alt: `${EJEMPLO}Compactador de neumáticos amarillo`,
  },
} satisfies Record<string, Imagen>;
type Clave = keyof typeof IMAGENES;

/** Foto de cada tarjeta, por orden (las seis que sembró la migración). */
const TARJETAS_REPUESTOS: Clave[] = [
  "repMarcas",
  "repCategorias",
  "repTren",
  "repFiltracion",
  "repGets",
  "lubricantes",
];
const TARJETAS_MAQUINARIA: Clave[] = [
  "maqNueva",
  "maqUsada",
  "maqAditamentos",
  "repMarcas",
  "lubricantes",
  "servicio",
];

const mime = (f: string) => (f.endsWith(".png") ? "image/png" : "image/jpeg");
const idDe = (v: unknown): number | null =>
  typeof v === "number"
    ? v
    : v && typeof v === "object" && "id" in v
      ? Number((v as { id: unknown }).id)
      : null;
const base = (f: string) => f.replace(/\.[a-z0-9]+$/i, "");
const nombreFichero = (clave: Clave) => `${PREFIJO}${IMAGENES[clave].origen}`;
const mismoFichero = (guardado: string | null | undefined, original: string) =>
  !!guardado && (guardado === original || base(guardado).startsWith(`${base(original)}-`));

const mediaExistente = async () =>
  (
    await payload.find({
      collection: "media",
      where: { filename: { like: PREFIJO } },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })
  ).docs.filter((m) => m.filename?.startsWith(PREFIJO));

type Manifiesto = {
  repuestos: { fondo: number | null; tarjetas: (number | null)[] };
  maquinaria: { fondo: number | null; tarjetas: (number | null)[] };
  contacto: { foto: number | null; imagenDecorativa: number | null };
};

const ids: Partial<Record<Clave, number>> = {};

if (modo === "sembrar") {
  const global = await payload.findGlobal({
    slug: "paginas-indice",
    depth: 0,
    overrideAccess: true,
  });
  if (!global.repuestos?.tarjetas?.length || !global.maquinaria?.tarjetas?.length) {
    console.error("[indices] NO hay tarjetas sembradas en el global: ¿está aplicada la migración?");
    process.exit(1);
  }

  // 1. Imágenes (las que ya están no se vuelven a subir).
  const existentes = await mediaExistente();
  for (const clave of Object.keys(IMAGENES) as Clave[]) {
    const img = IMAGENES[clave];
    let doc = existentes.find((m) => mismoFichero(m.filename, nombreFichero(clave)));
    if (!doc) {
      const data = fs.readFileSync(path.join(CARPETA, img.origen));
      doc = await payload.create({
        collection: "media",
        data: { alt: img.alt, focalX: 50, focalY: 50 },
        file: { data, name: nombreFichero(clave), mimetype: mime(img.origen), size: data.length },
        overrideAccess: true,
      });
      log(`${clave}: subida (id ${doc.id})`);
    } else log(`${clave}: ya existía (id ${doc.id})`);
    ids[clave] = doc.id;
  }

  // 2. Manifiesto con lo previo, SOLO la primera vez.
  if (!fs.existsSync(MANIFIESTO)) {
    const m: Manifiesto = {
      repuestos: {
        fondo: idDe(global.repuestos?.fondo),
        tarjetas: (global.repuestos?.tarjetas ?? []).map((t) => idDe(t.imagen)),
      },
      maquinaria: {
        fondo: idDe(global.maquinaria?.fondo),
        tarjetas: (global.maquinaria?.tarjetas ?? []).map((t) => idDe(t.imagen)),
      },
      contacto: {
        foto: idDe(global.contacto?.foto),
        imagenDecorativa: idDe(global.contacto?.imagenDecorativa),
      },
    };
    fs.writeFileSync(MANIFIESTO, JSON.stringify(m, null, 2));
    log(`manifiesto guardado (${MANIFIESTO})`);
  } else log("manifiesto previo conservado");

  // 3. El global: las fotos, sin tocar títulos ni enlaces.
  const conFoto = (tarjetas: NonNullable<typeof global.repuestos>["tarjetas"], claves: Clave[]) =>
    (tarjetas ?? []).map((t, i) => ({
      id: t.id ?? undefined,
      titulo: t.titulo,
      enlace: t.enlace,
      imagen: claves[i] ? (ids[claves[i]] ?? null) : null,
    }));
  await payload.updateGlobal({
    slug: "paginas-indice",
    data: {
      repuestos: {
        ...global.repuestos,
        fondo: ids.heroRepuestos,
        tarjetas: conFoto(global.repuestos?.tarjetas, TARJETAS_REPUESTOS),
      },
      maquinaria: {
        ...global.maquinaria,
        fondo: ids.heroMaquinaria,
        tarjetas: conFoto(global.maquinaria?.tarjetas, TARJETAS_MAQUINARIA),
      },
      contacto: {
        ...global.contacto,
        foto: ids.contactoFoto,
        imagenDecorativa: ids.contactoDecorativa,
      },
    },
    overrideAccess: true,
  });
  log("global «paginas-indice»: fotos de tarjetas, fondos y contacto puestos");
  log("HECHO. Redesplegar el preview (o hacer push) para que el build lo recoja.");
  process.exit(0);
}

// --- retirar ------------------------------------------------------------------
if (!fs.existsSync(MANIFIESTO)) {
  console.error(
    "[indices] NO hay manifiesto: no sé qué valores previos restaurar. No se toca nada.",
  );
  process.exit(1);
}
const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
const global = await payload.findGlobal({ slug: "paginas-indice", depth: 0, overrideAccess: true });
const restaurar = (
  tarjetas: NonNullable<typeof global.repuestos>["tarjetas"],
  previas: (number | null)[],
) =>
  (tarjetas ?? []).map((t, i) => ({
    id: t.id ?? undefined,
    titulo: t.titulo,
    enlace: t.enlace,
    imagen: previas[i] ?? null,
  }));
// Primero se sueltan las referencias, después se borran las imágenes.
await payload.updateGlobal({
  slug: "paginas-indice",
  data: {
    repuestos: {
      ...global.repuestos,
      fondo: m.repuestos.fondo,
      tarjetas: restaurar(global.repuestos?.tarjetas, m.repuestos.tarjetas),
    },
    maquinaria: {
      ...global.maquinaria,
      fondo: m.maquinaria.fondo,
      tarjetas: restaurar(global.maquinaria?.tarjetas, m.maquinaria.tarjetas),
    },
    contacto: {
      ...global.contacto,
      foto: m.contacto.foto,
      imagenDecorativa: m.contacto.imagenDecorativa,
    },
  },
  overrideAccess: true,
});
log("valores previos restaurados");

const ficheros: string[] = [];
for (const media of await mediaExistente()) {
  if (media.url) ficheros.push(media.url);
  await payload.delete({ collection: "media", id: media.id, overrideAccess: true });
}
log(`${ficheros.length} imágenes borradas de la base`);
fs.renameSync(MANIFIESTO, `${MANIFIESTO}.retirado`);

let fallos = 0;
for (const url of ficheros) {
  const fin = Date.now() + 150_000;
  let estado = 0;
  while (Date.now() < fin) {
    estado = (await fetch(url, { method: "HEAD" }).catch(() => null))?.status ?? 0;
    if (estado === 404) break;
    await esperar(10_000);
  }
  if (estado !== 404) {
    fallos++;
    log(`Blob ${url.split("/").pop()}: ${estado} — SIGUE AHÍ`);
  }
}
log(fallos ? `ATENCIÓN: ${fallos} ficheros siguen en el Blob.` : "HECHO. Todo fuera del Blob.");
process.exit(fallos ? 1 : 0);
