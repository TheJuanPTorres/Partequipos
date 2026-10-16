/**
 * CONTENIDO REAL DE LA HOME Y DE NOSOTROS, desde la web original de WordPress.
 * Sustituye a la copia de demostración de ux-9 (CLAUDE.md §10.38). Estudio,
 * decisiones de dirección (2026-10-14) y huecos: `docs/contenido-real-portada.md`.
 *
 *   npm run preview:real:simular     # no escribe nada: dice qué cambiaría y cuántas subidas
 *   npm run preview:real:importar    # sube las imágenes y aplica el contenido
 *   npm run preview:real:retirar     # deshace EXACTAMENTE lo del manifiesto
 *
 * Qué toca, y nada más:
 * - Portada («inicio»): imagen de la sección 3, logos de la 4, imagen y YouTube
 *   de «Nuestra Compañía» (sin vídeo), sin imagen en las preguntas, meta descripción.
 * - Marcas de maquinaria nueva (4): logo, foto de tarjeta y orden en la portada.
 * - Categorías técnicas de la sección 5 (4): imagen, título y enlace.
 * - Pie: sin imagen decorativa (no hay recorte real).
 * - Sedes: las de WordPress (crea, actualiza por nombre y quita las que no están).
 * - Nosotros: sus bloques y su meta descripción.
 * El hero, los testimonios y las preguntas NO se tocan (los testimonios y las
 * preguntas reales esperan al cliente).
 *
 * EN EL SITIO PUBLICADO, EL ORDEN ES OBLIGATORIO: primero se retira la copia de
 * demostración (`copia-demo.ts retirar`, con su runbook) y DESPUÉS se ejecuta
 * esto. Al revés, la retirada de la copia devolvería las secciones a su valor de
 * antes y borraría lo real. Por eso, en `produccion` el script se niega si aún
 * queda algo de la copia (un fichero `demo-copia-` en uso).
 *
 * Como los demás importadores: MANIFIESTO fuera del repositorio
 * (`manifiesto-contenido-real-<destino>.json`) con lo creado y el valor de ANTES
 * de lo cambiado, y RETIRADA EXACTA. Doble cierre en la simulación: sin token
 * del Blob y con `create`/`update`/`delete` de Payload que lanzan un error.
 *
 * FUENTE, fuera del repositorio (`Desktop/partequipos-cierre/contenido-real-wordpress.json`,
 * o `fuente=<ruta>`): lo que saca `scripts/contenido-real/extraer-xml.py` del XML.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { convertHTMLToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
// happy-dom llega con `@lexical/headless` (como en el importador del blog y el de fichas).
import { Window } from "happy-dom";
import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import {
  ENLACES_TARJETAS,
  PREFIJO_REAL,
  elegidoEnElPanel,
  ficheroReal,
  type FuenteContenidoReal,
  type ManifiestoContenidoReal,
  restoDeLaCopia,
} from "../../src/lib/portada/contenidoReal";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[real] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, importar o retirar");
// `solo=categorias`: solo las categorías técnicas de la portada (y sus fotos). Así una
// pasada para añadir categorías no toca marcas, portada, sedes, Nosotros ni el pie.
const SOLO = valorDe("solo");
if (SOLO !== undefined && SOLO !== "categorias")
  fallar(`«solo» solo admite «categorias», no «${SOLO}»`);
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[real]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "contenido-real-wordpress.json");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-contenido-real-${destino}.json`);

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
const log = (m: string) => process.stdout.write(`[real] ${m}\n`);

/** El conversor de Payload espera un constructor con la forma de `JSDOM`. */
class DomFeliz {
  window: { document: Document };
  constructor(html: string) {
    const w = new Window();
    w.document.write(`<!doctype html><html><body>${html}</body></html>`);
    this.window = w as unknown as { document: Document };
  }
}

type Id = number;
type Doc = Record<string, unknown> & { id: Id };
const idDe = (x: unknown): Id | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;
/** Las filas de un array sin su `id` (Payload las vuelve a numerar al guardar). */
const sinIds = (filas: unknown): Record<string, unknown>[] =>
  Array.isArray(filas)
    ? filas.map((f) => {
        const r = { ...(f as Record<string, unknown>) };
        delete r.id;
        return r;
      })
    : [];

// ---------- Manifiesto ----------

const manifiesto: ManifiestoContenidoReal = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as ManifiestoContenidoReal)
  : {
      destino: destino!,
      inicio: new Date().toISOString(),
      creado: { media: [], sedes: [] },
      antes: null,
    };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
const guardar = () => {
  if (modo === "simular") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

// ---------- Lecturas del destino ----------

async function pagina(slug: string): Promise<Doc | null> {
  const r = await payload.find({
    collection: "paginas",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return (r.docs[0] as unknown as Doc) ?? null;
}
const porSlug = async (coleccion: "marcas-maquinaria" | "categorias-tecnicas", slugs: string[]) =>
  (
    await payload.find({
      collection: coleccion,
      where: { slug: { in: slugs } },
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
    })
  ).docs as unknown as Doc[];
const todasLasSedes = async () =>
  (
    await payload.find({
      collection: "sedes",
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
    })
  ).docs as unknown as Doc[];

// ================================================================== RETIRAR
if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const a = manifiesto.antes;
  if (a) {
    await payload.update({
      collection: "paginas",
      id: a.portada.id,
      data: a.portada.datos as never,
      overrideAccess: true,
    });
    log("portada: secciones devueltas a su valor de antes");
    if (a.nosotros) {
      await payload.update({
        collection: "paginas",
        id: a.nosotros.id,
        data: a.nosotros.datos as never,
        overrideAccess: true,
      });
      log("nosotros: bloques y meta descripción devueltos");
    }
    for (const [id, datos] of Object.entries(a.marcas))
      await payload.update({
        collection: "marcas-maquinaria",
        id: Number(id),
        data: datos as never,
        overrideAccess: true,
      });
    for (const [id, datos] of Object.entries(a.categorias))
      await payload.update({
        collection: "categorias-tecnicas",
        id: Number(id),
        data: datos as never,
        overrideAccess: true,
      });
    log(
      `marcas y categorías devueltas: ${Object.keys(a.marcas).length} y ${Object.keys(a.categorias).length}`,
    );
    await payload.updateGlobal({ slug: "pie", data: a.pie as never, overrideAccess: true });
    log("pie: imagen decorativa devuelta");
    // Sedes: las actualizadas vuelven a su valor; las quitadas se vuelven a crear.
    for (const [id, datos] of Object.entries(a.sedesActualizadas))
      await payload.update({
        collection: "sedes",
        id: Number(id),
        data: datos as never,
        overrideAccess: true,
      });
    for (const datos of a.sedesQuitadas)
      await payload.create({ collection: "sedes", data: datos as never, overrideAccess: true });
    log(
      `sedes: ${Object.keys(a.sedesActualizadas).length} devueltas y ${a.sedesQuitadas.length} vueltas a crear`,
    );
  }
  for (const id of manifiesto.creado.sedes)
    await payload.delete({ collection: "sedes", id, overrideAccess: true }).catch(() => null);
  log(`sedes creadas y borradas: ${manifiesto.creado.sedes.length}`);
  const urls: string[] = [];
  for (const m of manifiesto.creado.media) {
    const r = await payload
      .delete({ collection: "media", id: m.id, overrideAccess: true })
      .catch(() => null);
    if (r && m.url) urls.push(m.url);
  }
  log(`imágenes creadas y borradas: ${urls.length} de ${manifiesto.creado.media.length}`);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("manifiesto retirado; espero 70 s (propagación del Blob)");
  await new Promise((r) => setTimeout(r, 70_000));
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
  log(`✓ RETIRADA COMPLETA: los ${urls.length} ficheros dan 404`);
  process.exit(0);
}

// ================================================================== SIMULAR / IMPORTAR
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE} (ver extraer-xml.py)`);
const fuente = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as FuenteContenidoReal;

const portada = (await pagina("inicio")) ?? fallar("el destino no tiene portada (slug «inicio»)");
const nosotros = await pagina("nosotros");
const marcas = await porSlug(
  "marcas-maquinaria",
  fuente.portada.marcas.map((m) => m.slug),
);
const categorias = await porSlug(
  "categorias-tecnicas",
  fuente.portada.categorias.map((c) => c.slug),
);
const sedes = await todasLasSedes();
const pie = (await payload.findGlobal({
  slug: "pie",
  depth: 0,
  overrideAccess: true,
})) as unknown as Doc;

for (const m of fuente.portada.marcas)
  if (!marcas.some((x) => x.slug === m.slug))
    fallar(`no existe la marca «${m.slug}» en el destino`);
for (const c of fuente.portada.categorias)
  if (!categorias.some((x) => x.slug === c.slug))
    fallar(`no existe la categoría «${c.slug}» en el destino`);

// En el sitio publicado, la copia de demostración tiene que estar retirada antes.
if (destino === "produccion") {
  const enUso = await restoDeLaCopia(payload);
  if (enUso.length)
    fallar(
      `aún queda la copia de demostración (${enUso.length}: ${enUso.slice(0, 3).join(" · ")}…). ` +
        "Primero su retirada (runbook-retirada-demo), DESPUÉS esto.",
    );
}

// El valor de ANTES de todo lo que se cambia: solo la primera vez (si se repite, se conserva).
if (!manifiesto.antes) {
  const grupo = (k: string) => {
    const g = { ...((portada[k] as Record<string, unknown>) ?? {}) };
    for (const [c, v] of Object.entries(g))
      if (v && typeof v === "object" && "id" in v) g[c] = idDe(v);
    return g;
  };
  const seccionLogos = grupo("seccionLogos");
  seccionLogos.logos = sinIds(seccionLogos.logos).map((l) => ({ ...l, logo: idDe(l.logo) }));
  const sedeDatos = (s: Doc) => ({
    nombre: s.nombre,
    ciudad: s.ciudad,
    departamento: s.departamento,
    latitud: s.latitud,
    longitud: s.longitud,
    lineas: sinIds(s.lineas),
    foto: idDe(s.foto),
    orden: s.orden ?? null,
  });
  const nombres = new Set(fuente.sedes.map((s) => s.nombre));
  manifiesto.antes = {
    portada: {
      id: portada.id,
      datos: {
        seccionUsada: grupo("seccionUsada"),
        seccionRepuestos: grupo("seccionRepuestos"),
        seccionLogos,
        seccionCompania: grupo("seccionCompania"),
        seccionFaq: grupo("seccionFaq"),
        seo: grupo("seo"),
      },
    },
    nosotros: nosotros
      ? {
          id: nosotros.id,
          datos: {
            bloques: (nosotros.bloques as unknown[]) ?? [],
            seo: { ...((nosotros.seo as object) ?? {}) },
          },
        }
      : null,
    marcas: Object.fromEntries(
      marcas.map((m) => [
        m.id,
        {
          logo: idDe(m.logo),
          imagenTarjeta: idDe(m.imagenTarjeta),
          ordenPortada: m.ordenPortada ?? null,
          descripcion: m.descripcion ?? null,
        },
      ]),
    ),
    categorias: Object.fromEntries(
      categorias.map((c) => [
        c.id,
        {
          imagen: idDe(c.imagen),
          tituloPortada: c.tituloPortada ?? null,
          enlace: c.enlace ?? null,
          ordenPortada: c.ordenPortada ?? null,
          icono: c.icono ?? null,
        },
      ]),
    ),
    pie: { imagenDecorativa: idDe(pie.imagenDecorativa) },
    sedesActualizadas: Object.fromEntries(
      sedes.filter((s) => nombres.has(String(s.nombre))).map((s) => [s.id, sedeDatos(s)]),
    ),
    sedesQuitadas: sedes.filter((s) => !nombres.has(String(s.nombre))).map(sedeDatos),
  };
  guardar();
}
// Una importación anterior a la fila de categorías no guardó «Repuestos»: su valor de
// ahora es el original, porque hasta este cambio el importador no lo tocaba.
{
  const datos = manifiesto.antes!.portada.datos as Record<string, unknown>;
  if (!datos.seccionRepuestos) {
    datos.seccionRepuestos = { ...((portada.seccionRepuestos as Record<string, unknown>) ?? {}) };
    guardar();
  }
}

// Las categorías que una pasada anterior no tocaba (de 4 a 10 el 2026-10-16, dos tarjetas
// apiladas de 5): su valor de ahora es el original, así la retirada también las devuelve.
{
  const antesCat = manifiesto.antes!.categorias as Record<string, unknown>;
  let nuevas = 0;
  for (const c of categorias)
    if (!(String(c.id) in antesCat)) {
      antesCat[String(c.id)] = {
        imagen: idDe(c.imagen),
        tituloPortada: c.tituloPortada ?? null,
        enlace: c.enlace ?? null,
        ordenPortada: c.ordenPortada ?? null,
        icono: c.icono ?? null,
      };
      nuevas++;
    }
  if (nuevas) {
    log(`categorías nuevas en el manifiesto: ${nuevas}`);
    guardar();
  }
}

// ---------- Imágenes: de WordPress al Blob, una cada 0,7 s, sin repetir ----------

const AGENTE = "Partequipos-migracion/1.0 (importador de contenido real; solo lectura)";
let ultima = 0;
async function descargar(url: string): Promise<{ datos: Buffer; tipo: string }> {
  const espera = ultima + 700 - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultima = Date.now();
  const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!r.ok) throw new Error(`HTTP ${r.status} al descargar ${url}`);
  return { datos: Buffer.from(await r.arrayBuffer()), tipo: r.headers.get("content-type") ?? "" };
}

const ya = new Map(
  (
    await payload.find({
      collection: "media",
      where: { filename: { like: PREFIJO_REAL } },
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
    })
  ).docs
    .filter((d) => (d.filename ?? "").startsWith(PREFIJO_REAL))
    .map((d) => [d.filename ?? "", d.id]),
);
const subidas: string[] = [];
const ids: Record<string, Id> = {};
const clavesCategorias = new Set(fuente.portada.categorias.map((c) => c.imagen));
const imagenesAUsar = Object.entries(fuente.imagenes).filter(
  ([clave]) => SOLO !== "categorias" || clavesCategorias.has(clave),
);
for (const [clave, img] of imagenesAUsar) {
  const fichero = ficheroReal(clave, img.url);
  // El Blob añade un sufijo aleatorio: lo ya subido se reconoce por el nombre sin extensión.
  const base = fichero.replace(/\.\w+$/, "");
  const previo = [...ya.entries()].find(([f]) => f === fichero || f.startsWith(`${base}-`));
  if (previo) {
    ids[clave] = previo[1];
    continue;
  }
  subidas.push(clave);
  if (modo === "simular") {
    ids[clave] = -1;
    continue;
  }
  const { datos, tipo } = await descargar(img.url);
  const doc = await payload.create({
    collection: "media",
    data: { alt: img.alt, ...(img.foco ? { focalX: img.foco[0], focalY: img.foco[1] } : {}) },
    file: {
      data: datos,
      mimetype: tipo.split(";")[0] || "image/jpeg",
      name: fichero,
      size: datos.length,
    },
    overrideAccess: true,
  });
  manifiesto.creado.media.push({ clave, id: doc.id, url: doc.url ?? "" });
  guardar();
  ids[clave] = doc.id;
  log(`subida ${clave} → media ${doc.id}`);
}
const img = (clave: string) => ids[clave] ?? fallar(`la fuente no tiene la imagen «${clave}»`);

// ---------- Lo elegido en el panel NO se pisa (dirección, 2026-10-16) ----------
// Cada imagen, vídeo o animación que escribe la importación se queda como está si la
// eligió alguien en el panel (`elegidoEnElPanel`): ni se sustituye ni se vacía.

const ficheros = new Map<string, string | null>();
async function ficheroDe(
  coleccion: "media" | "videos" | "animaciones",
  id: Id,
): Promise<string | null> {
  const k = `${coleccion}:${id}`;
  if (!ficheros.has(k)) {
    try {
      const d = await payload.findByID({
        collection: coleccion,
        id,
        depth: 0,
        overrideAccess: true,
      });
      ficheros.set(k, (d as { filename?: string | null }).filename ?? null);
    } catch {
      ficheros.set(k, null);
    }
  }
  return ficheros.get(k) ?? null;
}
const conservados: string[] = [];
async function oElegido(
  donde: string,
  actual: unknown,
  deAntes: unknown,
  nuevo: Id | null,
  coleccion: "media" | "videos" | "animaciones" = "media",
): Promise<Id | null> {
  const id = idDe(actual);
  if (
    id !== null &&
    elegidoEnElPanel({ id, fichero: await ficheroDe(coleccion, id) }, idDe(deAntes))
  ) {
    conservados.push(donde);
    return id;
  }
  return nuevo;
}
const filas = (x: unknown): Record<string, unknown>[] =>
  Array.isArray(x) ? (x as Record<string, unknown>[]) : [];
const grupo = (doc: Doc | null, k: string) =>
  (doc?.[k] as Record<string, unknown> | undefined) ?? {};
const bloque = (lista: unknown, tipo: string) =>
  filas(lista).find((b) => b.blockType === tipo) ?? ({} as Record<string, unknown>);

// ---------- Lo que se aplica ----------

const p = fuente.portada;
const antes = manifiesto.antes!.portada.datos as Record<string, Record<string, unknown>>;
const todo = SOLO !== "categorias";

const antesCategorias = manifiesto.antes!.categorias as Record<string, Record<string, unknown>>;
const datosCategorias: { id: Id; data: Record<string, unknown> }[] = [];
for (const c of p.categorias) {
  const doc = categorias.find((x) => x.slug === c.slug)!;
  datosCategorias.push({
    id: doc.id,
    // Orden e icono también: la retirada de la copia de demostración los deja vacíos.
    data: {
      imagen: await oElegido(
        `categoría ${c.slug}: foto`,
        doc.imagen,
        antesCategorias[String(doc.id)]?.imagen,
        img(c.imagen),
      ),
      tituloPortada: c.titulo,
      enlace: c.enlace,
      ordenPortada: c.orden,
      icono: c.icono,
    },
  });
}

const logosActuales = filas(grupo(portada, "seccionLogos").logos);
const logosAntes = filas(antes.seccionLogos?.logos);
const datosPortada = todo
  ? {
      // Vacía hasta que haya una máquina recortada real (dirección, 2026-10-16): ni la de
      // ux-9 ni una foto normal de WordPress. La que se elija en el panel, se queda.
      seccionUsada: {
        ...antes.seccionUsada,
        imagen: await oElegido(
          "portada: máquina recortada de «Maquinaria pesada usada»",
          grupo(portada, "seccionUsada").imagen,
          antes.seccionUsada?.imagen,
          null,
        ),
      },
      // El enlace de cada categoría de la sección de repuestos dice «Ver todo».
      seccionRepuestos: { ...antes.seccionRepuestos, verMasTexto: "Ver todo" },
      seccionLogos: {
        ...antes.seccionLogos,
        logos: await Promise.all(
          p.logos.map(async (l, i) => ({
            nombre: l.nombre,
            logo: await oElegido(
              `portada: logo ${i + 1} de «Nuestras marcas»`,
              logosActuales[i]?.logo,
              logosAntes[i]?.logo,
              img(l.logo),
            ),
          })),
        ),
      },
      seccionCompania: {
        ...antes.seccionCompania,
        video: await oElegido(
          "portada: vídeo de «Nuestra Compañía»",
          grupo(portada, "seccionCompania").video,
          antes.seccionCompania?.video,
          null,
          "videos",
        ),
        imagen: await oElegido(
          "portada: foto de «Nuestra Compañía»",
          grupo(portada, "seccionCompania").imagen,
          antes.seccionCompania?.imagen,
          img(p.compania.imagen),
        ),
        youtube: p.compania.youtube,
      },
      // Tarjeta de las preguntas (rediseño de Andrés): la foto real del técnico.
      seccionFaq: {
        ...antes.seccionFaq,
        imagen: await oElegido(
          "portada: foto de las preguntas frecuentes",
          grupo(portada, "seccionFaq").imagen,
          antes.seccionFaq?.imagen,
          img(p.faqImagen),
        ),
      },
      seo: {
        ...antes.seo,
        // La imagen al compartir: la de antes, salvo que se haya elegido otra en el panel.
        ogImage: await oElegido(
          "portada: imagen al compartir",
          grupo(portada, "seo").ogImage,
          antes.seo?.ogImage,
          idDe(antes.seo?.ogImage),
        ),
        metaDescription: p.metaDescripcion,
      },
    }
  : null;

const antesMarcas = manifiesto.antes!.marcas as Record<string, Record<string, unknown>>;
const datosMarcas: { id: Id; data: Record<string, unknown> }[] = [];
if (todo)
  for (const m of p.marcas) {
    const doc = marcas.find((x) => x.slug === m.slug)!;
    const a = antesMarcas[String(doc.id)] ?? {};
    datosMarcas.push({
      id: doc.id,
      data: {
        logo: await oElegido(`marca ${m.slug}: logo`, doc.logo, a.logo, img(m.logo)),
        imagenTarjeta: await oElegido(
          `marca ${m.slug}: foto de la tarjeta`,
          doc.imagenTarjeta,
          a.imagenTarjeta,
          img(m.tarjeta),
        ),
        ordenPortada: m.orden,
        descripcion: m.descripcion,
      },
    });
  }

const imagenPie = todo
  ? await oElegido(
      "pie: imagen decorativa",
      pie.imagenDecorativa,
      (manifiesto.antes!.pie as Record<string, unknown>).imagenDecorativa,
      null,
    )
  : null;

const antesSedes = manifiesto.antes!.sedesActualizadas as Record<string, Record<string, unknown>>;
const fotosSedes = new Map<string, Id | null>();
if (todo)
  for (const s of fuente.sedes) {
    const existente = sedes.find((x) => x.nombre === s.nombre);
    fotosSedes.set(
      s.nombre,
      existente
        ? await oElegido(
            `sede ${s.nombre}: foto`,
            existente.foto,
            antesSedes[String(existente.id)]?.foto,
            null,
          )
        : null,
    );
  }

const n = fuente.nosotros;
const bloquesActuales = nosotros?.bloques;
const bloquesAntes = manifiesto.antes!.nosotros?.datos.bloques;
const deNosotros = (
  tipo: string,
  campo: string,
  nuevo: Id | null,
  coleccion: "media" | "videos" | "animaciones" = "media",
) =>
  oElegido(
    `Nosotros, ${tipo}: ${campo}`,
    bloque(bloquesActuales, tipo)[campo],
    bloque(bloquesAntes, tipo)[campo],
    nuevo,
    coleccion,
  );
const tarjetasActuales = filas(bloque(bloquesActuales, "tarjetasExpandibles").tarjetas);
const tarjetasAntes = filas(bloque(bloquesAntes, "tarjetasExpandibles").tarjetas);
const parrafo = convertHTMLToLexical({ editorConfig, html: n.parrafoHtml, JSDOM: DomFeliz });
const bloquesNosotros =
  todo && nosotros
    ? [
        {
          blockType: "cabeceraVideo",
          antetitulo: n.cabecera.antetitulo,
          titulo: n.cabecera.titulo,
          video: await deNosotros("cabeceraVideo", "video", null, "videos"),
          imagen: await deNosotros("cabeceraVideo", "imagen", img("nosotros-cabecera")),
        },
        {
          blockType: "presentacionImagen",
          antetitulo: n.antetitulo,
          titulo: n.titulo,
          texto: parrafo,
          botonTexto: n.boton.texto,
          botonEnlace: n.boton.enlace,
          imagen: await deNosotros("presentacionImagen", "imagen", img("nosotros-mapa")),
          lottie: await deNosotros("presentacionImagen", "lottie", null, "animaciones"),
        },
        ...(n.cifras.length ? [{ blockType: "cifras", cifras: n.cifras }] : []),
        {
          blockType: "franjaMarquee",
          texto: n.franja,
          imagenFondo: await deNosotros("franjaMarquee", "imagenFondo", img("nosotros-franja")),
          imagenFrontal: await deNosotros("franjaMarquee", "imagenFrontal", null),
        },
        {
          blockType: "tarjetasExpandibles",
          titulo: n.tarjetasTitulo,
          tarjetas: await Promise.all(
            n.tarjetas.map(async (t, i) => ({
              titulo: t.titulo,
              texto: t.texto,
              imagen: await oElegido(
                `Nosotros, tarjeta ${i + 1}: imagen`,
                tarjetasActuales[i]?.imagen,
                tarjetasAntes[i]?.imagen,
                img(t.imagen),
              ),
              enlace: ENLACES_TARJETAS[t.clave],
            })),
          ),
        },
      ]
    : [];

const ogNosotros =
  todo && nosotros
    ? await oElegido(
        "Nosotros: imagen al compartir",
        grupo(nosotros, "seo").ogImage,
        (manifiesto.antes!.nosotros?.datos.seo as Record<string, unknown> | undefined)?.ogImage,
        idDe(
          (manifiesto.antes!.nosotros?.datos.seo as Record<string, unknown> | undefined)?.ogImage,
        ),
      )
    : null;

const informe = {
  destino,
  solo: SOLO ?? "todo",
  subidasBlob: subidas.length,
  yaEnElAlmacen: imagenesAUsar.length - subidas.length,
  conservadosDelPanel: conservados,
  categorias: p.categorias.map((c) => `${c.slug}: «${c.titulo}» → ${c.enlace}`),
  portada: datosPortada ? Object.keys(datosPortada) : "no se toca",
  marcas: todo ? p.marcas.map((m) => `${m.slug} (orden ${m.orden})`) : "no se tocan",
  sedes: todo
    ? {
        crear: fuente.sedes
          .filter((s) => !sedes.some((x) => x.nombre === s.nombre))
          .map((s) => s.nombre),
        actualizar: fuente.sedes
          .filter((s) => sedes.some((x) => x.nombre === s.nombre))
          .map((s) => s.nombre),
        quitar: sedes
          .filter((x) => !fuente.sedes.some((s) => s.nombre === x.nombre))
          .map((x) => String(x.nombre)),
      }
    : "no se tocan",
  nosotros: !todo
    ? "no se toca"
    : nosotros
      ? bloquesNosotros.map((b) => b.blockType)
      : "sin página «nosotros»",
  pie: todo ? "imagen decorativa" : "no se toca",
  avisosDeLaFuente: fuente.avisos,
};
if (modo === "simular") {
  log(JSON.stringify(informe, null, 2));
  log("simulación: no se ha escrito nada");
  process.exit(0);
}

for (const c of datosCategorias)
  await payload.update({
    collection: "categorias-tecnicas",
    id: c.id,
    data: c.data as never,
    overrideAccess: true,
  });
log(`categorías: ${datosCategorias.length}`);
for (const d of conservados) log(`elegido en el panel, no se toca: ${d}`);

if (todo) {
  await payload.update({
    collection: "paginas",
    id: portada.id,
    data: datosPortada as never,
    overrideAccess: true,
  });
  log("portada: secciones 3, 4, «Nuestra Compañía», preguntas y meta descripción");
  for (const m of datosMarcas)
    await payload.update({
      collection: "marcas-maquinaria",
      id: m.id,
      data: m.data as never,
      overrideAccess: true,
    });
  log(`marcas: ${datosMarcas.length}`);
  await payload.updateGlobal({
    slug: "pie",
    data: { imagenDecorativa: imagenPie },
    overrideAccess: true,
  });
  log(imagenPie === null ? "pie: sin imagen decorativa" : "pie: la imagen decorativa del panel");

  const nuevas = fuente.sedes.filter((s) => !sedes.some((x) => x.nombre === s.nombre)).length;
  for (const [i, s] of fuente.sedes.entries()) {
    const datos = {
      nombre: s.nombre,
      ciudad: s.ciudad,
      departamento: s.departamento,
      latitud: s.coordenadas[0],
      longitud: s.coordenadas[1],
      lineas: s.lineas,
      foto: fotosSedes.get(s.nombre) ?? null,
      orden: i + 1,
    };
    const existente = sedes.find((x) => x.nombre === s.nombre);
    if (existente) {
      await payload.update({
        collection: "sedes",
        id: existente.id,
        data: datos,
        overrideAccess: true,
      });
    } else {
      const doc = await payload.create({ collection: "sedes", data: datos, overrideAccess: true });
      manifiesto.creado.sedes.push(doc.id);
      guardar();
    }
  }
  const quitadas = sedes.filter((x) => !fuente.sedes.some((f) => f.nombre === x.nombre));
  for (const s of quitadas)
    await payload.delete({ collection: "sedes", id: s.id, overrideAccess: true });
  log(`sedes: ${fuente.sedes.length} (${nuevas} nuevas, ${quitadas.length} quitadas)`);

  if (nosotros) {
    await payload.update({
      collection: "paginas",
      id: nosotros.id,
      data: {
        bloques: bloquesNosotros,
        seo: {
          ...((manifiesto.antes!.nosotros?.datos.seo as object) ?? {}),
          ogImage: ogNosotros,
          metaDescription: n.metaDescripcion,
        },
      } as never,
      overrideAccess: true,
    });
    log(`nosotros: ${bloquesNosotros.length} bloques`);
  }
}
manifiesto.completo = new Date().toISOString();
guardar();
log(`✓ CONTENIDO REAL APLICADO · ${subidas.length} subidas al Blob · manifiesto: ${MANIFIESTO}`);
log("Los scripts no revalidan: redesplegar (o guardar la portada y Nosotros en el panel).");
