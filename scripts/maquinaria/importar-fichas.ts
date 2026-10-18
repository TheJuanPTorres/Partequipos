/**
 * Importación de las FICHAS de maquinaria nueva de WordPress a
 * `equipos-nuevos`, con su galería en `Media` y su PDF en `documentos`.
 * Detalle y decisiones: `docs/fichas-nuevas-importacion.md`.
 *
 *   npm run preview:fichas:simular              # sin escribir en la base ni en el Blob
 *   npm run preview:fichas:simular -- comprobar # además, comprueba fotos y PDF en WordPress
 *   npm run preview:fichas:importar             # una tanda (20 fichas); repetir hasta acabar
 *   npm run preview:fichas:importar -- tanda=80
 *   npm run preview:fichas:importar -- actualizar  # vuelve a aplicar los datos a las ya importadas,
 *                                                 # por tandas que avanzan (`reiniciar`: desde la primera)
 *   npm run preview:fichas:importar -- etiquetas   # solo las etiquetas, tal cual WordPress (2026-10-18)
 *   npm run preview:fichas:retirar              # deshace EXACTAMENTE lo del manifiesto
 *
 * IMPORTACIÓN AL PREVIEW APROBADA por dirección (2026-10-13), tras la simulación.
 * Para el sitio publicado, destino `produccion` con su base y su almacén, solo
 * por runbook de dirección (`runbook-importar-fichas-lanzamiento.md`).
 * Como los usados: por tandas, con MANIFIESTO (`manifiesto-fichas-preview.json`,
 * fuera del repositorio) y RETIRADA EXACTA: borra lo que creó y devuelve a las
 * fichas que ya existían (las de demostración) sus valores de antes.
 *
 * `actualizar` sirve también para rellenar el peso numérico cuando exista el
 * campo en `equipos-nuevos` (lo añade B): el script lo detecta solo.
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
import crypto from "node:crypto";
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
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { enlaceInterno, textoPlano } from "../../src/lib/blog/wordpress";
import type { EquiposNuevo } from "../../src/payload-types";
import {
  CORRECCIONES_WP,
  etiquetasTalCual,
  descripcionSeoDeFicha,
  type OrigenDescripcion,
  clasificarTexto,
  enlacesDe,
  fotoDeFicha,
  nombreDeFicha,
  paresDeEspecificaciones,
  pdfDeFicha,
  pesoOperativoKg,
  type Par,
} from "../../src/lib/maquinaria/wordpress";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import {
  marcarActualizada,
  pendientesDeActualizar,
  type EstadoActualizacion,
} from "../../src/lib/importacion/actualizacion";
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
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[fichas] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, importar o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
// Como los usados: `preview` solo con la base y el Blob del preview; los otros
// destinos, con SU base y SU almacén (el almacén se declara para la guarda).
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
// Simulación: sin token, nada puede llegar al Blob. Importar y retirar: el almacén, comprobado antes.
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[fichas]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "maquinaria-nueva-wordpress.json");
const ALCANCE = valorDe("alcance") ?? path.join(CIERRE, "alcance-fichas-nuevas.txt");
const INFORME = path.join(path.dirname(FUENTE), "simulacion-fichas.json");
const COMPROBAR = args.includes("comprobar");
const MANIFIESTO = valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-fichas-${destino}.json`);
const TANDA = Number(valorDe("tanda") ?? 20);
if (!Number.isInteger(TANDA) || TANDA < 1) fallar("tanda=<n> tiene que ser un entero positivo");
const ACTUALIZAR = args.includes("actualizar");
/** Con `actualizar reiniciar`, la actualización empieza de cero aunque la fuente sea la misma. */
const REINICIAR = args.includes("reiniciar");
/**
 * Con `etiquetas` (decisión del cliente, 2026-10-18): en las fichas YA
 * importadas, solo las etiquetas de la ficha técnica pasan a como están en
 * WordPress (sin corregir ni pasar a minúsculas), y el título para buscadores
 * vacío se rellena con el de WordPress (el SV208). Conserva «Destacar», los
 * valores y todo lo demás; no toca una ficha que un editor haya cambiado.
 * Con `simular`, solo cuenta. No crea nada ni sube nada.
 */
const ETIQUETAS = args.includes("etiquetas");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
if (modo === "simular") {
  for (const op of ["create", "update", "delete", "updateGlobal"] as const) {
    (payload as unknown as Record<string, unknown>)[op] = () =>
      fallar(`simulación: «${op}» no está permitido`);
  }
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
// El Blob añade un sufijo aleatorio al nombre: lo ya subido se reconoce por el PREFIJO.
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

/** Cuántas fichas llevan cada meta descripción de WordPress (las repetidas no se usan). */
const metasRepetidas = new Map<string, number>();
for (const f of fichas) {
  const d = textoPlano(vivo.get(f.ruta)?.descripcion ?? "");
  if (d) metasRepetidas.set(d, (metasRepetidas.get(d) ?? 0) + 1);
}

const avisos: string[] = [];
const fotosDe = (f: FichaWp) => (f.galeria.length ? f.galeria : f.imagenes);
const genericas = fotosGenericas(fichas.map((f) => ({ fotos: fotosDe(f) })));

type PlanFoto = {
  idWp: number;
  url: string;
  fichero: string;
  mimetype: string;
  convertir: boolean;
  alt: string;
};
/** Prefijo estable de una foto en `Media` (el id del adjunto) y de un PDF (su nombre sin extensión). */
const prefijoFoto = (idWp: number) => `wp-ficha-${idWp}-`;
const prefijoPdf = (fichero: string) => fichero.replace(/\.pdf$/i, "");
type Plan = {
  ruta: string;
  slug: string;
  marcaId: number | null;
  tipoId: number | null;
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
  seo: {
    metaTitle: string | null;
    metaDescription: string | null;
    origenDescripcion: OrigenDescripcion;
  };
  /** Errores de WordPress corregidos al importar (`CORRECCIONES_WP`). */
  correcciones: string[];
  avisos: string[];
};
/** El HTML de la descripción de cada ficha, con los enlaces ya relativos (no va al informe). */
const htmlDe = new Map<string, string>();

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
      mimetype: p.mimetype,
      convertir: p.convertir,
      alt: altDeRepuesto(foto.alt, nombre),
    });
  }
  if (!fotos.length) avisosFicha.push("sin fotos");

  const correccion = CORRECCIONES_WP[f.ruta] ?? {};
  const correcciones = [
    correccion.sinPdf,
    correccion.sinTituloSeo,
    correccion.sinDescripcionSeo,
  ].filter((c): c is string => Boolean(c));
  const urlPdf = correccion.sinPdf
    ? null
    : (f.botones.find((b) => /\.pdf(\?|$)/i.test(b.url))?.url ?? null);
  const pdfPlan = urlPdf ? pdfDeFicha(urlPdf) : null;

  // Los enlaces al dominio de WordPress pasan a rutas relativas (las URL del sitio nuevo son las mismas).
  htmlDe.set(
    f.ruta,
    htmlDescripcion.replace(/href="([^"]+)"/gi, (_, h: string) => `href="${enlaceInterno(h)}"`),
  );
  const v = vivo.get(f.ruta);
  const codigo = codigoDeModelo(nombre, marca?.nombre ?? marcaSlug, slug).valor;
  // Unas 50 fichas llevan en WordPress la meta descripción de otro modelo:
  // la de WordPress solo si nombra este; si no, la primera frase del texto o una
  // generada (decisión de dirección, 2026-10-14; `descripcionSeoDeFicha`).
  const descripcionBuscadores = descripcionSeoDeFicha({
    metaWp: descripcionSeo(v?.descripcion),
    htmlDescripcion,
    nombre,
    codigo,
    // Una descripción de WordPress que llevan varias fichas no es de ninguna.
    descartarWp:
      Boolean(correccion.sinDescripcionSeo) ||
      (metasRepetidas.get(textoPlano(v?.descripcion ?? "")) ?? 0) > 1,
  });
  planes.push({
    ruta: f.ruta,
    slug,
    marcaId: marca?.id ?? null,
    tipoId: tipo?.id ?? null,
    accion: !tipo ? "sin-destino" : actual ? "actualizar" : "crear",
    idActual: actual?.id ?? null,
    enAlcance: alcance.has(f.ruta),
    maquetacion: f.galeria.length ? "nueva" : "antigua",
    nombre,
    codigo,
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
      metaTitle: correccion.sinTituloSeo ? null : tituloSeo(v?.titulo, nombre),
      metaDescription: descripcionBuscadores.texto,
      origenDescripcion: descripcionBuscadores.origen,
    },
    correcciones,
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
const yaSubido = (hay: Set<string>, prefijo: string) => [...hay].some((f) => f.startsWith(prefijo));
const fotosASubir = [...fotosUnicas.values()].filter(
  (f) => !yaSubido(mediaYa, prefijoFoto(f.idWp)),
);
const pdfsASubir = [...pdfsUnicos.values()].filter(
  (d) => !yaSubido(documentosYa, prefijoPdf(d.fichero)),
);
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
  /** PDF que pasan del tope de `documentos` (30 MB, §10.39): no se pueden subir tal cual. */
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
    if (mb > 30) {
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
  correcciones: planes.flatMap((p) => p.correcciones.map((c) => `${p.slug}: ${c}`)),
  descripcionBuscadores: cuenta(planes, (p) => p.seo.origenDescripcion),
  comprobacion: COMPROBAR ? comprobacion : "no pedida (añade «comprobar»)",
  avisos,
};
if (ETIQUETAS) {
  if (modo === "retirar") fallar("«etiquetas» va con simular o importar");
  const cuenta = { cambiadas: 0, iguales: 0, editadas: 0, sinFicha: 0, titulos: 0 };
  for (const p of planes) {
    if (p.idActual === null) {
      cuenta.sinFicha++;
      continue;
    }
    const doc = await payload.findByID({
      collection: "equipos-nuevos",
      id: p.idActual,
      depth: 0,
      overrideAccess: true,
    });
    const filas = etiquetasTalCual(doc.fichaTecnica ?? [], p.fichaTecnica);
    const titulo = !doc.seo?.metaTitle && p.seo.metaTitle ? p.seo.metaTitle : null;
    if (filas === null) {
      cuenta.editadas++;
      log(`no se toca ${p.slug} (id ${p.idActual}): su ficha técnica no es la de la importación`);
    } else if (filas === "igual") cuenta.iguales++;
    else cuenta.cambiadas++;
    if (titulo) cuenta.titulos++;
    const data = {
      ...(Array.isArray(filas) ? { fichaTecnica: filas } : {}),
      ...(titulo ? { seo: { ...doc.seo, metaTitle: titulo } } : {}),
    };
    if (modo === "importar" && Object.keys(data).length) {
      await payload.update({
        collection: "equipos-nuevos",
        id: p.idActual,
        data: data as Partial<EquiposNuevo>,
        overrideAccess: true,
      });
      log(`etiquetas como en WordPress: ${p.slug} (id ${p.idActual})${titulo ? " · título" : ""}`);
    }
  }
  log(
    `etiquetas (${modo}): cambiadas ${cuenta.cambiadas} · ya iguales ${cuenta.iguales} · editadas, sin tocar ${cuenta.editadas} · sin ficha en la base ${cuenta.sinFicha} · títulos rellenados ${cuenta.titulos}`,
  );
  process.exit(0);
}
if (modo === "simular") {
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
  process.exit(0);
}

// ---------- Manifiesto ----------

type Fichero = { id: number; filename: string; url: string };
/** Lo que la importación sobrescribe en una ficha que ya existía: se devuelve al retirar. */
type Anterior = Pick<
  EquiposNuevo,
  | "nombre"
  | "codigo"
  | "entradilla"
  | "descripcion"
  | "destacados"
  | "imagenes"
  | "fichaTecnica"
  | "fichaTecnicaPdf"
  | "documentos"
  | "seo"
> &
  Record<string, unknown>;
type Manifiesto = {
  destino: string;
  creado: {
    equipos: { ruta: string; id: number }[];
    media: (Fichero & { idWp: number })[];
    documentos: (Fichero & { urlWp: string })[];
  };
  /** Fichas que ya existían (las de demostración) y su valor de antes, por id. */
  actualizados: { ruta: string; id: number }[];
  anteriores: Record<string, Anterior>;
  /** Por dónde va `actualizar` con la fuente actual (`src/lib/importacion/actualizacion.ts`). */
  actualizacion?: EstadoActualizacion;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : {
      destino: destino!,
      creado: { equipos: [], media: [], documentos: [] },
      actualizados: [],
      anteriores: {},
    };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
function guardarManifiesto() {
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
}

/** El id de una relación (poblada o no). */
const idDe = (x: unknown): number | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;
const ids = (xs: unknown[] | null | undefined) =>
  (xs ?? []).map(idDe).filter((x): x is number => x !== null);
/** Las filas de un array sin su `id` (Payload las vuelve a numerar al guardar). */
const sinIds = <T extends { id?: unknown }>(filas: T[] | null | undefined) =>
  (filas ?? []).map((fila) => {
    const resto = { ...fila };
    delete resto.id;
    return resto;
  });

// ---------- Peso numérico (campo de B, si ya existe) ----------

/** El campo numérico de peso de `equipos-nuevos`, si ya está en el esquema (lo añade B). */
const campoPeso =
  payload.collections["equipos-nuevos"].config.flattenedFields.find(
    (c) => c.type === "number" && /^peso/i.test(c.name),
  )?.name ?? null;

// ---------- Retirada ----------

/**
 * Deshace EXACTAMENTE lo que apunta el manifiesto: devuelve a las fichas que ya
 * existían sus valores de antes, borra las fichas, fotos y PDF que creó la
 * importación y comprueba que los ficheros salen del Blob. Lo que no creó la
 * importación no se borra nunca.
 */
async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  let devueltas = 0;
  for (const { id } of manifiesto.actualizados) {
    const a = manifiesto.anteriores[String(id)];
    if (!a) continue;
    await payload.update({
      collection: "equipos-nuevos",
      id,
      data: {
        nombre: a.nombre,
        codigo: a.codigo ?? null,
        entradilla: a.entradilla ?? null,
        descripcion: a.descripcion ?? null,
        destacados: sinIds(a.destacados),
        imagenes: ids(a.imagenes),
        fichaTecnica: sinIds(a.fichaTecnica),
        fichaTecnicaPdf: idDe(a.fichaTecnicaPdf),
        documentos: ids(a.documentos),
        seo: a.seo ? { ...a.seo, ogImage: idDe(a.seo.ogImage) } : undefined,
        ...(campoPeso ? { [campoPeso]: a[campoPeso] ?? null } : {}),
      },
      overrideAccess: true,
    });
    devueltas++;
  }
  log(
    `fichas que ya existían, devueltas a su valor de antes: ${devueltas} de ${manifiesto.actualizados.length}`,
  );
  let equiposBorrados = 0;
  for (const { id } of manifiesto.creado.equipos) {
    const r = await payload
      .delete({ collection: "equipos-nuevos", id, overrideAccess: true })
      .catch(() => null);
    if (r) equiposBorrados++;
  }
  log(`fichas creadas y borradas: ${equiposBorrados} de ${manifiesto.creado.equipos.length}`);
  const urls: string[] = [];
  const porColeccion = [
    ["media", manifiesto.creado.media],
    ["documentos", manifiesto.creado.documentos],
  ] as const;
  for (const [coleccion, lista] of porColeccion) {
    let n = 0;
    for (const m of lista) {
      const r = await payload
        .delete({ collection: coleccion, id: m.id, overrideAccess: true })
        .catch(() => null);
      if (r) {
        n++;
        if (m.url) urls.push(m.url);
      }
    }
    log(`${coleccion} creados y borrados: ${n} de ${lista.length}`);
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("manifiesto retirado; espero 70 s (propagación del Blob)");
  await new Promise((r) => setTimeout(r, 70_000));
  // Como en los usados: algún fichero tarda algo más de 60 s; hasta 3 vueltas más, cada 30 s.
  let vivos = [...urls];
  for (let intento = 0; ; intento++) {
    const quedan: string[] = [];
    for (const u of vivos) if ((await fetch(u, { method: "HEAD" })).status !== 404) quedan.push(u);
    vivos = quedan;
    if (!vivos.length || intento === 3) break;
    log(`${vivos.length} ficheros aún responden; vuelvo a mirar en 30 s`);
    await new Promise((r) => setTimeout(r, 30_000));
  }
  if (vivos.length) fallar(`${vivos.length} ficheros siguen en el Blob: ${vivos.join(" ")}`);
  log(`✓ los ${urls.length} ficheros dan 404`);
}

if (modo === "retirar") {
  await retirar();
  process.exit(0);
}

// ---------- Red, con turno ----------

const AGENTE = "Partequipos-migracion/1.0 (importador de fichas de maquinaria; solo lectura)";
let ultima = 0;
async function turno() {
  const espera = ultima + 700 - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultima = Date.now();
}
async function descargar(url: string): Promise<Buffer> {
  await turno();
  const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!r.ok) throw new Error(`HTTP ${r.status} al descargar ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

/** El fichero ya subido con ese prefijo, si lo hay (el más antiguo). */
async function yaEnColeccion(
  coleccion: "media" | "documentos",
  prefijo: string,
): Promise<Fichero | null> {
  const r = await payload.find({
    collection: coleccion,
    where: { filename: { like: prefijo } },
    sort: "createdAt",
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const d = r.docs.find((x) => (x.filename ?? "").startsWith(prefijo));
  return d ? { id: d.id, filename: d.filename ?? "", url: d.url ?? "" } : null;
}

async function fotoAMedia(f: PlanFoto): Promise<number> {
  const ya = await yaEnColeccion("media", prefijoFoto(f.idWp));
  if (ya) return ya.id;
  const origen = await descargar(f.url);
  // AVIF → WebP en esta máquina, no en el lambda (como los repuestos).
  const datos = f.convertir ? await sharp(origen).webp({ quality: 82 }).toBuffer() : origen;
  const doc = await payload.create({
    collection: "media",
    data: { alt: f.alt },
    file: { data: datos, mimetype: f.mimetype, name: f.fichero, size: datos.length },
    overrideAccess: true,
  });
  manifiesto.creado.media.push({
    idWp: f.idWp,
    id: doc.id,
    filename: doc.filename ?? f.fichero,
    url: doc.url ?? "",
  });
  guardarManifiesto();
  return doc.id;
}

async function pdfADocumento(
  pdf: { url: string; fichero: string },
  nombre: string,
): Promise<number> {
  const ya = await yaEnColeccion("documentos", prefijoPdf(pdf.fichero));
  if (ya) return ya.id;
  const datos = await descargar(pdf.url);
  const doc = await payload.create({
    collection: "documentos",
    data: { titulo: `Ficha técnica ${nombre}` },
    file: { data: datos, mimetype: "application/pdf", name: pdf.fichero, size: datos.length },
    overrideAccess: true,
  });
  manifiesto.creado.documentos.push({
    urlWp: pdf.url,
    id: doc.id,
    filename: doc.filename ?? pdf.fichero,
    url: doc.url ?? "",
  });
  guardarManifiesto();
  return doc.id;
}

// ---------- Importación, por tandas ----------

const hecha = (ruta: string) =>
  manifiesto.creado.equipos.some((e) => e.ruta === ruta) ||
  manifiesto.actualizados.some((e) => e.ruta === ruta);
const conDestino = planes.filter((p) => p.accion !== "sin-destino");
for (const p of planes.filter((p) => p.accion === "sin-destino")) {
  log(`SIN DESTINO, no se importa: ${p.ruta} (${p.avisos.join("; ")})`);
}
// Con `actualizar`, la tanda avanza por las que aún no se actualizaron con
// ESTA fuente (antes tomaba siempre las primeras N y no pasaba de ahí).
let actualizacion: EstadoActualizacion | null = null;
let pendientes: typeof conDestino;
if (ACTUALIZAR) {
  const huella = crypto.createHash("sha256").update(fs.readFileSync(FUENTE)).digest("hex");
  const r = pendientesDeActualizar(
    conDestino,
    (p) => p.ruta,
    manifiesto.actualizacion,
    huella,
    REINICIAR,
  );
  if (r.reiniciada) log("actualizar: fuente nueva o «reiniciar», empieza desde la primera");
  actualizacion = r.estado;
  pendientes = r.pendientes;
  log(`actualizar: ya actualizadas con esta fuente: ${conDestino.length - pendientes.length}`);
} else {
  pendientes = conDestino.filter((p) => !hecha(p.ruta));
}
const tanda = pendientes.slice(0, TANDA);
/** Apunta la ficha como actualizada con esta fuente (solo con `actualizar`). */
const apuntarActualizada = (ruta: string) => {
  if (!actualizacion) return;
  marcarActualizada(actualizacion, ruta);
  manifiesto.actualizacion = actualizacion;
};
log(
  `ya importadas: ${conDestino.filter((p) => hecha(p.ruta)).length} · esta tanda: ${tanda.length} · quedan después: ${pendientes.length - tanda.length}`,
);
log(
  campoPeso
    ? `peso numérico: se rellena el campo «${campoPeso}»`
    : "peso numérico: el campo aún no existe; se rellenará con «actualizar» cuando esté",
);

for (const p of tanda) {
  const imagenes: number[] = [];
  for (const f of p.fotos) imagenes.push(await fotoAMedia(f));
  const fichaTecnicaPdf = p.pdf ? await pdfADocumento(p.pdf, p.nombre) : null;
  const html = htmlDe.get(p.ruta) ?? "";
  const descripcion = textoPlano(html)
    ? (convertHTMLToLexical({ editorConfig, html, JSDOM: DomFeliz }) as EquiposNuevo["descripcion"])
    : null;
  const data = {
    nombre: p.nombre,
    codigo: p.codigo,
    // WordPress no tiene entradilla ni puntos destacados: en las fichas de
    // demostración se vacía el relleno.
    entradilla: null,
    descripcion,
    destacados: [],
    imagenes,
    // «Destacar», sin marcar: lo decide el editor.
    fichaTecnica: p.fichaTecnica.map((f) => ({ ...f, destacar: false })),
    fichaTecnicaPdf,
    documentos: [],
    seo: { metaTitle: p.seo.metaTitle, metaDescription: p.seo.metaDescription },
    ...(campoPeso ? { [campoPeso]: p.pesoKg } : {}),
  };

  // Ya existía (por el plan, o creada en una tanda anterior): se actualiza.
  const creadaAntes = manifiesto.creado.equipos.find((e) => e.ruta === p.ruta)?.id ?? null;
  const id = p.idActual ?? creadaAntes;
  // Solo las que existían ANTES de la importación tienen valor de antes que
  // devolver; las que creó una tanda anterior se retiran borrándolas.
  const yaExistia = p.idActual !== null && creadaAntes === null;
  if (id !== null) {
    if (yaExistia && !manifiesto.anteriores[String(id)]) {
      const antes = await payload.findByID({
        collection: "equipos-nuevos",
        id,
        depth: 0,
        overrideAccess: true,
      });
      manifiesto.anteriores[String(id)] = {
        nombre: antes.nombre,
        codigo: antes.codigo,
        entradilla: antes.entradilla,
        descripcion: antes.descripcion,
        destacados: antes.destacados,
        imagenes: antes.imagenes,
        fichaTecnica: antes.fichaTecnica,
        fichaTecnicaPdf: antes.fichaTecnicaPdf,
        documentos: antes.documentos,
        seo: antes.seo,
        ...(campoPeso
          ? { [campoPeso]: (antes as unknown as Record<string, unknown>)[campoPeso] ?? null }
          : {}),
      };
      guardarManifiesto();
    }
    await payload.update({ collection: "equipos-nuevos", id, data, overrideAccess: true });
    if (yaExistia && !manifiesto.actualizados.some((e) => e.id === id)) {
      manifiesto.actualizados.push({ ruta: p.ruta, id });
    }
    apuntarActualizada(p.ruta);
    guardarManifiesto();
    log(
      `actualizada ${p.slug} (id ${id}) · ${imagenes.length} fotos · ${p.fichaTecnica.length} filas · PDF ${fichaTecnicaPdf ? "sí" : "no"}`,
    );
    continue;
  }
  const doc = await payload.create({
    collection: "equipos-nuevos",
    data: { ...data, slug: p.slug, marca: p.marcaId!, tipo: p.tipoId! },
    overrideAccess: true,
  });
  manifiesto.creado.equipos.push({ ruta: p.ruta, id: doc.id });
  apuntarActualizada(p.ruta);
  guardarManifiesto();
  if (doc.slug !== p.slug) {
    fallar(`la ficha ${p.ruta} se guardó con otro slug («${doc.slug}»): revisar`);
  }
  log(
    `creada ${p.slug} (id ${doc.id}) · ${imagenes.length} fotos · ${p.fichaTecnica.length} filas · PDF ${fichaTecnicaPdf ? "sí" : "no"}`,
  );
}
log(
  `tanda terminada · en el manifiesto: ${manifiesto.creado.equipos.length} creadas, ${manifiesto.actualizados.length} actualizadas, ${manifiesto.creado.media.length} fotos, ${manifiesto.creado.documentos.length} PDF`,
);
if (pendientes.length > tanda.length) log("quedan fichas: vuelve a ejecutar la importación");
