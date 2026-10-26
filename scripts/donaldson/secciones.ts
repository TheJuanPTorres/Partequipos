/**
 * FILTROS DONALDSON, SECCIONES PROPIAS (2026-10-26, dirección): rellena el grupo «Secciones
 * propias de la página de marca» de la categoría «Filtros Donaldson» con su página de
 * WordPress, TAL CUAL: la presentación («Protegiendo su maquinaria pesada en la…», el texto de
 * bienvenida y las CUATRO fotos del carrusel) y su «¿Por qué elegirnos?» (texto, foto de los
 * filtros y «Nuestro compromiso…»). Fuente: el JSON de `extraer-wp.mjs` (`secciones`), fuera
 * del repositorio.
 *
 *   npm run preview:donaldson:secciones:simular   # no escribe nada: el plan
 *   npm run preview:donaldson:secciones:aplicar
 *   npm run preview:donaldson:secciones:retirar   # deshace lo del manifiesto
 *
 * Para el sitio publicado, el runbook de dirección (mismo script, destino del sitio publicado,
 * con base Y almacén de ese entorno o no hace nada).
 *
 * Sube las fotos a «Imágenes» (`wp-donaldson-…`, las grandes reducidas a 2560 px) y SOLO
 * rellena el grupo si está vacío: no pisa lo que un editor haya escrito. Idempotente. La
 * retirada devuelve el grupo a como estaba y borra las fotos. No revalida: al terminar,
 * vaciar la caché (`POST /api/revalidar/`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { formatoDeImagen } from "../../src/lib/repuestos/wordpress";
import { formatSlug } from "../../src/lib/utils/formatSlug";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[donaldson-secciones] ✗ ${m}`);
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
  exigirAlmacen("[donaldson-secciones]");
}

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = path.join(CIERRE, "donaldson-wordpress.json");
const MANIFIESTO = path.join(CIERRE, `manifiesto-donaldson-secciones-${destino}.json`);
const AGENTE = "Mozilla/5.0 (Partequipos; importación de Filtros Donaldson)";
const SLUG = "filtros-donaldson-maquinaria-pesada";
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
const log = (m: string) => process.stdout.write(`[donaldson-secciones] ${m}\n`);

// ---------- Manifiesto ----------

type Grupo = Record<string, unknown> | null;
type Manifiesto = {
  destino: string;
  categoria: number | null;
  /** El grupo tal como estaba antes de rellenarlo, para devolverlo al retirar. */
  grupoAntes: Grupo;
  media: { id: number; filename: string; url: string }[];
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, categoria: null, grupoAntes: null, media: [] };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

const categoria = (
  await payload.find({
    collection: "categorias-tecnicas",
    where: { slug: { equals: SLUG } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
).docs[0];
if (!categoria) fallar(`no existe la categoría «${SLUG}» (antes, scripts/donaldson/importar.ts)`);

// ---------- Retirar ----------

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  if (manifiesto.categoria !== null) {
    await payload.update({
      collection: "categorias-tecnicas",
      id: manifiesto.categoria,
      data: { paginaMarca: (manifiesto.grupoAntes ?? {}) as never },
      overrideAccess: true,
    });
    log("grupo devuelto a como estaba");
  }
  const urls: string[] = [];
  for (const f of manifiesto.media) {
    await payload.delete({ collection: "media", id: f.id, overrideAccess: true }).catch(() => null);
    if (f.url) urls.push(f.url);
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
    secciones?: {
      antetitulo: string;
      titulo: string;
      texto: string;
      fotos: string[];
      porQue: {
        titulo: string;
        texto: string;
        foto: string;
        compromisoTitulo: string;
        compromisoTexto: string;
      };
    };
  };
  if (!fs.existsSync(FUENTE))
    fallar(`no está la fuente ${FUENTE} (node scripts/donaldson/extraer-wp.mjs)`);
  const s = (JSON.parse(fs.readFileSync(FUENTE, "utf8")) as Fuente).secciones;
  if (!s) fallar("la fuente no trae «secciones»: vuelve a ejecutar extraer-wp.mjs");
  if (s!.fotos.length !== 4) fallar(`el carrusel trae ${s!.fotos.length} fotos, no 4`);

  const actual = categoria!.paginaMarca;
  const lleno = Object.values(actual ?? {}).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== "",
  );
  if (lleno) {
    log("el grupo ya tiene contenido (de un editor o de una pasada anterior): no se toca");
  } else {
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
      let datos = Buffer.from(await r.arrayBuffer());
      const { default: sharp } = await import("sharp");
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
      manifiesto.media.push({
        id: doc.id,
        filename: guardado.filename ?? nombreFichero,
        url: guardado.url ?? "",
      });
      guardar();
      return doc.id;
    };

    // Los textos alternativos, de la página de WordPress (los suyos, tal cual).
    const ALT = [
      "Variedad en filtración Donaldson para tu equipo de la construcción",
      "Filtración especializada Donaldson para maquinaria pesada en Partequipos",
      "Filtración Donaldson disponible en Partequipos",
      "Filtros Donaldson para tu equipo",
    ];
    const fotos: number[] = [];
    for (const [i, u] of s!.fotos.entries()) {
      const id = await subir(u, `carrusel-${i + 1}`, ALT[i] ?? "Filtros Donaldson");
      if (id !== null) fotos.push(id);
    }
    const fotoPorQue = await subir(s!.porQue.foto, "por-que", "Filtros Donaldson");

    log(`grupo a rellenar: presentación con ${s!.fotos.length} fotos y «¿Por qué elegirnos?»`);
    if (modo === "aplicar") {
      manifiesto.categoria = categoria!.id;
      manifiesto.grupoAntes = (actual ?? null) as Grupo;
      guardar();
      await payload.update({
        collection: "categorias-tecnicas",
        id: categoria!.id,
        data: {
          paginaMarca: {
            bienvenidaAntetitulo: s!.antetitulo,
            bienvenidaTitulo: s!.titulo,
            bienvenidaTexto: s!.texto,
            bienvenidaFotos: fotos,
            porQueTitulo: s!.porQue.titulo,
            porQueTexto: s!.porQue.texto,
            porQueImagen: fotoPorQue,
            compromisoTitulo: s!.porQue.compromisoTitulo,
            compromisoTexto: s!.porQue.compromisoTexto,
          },
        },
        overrideAccess: true,
      });
      log("grupo rellenado");
    }
  }
  log(
    modo === "simular"
      ? "SIMULACIÓN: no se ha escrito nada."
      : "APLICADO. Vaciar la caché del sitio (POST /api/revalidar/).",
  );
}
