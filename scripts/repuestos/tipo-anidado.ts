/**
 * TIPO ANIDADO DE CASE (2026-10-17, dirección): la «Excavadora» de CASE, que
 * en WordPress cuelga de «Cargador frontal» y tiene 4 modelos con su página
 * (CX210B, CX220C, CX350B y CX350C), pasa de ser UN MODELO del cargador (con
 * 301 desde las 4) a ser un TIPO con sus 4 modelos en sus URL de WordPress.
 * Detalle en docs/repuestos-importacion.md §11 y src/lib/repuestos/anidado.ts.
 *
 *   npm run preview:repuestos:anidado:simular   # no escribe nada: el plan
 *   npm run preview:repuestos:anidado:aplicar
 *   npm run preview:repuestos:anidado:retirar   # deshace lo del manifiesto
 *
 * Para el sitio publicado, el runbook de dirección (mismo script, destino del
 * sitio publicado, con base Y almacén de ese entorno o no hace nada).
 *
 * Qué hace, en este orden (las 4 páginas «de nivel 4» de la extracción, y su
 * página madre):
 *   1. guarda en el manifiesto y BORRA el modelo madre («Excavadora CASE
 *      CONSTRUCTION», en el cargador): su URL pasa a ser la del tipo;
 *   2. crea el tipo «Excavadora», que cuelga del cargador, con el texto, el
 *      SEO y la foto de su tarjeta de WordPress (`wp-tipo-…`);
 *   3. crea sus 4 modelos con el texto y el SEO de WordPress (sin fotos, como
 *      el resto de modelos importados);
 *   4. guarda y BORRA las 4 redirecciones 301 hacia la madre.
 * Idempotente. La retirada lo deshace en orden inverso y vuelve a crear el
 * modelo madre y las 4 redirecciones como estaban. No revalida: redesplegar.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { normalizarRuta } from "../../src/lib/redirects/normalizar";
import {
  altDeTipo,
  codigoDeModelo,
  descripcionSeo,
  ficheroDeTipo,
  formatoDeImagen,
  nivelDePagina,
  nombreDeModelo,
  nombreDeTipo,
  rutaMadre,
  textoDePagina,
  tituloPorDefectoModelo,
  tituloSeo,
} from "../../src/lib/repuestos/wordpress";
import { tituloPorDefecto } from "../../src/lib/seo/porDefecto";
import { leerCsv } from "../../src/lib/utils/csv";
import { formatSlug } from "../../src/lib/utils/formatSlug";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[anidado] ✗ ${m}`);
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
  exigirAlmacen("[anidado]");
}

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = path.join(CIERRE, "repuestos-wordpress.json");
const MANIFIESTO = path.join(CIERRE, `manifiesto-tipo-anidado-${destino}.json`);
const AGENTE = "Mozilla/5.0 (Partequipos; importación de repuestos)";
const NOTAS_301 = "Importación de repuestos de WordPress (2026-10-13).";

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
const log = (m: string) => process.stdout.write(`[anidado] ${m}\n`);

// ---------- Manifiesto ----------

type Seo = { metaTitle: string | null; metaDescription: string | null };
type ModeloGuardado = {
  nombre: string;
  slug: string;
  codigo: string | null;
  descripcion: string | null;
  seo: Record<string, unknown> | null;
  imagenes: number[];
};
type Manifiesto = {
  destino: string;
  /** El modelo madre borrado, para volver a crearlo al retirar. */
  madreBorrada: (ModeloGuardado & { marca: number; tipo: number }) | null;
  /** Las 301 borradas, para volver a crearlas al retirar. */
  redirectsBorrados: {
    desde: string;
    hacia: string;
    tipo: string;
    origen: string;
    notas: string | null;
  }[];
  creado: {
    tipo: number | null;
    modelos: number[];
    media: { id: number; filename: string; url: string }[];
  };
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : {
      destino: destino!,
      madreBorrada: null,
      redirectsBorrados: [],
      creado: { tipo: null, modelos: [], media: [] },
    };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};
const idDe = (v: unknown): number | null =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? idDe(v.id) : null;

// ---------- Plan, desde la extracción de WordPress ----------

type FotoWp = { idWp: number; url?: string; alt?: string };
type PaginaWp = {
  ruta: string;
  titulo: string;
  segmentos: string[] | null;
  texto: string;
  tarjeta?: FotoWp | null;
};
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE} (ver extraer-xml.py)`);
const { paginas } = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as { paginas: PaginaWp[] };
const vivo = new Map(
  leerCsv(fs.readFileSync("docs/url-map.csv", "utf8")).map((f) => [
    (f.url ?? "").replace(/^https?:\/\/[^/]+/, ""),
    { titulo: f.title ?? "", descripcion: f.meta_description ?? "" },
  ]),
);

const hijas = paginas.filter((p) => nivelDePagina(p.segmentos) === "sinRuta");
const rutasMadre = [...new Set(hijas.map((p) => rutaMadre(p.ruta)))];
if (rutasMadre.length !== 1) fallar(`se esperaba UNA página madre y hay ${rutasMadre.length}`);
const madre = paginas.find((p) => p.ruta === rutasMadre[0]);
if (!madre?.segmentos) fallar(`no está en la fuente la página madre ${rutasMadre[0]}`);
const [marcaSlug = "", padreSlug = "", tipoSlug = ""] = madre!.segmentos!;
log(`madre: ${madre!.ruta} · ${hijas.length} modelos`);

// ---------- Retirar ----------

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  for (const id of manifiesto.creado.modelos) {
    await payload
      .delete({ collection: "modelos-repuesto", id, overrideAccess: true })
      .catch(() => null);
  }
  log(`modelos borrados: ${manifiesto.creado.modelos.length}`);
  if (manifiesto.creado.tipo !== null) {
    await payload
      .delete({ collection: "tipos-equipo", id: manifiesto.creado.tipo, overrideAccess: true })
      .catch(() => null);
    log("tipo anidado borrado");
  }
  if (manifiesto.madreBorrada) {
    const m = manifiesto.madreBorrada;
    await payload.create({
      collection: "modelos-repuesto",
      data: { ...m, seo: m.seo ?? undefined } as never,
      overrideAccess: true,
    });
    log(`modelo madre vuelto a crear: ${m.slug}`);
  }
  for (const r of manifiesto.redirectsBorrados) {
    await payload.create({ collection: "redirects", data: r as never, overrideAccess: true });
  }
  log(`redirecciones vueltas a crear: ${manifiesto.redirectsBorrados.length}`);
  const urls = manifiesto.creado.media.map((f) => f.url).filter(Boolean);
  for (const f of manifiesto.creado.media) {
    await payload.delete({ collection: "media", id: f.id, overrideAccess: true }).catch(() => null);
  }
  if (urls.length > 0) {
    log(`fotos borradas: ${urls.length}; espero 70 s (propagación del Blob)`);
    await new Promise((r) => setTimeout(r, 70_000));
    for (const u of urls) {
      if ((await fetch(u, { method: "HEAD" })).status !== 404) fallar(`sigue en el Blob: ${u}`);
    }
    log("las fotos responden 404 en el Blob");
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Redesplegar para que el sitio lo muestre.");
} else {
  await aplicar();
}

// ---------- Simular / aplicar ----------

async function aplicar(): Promise<void> {
  const uno = async <T>(collection: "marcas" | "tipos-equipo", where: object): Promise<T | null> =>
    ((
      await payload.find({
        collection,
        where: where as never,
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0] as T | undefined) ?? null;

  const marca = await uno<{ id: number; nombre: string }>("marcas", {
    slug: { equals: marcaSlug },
  });
  if (!marca) fallar(`no está la marca ${marcaSlug}`);
  const padre = await uno<{ id: number; slug: string }>("tipos-equipo", {
    and: [{ marca: { equals: marca!.id } }, { slug: { equals: padreSlug } }],
  });
  if (!padre) fallar(`no está el tipo padre ${padreSlug}`);

  // 1. El modelo madre (su URL pasa a ser la del tipo).
  const madreDoc = (
    await payload.find({
      collection: "modelos-repuesto",
      where: { and: [{ tipo: { equals: padre!.id } }, { slug: { equals: tipoSlug } }] },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
  if (madreDoc) {
    if (!manifiesto.madreBorrada) {
      manifiesto.madreBorrada = {
        nombre: madreDoc.nombre,
        slug: madreDoc.slug,
        codigo: madreDoc.codigo ?? null,
        descripcion: madreDoc.descripcion ?? null,
        seo: (madreDoc.seo as Record<string, unknown> | null) ?? null,
        imagenes: (madreDoc.imagenes ?? []).map(idDe).filter((x): x is number => x !== null),
        marca: marca!.id,
        tipo: padre!.id,
      };
      guardar();
    }
    log(`modelo madre «${madreDoc.nombre}»: se borra (id ${madreDoc.id})`);
    if (modo === "aplicar") {
      await payload.delete({
        collection: "modelos-repuesto",
        id: madreDoc.id,
        overrideAccess: true,
      });
    }
  } else {
    log("modelo madre: ya no está");
  }

  // 2. El tipo anidado.
  const nombreTipo =
    nombreDeTipo(madre!.titulo, marca!.nombre) ?? fallar("la madre no tiene nombre de tipo");
  const viva = vivo.get(madre!.ruta);
  const seoTipo: Seo = {
    metaTitle: tituloSeo(viva?.titulo, tituloPorDefecto.tipoRepuesto(nombreTipo, marca!.nombre)),
    metaDescription: descripcionSeo(viva?.descripcion),
  };
  let tipo = await uno<{ id: number }>("tipos-equipo", {
    and: [{ marca: { equals: marca!.id } }, { slug: { equals: tipoSlug } }],
  });
  if (tipo) {
    log(`tipo «${nombreTipo}»: ya existe (id ${tipo.id})`);
  } else {
    const imagen = madre!.tarjeta?.url
      ? await imagenDeTipo(madre!.tarjeta, nombreTipo, marca!.nombre)
      : null;
    log(`tipo «${nombreTipo}» bajo ${padreSlug}: se crea${imagen === null ? " (sin foto)" : ""}`);
    if (modo === "aplicar") {
      tipo = await payload.create({
        collection: "tipos-equipo",
        data: {
          nombre: nombreTipo,
          slug: tipoSlug,
          marca: marca!.id,
          tipoPadre: padre!.id,
          descripcion: textoDePagina(madre!.texto),
          seo: seoTipo,
          ...(imagen ? { imagen } : {}),
        },
        overrideAccess: true,
      });
      manifiesto.creado.tipo = tipo.id;
      guardar();
    }
  }

  // 3. Sus modelos.
  let creados = 0;
  for (const p of hijas) {
    const slug = formatSlug(p.segmentos![3] ?? "");
    const nombre = nombreDeModelo(p.titulo);
    const codigo = codigoDeModelo(nombre, marca!.nombre, slug).valor;
    const v = vivo.get(p.ruta);
    const ya = tipo
      ? (
          await payload.find({
            collection: "modelos-repuesto",
            where: { and: [{ tipo: { equals: tipo.id } }, { slug: { equals: slug } }] },
            depth: 0,
            limit: 1,
            overrideAccess: true,
          })
        ).docs[0]
      : undefined;
    log(
      `  modelo ${nombre} (${codigo ?? "sin código"}) → …/${tipoSlug}/${slug}/${ya ? " (ya existe)" : ""}`,
    );
    if (ya || modo !== "aplicar" || !tipo) continue;
    const creado = await payload.create({
      collection: "modelos-repuesto",
      data: {
        nombre,
        slug,
        marca: marca!.id,
        tipo: tipo.id,
        codigo,
        descripcion: textoDePagina(p.texto),
        seo: {
          metaTitle: tituloSeo(v?.titulo, tituloPorDefectoModelo(nombre)),
          metaDescription: descripcionSeo(v?.descripcion),
        },
      },
      overrideAccess: true,
    });
    manifiesto.creado.modelos.push(creado.id);
    guardar();
    creados++;
  }

  // 4. Las 301 de los 4 modelos hacia la madre.
  let borrados = 0;
  for (const p of hijas) {
    const desde = normalizarRuta(p.ruta);
    const r = (
      await payload.find({
        collection: "redirects",
        where: { desde: { equals: desde } },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0];
    if (!r) continue;
    if (!manifiesto.redirectsBorrados.some((x) => x.desde === desde)) {
      manifiesto.redirectsBorrados.push({
        desde,
        hacia: r.hacia,
        tipo: r.tipo ?? "301",
        origen: r.origen ?? "migracion",
        notas: r.notas ?? NOTAS_301,
      });
      guardar();
    }
    log(`  301 ${desde} → ${r.hacia}: se borra`);
    if (modo === "aplicar") {
      await payload.delete({ collection: "redirects", id: r.id, overrideAccess: true });
      borrados++;
    }
  }
  log(
    modo === "simular"
      ? "SIMULACIÓN: no se ha escrito nada."
      : `APLICADO: ${creados} modelos creados, ${borrados} redirecciones borradas. Redesplegar.`,
  );
}

/** La foto de la tarjeta del tipo en `Media` (`wp-tipo-…`), por su nombre: una segunda pasada no la sube. */
async function imagenDeTipo(t: FotoWp, nombre: string, marca: string): Promise<number | null> {
  const fichero = ficheroDeTipo(t.idWp, nombre, marca);
  const prefijo = fichero.slice(0, fichero.indexOf(`${t.idWp}-`) + `${t.idWp}-`.length);
  const ya = await payload.find({
    collection: "media",
    where: { filename: { contains: prefijo } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const existente = ya.docs.find((d) => d.filename?.toLowerCase().startsWith(prefijo));
  if (existente) return existente.id;
  const r = await fetch(t.url!, { headers: { "User-Agent": AGENTE } });
  if (!r.ok) fallar(`no se puede descargar ${t.url}: HTTP ${r.status}`);
  const { default: sharp } = await import("sharp");
  let datos = Buffer.from(await r.arrayBuffer());
  const meta = await sharp(datos).metadata();
  const f = formatoDeImagen(meta.format) ?? fallar(`${t.url}: formato que Media no admite`);
  if (f.convertir) datos = await sharp(datos).webp({ quality: 82 }).toBuffer();
  const nombreFichero = `${fichero}.${f.ext}`;
  log(
    `foto ${nombreFichero}: ${meta.format}, ${meta.width}×${meta.height}, ${Math.round(datos.length / 1024)} kB`,
  );
  if (modo !== "aplicar") return null;
  const doc = await payload.create({
    collection: "media",
    data: { alt: altDeTipo(nombre, marca), focalX: 50, focalY: 50 },
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
}
