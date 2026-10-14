/**
 * Siembra o retira el CONTENIDO DE EJEMPLO de la página de marca de repuestos
 * (ux-9, plantilla 3373), SOLO EN EL PREVIEW.
 *
 *   npm run preview:repuestos-marca:sembrar
 *   npm run preview:repuestos-marca:retirar
 *
 * - SOLO preview: el mismo guardián que el hero de prueba
 *   (`puedeTocarHeroDePrueba`), que se niega ANTES de conectar si la base o el
 *   Blob no son los del preview, y la guarda del almacén (§10.37).
 * - Sube desde `Desktop/partequipos-diseno/wordpress/repuestos-marca/assets/`
 *   las imágenes de ux-9 (licencia pendiente, L3; excepción de demostración
 *   §10.38) con el prefijo `repuestos-marca-` y el texto alternativo
 *   «EJEMPLO UX-9 — …»:
 *     · el fondo del encabezado (el logo es el de la marca, el que importó B);
 *     · la imagen de la tarjeta de cada tipo de la marca (se empareja por
 *       nombre: bulldozer, excavadora, retrocargadora, cargador frontal);
 *     · las de las tarjetas de maquinaria usada y aditamentos (global
 *       `repuestos-marca`);
 *     · la posición (`ordenMarca`) y, si no tenían, el icono de las categorías técnicas.
 * - NO inventa datos de la marca ni de los tipos: usa los que haya (los
 *   importará el agente B). Sin marca «caterpillar» en el preview, se niega.
 * - Antes de tocar nada guarda en un MANIFIESTO (fuera del repositorio) los
 *   valores previos de cada campo; `retirar` los restaura y borra las
 *   imágenes del Blob. Idempotente.
 *
 * NO REFRESCA EL PREVIEW: la página de marca está prerenderizada. Sembrar
 * ANTES del último push, o redesplegar.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
if (!modo) {
  console.error("[repuestos-marca] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[repuestos-marca] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[repuestos-marca]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[repuestos-marca] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RAIZ = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-diseno",
  "wordpress",
  "repuestos-marca",
);
const CARPETA = path.join(RAIZ, "assets");
const MANIFIESTO = path.join(RAIZ, "manifiesto-preview.json");
const PREFIJO = "repuestos-marca-";
const MARCA_SLUG = "repuestos-para-maquinaria-pesada-caterpillar";

type Imagen = { origen: string; nombre: string; alt: string; mime: string };
const IMAGENES: Record<string, Imagen> = {
  fondo: {
    origen: "ZX130-7H_working_jobsite-14-scaled-2.jpg",
    nombre: `${PREFIJO}fondo.jpg`,
    alt: "EJEMPLO UX-9 — Excavadora trabajando en una obra",
    mime: "image/jpeg",
  },
  bulldozer: {
    origen: "images-1.jpeg",
    nombre: `${PREFIJO}tipo-bulldozer.jpg`,
    alt: "EJEMPLO UX-9 — Bulldozer Caterpillar empujando tierra",
    mime: "image/jpeg",
  },
  excavadora: {
    origen: "images-5.jpeg",
    nombre: `${PREFIJO}tipo-excavadora.jpg`,
    alt: "EJEMPLO UX-9 — Excavadora Caterpillar en una cantera",
    mime: "image/jpeg",
  },
  retrocargadora: {
    origen: "images-2.jpeg",
    nombre: `${PREFIJO}tipo-retrocargadora.jpg`,
    alt: "EJEMPLO UX-9 — Camión minero Caterpillar",
    mime: "image/jpeg",
  },
  cargador: {
    origen: "images-3.jpeg",
    nombre: `${PREFIJO}tipo-cargador.jpg`,
    alt: "EJEMPLO UX-9 — Cargador frontal Caterpillar",
    mime: "image/jpeg",
  },
  usadas: {
    origen: "8c226e468439f0b2f0eaecb4309cc16e-scaled.jpg",
    nombre: `${PREFIJO}tarjeta-usadas.jpg`,
    alt: "EJEMPLO UX-9 — Excavadora de maquinaria usada",
    mime: "image/jpeg",
  },
  aditamentos: {
    origen: "images-4.jpeg",
    nombre: `${PREFIJO}tarjeta-aditamentos.jpg`,
    alt: "EJEMPLO UX-9 — Aditamentos para maquinaria",
    mime: "image/jpeg",
  },
};

/** Qué imagen lleva cada tipo, por su nombre (sin tildes, en minúscula). */
const TIPO_A_IMAGEN: [RegExp, string][] = [
  [/bulldozer|buldozer/, "bulldozer"],
  [/excavadora/, "excavadora"],
  [/retrocargadora/, "retrocargadora"],
  [/cargador/, "cargador"],
];

/** Posición de cada categoría técnica en la página, por su nombre (el orden de ux-9). */
type Icono =
  | "corte"
  | "llanta"
  | "lubricante"
  | "filtro"
  | "motor"
  | "rodaje"
  | "miscelaneos"
  | "componentes"
  | "diesel";
const CATEGORIA_A_ORDEN: [RegExp, number, Icono][] = [
  [/rodaje/, 1, "rodaje"],
  [/filtraci/, 2, "filtro"],
  [/corte|baldes|gets/, 3, "corte"],
  [/lubricante/, 4, "lubricante"],
  [/miscel/, 5, "miscelaneos"],
  [/componentes mayores|mayores/, 6, "componentes"],
  [/diesel|motor/, 7, "diesel"],
  [/llantas|rines/, 8, "llanta"],
];

const normal = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Manifiesto = {
  marca: { id: number; fondoHero: number | null; logo: number | null } | null;
  tipos: { id: number; imagen: number | null }[];
  categorias: { id: number; ordenMarca: number | null; icono?: Icono | null }[];
  global: { usadas: number | null; aditamentos: number | null } | null;
};
const idDe = (v: unknown): number | null =>
  typeof v === "number"
    ? v
    : v && typeof v === "object" && "id" in v
      ? Number((v as { id: unknown }).id)
      : null;

const mediaExistente = async () =>
  (
    await payload.find({
      collection: "media",
      where: { filename: { like: PREFIJO } },
      depth: 0,
      limit: 50,
      overrideAccess: true,
    })
  ).docs.filter((m) => m.filename?.startsWith(PREFIJO));

const base = (f: string) => f.replace(/\.[a-z0-9]+$/i, "");
const mismoFichero = (guardado: string | null | undefined, original: string) =>
  !!guardado && (guardado === original || base(guardado).startsWith(`${base(original)}-`));

async function marcaCat() {
  const r = await payload.find({
    collection: "marcas",
    where: { slug: { equals: MARCA_SLUG } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return r.docs[0] ?? null;
}

if (modo === "sembrar") {
  const marca = await marcaCat();
  if (!marca) {
    console.error(
      `[repuestos-marca] NO existe la marca «${MARCA_SLUG}» en el preview: no hay dónde sembrar.`,
    );
    process.exit(1);
  }

  // 1. Imágenes (las que ya están no se vuelven a subir).
  const existentes = await mediaExistente();
  const ids: Record<string, number> = {};
  for (const [clave, img] of Object.entries(IMAGENES)) {
    let doc = existentes.find((m) => mismoFichero(m.filename, img.nombre));
    if (!doc) {
      const data = fs.readFileSync(path.join(CARPETA, img.origen));
      doc = await payload.create({
        collection: "media",
        data: { alt: img.alt, focalX: 50, focalY: 50 },
        file: { data, name: img.nombre, mimetype: img.mime, size: data.length },
        overrideAccess: true,
      });
      log(`${clave}: subida (id ${doc.id})`);
    } else log(`${clave}: ya existía (id ${doc.id})`);
    ids[clave] = doc.id;
  }

  // 2. Manifiesto con lo previo, SOLO la primera vez (una segunda siembra no lo pisa).
  const tipos = (
    await payload.find({
      collection: "tipos-equipo",
      where: { marca: { equals: marca.id } },
      depth: 0,
      limit: 0,
      overrideAccess: true,
    })
  ).docs;
  const categorias = (
    await payload.find({
      collection: "categorias-tecnicas",
      depth: 0,
      limit: 0,
      overrideAccess: true,
    })
  ).docs;
  const global = await payload.findGlobal({
    slug: "repuestos-marca",
    depth: 0,
    overrideAccess: true,
  });

  if (!fs.existsSync(MANIFIESTO)) {
    const m: Manifiesto = {
      marca: { id: marca.id, fondoHero: idDe(marca.fondoHero), logo: idDe(marca.logo) },
      tipos: tipos.map((t) => ({ id: t.id, imagen: idDe(t.imagen) })),
      categorias: categorias.map((c) => ({
        id: c.id,
        ordenMarca: c.ordenMarca ?? null,
        icono: c.icono ?? null,
      })),
      global: {
        usadas: idDe(global.tarjetaUsadas?.imagen),
        aditamentos: idDe(global.tarjetaAditamentos?.imagen),
      },
    };
    fs.writeFileSync(MANIFIESTO, JSON.stringify(m, null, 2));
    log(`manifiesto guardado (${MANIFIESTO})`);
  } else {
    // Un manifiesto de una versión anterior del script no guardaba el icono: se completa con lo
    // que hay ahora, que sigue siendo lo previo mientras no se haya puesto ninguno.
    const previo = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
    let completado = false;
    for (const c of previo.categorias) {
      if (!("icono" in c)) {
        c.icono = categorias.find((x) => x.id === c.id)?.icono ?? null;
        completado = true;
      }
    }
    if (completado) fs.writeFileSync(MANIFIESTO, JSON.stringify(previo, null, 2));
    log("manifiesto previo conservado");
  }

  // 3. Marca: solo el fondo (el logo es el que importó B).
  await payload.update({
    collection: "marcas",
    id: marca.id,
    data: { fondoHero: ids.fondo },
    overrideAccess: true,
  });
  log(`marca «${marca.nombre}» (id ${marca.id}): fondo puesto (el logo es el que importó B)`);

  // 4. Tipos: la imagen que corresponda a su nombre.
  let conImagen = 0;
  for (const t of tipos) {
    const clave = TIPO_A_IMAGEN.find(([re]) => re.test(normal(t.nombre)))?.[1];
    if (!clave || !ids[clave]) {
      log(`tipo «${t.nombre}»: sin imagen de ejemplo`);
      continue;
    }
    await payload.update({
      collection: "tipos-equipo",
      id: t.id,
      data: { imagen: ids[clave] },
      overrideAccess: true,
    });
    conImagen++;
  }
  log(`${conImagen} de ${tipos.length} tipos con imagen`);

  // 5. Categorías: su posición.
  let ordenadas = 0;
  for (const c of categorias) {
    const regla = CATEGORIA_A_ORDEN.find(([re]) => re.test(normal(c.nombre)));
    if (!regla) continue;
    await payload.update({
      collection: "categorias-tecnicas",
      id: c.id,
      // El icono solo se pone si la categoría no tenía uno (el de la portada manda).
      data: { ordenMarca: regla[1], ...(c.icono ? {} : { icono: regla[2] }) },
      overrideAccess: true,
    });
    ordenadas++;
  }
  log(`${ordenadas} de ${categorias.length} categorías con posición`);

  // 6. Global: las imágenes de las dos tarjetas (los textos los puso la migración).
  await payload.updateGlobal({
    slug: "repuestos-marca",
    data: {
      tarjetaUsadas: { ...global.tarjetaUsadas, imagen: ids.usadas },
      tarjetaAditamentos: { ...global.tarjetaAditamentos, imagen: ids.aditamentos },
    },
    overrideAccess: true,
  });
  log("global «repuestos-marca»: imágenes de usadas y aditamentos puestas");
  log("HECHO. Redesplegar el preview (o hacer push) para que el build lo recoja.");
  process.exit(0);
}

// --- retirar ------------------------------------------------------------------
if (!fs.existsSync(MANIFIESTO)) {
  console.error(
    "[repuestos-marca] NO hay manifiesto: no sé qué valores previos restaurar. No se toca nada.",
  );
  process.exit(1);
}
const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
// Primero se sueltan las referencias, después se borran las imágenes.
if (m.marca) {
  // El logo solo se restaura si sigue siendo el de ejemplo de una versión anterior del script:
  // si no, es el que importó el agente B y no se toca.
  const actual = await payload.findByID({
    collection: "marcas",
    id: m.marca.id,
    depth: 1,
    overrideAccess: true,
  });
  const logoActual = typeof actual.logo === "object" && actual.logo ? actual.logo : null;
  const esDeEjemplo = !!logoActual?.filename?.startsWith(PREFIJO);
  // Igual con el fondo: solo si sigue siendo el de ejemplo. La importación de
  // repuestos (agente C, 2026-10-14) lo quita y guarda lo previo en su manifiesto.
  const fondoActual =
    typeof actual.fondoHero === "object" && actual.fondoHero ? actual.fondoHero : null;
  const fondoDeEjemplo = !!fondoActual?.filename?.startsWith(PREFIJO);
  await payload.update({
    collection: "marcas",
    id: m.marca.id,
    data: {
      ...(fondoDeEjemplo ? { fondoHero: m.marca.fondoHero } : {}),
      ...(esDeEjemplo ? { logo: m.marca.logo } : {}),
    },
    overrideAccess: true,
  });
}
for (const t of m.tipos) {
  // Solo si sigue con la imagen de ejemplo: la importación de repuestos pone la
  // real de WordPress (`wp-tipo-…`), y esa no se toca.
  const actual = await payload
    .findByID({ collection: "tipos-equipo", id: t.id, depth: 1, overrideAccess: true })
    .catch(() => null);
  const imagen = actual && typeof actual.imagen === "object" ? actual.imagen : null;
  if (!imagen?.filename?.startsWith(PREFIJO)) continue;
  await payload.update({
    collection: "tipos-equipo",
    id: t.id,
    data: { imagen: t.imagen },
    overrideAccess: true,
  });
}
for (const c of m.categorias) {
  await payload.update({
    collection: "categorias-tecnicas",
    id: c.id,
    data: { ordenMarca: c.ordenMarca, icono: c.icono },
    overrideAccess: true,
  });
}
if (m.global) {
  const g = await payload.findGlobal({ slug: "repuestos-marca", depth: 0, overrideAccess: true });
  await payload.updateGlobal({
    slug: "repuestos-marca",
    data: {
      tarjetaUsadas: { ...g.tarjetaUsadas, imagen: m.global.usadas },
      tarjetaAditamentos: { ...g.tarjetaAditamentos, imagen: m.global.aditamentos },
    },
    overrideAccess: true,
  });
}
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
