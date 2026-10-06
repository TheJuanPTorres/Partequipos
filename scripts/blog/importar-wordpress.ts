/**
 * IMPORTADOR DEL BLOG desde el WordPress actual (partequipos.com) a Payload.
 * SOLO PREVIEW. Lee la API REST pública de WordPress, SIN credenciales.
 *
 *   npm run preview:blog:simular     (no escribe nada; informe de lo que haría)
 *   npm run preview:blog:importar    (crea o actualiza; repetirlo no duplica)
 *
 * Qué trae de cada entrada: título, slug (el mismo, para que la URL no cambie),
 * fecha, autor, categoría, extracto (→ entradilla), contenido (→ Lexical, con
 * las imágenes del cuerpo copiadas a `Media`), imagen destacada con su texto
 * alternativo y el SEO de Yoast (solo el que no está repetido, ver
 * `valoresUnicos`).
 *
 * - SOLO preview: guardián de base y almacén (`puedeTocarHeroDePrueba`) y la
 *   guarda del almacén (§10.37), antes de cargar Payload. También al simular,
 *   porque lee la base para decir qué crearía y qué actualizaría.
 * - EDUCADO con el servidor: una petición cada 700 ms como mucho, con un
 *   User-Agent que dice qué es. Las entradas, las categorías y las imágenes
 *   destacadas van en una petición cada una (listas con `include`).
 * - IDEMPOTENTE: el artículo se busca por slug (se actualiza si existe) y cada
 *   imagen por un nombre de fichero determinista (`wp-AAAA-MM-<nombre>`), que
 *   se reutiliza si ya está en `Media`.
 * - El informe (JSON) se guarda FUERA del repositorio, en
 *   `Desktop/partequipos-diseno/wordpress/blog/`.
 *
 * El contenido de WordPress está hecho con Elementor (widgets de imagen y de
 * texto). Antes de convertir se aplana: fuera los contenedores, cada imagen se
 * cambia por un marcador que después pasa a ser un nodo `upload`, las tablas
 * (el editor del sitio no tiene tablas) pasan a párrafos «celda · celda» y los
 * shortcodes que quedan como texto se quitan. Todo eso se cuenta en el informe.
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

import { exigirAlmacen } from "../blob/exigirAlmacen";
import {
  altParaMedia,
  entradillaDeExtracto,
  enlaceInterno,
  esMismaImagen,
  extraerJsonWp,
  formatoPorExtension,
  nombreDeFicheroWp,
  quitarShortcodes,
  textoPlano,
  urlImagenCorregida,
  valoresUnicos,
} from "../../src/lib/blog/wordpress";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => a === "simular" || a === "importar");
if (!modo) {
  console.error("[blog] indica el modo: «simular» o «importar».");
  process.exit(1);
}
const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[blog] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[blog]");

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
type MediaWp = { id: number; source_url: string; alt_text: string; mime_type: string };
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

type Imagen = { urlWp: string; alt: string | null };
type ResultadoImagen =
  | {
      estado: "subida" | "reutilizada" | "simulada";
      id: number | null;
      deRespaldo: boolean;
      corregida: boolean;
    }
  | { estado: "omitida"; motivo: string; urlWp: string };

const porFichero = new Map<string, number>();
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
  for (const d of iguales.slice(1)) duplicadas.set(d.id, d.filename ?? "");
  if (id) porFichero.set(fichero, id);
  return id;
}

async function imagenAMedia(img: Imagen, titulo: string, n: number): Promise<ResultadoImagen> {
  const { url, corregida } = urlImagenCorregida(img.urlWp);
  const formato = formatoPorExtension(url);
  if (!formato) {
    return {
      estado: "omitida",
      motivo: `formato no admitido en Media (.${url.split(".").pop()})`,
      urlWp: img.urlWp,
    };
  }
  const fichero = nombreDeFicheroWp(url);
  const { alt, deRespaldo } = altParaMedia(img.alt, titulo, n, fichero);
  const ya = await mediaPorFichero(fichero);
  if (ya) return { estado: "reutilizada", id: ya, deRespaldo, corregida };
  if (modo === "simular") {
    const fallo = await existe(url);
    if (fallo)
      return { estado: "omitida", motivo: `no se puede descargar (${fallo})`, urlWp: img.urlWp };
    return { estado: "simulada", id: null, deRespaldo, corregida };
  }
  const d = await descargar(url);
  if ("error" in d)
    return { estado: "omitida", motivo: `no se puede descargar (${d.error})`, urlWp: img.urlWp };
  try {
    const doc = await payload.create({
      collection: "media",
      data: { alt, focalX: 50, focalY: 50 },
      file: {
        data: d.datos,
        mimetype: `image/${formato}`,
        name: fichero,
        size: d.datos.length,
      },
      overrideAccess: true,
    });
    porFichero.set(fichero, doc.id);
    return { estado: "subida", id: doc.id, deRespaldo, corregida };
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

/** Bloques de plugins de WordPress que se quitan del contenido (selector → nombre en el informe). */
const PLUGINS: [string, string][] = [[".kk-star-ratings", "valoración (kk-star-ratings)"]];

type Aplanado = {
  html: string;
  imagenes: Imagen[];
  tablas: number;
  shortcodes: string[];
  otros: string[];
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

  // Imágenes → marcador (si van dentro de un enlace a la propia imagen, el enlace también).
  for (const img of [...cuerpo.querySelectorAll("img")]) {
    const src = img.getAttribute("src") ?? "";
    if (!src) {
      img.remove();
      continue;
    }
    imagenes.push({ urlWp: src, alt: img.getAttribute("alt") });
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

  // Enlaces internos → rutas relativas.
  for (const a of [...cuerpo.querySelectorAll("a[href]")]) {
    a.setAttribute("href", enlaceInterno(a.getAttribute("href") ?? ""));
  }

  // h1 dentro del contenido → h2 (el <h1> de la página es el título).
  for (const h of [...cuerpo.querySelectorAll("h1")]) {
    const h2 = doc.createElement("h2");
    h2.innerHTML = h.innerHTML;
    h.replaceWith(h2);
  }

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

  const { texto, quitados } = quitarShortcodes(cuerpo.innerHTML);
  // Párrafos vacíos fuera.
  const limpio = texto.replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");
  return { html: limpio, imagenes, tablas, shortcodes: quitados, otros };
}

type NodoLexical = { type: string; text?: string; children?: NodoLexical[]; [k: string]: unknown };

function textoDeLexical(n: NodoLexical): string {
  if (typeof n.text === "string") return n.text;
  return (n.children ?? []).map(textoDeLexical).join(" ");
}

function idDeNodo(): string {
  return [...crypto.getRandomValues(new Uint8Array(12))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Los párrafos con el marcador de una imagen pasan a ser nodos `upload` (o desaparecen si se omitió). */
function ponerImagenes(raiz: NodoLexical, ids: (number | null)[]): void {
  const hijos: NodoLexical[] = [];
  for (const n of raiz.children ?? []) {
    const t = textoDeLexical(n).trim();
    const m = t.match(/^@@IMAGEN-(\d+)@@$/);
    if (n.type === "paragraph" && m) {
      const id = ids[Number(m[1]) - 1];
      if (id) {
        hijos.push({
          type: "upload",
          version: 3,
          format: "",
          id: idDeNodo(),
          fields: null,
          relationTo: "media",
          value: id,
        });
      }
      continue;
    }
    if (/@@IMAGEN-\d+@@/.test(t)) {
      // Marcador dentro de un párrafo con más texto: la imagen va detrás del párrafo.
      const sueltos = [...t.matchAll(/@@IMAGEN-(\d+)@@/g)].map((x) => ids[Number(x[1]) - 1]);
      quitarMarcadores(n);
      hijos.push(n);
      for (const id of sueltos) {
        if (id)
          hijos.push({
            type: "upload",
            version: 3,
            format: "",
            id: idDeNodo(),
            fields: null,
            relationTo: "media",
            value: id,
          });
      }
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
  };
  destacada: string;
  tablasAParrafos: number;
  shortcodesQuitados: string[];
  noConvertibles: string[];
  textoConservado: number;
  seo: { titulo: boolean; descripcion: boolean };
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
  const entrada: Entrada = {
    slug,
    titulo,
    enUrlMap: mapa.has(slug),
    accion: existente.docs[0] ? "actualizar" : "crear",
    estado: "ok",
    imagenes: {
      subidas: 0,
      reutilizadas: 0,
      simuladas: 0,
      omitidas: [],
      altDeRespaldo: 0,
      urlCorregidas: 0,
    },
    destacada: "ninguna",
    tablasAParrafos: 0,
    shortcodesQuitados: [],
    noConvertibles: [],
    textoConservado: 0,
    seo: { titulo: false, descripcion: false },
  };
  try {
    const plano = aplanar(post.content.rendered);
    entrada.tablasAParrafos = plano.tablas;
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
      ids.push(r.id);
    }

    const estado = convertHTMLToLexical({ editorConfig, html: plano.html, JSDOM: DomFeliz });
    const raiz = estado.root as unknown as NodoLexical;
    ponerImagenes(raiz, ids);

    const antes = textoPlano(plano.html.replace(/@@IMAGEN-\d+@@/g, "")).replace(/\s/g, "").length;
    const despues = textoDeLexical(raiz).replace(/\s/g, "").length;
    entrada.textoConservado = antes ? Math.round((despues / antes) * 1000) / 10 : 100;

    let destacada: number | null = null;
    const m = mediaWp.get(post.featured_media);
    if (m) {
      const r = await imagenAMedia({ urlWp: m.source_url, alt: m.alt_text }, titulo, 1);
      if (r.estado === "omitida") entrada.destacada = `omitida: ${r.motivo}`;
      else {
        entrada.destacada = r.estado;
        destacada = r.id;
      }
    }

    const y = post.yoast_head_json ?? {};
    const metaTitle =
      y.title && titulosUnicos.has(y.title.trim()) ? decodeEntidadesSeguro(y.title) : null;
    const metaDescription =
      y.description && descripcionesUnicas.has(y.description.trim())
        ? decodeEntidadesSeguro(y.description)
        : null;
    entrada.seo = { titulo: Boolean(metaTitle), descripcion: Boolean(metaDescription) };

    const cat = categoriasWp.find((c) => post.categories.includes(c.id));
    const categoria = cat ? await categoriaBlog(cat) : null;

    if (modo === "importar") {
      const data = {
        titulo,
        slug,
        fechaPublicacion: post.date_gmt.endsWith("Z") ? post.date_gmt : `${post.date_gmt}Z`,
        autor: y.author ? textoPlano(y.author) : undefined,
        entradilla: entradillaDeExtracto(post.excerpt.rendered),
        categoria: categoria ?? undefined,
        imagenDestacada: destacada ?? undefined,
        contenido: estado as never,
        seo: { metaTitle, metaDescription },
      };
      const doc = existente.docs[0]
        ? await payload.update({
            collection: "articulos",
            id: existente.docs[0].id,
            data,
            overrideAccess: true,
          })
        : await payload.create({ collection: "articulos", data, overrideAccess: true });
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

function decodeEntidadesSeguro(t: string): string {
  return textoPlano(t);
}

// ---------- Copias repetidas ----------

/*
 * Copias de una misma imagen que ya no usa ningún artículo (las dejó una pasada
 * anterior a esta comprobación). Solo se borran si NADA las referencia: se
 * mira en todos los artículos (destacada y contenido) y en el resto de la base
 * por la relación de `Media`.
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
    borradas++;
  }
  log(`copias repetidas borradas: ${borradas} de ${duplicadas.size}`);
}

// ---------- Resumen ----------

fs.mkdirSync(CARPETA, { recursive: true });
const fichero = path.join(CARPETA, `informe-${modo}.json`);
fs.writeFileSync(fichero, JSON.stringify(informe, null, 2));

const ok = informe.filter((e) => e.estado === "ok");
const suma = (f: (e: Entrada) => number) => informe.reduce((s, e) => s + f(e), 0);
log("──────── resumen ────────");
log(
  `modo: ${modo} · entradas: ${informe.length} · bien: ${ok.length} · fallan: ${informe.length - ok.length}`,
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
  `imágenes del cuerpo: subidas ${suma((e) => e.imagenes.subidas)} · reutilizadas ${suma((e) => e.imagenes.reutilizadas)} · por subir ${suma((e) => e.imagenes.simuladas)} · omitidas ${suma((e) => e.imagenes.omitidas.length)} · alt de respaldo ${suma((e) => e.imagenes.altDeRespaldo)} · URL corregidas ${suma((e) => e.imagenes.urlCorregidas)}`,
);
log(
  `destacadas: ${JSON.stringify(informe.reduce<Record<string, number>>((a, e) => ({ ...a, [e.destacada.split(":")[0]!]: (a[e.destacada.split(":")[0]!] ?? 0) + 1 }), {}))}`,
);
log(
  `tablas pasadas a párrafos: ${suma((e) => e.tablasAParrafos)} · shortcodes quitados: ${suma((e) => e.shortcodesQuitados.length)} · quitados o no convertibles: ${JSON.stringify(informe.flatMap((e) => e.noConvertibles).reduce<Record<string, number>>((a, n) => ({ ...a, [n]: (a[n] ?? 0) + 1 }), {}))}`,
);
log(`texto conservado (mín.): ${Math.min(...informe.map((e) => e.textoConservado))} %`);
log(
  `SEO de Yoast importado: título ${informe.filter((e) => e.seo.titulo).length} · descripción ${informe.filter((e) => e.seo.descripcion).length}`,
);
log(`informe: ${fichero}`);
if (informe.length - ok.length > 0) {
  const e = new Error(`[blog] ✗ ${informe.length - ok.length} entradas fallaron (ver el informe)`);
  e.stack = e.message;
  throw e;
}
