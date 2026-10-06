/**
 * IMPORTADOR DEL BLOG desde el WordPress actual (partequipos.com) a Payload.
 * Lee la API REST pública de WordPress, SIN credenciales.
 *
 *   npx payload run scripts/blog/importar-wordpress.ts <modo> <destino> [manifiesto=<ruta>]
 *
 *   modo:     simular  → no escribe nada; informe de lo que haría
 *             importar → crea o actualiza; repetirlo no duplica
 *             retirar  → deshace EXACTAMENTE lo que hizo la importación (manifiesto)
 *   destino:  preview    → base y Blob del preview (`npm run preview:blog:*`)
 *             produccion → base Y token del almacén de producción (solo dirección, con runbook)
 *             prueba     → una base desechable y el almacén del preview
 *
 * Argumentos POSICIONALES: `payload run` descarta las banderas con guiones.
 *
 * Qué trae de cada entrada: título, slug (el mismo, para que la URL no cambie),
 * fecha, categoría, extracto (→ entradilla), contenido (→ Lexical, con las
 * imágenes del cuerpo copiadas a `Media`), imagen destacada con su texto
 * alternativo y el SEO de Yoast (solo el que no está repetido, ver
 * `valoresUnicos`). La firma es «Partequipos» (decisión de dirección): en
 * WordPress todas dicen «Analista.Mercadeo»; se cambia por artículo en el panel.
 *
 * - DESTINO EXPLÍCITO y validado contra la base y el almacén de la sesión
 *   ANTES de cargar Payload (`veredictoDestino`, el mismo de la copia de
 *   demostración), más la guarda del almacén (§10.37).
 * - EDUCADO con el servidor: una petición cada 700 ms como mucho, con un
 *   User-Agent que dice qué es.
 * - IDEMPOTENTE: el artículo se busca por slug (se actualiza si existe) y cada
 *   imagen por un nombre determinista (`wp-AAAA-MM-<nombre>`, que el Blob
 *   alarga con un sufijo aleatorio: `esMismaImagen`).
 * - AVIF → WebP con sharp (decisión de dirección): `Media` no admite AVIF de
 *   entrada (§10.28); se convierte AQUÍ, en el script, con imágenes del propio
 *   WordPress del cliente, nunca en el servidor del sitio.
 * - EL MANIFIESTO (JSON, por defecto en `Desktop/partequipos-cierre/`) apunta
 *   lo que la importación CREA (artículos, imágenes, categorías) y el valor
 *   ANTERIOR de cada artículo que ya existía. Se escribe tras cada paso: si se
 *   corta, se repite y sigue. `retirar` lo usa para dejarlo todo como estaba.
 * - El informe (JSON) se guarda FUERA del repositorio, en
 *   `Desktop/partequipos-diseno/wordpress/blog/`.
 *
 * El contenido de WordPress está hecho con Elementor (widgets de imagen y de
 * texto). Antes de convertir se aplana: fuera los contenedores, cada imagen se
 * cambia por un marcador que después pasa a ser un nodo `upload`, las tablas
 * (el editor del sitio no tiene tablas) pasan a párrafos «celda · celda» y los
 * shortcodes y widgets de plugins se quitan. Todo eso se cuenta en el informe.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { convertHTMLToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
/*
 * happy-dom NO es dependencia directa: llega con `@lexical/headless`, que es
 * dependencia de `@payloadcms/richtext-lexical` (el mismo DOM que usa Lexical
 * para importar HTML en el servidor). Solo lo usa este script, nunca el sitio.
 * El conversor de Payload pide un constructor con la forma de `JSDOM`.
 */
import { Window } from "happy-dom";
import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import {
  FIRMA_POR_DEFECTO,
  altParaMedia,
  entradillaDeExtracto,
  enlaceInterno,
  enlaceViejo,
  esAltGenerado,
  esAvif,
  esMismaImagen,
  esSubapartado,
  extraerJsonWp,
  formatoPorExtension,
  limpiarLexical,
  nivelTituloNegrita,
  nombreDeFicheroWp,
  normalizarRuta,
  quitarShortcodes,
  textoPlano,
  tituloEnNegrita,
  type OrigenAlt,
  urlImagenCorregida,
  valoresUnicos,
} from "../../src/lib/blog/wordpress";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[blog] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, importar o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  // La guarda de las colecciones (§10.37) espera, fuera de Vercel, el almacén
  // del preview: aquí se DECLARA el del destino, ya validado con su base.
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[blog]");
const MANIFIESTO =
  valorDe("manifiesto") ??
  path.join(os.homedir(), "Desktop", "partequipos-cierre", `manifiesto-blog-${destino}.json`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const editorConfig = await editorConfigFactory.default({ config: payload.config });

const WP = "https://partequipos.com/wp-json/wp/v2";
const AGENTE = "Partequipos-migracion/1.0 (importador del blog; solo lectura)";
const PAUSA_MS = 700;
const CARPETA = path.join(os.homedir(), "Desktop", "partequipos-diseno", "wordpress", "blog");
const log = (m: string) => process.stdout.write(`[blog] ${m}\n`);

// ---------- Manifiesto ----------

/** Campos de un artículo que la importación escribe (y la retirada devuelve). */
const CAMPOS = [
  "titulo",
  "slug",
  "fechaPublicacion",
  "autor",
  "entradilla",
  "categoria",
  "imagenDestacada",
  "contenido",
  "seo",
] as const;
type Anterior = Record<(typeof CAMPOS)[number], unknown>;
type Manifiesto = {
  destino: string;
  creado: {
    articulos: number[];
    media: { id: number; filename: string; url: string }[];
    categorias: number[];
  };
  anteriores: Record<string, Anterior>;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, creado: { articulos: [], media: [], categorias: [] }, anteriores: {} };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
function guardarManifiesto() {
  if (modo !== "importar") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
}

// ---------- Retirada ----------

/**
 * Deshace EXACTAMENTE lo que apunta el manifiesto: devuelve cada artículo que
 * ya existía a su valor anterior, borra los artículos, las imágenes y las
 * categorías que creó la importación, y comprueba que los ficheros salen del
 * Blob. Lo que no creó la importación no se borra nunca.
 */
async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  let devueltos = 0;
  for (const [id, anterior] of Object.entries(manifiesto.anteriores)) {
    await payload.update({
      collection: "articulos",
      id: Number(id),
      data: anterior as never,
      overrideAccess: true,
    });
    devueltos++;
  }
  log(`artículos devueltos a su valor anterior: ${devueltos}`);
  let borrados = 0;
  for (const id of manifiesto.creado.articulos) {
    const r = await payload
      .delete({ collection: "articulos", id, overrideAccess: true })
      .catch(() => null);
    if (r) borrados++;
  }
  log(`artículos creados y borrados: ${borrados} de ${manifiesto.creado.articulos.length}`);
  const urls: string[] = [];
  for (const m of manifiesto.creado.media) {
    const r = await payload
      .delete({ collection: "media", id: m.id, overrideAccess: true })
      .catch(() => null);
    if (r && m.url) urls.push(m.url);
  }
  log(`imágenes creadas y borradas: ${urls.length} de ${manifiesto.creado.media.length}`);
  let categorias = 0;
  for (const id of manifiesto.creado.categorias) {
    const r = await payload
      .delete({ collection: "categorias-blog", id, overrideAccess: true })
      .catch(() => null);
    if (r) categorias++;
  }
  log(`categorías creadas y borradas: ${categorias} de ${manifiesto.creado.categorias.length}`);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("manifiesto retirado; espero 70 s (propagación del Blob)");
  await new Promise((r) => setTimeout(r, 70_000));
  const vivos: string[] = [];
  for (const u of urls) if ((await fetch(u, { method: "HEAD" })).status !== 404) vivos.push(u);
  if (vivos.length) fallar(`${vivos.length} ficheros siguen en el Blob`);
  log(`✓ los ${urls.length} ficheros dan 404`);
}

if (modo === "retirar") {
  await retirar();
  process.exit(0);
}

// ---------- Red, con turno ----------

let ultima = 0;
async function turno() {
  const espera = ultima + PAUSA_MS - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultima = Date.now();
}

async function pedirJson(url: string): Promise<unknown> {
  await turno();
  const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  return extraerJsonWp(await r.text());
}

async function descargar(
  url: string,
): Promise<{ datos: Buffer; tipo: string } | { error: string }> {
  await turno();
  try {
    const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    return { datos: Buffer.from(await r.arrayBuffer()), tipo: r.headers.get("content-type") ?? "" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function existe(url: string): Promise<string | null> {
  await turno();
  try {
    const r = await fetch(url, { method: "HEAD", headers: { "User-Agent": AGENTE } });
    return r.ok ? null : `HTTP ${r.status}`;
  } catch (e) {
    return (e as Error).message;
  }
}

// ---------- Datos de WordPress ----------

type PostWp = {
  id: number;
  slug: string;
  date_gmt: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  categories: number[];
  featured_media: number;
  link: string;
  yoast_head_json?: {
    title?: string;
    description?: string;
    author?: string;
    og_image?: { url: string }[];
  };
};
type MediaWp = {
  id: number;
  source_url: string;
  alt_text: string;
  mime_type: string;
  title?: { rendered: string };
  caption?: { rendered: string };
};
type CategoriaWp = { id: number; slug: string; name: string; description: string };

const posts = (await pedirJson(`${WP}/posts?per_page=100&status=publish`)) as PostWp[];
log(`${posts.length} entradas publicadas`);
const idsCat = [...new Set(posts.flatMap((p) => p.categories))];
const categoriasWp = (await pedirJson(
  `${WP}/categories?include=${idsCat.join(",")}&per_page=100`,
)) as CategoriaWp[];
const idsMedia = [...new Set(posts.map((p) => p.featured_media).filter(Boolean))];
const mediaWp = new Map<number, MediaWp>();
for (let i = 0; i < idsMedia.length; i += 100) {
  const lote = (await pedirJson(
    `${WP}/media?include=${idsMedia.slice(i, i + 100).join(",")}&per_page=100`,
  )) as MediaWp[];
  for (const m of lote) mediaWp.set(m.id, m);
}

// Título y pie de foto de las imágenes del CUERPO (llevan la clase `wp-image-N`).
const idsCuerpo = [
  ...new Set(
    posts.flatMap((p) =>
      [...p.content.rendered.matchAll(/wp-image-(\d+)/g)].map((m) => Number(m[1])),
    ),
  ),
].filter((id) => !mediaWp.has(id));
for (let i = 0; i < idsCuerpo.length; i += 100) {
  const lote = (await pedirJson(
    `${WP}/media?include=${idsCuerpo.slice(i, i + 100).join(",")}&per_page=100`,
  )) as MediaWp[];
  for (const m of lote) mediaWp.set(m.id, m);
}

// Todas las rutas de url-map.csv (650): destino de los enlaces internos.
const rutasMapa = new Set(
  fs
    .readFileSync(path.join(process.cwd(), "docs", "url-map.csv"), "utf8")
    .split(/\r?\n/)
    .slice(1)
    .filter((l) => l.trim())
    .map((l) => normalizarRuta(new URL(l.split('","')[0]!.replace(/^"/, "")).pathname)),
);

/*
 * ENLACES INTERNOS a rutas que no están en url-map.csv: se pregunta a
 * WordPress (HEAD, sin seguir) adónde las lleva hoy. Si las redirige a una
 * ruta del mapa, el enlace pasa a esa ruta; si no, se queda y va al informe.
 */
const destinoEnlace = new Map<string, string>();
const sinDestino = new Map<string, Set<string>>();
for (const post of posts) {
  for (const m of post.content.rendered.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const rel = enlaceInterno(m[1]!.replace(/&amp;/g, "&"));
    if (!rel.startsWith("/")) continue;
    const ruta = normalizarRuta(rel.split(/[?#]/)[0]!);
    // Las rutas viejas ya decididas (ENLACES_VIEJOS) no se preguntan.
    if (enlaceViejo(ruta)) continue;
    if (rutasMapa.has(ruta) || destinoEnlace.has(ruta) || sinDestino.has(ruta)) {
      sinDestino.get(ruta)?.add(post.slug);
      continue;
    }
    await turno();
    const r = await fetch(`https://partequipos.com${ruta}`, {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": AGENTE },
    }).catch(() => null);
    const hacia = r?.headers.get("location");
    const destino = hacia
      ? normalizarRuta(new URL(hacia, "https://partequipos.com").pathname)
      : null;
    if (destino && rutasMapa.has(destino)) destinoEnlace.set(ruta, destino);
    else sinDestino.set(ruta, new Set([post.slug]));
  }
}
log(
  `enlaces internos fuera del mapa: ${destinoEnlace.size} redirigidos por WordPress a una ruta del mapa, ${sinDestino.size} sin destino`,
);

const mapa = new Set(
  fs
    .readFileSync(path.join(process.cwd(), "docs", "url-map.csv"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes('"blog"'))
    .map((l) => new URL(l.split('","')[0]!.replace(/^"/, "")).pathname.replace(/^\/|\/$/g, "")),
);
const titulosUnicos = valoresUnicos(posts.map((p) => p.yoast_head_json?.title));
const descripcionesUnicas = valoresUnicos(posts.map((p) => p.yoast_head_json?.description));

// ---------- Imágenes ----------

type Imagen = { urlWp: string; alt: string | null; idWp: number | null; seccion: string | null };
type ResultadoImagen =
  | {
      estado: "subida" | "reutilizada" | "simulada";
      id: number | null;
      deRespaldo: boolean;
      corregida: boolean;
      convertida: boolean;
      origen: OrigenAlt;
      altRehecho: boolean;
    }
  | { estado: "omitida"; motivo: string; urlWp: string };

const porFichero = new Map<string, number>();
/** Texto alternativo actual de cada `Media` encontrada (para rehacer solo los generados). */
const altActual = new Map<number, string>();
/** Copias repetidas de una misma imagen de WordPress (se borran al final, ver abajo). */
const duplicadas = new Map<number, string>();

/**
 * La `Media` que ya es esta imagen de WordPress: la MÁS ANTIGUA de las que
 * casan (el Blob añade un sufijo aleatorio al nombre, `esMismaImagen`). Las
 * demás copias se apuntan para borrarlas al terminar, cuando ningún artículo
 * de esta pasada las use ya.
 */
async function mediaPorFichero(fichero: string): Promise<number | null> {
  if (porFichero.has(fichero)) return porFichero.get(fichero)!;
  const raiz = fichero.slice(0, fichero.lastIndexOf("."));
  const r = await payload.find({
    collection: "media",
    where: { filename: { contains: raiz } },
    sort: "createdAt",
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const iguales = r.docs.filter((d) => d.filename && esMismaImagen(d.filename, fichero));
  const id = iguales[0]?.id ?? null;
  if (iguales[0]) altActual.set(iguales[0].id, iguales[0].alt ?? "");
  for (const d of iguales.slice(1)) duplicadas.set(d.id, d.filename ?? "");
  if (id) porFichero.set(fichero, id);
  return id;
}

async function imagenAMedia(img: Imagen, titulo: string, n: number): Promise<ResultadoImagen> {
  const { url, corregida } = urlImagenCorregida(img.urlWp);
  const avif = esAvif(url);
  const formato = avif ? "webp" : formatoPorExtension(url);
  if (!formato) {
    return {
      estado: "omitida",
      motivo: `formato no admitido en Media (.${url.split(".").pop()})`,
      urlWp: img.urlWp,
    };
  }
  // Un AVIF se guarda como WebP: el nombre determinista lleva ya la extensión nueva.
  const fichero = nombreDeFicheroWp(url).replace(/\.avif$/i, ".webp");
  const wp = img.idWp ? mediaWp.get(img.idWp) : undefined;
  const {
    alt,
    origen,
    marcado: deRespaldo,
  } = altParaMedia({
    altWp: img.alt,
    pieWp: wp?.caption?.rendered,
    tituloWp: wp?.title?.rendered,
    seccion: img.seccion,
    titulo,
    n,
    fichero,
  });
  const ya = await mediaPorFichero(fichero);
  if (ya) {
    // Solo se rehace un alt que escribió el importador: lo que tocó un editor, no.
    const actual = altActual.get(ya) ?? "";
    let altRehecho = false;
    if (modo === "importar" && esAltGenerado(actual) && actual !== alt) {
      await payload.update({ collection: "media", id: ya, data: { alt }, overrideAccess: true });
      altActual.set(ya, alt);
      altRehecho = true;
    }
    return {
      estado: "reutilizada",
      id: ya,
      deRespaldo,
      corregida,
      convertida: avif,
      origen,
      altRehecho,
    };
  }
  if (modo === "simular") {
    const fallo = await existe(url);
    if (fallo)
      return { estado: "omitida", motivo: `no se puede descargar (${fallo})`, urlWp: img.urlWp };
    return {
      estado: "simulada",
      id: null,
      deRespaldo,
      corregida,
      convertida: avif,
      origen,
      altRehecho: false,
    };
  }
  const d = await descargar(url);
  if ("error" in d)
    return { estado: "omitida", motivo: `no se puede descargar (${d.error})`, urlWp: img.urlWp };
  try {
    const datos = avif ? await sharp(d.datos).webp({ quality: 85 }).toBuffer() : d.datos;
    const doc = await payload.create({
      collection: "media",
      data: { alt, focalX: 50, focalY: 50 },
      file: {
        data: datos,
        mimetype: `image/${formato}`,
        name: fichero,
        size: datos.length,
      },
      overrideAccess: true,
    });
    porFichero.set(fichero, doc.id);
    manifiesto.creado.media.push({
      id: doc.id,
      filename: doc.filename ?? fichero,
      url: doc.url ?? "",
    });
    guardarManifiesto();
    return {
      estado: "subida",
      id: doc.id,
      deRespaldo,
      corregida,
      convertida: avif,
      origen,
      altRehecho: false,
    };
  } catch (e) {
    return {
      estado: "omitida",
      motivo: `Media la rechaza: ${(e as Error).message}`,
      urlWp: img.urlWp,
    };
  }
}

// ---------- Contenido: aplanar Elementor y convertir a Lexical ----------

/** El conversor de Payload espera un constructor con la forma de `JSDOM`. */
class DomFeliz {
  window: { document: Document };
  constructor(html: string) {
    const w = new Window();
    w.document.write(`<!doctype html><html><body>${html}</body></html>`);
    this.window = w as unknown as { document: Document };
  }
}

const MARCA_IMG = (n: number) => `@@IMAGEN-${n}@@`;
const DESENVOLVER = new Set([
  "DIV",
  "SECTION",
  "SPAN",
  "FIGURE",
  "ARTICLE",
  "HEADER",
  "FOOTER",
  "MAIN",
  "CENTER",
  "FONT",
]);

let enlacesInternos = 0;
let enlacesRedirigidos = 0;
let enlacesViejosCambiados = 0;
let enlacesViejosQuitados = 0;

/** Bloques de plugins de WordPress que se quitan del contenido (selector → nombre en el informe). */
const PLUGINS: [string, string][] = [[".kk-star-ratings", "valoración (kk-star-ratings)"]];

type Aplanado = {
  html: string;
  imagenes: Imagen[];
  tablas: number;
  shortcodes: string[];
  otros: string[];
  negritas: { convertidos: number; dejados: Record<string, number> };
};

function aplanar(html: string): Aplanado {
  const w = new Window();
  const doc = w.document;
  doc.write(`<!doctype html><html><body>${html}</body></html>`);
  const cuerpo = doc.body;
  const imagenes: Imagen[] = [];
  const otros: string[] = [];
  let tablas = 0;

  for (const e of [...cuerpo.querySelectorAll("style, script, noscript, link, meta")]) e.remove();

  // Widgets de plugins que no son del artículo: las estrellas de valoración
  // («5/5 - (1 voto)», kk-star-ratings) van en las 53 entradas.
  for (const [sel, nombre] of PLUGINS) {
    for (const e of [...cuerpo.querySelectorAll(sel)]) {
      otros.push(nombre);
      e.remove();
    }
  }

  // La SECCIÓN de cada imagen: el último encabezado (o párrafo corto todo en
  // negrita, que es como titulan casi todas las entradas) antes de ella.
  const seccionDe = new Map<unknown, string>();
  let seccion: string | null = null;
  for (const e of [...cuerpo.querySelectorAll("h1, h2, h3, h4, h5, h6, p, img")]) {
    if (e.tagName === "IMG") {
      if (seccion) seccionDe.set(e, seccion);
      continue;
    }
    const texto = textoPlano(e.innerHTML);
    const negrita = [...e.querySelectorAll("strong, b")]
      .map((b) => textoPlano(b.innerHTML))
      .join(" ");
    const esTitulo =
      e.tagName !== "P" || (texto.length > 0 && texto.length < 90 && negrita.trim() === texto);
    if (esTitulo && texto) seccion = texto;
  }

  // Imágenes → marcador (si van dentro de un enlace a la propia imagen, el enlace también).
  for (const img of [...cuerpo.querySelectorAll("img")]) {
    const src = img.getAttribute("src") ?? "";
    if (!src) {
      img.remove();
      continue;
    }
    const idWp = Number((img.getAttribute("class") ?? "").match(/wp-image-(\d+)/)?.[1]) || null;
    imagenes.push({
      urlWp: src,
      alt: img.getAttribute("alt"),
      idWp,
      seccion: seccionDe.get(img) ?? null,
    });
    const marca = doc.createElement("p");
    marca.textContent = MARCA_IMG(imagenes.length);
    const enlace = img.closest("a");
    const objetivo =
      enlace && /\/wp-content\/uploads\//.test(enlace.getAttribute("href") ?? "") ? enlace : img;
    objetivo.replaceWith(marca);
  }

  // Tablas → un párrafo por fila, celdas separadas por « · ».
  for (const t of [...cuerpo.querySelectorAll("table")]) {
    tablas++;
    const filas = [...t.querySelectorAll("tr")].map((tr) =>
      [...tr.querySelectorAll("th, td")]
        .map((c) => textoPlano(c.innerHTML))
        .filter(Boolean)
        .join(" · "),
    );
    const frag = doc.createElement("div");
    for (const f of filas.filter(Boolean)) {
      const p = doc.createElement("p");
      p.textContent = f;
      frag.appendChild(p);
    }
    t.replaceWith(frag);
  }

  // Lo que no tiene sitio en el editor del sitio: se anota.
  for (const sel of ["iframe", "video", "audio", "object", "embed", "form", "svg", "canvas"]) {
    for (const e of [...cuerpo.querySelectorAll(sel)]) {
      otros.push(sel);
      e.remove();
    }
  }

  // Enlaces internos → rutas relativas; las que WordPress redirige a una ruta
  // del mapa, a esa ruta (`destinoEnlace`, resuelto arriba).
  for (const a of [...cuerpo.querySelectorAll("a[href]")]) {
    const rel = enlaceInterno(a.getAttribute("href") ?? "");
    // Rutas viejas ya decididas: a su equivalente, o sin enlace (queda el texto).
    const viejo = rel.startsWith("/") ? enlaceViejo(rel) : null;
    if (viejo && "quitar" in viejo) {
      a.replaceWith(...[...a.childNodes]);
      enlacesViejosQuitados++;
      continue;
    }
    if (viejo) {
      a.setAttribute("href", viejo.destino);
      enlacesInternos++;
      enlacesViejosCambiados++;
      continue;
    }
    if (rel.startsWith("/")) {
      const [ruta, resto] = [rel.split(/[?#]/)[0]!, rel.slice(rel.split(/[?#]/)[0]!.length)];
      const destino = destinoEnlace.get(normalizarRuta(ruta));
      a.setAttribute("href", destino ? `${destino}${resto}` : rel);
      enlacesInternos++;
      if (destino) enlacesRedirigidos++;
    } else {
      a.setAttribute("href", rel);
    }
  }

  // Encabezados de WordPress sin negrita dentro: el estilo lo pone la plantilla.
  for (const h of [...cuerpo.querySelectorAll("h1, h2, h3, h4, h5, h6")]) {
    for (const b of [...h.querySelectorAll("strong, b")]) b.replaceWith(...[...b.childNodes]);
  }

  // h1 dentro del contenido → h2 (el <h1> de la página es el título).
  for (const h of [...cuerpo.querySelectorAll("h1")]) {
    const h2 = doc.createElement("h2");
    h2.innerHTML = h.innerHTML;
    h.replaceWith(h2);
  }

  // Un <div> que solo lleva texto es un párrafo: si se desenvolviera a secas,
  // dos seguidos quedarían pegados en uno («Capacidades de la línea» y
  // «80/40» → «línea80/40»).
  const BLOQUES =
    "p, div, section, article, ul, ol, li, table, h1, h2, h3, h4, h5, h6, blockquote, figure, pre, hr";
  let divsAParrafo = 0;
  for (const d of [...cuerpo.querySelectorAll("div")].reverse()) {
    if (d.querySelector(BLOQUES) || !textoPlano(d.innerHTML)) continue;
    const p = doc.createElement("p");
    p.innerHTML = d.innerHTML;
    d.replaceWith(p);
    divsAParrafo++;
  }
  if (divsAParrafo) otros.push(`div con solo texto → párrafo (${divsAParrafo})`);

  // Fuera los contenedores de Elementor: se quedan sus hijos.
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const e of [...cuerpo.querySelectorAll("*")]) {
      if (DESENVOLVER.has(e.tagName)) {
        e.replaceWith(...[...e.childNodes]);
        cambio = true;
      }
    }
  }

  // Párrafos enteros en negrita usados como títulos → h2/h3, solo los claros
  // (`tituloEnNegrita`), bajo el encabezado real anterior. Solo los del nivel
  // superior del artículo: dentro de una lista o una cita no son títulos.
  const negritas = { convertidos: 0, dejados: {} as Record<string, number> };
  let encabezadoReal: number | null = null;
  let tituloAnterior: number | null = null;
  for (const e of [...cuerpo.children]) {
    if (/^H[1-6]$/.test(e.tagName)) {
      encabezadoReal = Number(e.tagName[1]);
      tituloAnterior = encabezadoReal;
      continue;
    }
    if (e.tagName !== "P") continue;
    const veredicto = tituloEnNegrita({
      texto: textoPlano(e.innerHTML),
      negrita: [...e.querySelectorAll("strong, b")].map((b) => textoPlano(b.innerHTML)).join(" "),
      saltos: !!e.querySelector("br"),
    });
    if (!veredicto) continue;
    if (!veredicto.titulo) {
      negritas.dejados[veredicto.motivo] = (negritas.dejados[veredicto.motivo] ?? 0) + 1;
      continue;
    }
    for (const b of [...e.querySelectorAll("strong, b")]) b.replaceWith(...[...b.childNodes]);
    const sub = esSubapartado(textoPlano(e.innerHTML));
    const nivel = nivelTituloNegrita(encabezadoReal, sub, tituloAnterior);
    if (!sub) tituloAnterior = nivel;
    const h = doc.createElement(`h${nivel}`);
    h.innerHTML = e.innerHTML.replace(/^(\s|&nbsp;)+|(\s|&nbsp;)+$/g, "");
    e.replaceWith(h);
    negritas.convertidos++;
  }

  const { texto, quitados } = quitarShortcodes(cuerpo.innerHTML);
  // Párrafos vacíos fuera.
  const limpio = texto.replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");
  return { html: limpio, imagenes, tablas, shortcodes: quitados, otros, negritas };
}

type NodoLexical = { type: string; text?: string; children?: NodoLexical[]; [k: string]: unknown };

function textoDeLexical(n: NodoLexical): string {
  if (typeof n.text === "string") return n.text;
  return (n.children ?? []).map(textoDeLexical).join(" ");
}

function nodoImagen(id: number): NodoLexical {
  const idNodo = [...crypto.getRandomValues(new Uint8Array(12))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return {
    type: "upload",
    version: 3,
    format: "",
    id: idNodo,
    fields: null,
    relationTo: "media",
    value: id,
  };
}

/** Los párrafos con el marcador de una imagen pasan a ser nodos `upload` (o desaparecen si se omitió). */
function ponerImagenes(raiz: NodoLexical, ids: (number | null)[]): void {
  const hijos: NodoLexical[] = [];
  for (const n of raiz.children ?? []) {
    const t = textoDeLexical(n).trim();
    const m = t.match(/^@@IMAGEN-(\d+)@@$/);
    if (n.type === "paragraph" && m) {
      const id = ids[Number(m[1]) - 1];
      if (id) hijos.push(nodoImagen(id));
      continue;
    }
    if (/@@IMAGEN-\d+@@/.test(t)) {
      // Marcador dentro de un párrafo con más texto: la imagen va detrás del párrafo.
      const sueltos = [...t.matchAll(/@@IMAGEN-(\d+)@@/g)].map((x) => ids[Number(x[1]) - 1]);
      quitarMarcadores(n);
      hijos.push(n);
      for (const id of sueltos) if (id) hijos.push(nodoImagen(id));
      continue;
    }
    hijos.push(n);
  }
  raiz.children = hijos;
}

function quitarMarcadores(n: NodoLexical): void {
  if (typeof n.text === "string") n.text = n.text.replace(/@@IMAGEN-\d+@@/g, "").trim();
  for (const h of n.children ?? []) quitarMarcadores(h);
}

// ---------- Categorías ----------

async function categoriaBlog(c: CategoriaWp): Promise<number | null> {
  const r = await payload.find({
    collection: "categorias-blog",
    where: { slug: { equals: c.slug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  if (r.docs[0]) return r.docs[0].id;
  if (modo === "simular") return null;
  const nueva = await payload.create({
    collection: "categorias-blog",
    data: {
      nombre: textoPlano(c.name),
      slug: c.slug,
      descripcion: textoPlano(c.description) || undefined,
    },
    overrideAccess: true,
  });
  manifiesto.creado.categorias.push(nueva.id);
  guardarManifiesto();
  log(`categoría «${c.slug}» creada`);
  return nueva.id;
}

// ---------- Bucle principal ----------

type Entrada = {
  slug: string;
  titulo: string;
  enUrlMap: boolean;
  accion: "crear" | "actualizar";
  estado: "ok" | "fallo";
  motivo?: string;
  imagenes: {
    subidas: number;
    reutilizadas: number;
    simuladas: number;
    omitidas: { url: string; motivo: string }[];
    altDeRespaldo: number;
    urlCorregidas: number;
    avifAWebp: number;
  };
  destacada: string;
  tablasAParrafos: number;
  shortcodesQuitados: string[];
  noConvertibles: string[];
  textoConservado: number;
  seo: { titulo: boolean; descripcion: boolean };
  alt: Partial<Record<OrigenAlt, number>>;
  altRehechos: number;
  limpieza: { alineaciones: number; vacios: number; niveles: number };
  negritas: { convertidos: number; dejados: Record<string, number> };
};
const informe: Entrada[] = [];

for (const post of [...posts].sort((a, b) => a.date_gmt.localeCompare(b.date_gmt))) {
  const slug = decodeURIComponent(post.slug);
  const titulo = textoPlano(post.title.rendered);
  const existente = await payload.find({
    collection: "articulos",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const previo = existente.docs[0];
  const entrada: Entrada = {
    slug,
    titulo,
    enUrlMap: mapa.has(slug),
    accion: previo ? "actualizar" : "crear",
    estado: "ok",
    imagenes: {
      subidas: 0,
      reutilizadas: 0,
      simuladas: 0,
      omitidas: [],
      altDeRespaldo: 0,
      urlCorregidas: 0,
      avifAWebp: 0,
    },
    destacada: "ninguna",
    tablasAParrafos: 0,
    shortcodesQuitados: [],
    noConvertibles: [],
    textoConservado: 0,
    seo: { titulo: false, descripcion: false },
    alt: {},
    altRehechos: 0,
    limpieza: { alineaciones: 0, vacios: 0, niveles: 0 },
    negritas: { convertidos: 0, dejados: {} },
  };
  try {
    const plano = aplanar(post.content.rendered);
    entrada.tablasAParrafos = plano.tablas;
    entrada.negritas = plano.negritas;
    entrada.shortcodesQuitados = plano.shortcodes;
    entrada.noConvertibles = plano.otros;

    const ids: (number | null)[] = [];
    for (const [i, img] of plano.imagenes.entries()) {
      const r = await imagenAMedia(img, titulo, i + 1);
      if (r.estado === "omitida") {
        entrada.imagenes.omitidas.push({ url: r.urlWp, motivo: r.motivo });
        ids.push(null);
        continue;
      }
      entrada.imagenes[
        r.estado === "subida"
          ? "subidas"
          : r.estado === "reutilizada"
            ? "reutilizadas"
            : "simuladas"
      ]++;
      if (r.deRespaldo) entrada.imagenes.altDeRespaldo++;
      if (r.corregida) entrada.imagenes.urlCorregidas++;
      if (r.convertida) entrada.imagenes.avifAWebp++;
      entrada.alt[r.origen] = (entrada.alt[r.origen] ?? 0) + 1;
      if (r.altRehecho) entrada.altRehechos++;
      ids.push(r.id);
    }

    const estado = convertHTMLToLexical({ editorConfig, html: plano.html, JSDOM: DomFeliz });
    const raiz = estado.root as unknown as NodoLexical;
    ponerImagenes(raiz, ids);
    entrada.limpieza = limpiarLexical(raiz as never);

    const antes = textoPlano(plano.html.replace(/@@IMAGEN-\d+@@/g, "")).replace(/\s/g, "").length;
    const despues = textoDeLexical(raiz).replace(/\s/g, "").length;
    entrada.textoConservado = antes ? Math.round((despues / antes) * 1000) / 10 : 100;

    let destacada: number | null = null;
    const m = mediaWp.get(post.featured_media);
    if (m) {
      const r = await imagenAMedia(
        { urlWp: m.source_url, alt: m.alt_text, idWp: m.id, seccion: null },
        titulo,
        1,
      );
      if (r.estado === "omitida") entrada.destacada = `omitida: ${r.motivo}`;
      else {
        entrada.destacada = r.convertida ? `${r.estado} (AVIF → WebP)` : r.estado;
        entrada.alt[r.origen] = (entrada.alt[r.origen] ?? 0) + 1;
        if (r.altRehecho) entrada.altRehechos++;
        destacada = r.id;
      }
    }

    const y = post.yoast_head_json ?? {};
    const metaTitle = y.title && titulosUnicos.has(y.title.trim()) ? textoPlano(y.title) : null;
    const metaDescription =
      y.description && descripcionesUnicas.has(y.description.trim())
        ? textoPlano(y.description)
        : null;
    entrada.seo = { titulo: Boolean(metaTitle), descripcion: Boolean(metaDescription) };

    const cat = categoriasWp.find((c) => post.categories.includes(c.id));
    const categoria = cat ? await categoriaBlog(cat) : null;

    if (modo === "importar") {
      const data = {
        titulo,
        slug,
        fechaPublicacion: post.date_gmt.endsWith("Z") ? post.date_gmt : `${post.date_gmt}Z`,
        autor: FIRMA_POR_DEFECTO,
        entradilla: entradillaDeExtracto(post.excerpt.rendered),
        categoria: categoria ?? undefined,
        imagenDestacada: destacada ?? undefined,
        contenido: estado as never,
        seo: { metaTitle, metaDescription },
      };
      if (
        previo &&
        !manifiesto.creado.articulos.includes(previo.id) &&
        !manifiesto.anteriores[String(previo.id)]
      ) {
        // Lo que tenía ANTES de la primera importación: es lo que devuelve `retirar`.
        manifiesto.anteriores[String(previo.id)] = Object.fromEntries(
          CAMPOS.map((c) => [c, (previo as unknown as Record<string, unknown>)[c] ?? null]),
        ) as Anterior;
        guardarManifiesto();
      }
      const doc = previo
        ? await payload.update({
            collection: "articulos",
            id: previo.id,
            data,
            overrideAccess: true,
          })
        : await payload.create({ collection: "articulos", data, overrideAccess: true });
      if (!previo) {
        manifiesto.creado.articulos.push(doc.id);
        guardarManifiesto();
      }
      if (doc.slug !== slug)
        throw new Error(`el slug guardado («${doc.slug}») no es el de WordPress`);
    }
  } catch (e) {
    entrada.estado = "fallo";
    entrada.motivo = (e as Error).message;
  }
  informe.push(entrada);
  log(
    `${entrada.estado === "ok" ? "✓" : "✗"} ${entrada.accion} ${slug.slice(0, 70)}${entrada.motivo ? ` — ${entrada.motivo}` : ""}`,
  );
}

// ---------- Copias repetidas ----------

/*
 * Copias de una misma imagen que ya no usa ningún artículo (las dejó una pasada
 * anterior). Solo se borran las `wp-…` que NINGÚN artículo usa (destacada ni
 * contenido).
 */
let borradas = 0;
if (modo === "importar" && duplicadas.size > 0) {
  const arts = await payload.find({
    collection: "articulos",
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const usadas = new Set<number>();
  for (const a of arts.docs) {
    if (typeof a.imagenDestacada === "number") usadas.add(a.imagenDestacada);
    for (const m of JSON.stringify(a.contenido ?? {}).matchAll(
      /"relationTo":"media","value":(\d+)/g,
    )) {
      usadas.add(Number(m[1]));
    }
  }
  for (const [id, nombre] of duplicadas) {
    if (usadas.has(id) || !nombre.startsWith("wp-")) continue;
    await payload.delete({ collection: "media", id, overrideAccess: true });
    manifiesto.creado.media = manifiesto.creado.media.filter((m) => m.id !== id);
    borradas++;
  }
  log(`copias repetidas borradas: ${borradas} de ${duplicadas.size}`);
  guardarManifiesto();
}

// ---------- Resumen ----------

fs.mkdirSync(CARPETA, { recursive: true });
const fichero = path.join(CARPETA, `informe-${modo}-${destino}.json`);
fs.writeFileSync(
  fichero,
  JSON.stringify(
    {
      entradas: informe,
      enlacesRedirigidos: Object.fromEntries(destinoEnlace),
      enlacesSinDestino: Object.fromEntries([...sinDestino].map(([k, v]) => [k, [...v]])),
    },
    null,
    2,
  ),
);

const ok = informe.filter((e) => e.estado === "ok");
const suma = (f: (e: Entrada) => number) => informe.reduce((s, e) => s + f(e), 0);
const cuenta = (lista: string[]) =>
  JSON.stringify(
    lista.reduce<Record<string, number>>((a, n) => ({ ...a, [n]: (a[n] ?? 0) + 1 }), {}),
  );
log("──────── resumen ────────");
log(
  `modo: ${modo} · destino: ${destino} · entradas: ${informe.length} · bien: ${ok.length} · fallan: ${informe.length - ok.length}`,
);
log(
  `crear: ${informe.filter((e) => e.accion === "crear").length} · actualizar: ${informe.filter((e) => e.accion === "actualizar").length}`,
);
log(
  `fuera de url-map.csv: ${
    informe
      .filter((e) => !e.enUrlMap)
      .map((e) => e.slug)
      .join(", ") || "ninguna"
  }`,
);
log(
  `imágenes del cuerpo: subidas ${suma((e) => e.imagenes.subidas)} · reutilizadas ${suma((e) => e.imagenes.reutilizadas)} · por subir ${suma((e) => e.imagenes.simuladas)} · omitidas ${suma((e) => e.imagenes.omitidas.length)} · alt de respaldo ${suma((e) => e.imagenes.altDeRespaldo)} · URL corregidas ${suma((e) => e.imagenes.urlCorregidas)} · AVIF → WebP ${suma((e) => e.imagenes.avifAWebp)}`,
);
log(`destacadas: ${cuenta(informe.map((e) => e.destacada.split(":")[0]!))}`);
log(
  `tablas pasadas a párrafos: ${suma((e) => e.tablasAParrafos)} · shortcodes quitados: ${suma((e) => e.shortcodesQuitados.length)} · quitados o no convertibles: ${cuenta(informe.flatMap((e) => e.noConvertibles))}`,
);
log(`texto conservado (mín.): ${Math.min(...informe.map((e) => e.textoConservado))} %`);
log(
  `limpieza: alineaciones ${suma((e) => e.limpieza.alineaciones)} · párrafos vacíos ${suma((e) => e.limpieza.vacios)} · niveles de encabezado ${suma((e) => e.limpieza.niveles)}`,
);
log(
  `alt por origen (imágenes del cuerpo y destacadas): ${JSON.stringify(
    informe.reduce<Record<string, number>>((a, e) => {
      for (const [k, v] of Object.entries(e.alt)) a[k] = (a[k] ?? 0) + (v ?? 0);
      return a;
    }, {}),
  )} · rehechos: ${suma((e) => e.altRehechos)}`,
);
log(
  `párrafos en negrita → título: ${suma((e) => e.negritas.convertidos)} (en ${informe.filter((e) => e.negritas.convertidos).length} artículos) · dejados como párrafo: ${JSON.stringify(
    informe.reduce<Record<string, number>>((a, e) => {
      for (const [k, v] of Object.entries(e.negritas.dejados)) a[k] = (a[k] ?? 0) + v;
      return a;
    }, {}),
  )}`,
);
log(
  `rutas viejas (ENLACES_VIEJOS): ${enlacesViejosCambiados} enlaces a su equivalente · ${enlacesViejosQuitados} quitados (queda el texto)`,
);
log(
  `enlaces internos: ${enlacesInternos} · a la ruta del mapa por redirección de WordPress: ${enlacesRedirigidos} · rutas sin destino: ${[...sinDestino.keys()].join(", ") || "ninguna"}`,
);
log(
  `SEO de Yoast importado: título ${informe.filter((e) => e.seo.titulo).length} · descripción ${informe.filter((e) => e.seo.descripcion).length}`,
);
log(`informe: ${fichero}`);
if (modo === "importar") {
  log(
    `manifiesto: ${MANIFIESTO} (creados: ${manifiesto.creado.articulos.length} artículos, ${manifiesto.creado.media.length} imágenes, ${manifiesto.creado.categorias.length} categorías; anteriores: ${Object.keys(manifiesto.anteriores).length})`,
  );
}
if (informe.length - ok.length > 0) {
  fallar(`${informe.length - ok.length} entradas fallaron (ver el informe)`);
}
