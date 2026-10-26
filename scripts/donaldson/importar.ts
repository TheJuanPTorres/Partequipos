/**
 * FILTROS DONALDSON (2026-10-26, dirección): la página de WordPress
 * `…/filtracion-para-maquinaria-pesada/filtros-donaldson-maquinaria-pesada/` pasa a ser una
 * categoría técnica que CUELGA de Filtración («Cuelga de»), en su misma URL, con la plantilla
 * 4007 de las categorías. Fuente: el JSON de `extraer-wp.mjs` (fuera del repositorio).
 *
 *   npm run preview:donaldson:simular   # no escribe nada: el plan
 *   npm run preview:donaldson:aplicar
 *   npm run preview:donaldson:retirar   # deshace lo del manifiesto
 *
 * Para el sitio publicado, el runbook de dirección (mismo script, destino del sitio publicado,
 * con base Y almacén de ese entorno o no hace nada).
 *
 * Qué hace, en este orden:
 *   1. guarda en el manifiesto y BORRA la redirección 301 que hoy lleva esa URL a Filtración
 *      (la sembró la migración `20261014_045109_redirects_categorias_heredadas`): una URL viva
 *      no puede ser origen de un redirect;
 *   2. sube a «Imágenes» (`wp-donaldson-…`) el logo, la foto de cada tipo de filtro y dos fotos
 *      de obra (cabecera y tarjeta), las grandes reducidas a 2560 px;
 *   3. crea la categoría «Filtros Donaldson» que cuelga de Filtración: logo, color de la marca
 *      (#007CC4, el del logo), presentación, una tarjeta por tipo de filtro (nombre, foto y su
 *      frase) y el título y la descripción para buscadores de WordPress, TAL CUAL.
 * Idempotente: una segunda pasada no crea nada. La retirada borra la categoría y las fotos y
 * vuelve a crear la redirección. No revalida: al terminar, vaciar la caché (`/api/revalidar/`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { normalizarRuta } from "../../src/lib/redirects/normalizar";
import { formatoDeImagen } from "../../src/lib/repuestos/wordpress";
import { rutas } from "../../src/lib/routes";
import { formatSlug } from "../../src/lib/utils/formatSlug";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[donaldson] ✗ ${m}`);
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
if (modo === "simular") {
  process.env.BLOB_READ_WRITE_TOKEN = "";
} else {
  exigirAlmacen("[donaldson]");
}

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = path.join(CIERRE, "donaldson-wordpress.json");
const MANIFIESTO = path.join(CIERRE, `manifiesto-donaldson-${destino}.json`);
const AGENTE = "Mozilla/5.0 (Partequipos; importación de Filtros Donaldson)";
const SLUG_PADRE = "filtracion-para-maquinaria-pesada";
const SLUG = "filtros-donaldson-maquinaria-pesada";
const NOMBRE = "Filtros Donaldson";
const COLOR = "#007CC4";
const PREFIJO = "wp-donaldson";
const ANCHO_MAXIMO = 2560;

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
const log = (m: string) => process.stdout.write(`[donaldson] ${m}\n`);

// ---------- Manifiesto ----------

type Manifiesto = {
  destino: string;
  /** La 301 borrada, para volver a crearla al retirar. */
  redirectBorrado: {
    desde: string;
    hacia: string;
    tipo: string;
    origen: string;
    notas: string | null;
  } | null;
  creado: { categoria: number | null; media: { id: number; filename: string; url: string }[] };
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, redirectBorrado: null, creado: { categoria: null, media: [] } };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

const desde = normalizarRuta(rutas.subcategoriaRepuestos(SLUG_PADRE, SLUG));

// ---------- Retirar ----------

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  if (manifiesto.creado.categoria !== null) {
    await payload
      .delete({
        collection: "categorias-tecnicas",
        id: manifiesto.creado.categoria,
        overrideAccess: true,
      })
      .catch(() => null);
    log("categoría borrada");
  }
  const urls: string[] = [];
  for (const f of manifiesto.creado.media) {
    await payload.delete({ collection: "media", id: f.id, overrideAccess: true }).catch(() => null);
    if (f.url) urls.push(f.url);
  }
  if (manifiesto.redirectBorrado) {
    const r = manifiesto.redirectBorrado;
    await payload.create({
      collection: "redirects",
      data: {
        desde: r.desde,
        hacia: r.hacia,
        tipo: r.tipo as "301",
        origen: r.origen as "migracion",
        notas: r.notas,
      },
      overrideAccess: true,
    });
    log(`redirección vuelta a crear: ${r.desde} → ${r.hacia}`);
  }
  if (urls.length > 0) {
    log(`fotos borradas: ${urls.length}; espero 70 s (propagación del Blob)`);
    await new Promise((r) => setTimeout(r, 70_000));
    for (const u of urls) {
      if ((await fetch(u, { method: "HEAD" })).status !== 404) fallar(`sigue en el Blob: ${u}`);
    }
    log("las fotos responden 404 en el Blob");
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `-retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Vaciar la caché del sitio.");
} else {
  // ---------- Simular / aplicar ----------

  type Fuente = {
    seo: { titulo: string; descripcion: string };
    logo: string;
    presentacion: string;
    fondo: string;
    tarjeta: string;
    tipos: { nombre: string; descripcion: string; foto: string }[];
  };
  if (!fs.existsSync(FUENTE))
    fallar(`no está la fuente ${FUENTE} (node scripts/donaldson/extraer-wp.mjs)`);
  const fuente = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as Fuente;
  if (fuente.tipos.length !== 8) fallar(`la fuente tiene ${fuente.tipos.length} tipos, no 8`);

  const padre = (
    await payload.find({
      collection: "categorias-tecnicas",
      where: { and: [{ slug: { equals: SLUG_PADRE } }, { padre: { exists: false } }] },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
  if (!padre) fallar(`no existe la categoría «${SLUG_PADRE}»`);
  log(`categoría de la que cuelga: «${padre!.nombre}» (${padre!.id})`);

  // 1. La 301 que hoy lleva la URL a Filtración.
  const redirect = (
    await payload.find({
      collection: "redirects",
      where: { desde: { equals: desde } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
  if (redirect) {
    log(`redirección a borrar: ${redirect.desde} → ${redirect.hacia}`);
    if (modo === "aplicar") {
      manifiesto.redirectBorrado ??= {
        desde: redirect.desde,
        hacia: redirect.hacia,
        tipo: redirect.tipo ?? "301",
        origen: redirect.origen ?? "migracion",
        notas: redirect.notas ?? null,
      };
      guardar();
      await payload.delete({ collection: "redirects", id: redirect.id, overrideAccess: true });
    }
  } else {
    log("sin redirección desde esa URL (ya borrada)");
  }

  // 2. Las fotos.
  const subir = async (url: string, nombre: string, alt: string): Promise<number | null> => {
    const fichero = `${PREFIJO}-${formatSlug(nombre)}`;
    const ya = await payload.find({
      collection: "media",
      where: { filename: { contains: fichero } },
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });
    const existente = ya.docs.find((d) => d.filename?.toLowerCase().startsWith(fichero));
    if (existente) {
      log(`foto ya subida: ${existente.filename}`);
      return existente.id;
    }
    const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
    if (!r.ok) fallar(`no se puede descargar ${url}: HTTP ${r.status}`);
    const { default: sharp } = await import("sharp");
    let datos = Buffer.from(await r.arrayBuffer());
    const meta = await sharp(datos).metadata();
    const f = formatoDeImagen(meta.format) ?? fallar(`${url}: formato que Media no admite`);
    if ((meta.width ?? 0) > ANCHO_MAXIMO) {
      datos = await sharp(datos)
        .resize({ width: ANCHO_MAXIMO })
        .toFormat(f.ext === "png" ? "png" : f.ext === "webp" ? "webp" : "jpeg", { quality: 82 })
        .toBuffer();
    } else if (f.convertir) {
      datos = await sharp(datos).webp({ quality: 82 }).toBuffer();
    }
    const nombreFichero = `${fichero}.${f.ext}`;
    log(
      `foto ${nombreFichero}: ${meta.format}, ${meta.width}×${meta.height}, ${Math.round(datos.length / 1024)} kB`,
    );
    if (modo !== "aplicar") return null;
    const doc = await payload.create({
      collection: "media",
      data: { alt, focalX: 50, focalY: 50 },
      file: { data: datos, mimetype: f.mimetype, name: nombreFichero, size: datos.length },
      overrideAccess: true,
    });
    const guardado = await payload.findByID({
      collection: "media",
      id: doc.id,
      depth: 0,
      overrideAccess: true,
    });
    manifiesto.creado.media.push({
      id: doc.id,
      filename: guardado.filename ?? nombreFichero,
      url: guardado.url ?? "",
    });
    guardar();
    return doc.id;
  };

  const logo = await subir(fuente.logo, "logo", "Logo de Donaldson");
  const fondo = await subir(fuente.fondo, "cabecera", "Filtros Donaldson para maquinaria pesada");
  const tarjeta = await subir(fuente.tarjeta, "tarjeta", "Familia de filtros Donaldson");
  const grupos = [];
  for (const t of fuente.tipos) {
    const imagen = await subir(t.foto, t.nombre, `${t.nombre} para maquinaria pesada`);
    grupos.push({ nombre: t.nombre, mostrar: true, imagen, descripcion: t.descripcion });
  }

  // 3. La categoría que cuelga de Filtración.
  const existente = (
    await payload.find({
      collection: "categorias-tecnicas",
      where: { slug: { equals: SLUG } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
  if (existente) {
    log(`la categoría «${existente.nombre}» ya existe (${existente.id}): no se toca`);
    manifiesto.creado.categoria ??= existente.id;
    guardar();
  } else {
    log(`categoría a crear: «${NOMBRE}» (${SLUG}) en «${padre!.nombre}», ${grupos.length} tipos`);
    if (modo === "aplicar") {
      const doc = await payload.create({
        collection: "categorias-tecnicas",
        data: {
          nombre: NOMBRE,
          slug: SLUG,
          padre: padre!.id,
          logo,
          colorMarca: COLOR,
          descripcion: fuente.presentacion,
          imagen: tarjeta,
          fondoHero: fondo,
          grupos,
          seo: { metaTitle: fuente.seo.titulo, metaDescription: fuente.seo.descripcion },
        },
        overrideAccess: true,
      });
      manifiesto.creado.categoria = doc.id;
      guardar();
      log(`categoría creada (${doc.id})`);
    }
  }
  log(
    modo === "simular"
      ? "SIMULACIÓN: no se ha escrito nada."
      : "APLICADO. Vaciar la caché del sitio (POST /api/revalidar/).",
  );
}
