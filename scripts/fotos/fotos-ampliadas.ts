/**
 * FOTOS QUE SE AMPLÍAN DE MÁS (dirección, 2026-11-16): cambia cada foto pequeña por su original
 * grande, ya optimizado en WebP fuera del repositorio. Por cada fila de la LISTA:
 *
 * 1. Busca en «Imágenes» la foto actual por su nombre de fichero exacto (el de su URL).
 * 2. Busca TODOS los sitios que la usan, en todas las colecciones y globales, guiándose por sus
 *    campos (`src/lib/media/referencias.ts`): campo suelto, galería, fila de array, bloque, grupo,
 *    pestaña o texto enriquecido.
 * 3. Sube la foto nueva como un registro APARTE de «Imágenes» con el MISMO texto alternativo y el
 *    mismo punto focal. La anterior NO se borra ni se sustituye: el adaptador del Blob borra el
 *    fichero viejo al sustituirlo, y entonces no habría vuelta atrás.
 * 4. Elige la nueva en cada uno de esos sitios.
 *
 *   npm run preview:fotos-ampliadas:simular -- tanda=cabeceras   # no escribe nada
 *   npm run preview:fotos-ampliadas:aplicar -- tanda=cabeceras
 *   npm run preview:fotos-ampliadas:retirar -- tanda=cabeceras   # (tanda=todas para todo)
 *
 * Tandas: `cabeceras` (las 12 de la lista A), `resto` (lista B) o `todas`.
 * Ficheros y lista, fuera del repositorio: `Desktop\partequipos-cierre\fotos-ampliadas-2026-11-16\`
 * (`lista.json` y los WebP; `carpeta=` y `lista=` para otros).
 *
 * Solo en el preview y en `prueba`, una foto que no está con su nombre exacto se busca por su raíz
 * (el nombre sin el sufijo aleatorio del Blob): allí las subidas son otras. Con el sitio publicado,
 * solo el nombre exacto.
 *
 * Como los demás importadores: MANIFIESTO fuera del repositorio
 * (`manifiesto-fotos-ampliadas-<destino>.json`) con, por foto, la anterior, la nueva y cada campo
 * cambiado; RETIRADA EXACTA, que solo devuelve la anterior en los campos que siguen con la nueva
 * (lo cambiado después en el panel se respeta) y borra la nueva si ya nada la usa. Volver a aplicar
 * no duplica. La simulación, sin token del Blob y con las escrituras bloqueadas. No revalida el
 * sitio publicado: al terminar, `POST /api/revalidar/` (runbook).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import {
  conSustitucion,
  idDe,
  rutaLegible,
  rutasDeImagen,
  valorEn,
  type CampoRef,
  type Ruta,
} from "../../src/lib/media/referencias";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[fotos-ampliadas] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
const TANDA = valorDe("tanda");
if (TANDA !== "cabeceras" && TANDA !== "resto" && TANDA !== "todas") {
  fallar("indica la tanda: tanda=cabeceras, tanda=resto o tanda=todas");
}
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[fotos-ampliadas]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const CARPETA = valorDe("carpeta") ?? path.join(CIERRE, "fotos-ampliadas-2026-11-16");
const LISTA = valorDe("lista") ?? path.join(CARPETA, "lista.json");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-fotos-ampliadas-${destino}.json`);
const REVALIDAR = valorDe("revalidar");
if (REVALIDAR && (destino !== "preview" || !origenDePreview(REVALIDAR))) {
  fallar("`revalidar=` solo con el destino preview y la URL de un preview");
}
/** Buscar por la raíz del nombre (sin el sufijo aleatorio): nunca con el sitio publicado. */
const POR_RAIZ = destino !== "produccion";

// ---------- La lista ----------

type Fila = {
  clave: string;
  tanda: "cabeceras" | "resto";
  /** El nombre de fichero de la foto actual, tal como sale en su URL. */
  actual: string;
  /** El WebP nuevo, en `CARPETA`. */
  nuevo: string;
  pagina: string;
};
if (!fs.existsSync(LISTA)) fallar(`no existe la lista ${LISTA}`);
const lista = (JSON.parse(fs.readFileSync(LISTA, "utf8")) as Fila[]).filter(
  (f) => TANDA === "todas" || f.tanda === TANDA,
);

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
const log = (m: string) => process.stdout.write(`[fotos-ampliadas] ${m}\n`);

// ---------- Manifiesto ----------

type Sitio = { tipo: "coleccion" | "global"; slug: string; id: number | null; rutas: Ruta[] };
type Hecha = {
  clave: string;
  tanda: Fila["tanda"];
  anterior: { id: number; filename: string };
  nueva: { id: number; filename: string; url: string };
  sitios: Sitio[];
};
type Manifiesto = { destino: string; inicio: string; hechas: Hecha[] };
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, inicio: new Date().toISOString(), hechas: [] };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
const guardar = () => {
  if (modo === "simular") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

async function revalidar() {
  if (!REVALIDAR) return;
  const token = process.env.REVALIDACION_TOKEN ?? "";
  if (!token) {
    log("sin REVALIDACION_TOKEN del preview: no se revalida (redesplegar el preview)");
    return;
  }
  const r = await fetchAlPreview(
    `${REVALIDAR.replace(/\/$/, "")}/api/revalidar/`,
    REVALIDAR,
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
    { method: "POST", headers: { [CABECERA_REVALIDACION]: token } },
  );
  log(`POST /api/revalidar/: HTTP ${r.status}`);
  if (r.status !== 200) fallar("la revalidación del preview no respondió 200");
}

// ---------- Dónde puede haber imágenes ----------

const usaMedia = (campos: CampoRef[]): boolean =>
  campos.some(
    (c) =>
      ((c.type === "upload" || c.type === "relationship") &&
        (Array.isArray(c.relationTo)
          ? c.relationTo.includes("media")
          : c.relationTo === "media")) ||
      c.type === "richText" ||
      usaMedia(c.fields ?? []) ||
      (c.blocks ?? []).some((b) => usaMedia(b.fields)) ||
      (c.tabs ?? []).some((t) => usaMedia(t.fields)),
  );
const colecciones = payload.config.collections
  .map((c) => ({ slug: c.slug, campos: c.fields as unknown as CampoRef[] }))
  .filter((c) => c.slug !== "media" && !c.slug.startsWith("payload-") && usaMedia(c.campos));
const globales = payload.config.globals
  .map((g) => ({ slug: g.slug, campos: g.fields as unknown as CampoRef[] }))
  .filter((g) => usaMedia(g.campos));

type Doc = Record<string, unknown> & { id?: number };
/** Todos los registros de las colecciones con imágenes, una vez (solo para saber cuáles mirar). */
const todos = new Map<string, Doc[]>();
for (const c of colecciones) {
  const r = await payload.find({
    collection: c.slug as never,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  todos.set(c.slug, r.docs as unknown as Doc[]);
}

/** Dónde se usa una imagen ahora mismo (leyendo cada registro de nuevo). */
async function sitiosDe(id: number): Promise<{ sitio: Sitio; datos: Doc }[]> {
  const out: { sitio: Sitio; datos: Doc }[] = [];
  for (const c of colecciones) {
    for (const d of todos.get(c.slug) ?? []) {
      if (rutasDeImagen(c.campos, d, id).length === 0) continue;
      const fresco = (await payload.findByID({
        collection: c.slug as never,
        id: d.id as number,
        depth: 0,
        overrideAccess: true,
      })) as unknown as Doc;
      const rutas = rutasDeImagen(c.campos, fresco, id);
      if (rutas.length)
        out.push({
          sitio: { tipo: "coleccion", slug: c.slug, id: d.id as number, rutas },
          datos: fresco,
        });
    }
  }
  for (const g of globales) {
    const datos = (await payload.findGlobal({
      slug: g.slug as never,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Doc;
    const rutas = rutasDeImagen(g.campos, datos, id);
    if (rutas.length) out.push({ sitio: { tipo: "global", slug: g.slug, id: null, rutas }, datos });
  }
  return out;
}

const nombreDe = (d: Doc) =>
  String(d.nombre ?? d.titulo ?? d.title ?? d.slug ?? d.id ?? "").slice(0, 60);

async function escribir(sitio: Sitio, datos: Doc, rutas: Ruta[], valor: number) {
  const data = conSustitucion(datos, rutas, valor);
  if (sitio.tipo === "global") {
    await payload.updateGlobal({
      slug: sitio.slug as never,
      data: data as never,
      depth: 0,
      overrideAccess: true,
    });
  } else {
    await payload.update({
      collection: sitio.slug as never,
      id: sitio.id!,
      data: data as never,
      depth: 0,
      overrideAccess: true,
    });
  }
}

type Media = {
  id: number;
  filename?: string | null;
  url?: string | null;
  alt?: string | null;
  focalX?: number | null;
  focalY?: number | null;
  width?: number | null;
};

async function fotoActual(f: Fila): Promise<Media | null> {
  const exacta = (
    await payload.find({
      collection: "media",
      where: { filename: { equals: f.actual } },
      depth: 0,
      limit: 2,
      overrideAccess: true,
    })
  ).docs as unknown as Media[];
  if (exacta.length === 1) return exacta[0] ?? null;
  if (exacta.length > 1) fallar(`hay ${exacta.length} imágenes con el nombre ${f.actual}`);
  if (!POR_RAIZ) return null;
  const raiz = f.actual.replace(/\.\w+$/, "").replace(/-[A-Za-z0-9]{30}$/, "");
  const parecidas = (
    (
      await payload.find({
        collection: "media",
        where: { filename: { like: raiz } },
        depth: 0,
        pagination: false,
        overrideAccess: true,
      })
    ).docs as unknown as Media[]
  ).filter((m) =>
    new RegExp(`^${raiz.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-[A-Za-z0-9]{30}\\.\\w+$`).test(
      m.filename ?? "",
    ),
  );
  return parecidas.length === 1 ? (parecidas[0] ?? null) : null;
}

// ---------- Retirar ----------

let fallos = 0;
if (modo === "retirar") {
  const quedan: Hecha[] = [];
  for (const h of manifiesto.hechas) {
    if (TANDA !== "todas" && h.tanda !== TANDA) {
      quedan.push(h);
      continue;
    }
    for (const s of h.sitios) {
      const datos = (s.tipo === "global"
        ? await payload.findGlobal({ slug: s.slug as never, depth: 0, overrideAccess: true })
        : await payload
            .findByID({ collection: s.slug as never, id: s.id!, depth: 0, overrideAccess: true })
            .catch(() => null)) as unknown as Doc | null;
      if (!datos) {
        log(`${h.clave}: ${s.slug} ${s.id} ya no existe`);
        continue;
      }
      const vigentes = s.rutas.filter((r) => idDe(valorEn(datos, r)) === h.nueva.id);
      const cambiadas = s.rutas.length - vigentes.length;
      if (vigentes.length) await escribir(s, datos, vigentes, h.anterior.id);
      log(
        `${h.clave}: ${s.slug} «${nombreDe(datos)}» → la anterior en ${vigentes.map(rutaLegible).join(", ") || "—"}` +
          (cambiadas ? ` (${cambiadas} cambiada(s) después en el panel: se respeta)` : ""),
      );
    }
    const usos = await sitiosDe(h.nueva.id);
    if (usos.length === 0) {
      await payload.delete({ collection: "media", id: h.nueva.id, overrideAccess: true });
      log(`${h.clave}: foto nueva ${h.nueva.filename} (${h.nueva.id}) borrada`);
    } else {
      log(`${h.clave}: la foto nueva sigue usada en ${usos.length} sitio(s): NO se borra`);
    }
  }
  manifiesto.hechas = quedan;
  guardar();
  await revalidar();
  log(`RETIRADA COMPLETA (tanda ${TANDA})`);
} else {
  // ---------- Simular / aplicar ----------
  let hechas = 0;
  for (const f of lista) {
    if (manifiesto.hechas.some((h) => h.clave === f.clave)) {
      log(`${f.clave}: ya aplicada (manifiesto), se salta`);
      continue;
    }
    const ruta = path.join(CARPETA, f.nuevo);
    if (!fs.existsSync(ruta)) {
      log(`✗ ${f.clave}: no existe el fichero nuevo ${ruta}`);
      fallos++;
      continue;
    }
    const anterior = await fotoActual(f);
    if (!anterior) {
      log(`✗ ${f.clave}: no está en «Imágenes» la foto ${f.actual}`);
      fallos++;
      continue;
    }
    const usos = await sitiosDe(anterior.id);
    if (usos.length === 0) {
      log(
        `✗ ${f.clave}: la foto ${anterior.filename} (${anterior.id}) no la usa nada: no se cambia`,
      );
      fallos++;
      continue;
    }
    const datos = fs.readFileSync(ruta);
    const meta = await sharp(datos).metadata();
    if (meta.format !== "webp") fallar(`${ruta} no es WebP (${meta.format})`);
    // Solo si gana: una foto actual igual o más ancha que la nueva se deja como está.
    if ((meta.width ?? 0) <= (anterior.width ?? 0)) {
      log(
        `= ${f.clave}: la actual (${anterior.width} px) ya es igual o más ancha que la nueva (${meta.width} px): se salta`,
      );
      continue;
    }
    log(
      `${f.clave}: ${anterior.filename} (${anterior.id}, ${anterior.width ?? "?"} px) → ${f.nuevo} ${meta.width}×${meta.height}, ${Math.round(datos.length / 1024)} KB; alt «${anterior.alt ?? ""}»`,
    );
    for (const u of usos) {
      log(
        `   ${u.sitio.slug} «${nombreDe(u.datos)}»: ${u.sitio.rutas.map(rutaLegible).join(", ")}`,
      );
    }
    if (modo === "simular") continue;
    const nueva = (await payload.create({
      collection: "media",
      data: {
        alt: anterior.alt ?? "",
        ...(anterior.focalX != null ? { focalX: anterior.focalX, focalY: anterior.focalY } : {}),
      } as never,
      file: { data: datos, mimetype: "image/webp", name: f.nuevo, size: datos.length },
      overrideAccess: true,
    })) as unknown as Media;
    const hecha: Hecha = {
      clave: f.clave,
      tanda: f.tanda,
      anterior: { id: anterior.id, filename: anterior.filename ?? "" },
      nueva: { id: nueva.id, filename: nueva.filename ?? "", url: nueva.url ?? "" },
      sitios: [],
    };
    manifiesto.hechas.push(hecha);
    guardar();
    for (const u of usos) {
      await escribir(u.sitio, u.datos, u.sitio.rutas, nueva.id);
      hecha.sitios.push(u.sitio);
      guardar();
    }
    hechas++;
  }
  if (modo === "aplicar") await revalidar();
  log(
    modo === "simular"
      ? `SIMULACIÓN (tanda ${TANDA}): ${lista.length} filas, ${fallos} con ✗; no se escribió nada`
      : `APLICADO (tanda ${TANDA}): ${hechas} fotos cambiadas, ${fallos} con ✗`,
  );
}
