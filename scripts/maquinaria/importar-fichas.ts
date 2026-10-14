/**
 * Importación de las FICHAS de maquinaria nueva de WordPress a
 * `equipos-nuevos`, con su galería en `Media` y su PDF en `documentos`.
 * Detalle y decisiones: `docs/fichas-nuevas-importacion.md`.
 *
 *   npm run preview:fichas:simular              # sin escribir en la base ni en el Blob
 *   npm run preview:fichas:simular -- comprobar # además, comprueba fotos y PDF en WordPress
 *
 * HOY SOLO HAY SIMULACIÓN (dirección, 2026-10-13): la importación real
 * (`importar` y `retirar`, por tandas y con manifiesto, como los usados) se
 * añade cuando dirección apruebe el informe de la simulación.
 *
 * Doble cierre en la simulación: tras validar el destino se vacía el token del
 * Blob (la guarda `almacenEsperado` rechazaría cualquier subida) y `create`,
 * `update` y `delete` de Payload lanzan un error.
 *
 * FUENTES, FUERA del repositorio (`Desktop/partequipos-cierre/`):
 * - `maquinaria-nueva-wordpress.json`, lo que saca `scripts/maquinaria/extraer-xml.py`
 *   de la exportación XML (o `fuente=<ruta>`);
 * - `alcance-fichas-nuevas.txt`, las fichas del mapa de alcance del cliente, una
 *   ruta por línea (o `alcance=<ruta>`; opcional).
 * El informe se guarda junto a la fuente (`simulacion-fichas.json`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { convertHTMLToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
/*
 * happy-dom NO es dependencia directa: llega con `@lexical/headless`, que es
 * dependencia de `@payloadcms/richtext-lexical` (como en el importador del
 * blog). El conversor de Payload pide un constructor con la forma de `JSDOM`.
 */
import { Window } from "happy-dom";
import { getPayload } from "payload";

import { enlaceInterno, textoPlano } from "../../src/lib/blog/wordpress";
import {
  clasificarTexto,
  enlacesDe,
  fotoDeFicha,
  nombreDeFicha,
  paresDeEspecificaciones,
  pdfDeFicha,
  pesoOperativoKg,
  type Par,
} from "../../src/lib/maquinaria/wordpress";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import {
  altDeRepuesto,
  codigoDeModelo,
  descripcionSeo,
  fotosGenericas,
  pareceDatoDeContacto,
  tituloSeo,
} from "../../src/lib/repuestos/wordpress";
import { leerCsv } from "../../src/lib/utils/csv";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[fichas] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (modo !== "simular") {
  fallar("solo existe el modo «simular»: la importación real espera la aprobación de dirección");
}
if (!destino) fallar("indica el destino: preview");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
// Simulación: sin token, nada puede llegar al Blob.
process.env.BLOB_READ_WRITE_TOKEN = "";

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "maquinaria-nueva-wordpress.json");
const ALCANCE = valorDe("alcance") ?? path.join(CIERRE, "alcance-fichas-nuevas.txt");
const INFORME = path.join(path.dirname(FUENTE), "simulacion-fichas.json");
const COMPROBAR = args.includes("comprobar");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
for (const op of ["create", "update", "delete", "updateGlobal"] as const) {
  (payload as unknown as Record<string, unknown>)[op] = () =>
    fallar(`simulación: «${op}» no está permitido`);
}
const editorConfig = await editorConfigFactory.default({ config: payload.config });

const log = (m: string) => process.stdout.write(`[fichas] ${m}\n`);

/** El conversor de Payload espera un constructor con la forma de `JSDOM`. */
class DomFeliz {
  window: { document: Document };
  constructor(html: string) {
    const w = new Window();
    w.document.write(`<!doctype html><html><body>${html}</body></html>`);
    this.window = w as unknown as { document: Document };
  }
}

// ---------- Fuentes ----------

type FotoWp = { idWp: number; url: string | null; alt: string };
type FichaWp = {
  idWp: number;
  ruta: string;
  titulo: string;
  segmentos: [string, string, string];
  titulos: string[];
  textos: string[];
  galeria: FotoWp[];
  imagenes: FotoWp[];
  botones: { texto: string; url: string }[];
  especificacionesFuera: string | null;
};
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE} (ver extraer-xml.py)`);
const { fichas } = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as { fichas: FichaWp[] };
const alcance = new Set(
  fs.existsSync(ALCANCE)
    ? fs
        .readFileSync(ALCANCE, "utf8")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [],
);

// El <title> y la meta descripción que hoy publica WordPress (rastreo, CLAUDE.md §10.1).
const vivo = new Map(
  leerCsv(fs.readFileSync("docs/url-map.csv", "utf8")).map((f) => [
    (f.url ?? "").replace(/^https?:\/\/[^/]+/, ""),
    { titulo: f.title ?? "", descripcion: f.meta_description ?? "" },
  ]),
);

// ---------- Lo que hay hoy en la base del preview (solo lectura) ----------

const marcas = new Map(
  (
    await payload.find({ collection: "marcas-maquinaria", depth: 0, limit: 0, pagination: false })
  ).docs.map((m) => [m.slug, m]),
);
const tipos = (
  await payload.find({ collection: "tipos-maquinaria", depth: 0, limit: 0, pagination: false })
).docs;
const tipoDe = (marcaId: number, slug: string) =>
  tipos.find(
    (t) => t.slug === slug && (typeof t.marca === "object" ? t.marca?.id : t.marca) === marcaId,
  );
const equipos = (
  await payload.find({ collection: "equipos-nuevos", depth: 0, limit: 0, pagination: false })
).docs;
const mediaYa = new Set(
  (
    await payload.find({
      collection: "media",
      where: { filename: { like: "wp-ficha-" } },
      depth: 0,
      limit: 0,
      pagination: false,
    })
  ).docs
    .map((m) => m.filename ?? "")
    .filter((f) => f.startsWith("wp-ficha-")),
);
const documentosYa = new Set(
  (
    await payload.find({
      collection: "documentos",
      where: { filename: { like: "wp-ficha-" } },
      depth: 0,
      limit: 0,
      pagination: false,
    })
  ).docs
    .map((d) => d.filename ?? "")
    .filter((f) => f.startsWith("wp-ficha-")),
);

// ---------- Plan (sin red ni escrituras) ----------

const avisos: string[] = [];
const fotosDe = (f: FichaWp) => (f.galeria.length ? f.galeria : f.imagenes);
const genericas = fotosGenericas(fichas.map((f) => ({ fotos: fotosDe(f) })));

type PlanFoto = { idWp: number; url: string; fichero: string; convertir: boolean; alt: string };
type Plan = {
  ruta: string;
  accion: "crear" | "actualizar" | "sin-destino";
  idActual: number | null;
  enAlcance: boolean;
  maquetacion: "nueva" | "antigua";
  nombre: string;
  codigo: string | null;
  fichaTecnica: Par[];
  pesoKg: number | null;
  descripcion: { parrafos: number; caracteres: number; lexical: "ok" | "falla" | "vacía" };
  enlaces: string[];
  fotos: PlanFoto[];
  pdf: { url: string; fichero: string } | null;
  seo: { metaTitle: string | null; metaDescription: string | null };
  avisos: string[];
};

const planes: Plan[] = [];
for (const f of fichas) {
  const [marcaSlug, tipoSlug, slug] = f.segmentos;
  const avisosFicha: string[] = [];
  const nombre = nombreDeFicha(f.titulo);
  const marca = marcas.get(marcaSlug);
  const tipo = marca ? tipoDe(marca.id, tipoSlug) : undefined;
  if (!marca) avisosFicha.push(`la marca «${marcaSlug}» no existe en el preview`);
  else if (!tipo)
    avisosFicha.push(`el tipo «${tipoSlug}» no existe en el preview para ${marcaSlug}`);
  const actual = tipo
    ? equipos.find(
        (e) => e.slug === slug && (typeof e.tipo === "object" ? e.tipo?.id : e.tipo) === tipo.id,
      )
    : undefined;

  // Especificaciones: el bloque de la sección principal (maquetación nueva) o el
  // que sigue a «Especificaciones» más abajo (maquetación antigua).
  const clases = f.textos.map((t) => ({ html: t, clase: clasificarTexto(t) }));
  const htmlEspecificaciones =
    clases.find((c) => c.clase === "especificaciones")?.html ?? f.especificacionesFuera ?? "";
  const fichaTecnica = htmlEspecificaciones ? paresDeEspecificaciones(htmlEspecificaciones) : [];
  if (!fichaTecnica.length) avisosFicha.push("sin ficha técnica legible");

  const htmlDescripcion = clases
    .filter((c) => c.clase === "texto")
    .map((c) => c.html)
    .join("\n");
  const planoDescripcion = textoPlano(htmlDescripcion);
  let lexical: Plan["descripcion"]["lexical"] = "vacía";
  if (planoDescripcion) {
    try {
      convertHTMLToLexical({ editorConfig, html: htmlDescripcion, JSDOM: DomFeliz });
      lexical = "ok";
    } catch {
      lexical = "falla";
      avisosFicha.push("la descripción no se convierte a Lexical");
    }
  } else avisosFicha.push("sin descripción");
  if (pareceDatoDeContacto(planoDescripcion))
    avisosFicha.push("la descripción parece llevar un dato de contacto: revisar antes de importar");

  const fotos: PlanFoto[] = [];
  for (const foto of fotosDe(f)) {
    if (genericas.has(foto.idWp)) continue;
    if (!foto.url) {
      avisosFicha.push(`foto ${foto.idWp} sin adjunto en la exportación`);
      continue;
    }
    const p = fotoDeFicha(foto.url, foto.idWp, nombre);
    if (!p) {
      avisosFicha.push(`foto ${foto.idWp} en un formato que Media no admite`);
      continue;
    }
    fotos.push({
      idWp: foto.idWp,
      url: foto.url,
      fichero: p.fichero,
      convertir: p.convertir,
      alt: altDeRepuesto(foto.alt, nombre),
    });
  }
  if (!fotos.length) avisosFicha.push("sin fotos");

  const urlPdf = f.botones.find((b) => /\.pdf(\?|$)/i.test(b.url))?.url ?? null;
  const pdfPlan = urlPdf ? pdfDeFicha(urlPdf) : null;

  const v = vivo.get(f.ruta);
  planes.push({
    ruta: f.ruta,
    accion: !tipo ? "sin-destino" : actual ? "actualizar" : "crear",
    idActual: actual?.id ?? null,
    enAlcance: alcance.has(f.ruta),
    maquetacion: f.galeria.length ? "nueva" : "antigua",
    nombre,
    codigo: codigoDeModelo(nombre, marca?.nombre ?? marcaSlug, slug).valor,
    fichaTecnica,
    pesoKg: pesoOperativoKg(fichaTecnica),
    descripcion: {
      parrafos: (htmlDescripcion.match(/<\/(p|h\d|li)>/gi) ?? []).length,
      caracteres: planoDescripcion.length,
      lexical,
    },
    // Los enlaces al dominio de WordPress pasan a rutas relativas (las URL del sitio nuevo son las mismas).
    enlaces: enlacesDe(htmlDescripcion).map(enlaceInterno),
    fotos,
    pdf: urlPdf && pdfPlan ? { url: urlPdf, fichero: pdfPlan.fichero } : null,
    seo: {
      metaTitle: tituloSeo(v?.titulo, nombre),
      metaDescription: descripcionSeo(v?.descripcion),
    },
    avisos: avisosFicha,
  });
}

// Fichas del preview que no están en WordPress (y el alcance que no está en WordPress).
const rutasWp = new Set(fichas.map((f) => f.ruta));
const soloPreview = equipos.filter((e) => !planes.some((p) => p.idActual === e.id));
const alcanceSinWp = [...alcance].filter((r) => !rutasWp.has(r));
if (alcanceSinWp.length)
  avisos.push(`${alcanceSinWp.length} fichas del alcance no están en WordPress`);

// Subidas al Blob: una por fichero único que aún no esté.
const fotosUnicas = new Map<number, PlanFoto>();
for (const p of planes)
  if (p.accion !== "sin-destino") for (const f of p.fotos) fotosUnicas.set(f.idWp, f);
const pdfsUnicos = new Map<string, { url: string; fichero: string }>();
for (const p of planes) if (p.accion !== "sin-destino" && p.pdf) pdfsUnicos.set(p.pdf.url, p.pdf);
const fotosASubir = [...fotosUnicas.values()].filter((f) => !mediaYa.has(f.fichero));
const pdfsASubir = [...pdfsUnicos.values()].filter((d) => !documentosYa.has(d.fichero));
const pdfsCompartidos = [...pdfsUnicos.keys()].filter(
  (u) => planes.filter((p) => p.pdf?.url === u).length > 1,
);

// ---------- Fotos y PDF en WordPress (opcional: red, sin escribir nada) ----------

type Comprobacion = {
  fallos: { url: string; error: string }[];
  mbPdfMax: number;
  mbFotoMax: number;
  mbFotosTotal: number;
  mbPdfTotal: number;
  /** PDF que pasan del tope de `documentos` (25 MB, §10.39): no se pueden subir tal cual. */
  pdfSobreTope: { fichero: string; mb: number; fichas: string[] }[];
};
const comprobacion: Comprobacion = {
  fallos: [],
  mbPdfMax: 0,
  mbFotoMax: 0,
  mbFotosTotal: 0,
  mbPdfTotal: 0,
  pdfSobreTope: [],
};
if (COMPROBAR) {
  const AGENTE = "Partequipos-migracion/1.0 (simulación de fichas de maquinaria; solo lectura)";
  let ultima = 0;
  const turno = async () => {
    const espera = ultima + 700 - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultima = Date.now();
  };
  const cabeza = async (url: string) => {
    await turno();
    try {
      const r = await fetch(url, { method: "HEAD", headers: { "User-Agent": AGENTE } });
      if (!r.ok) {
        comprobacion.fallos.push({ url, error: `HTTP ${r.status}` });
        return 0;
      }
      return Number(r.headers.get("content-length") ?? 0) / 1024 / 1024;
    } catch (error) {
      comprobacion.fallos.push({ url, error: String(error) });
      return 0;
    }
  };
  for (const f of fotosASubir) {
    const mb = await cabeza(f.url);
    comprobacion.mbFotosTotal += mb;
    comprobacion.mbFotoMax = Math.max(comprobacion.mbFotoMax, mb);
  }
  for (const d of pdfsASubir) {
    const mb = await cabeza(d.url);
    comprobacion.mbPdfTotal += mb;
    comprobacion.mbPdfMax = Math.max(comprobacion.mbPdfMax, mb);
    if (mb > 25) {
      const usan = planes.filter((p) => p.pdf?.url === d.url).map((p) => p.ruta);
      comprobacion.pdfSobreTope.push({
        fichero: d.fichero,
        mb: Math.round(mb * 10) / 10,
        fichas: usan,
      });
    }
  }
}

// ---------- Informe ----------

const cuenta = <T>(xs: T[], k: (x: T) => string) =>
  xs.reduce<Record<string, number>>((a, x) => ((a[k(x)] = (a[k(x)] ?? 0) + 1), a), {});
const resumen = {
  fichasWp: planes.length,
  porAccion: cuenta(planes, (p) => p.accion),
  porMaquetacion: cuenta(planes, (p) => p.maquetacion),
  enAlcance: planes.filter((p) => p.enAlcance).length,
  alcanceSinWp,
  conFichaTecnica: planes.filter((p) => p.fichaTecnica.length).length,
  filasFichaTecnica: planes.reduce((s, p) => s + p.fichaTecnica.length, 0),
  conPeso: planes.filter((p) => p.pesoKg !== null).length,
  conDescripcion: planes.filter((p) => p.descripcion.caracteres).length,
  lexical: cuenta(planes, (p) => p.descripcion.lexical),
  conEnlaces: planes.filter((p) => p.enlaces.length).length,
  conFotos: planes.filter((p) => p.fotos.length).length,
  fotosGenericasExcluidas: genericas.size,
  conPdf: planes.filter((p) => p.pdf).length,
  pdfsCompartidos: pdfsCompartidos.length,
  subidasBlob: {
    fotos: fotosASubir.length,
    fotosAvifAWebp: fotosASubir.filter((f) => f.convertir).length,
    pdf: pdfsASubir.length,
    total: fotosASubir.length + pdfsASubir.length,
    yaEnElPreview: { fotos: mediaYa.size, pdf: documentosYa.size },
  },
  previewHoy: {
    equipos: equipos.length,
    actualizados: planes.filter((p) => p.accion === "actualizar").length,
    soloEnPreview: soloPreview.length,
  },
  conAvisos: planes.filter((p) => p.avisos.length).length,
  comprobacion: COMPROBAR ? comprobacion : "no pedida (añade «comprobar»)",
  avisos,
};
fs.writeFileSync(
  INFORME,
  JSON.stringify(
    {
      resumen,
      planes,
      soloEnPreview: soloPreview.map((e) => ({ id: e.id, slug: e.slug, nombre: e.nombre })),
      pdfsCompartidos,
    },
    null,
    1,
  ),
);
log(`simulación: nada escrito. Informe completo: ${INFORME}`);
log(JSON.stringify(resumen, null, 1));
