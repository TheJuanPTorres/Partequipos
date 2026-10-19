/**
 * IMPORTADOR DE SERVICIO TÉCNICO Y LUBRICANTES ENI — el contenido real del
 * WordPress actual, sacado del XML con `extraer-xml.py`.
 *
 *   npx payload run scripts/servicio-lubricantes/importar.ts <modo> <destino> [contenido=<json>] [manifiesto=<json>] [solo=faltantes] [videos=<carpeta>]
 *
 *   modo:     simular  → no escribe nada; comprueba que cada fichero se puede descargar
 *             importar → escribe; repetirlo no duplica (cada fichero se busca por su nombre)
 *             retirar  → deshace EXACTAMENTE lo que hizo la importación (manifiesto)
 *   destino:  preview    → base y Blob del preview (`npm run preview:servicio-lubricantes:*`)
 *             produccion → base Y token del almacén de producción (solo dirección, con runbook)
 *             prueba     → una base desechable y el almacén del preview
 *
 * Argumentos POSICIONALES: `payload run` descarta las banderas con guiones.
 *
 * Qué escribe:
 * - `/servicio-tecnico/`: «Diseño: Servicio técnico» (aprobado el 2026-10-19)
 *   y sus BLOQUES para la plantilla de Andrés (cabecera con vídeo; #taller;
 *   #alistamiento con el corto de YouTube y su miniatura y el vídeo de las
 *   etapas; #posventa; #Siniestros como «Proceso paso a paso»; la galería con
 *   «Trabajamos con las principales aseguradoras» de titular, y el bloque de
 *   contacto «Contacto Partequipos»), su entradilla, y vacía su «Contenido» y sus «Secciones con
 *   ancla» de demostración.
 * - La marca `lubricantes-eni`: entradilla, logo e imagen de cabecera.
 * - Sus 4 categorías: entradilla, imagen de la tarjeta y los productos con su
 *   foto y su ficha técnica en PDF.
 *
 * FOTOS «DUDOSAS» (`dudosa: true` en el JSON): del 2026-10-14 al 2026-10-17
 * solo iban al preview. DECISIÓN DEL CLIENTE (2026-10-17): se migra todo el
 * contenido de su web, así que van a CUALQUIER destino; su contenido es su
 * responsabilidad (CLAUDE.md §10.38). La marca queda en el JSON como lista.
 *
 * `solo=faltantes` (2026-10-19, inventario frente a WordPress): sube SOLO lo
 * que la primera importación no traía y pinta la plantilla de Andrés —el
 * vídeo alojado de las etapas del alistamiento y la miniatura del corto de
 * YouTube— sin tocar los bloques. La textura y el vídeo de fondo de WordPress
 * ya no se suben (2026-10-19): la plantilla no los lleva. El vídeo pasa del
 * tope de 4 MB de `videos`, así que se sube RECOMPRIMIDO desde
 * `videos=<carpeta>` (por defecto, `partequipos-diseno/wordpress/
 * servicio-lubricantes/videos/`, con su LEEME). Van al mismo manifiesto, así
 * que la retirada también los quita.
 *
 * `solo=servicio` (2026-10-19): lo que falta y la página de servicio técnico
 * con su diseño, SIN tocar lubricantes (que pueden haber cambiado después).
 *
 * DESTINO validado contra la base y el almacén ANTES de cargar Payload, más la
 * guarda del almacén (§10.37), como el importador del blog. Educado con el
 * servidor de WordPress: una petición cada 700 ms como mucho.
 *
 * EL MANIFIESTO (por defecto en `Desktop/partequipos-cierre/`) apunta los
 * ficheros que CREA y el valor ANTERIOR de cada documento que toca. Se escribe
 * tras cada paso: si se corta, se repite y sigue.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import {
  esMismaImagen,
  formatoPorExtension,
  nombreDeFicheroWp,
} from "../../src/lib/blog/wordpress";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[servicio-lubricantes] ✗ ${m}`);
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
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[servicio-lubricantes]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-servicio-lubricantes-${destino}.json`);
const SOLO = valorDe("solo");
if (SOLO && SOLO !== "faltantes" && SOLO !== "servicio") {
  fallar(`solo=${SOLO} no existe (hay «solo=faltantes» y «solo=servicio»)`);
}
const CARPETA_VIDEOS =
  valorDe("videos") ??
  path.join(
    os.homedir(),
    "Desktop",
    "partequipos-diseno",
    "wordpress",
    "servicio-lubricantes",
    "videos",
  );
const CONTENIDO =
  valorDe("contenido") ??
  path.join(
    os.homedir(),
    "Desktop",
    "partequipos-diseno",
    "wordpress",
    "servicio-lubricantes",
    "contenido.json",
  );

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const AGENTE = "Partequipos-migracion/1.0 (importador de servicio técnico y lubricantes)";
const PAUSA_MS = 700;
const log = (m: string) => process.stdout.write(`[servicio-lubricantes] ${m}\n`);

// ---------- Manifiesto ----------

type Fichero = { id: number; filename: string; url: string };
type Coleccion = "paginas" | "marcas-lubricante" | "categorias-lubricante";
type Manifiesto = {
  destino: string;
  creado: { media: Fichero[]; videos: Fichero[]; documentos: Fichero[] };
  /** Valor anterior de cada documento tocado: `coleccion:id` → campos. */
  anteriores: Record<string, Record<string, unknown>>;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, creado: { media: [], videos: [], documentos: [] }, anteriores: {} };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
function guardarManifiesto() {
  if (modo !== "importar") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
}

// ---------- Retirada ----------

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  let devueltos = 0;
  for (const [clave, anterior] of Object.entries(manifiesto.anteriores)) {
    const [coleccion, id] = clave.split(":") as [Coleccion, string];
    await payload.update({
      collection: coleccion,
      id: Number(id),
      data: anterior as never,
      overrideAccess: true,
    });
    devueltos++;
  }
  log(`documentos devueltos a su valor anterior: ${devueltos}`);
  const urls: string[] = [];
  for (const coleccion of ["documentos", "videos", "media"] as const) {
    let borrados = 0;
    for (const f of manifiesto.creado[coleccion]) {
      const r = await payload
        .delete({ collection: coleccion, id: f.id, overrideAccess: true })
        .catch(() => null);
      if (r) borrados++;
      if (r && f.url) urls.push(f.url);
    }
    log(`${coleccion} creados y borrados: ${borrados} de ${manifiesto.creado[coleccion].length}`);
  }
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
  log(`✓ los ${urls.length} ficheros dan 404`);
}

if (modo === "retirar") {
  await retirar();
  process.exit(0);
}

// ---------- Contenido extraído ----------

type Foto = { url: string; alt: string; dudosa: boolean } | null;
type Producto = {
  nombre: string;
  grado: string | null;
  grupo: string | null;
  imagen: Foto;
  ficha: string | null;
};
type Contenido = {
  servicio: {
    cabecera: { video: string; imagen: Foto };
    taller: {
      antetitulo: string;
      titulo: string;
      parrafos: string[];
      destacado: string;
      imagen: Foto;
    };
    alistamiento: {
      titulo: string;
      parrafos: string[];
      youtube: string;
      miniatura: Foto;
      /** El vídeo alojado de las etapas y el de fondo de la sección (desde el 2026-10-19). */
      videoAlojado?: string | null;
      videoFondo?: string | null;
    };
    /** La textura de fondo de #taller y #Siniestros (desde el 2026-10-19). */
    fondo?: Foto;
    posventa: { titulo: string; parrafos: string[]; imagen: Foto };
    siniestros: {
      titulo: string;
      intro: string;
      apartados: { etiqueta: string; texto: string }[];
      aseguradoras: string;
      galeria: Foto[];
    };
  };
  lubricantes: {
    texto: string;
    logo: Foto;
    cabecera: Foto;
    categorias: {
      slug: string;
      entradilla: string | null;
      imagen: Foto;
      productos: Producto[];
    }[];
  };
  erratas: string[];
};
if (!fs.existsSync(CONTENIDO)) {
  fallar(`no está el contenido extraído (${CONTENIDO}): ejecuta antes extraer-xml.py`);
}
const datos = JSON.parse(fs.readFileSync(CONTENIDO, "utf8")) as Contenido;

// ---------- Red, con turno ----------

let ultima = 0;
async function turno() {
  const espera = ultima + PAUSA_MS - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultima = Date.now();
}

async function descargar(url: string): Promise<Buffer> {
  await turno();
  const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

async function existe(url: string): Promise<void> {
  await turno();
  const r = await fetch(url, { method: "HEAD", headers: { "User-Agent": AGENTE } });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
}

// ---------- Ficheros: idempotentes por su nombre determinista ----------

const cuenta = { subidos: 0, reutilizados: 0, simulados: 0 };
const yaVistos = new Map<string, number>();
/** Al simular, cada fichero se comprueba y se cuenta una sola vez aunque lo usen varios productos. */
const simulados = new Set<string>();

async function buscarFichero(
  coleccion: "media" | "videos" | "documentos",
  fichero: string,
): Promise<number | null> {
  const clave = `${coleccion}:${fichero}`;
  if (yaVistos.has(clave)) return yaVistos.get(clave)!;
  const raiz = fichero.slice(0, fichero.lastIndexOf("."));
  const r = await payload.find({
    collection: coleccion,
    where: { filename: { contains: raiz } },
    sort: "createdAt",
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const id = r.docs.find((d) => d.filename && esMismaImagen(d.filename, fichero))?.id ?? null;
  if (id) yaVistos.set(clave, id);
  return id;
}

async function guardado(coleccion: "media" | "videos" | "documentos", id: number, pedido: string) {
  const d = await payload.findByID({ collection: coleccion, id, depth: 0, overrideAccess: true });
  return { id, filename: d.filename ?? pedido, url: d.url ?? "" };
}

/** Una foto a `Media`. Devuelve su id, o null si no hay foto o se está simulando. */
async function imagen(foto: Foto, altSiVacio: string): Promise<number | null> {
  if (!foto) return null;
  const formato = formatoPorExtension(foto.url);
  if (!formato) fallar(`formato no admitido en Media: ${foto.url}`);
  const fichero = nombreDeFicheroWp(foto.url);
  const ya = await buscarFichero("media", fichero);
  if (ya) {
    cuenta.reutilizados++;
    return ya;
  }
  if (modo === "simular") {
    if (!simulados.has(foto.url)) {
      await existe(foto.url);
      simulados.add(foto.url);
      cuenta.simulados++;
    }
    return null;
  }
  const bytes = await descargar(foto.url);
  const doc = await payload.create({
    collection: "media",
    data: { alt: foto.alt.trim() || altSiVacio, focalX: 50, focalY: 50 },
    file: { data: bytes, mimetype: `image/${formato}`, name: fichero, size: bytes.length },
    overrideAccess: true,
  });
  yaVistos.set(`media:${fichero}`, doc.id);
  manifiesto.creado.media.push(await guardado("media", doc.id, fichero));
  guardarManifiesto();
  cuenta.subidos++;
  return doc.id;
}

async function pdf(url: string | null, titulo: string): Promise<number | null> {
  if (!url) return null;
  const fichero = nombreDeFicheroWp(url);
  const ya = await buscarFichero("documentos", fichero);
  if (ya) {
    cuenta.reutilizados++;
    return ya;
  }
  if (modo === "simular") {
    if (!simulados.has(url)) {
      await existe(url);
      simulados.add(url);
      cuenta.simulados++;
    }
    return null;
  }
  const bytes = await descargar(url);
  const doc = await payload.create({
    collection: "documentos",
    data: { titulo },
    file: { data: bytes, mimetype: "application/pdf", name: fichero, size: bytes.length },
    overrideAccess: true,
  });
  yaVistos.set(`documentos:${fichero}`, doc.id);
  manifiesto.creado.documentos.push(await guardado("documentos", doc.id, fichero));
  guardarManifiesto();
  cuenta.subidos++;
  return doc.id;
}

async function video(url: string, poster: number | null, descripcion: string) {
  const fichero = nombreDeFicheroWp(url);
  const ya = await buscarFichero("videos", fichero);
  if (ya) {
    cuenta.reutilizados++;
    return ya;
  }
  if (modo === "simular") {
    if (!simulados.has(url)) {
      await existe(url);
      simulados.add(url);
      cuenta.simulados++;
    }
    return null;
  }
  if (!poster) fallar("el vídeo de cabecera necesita su póster");
  const bytes = await descargar(url);
  const doc = await payload.create({
    collection: "videos",
    data: { descripcion, poster: poster!, decorativo: true },
    file: { data: bytes, mimetype: "video/mp4", name: fichero, size: bytes.length },
    overrideAccess: true,
  });
  yaVistos.set(`videos:${fichero}`, doc.id);
  manifiesto.creado.videos.push(await guardado("videos", doc.id, fichero));
  guardarManifiesto();
  cuenta.subidos++;
  return doc.id;
}

/** Tope de la colección «Vídeos» (`formatoDeVideoPermitido`): 4 MB. */
const TOPE_VIDEO = 4 * 1024 * 1024;

/**
 * Un vídeo de WordPress RECOMPRIMIDO (fichero local con el nombre determinista
 * de su URL) a «Vídeos». Idempotente por el nombre, como los demás.
 */
async function videoLocal(
  url: string,
  poster: number | null,
  descripcion: string,
  decorativo: boolean,
): Promise<number | null> {
  const fichero = nombreDeFicheroWp(url);
  const ya = await buscarFichero("videos", fichero);
  if (ya) {
    cuenta.reutilizados++;
    return ya;
  }
  const ruta = path.join(CARPETA_VIDEOS, fichero);
  if (!fs.existsSync(ruta)) fallar(`falta el vídeo recomprimido ${ruta} (ver su LEEME)`);
  const bytes = fs.readFileSync(ruta);
  if (bytes.length > TOPE_VIDEO) {
    fallar(`${fichero} pesa ${(bytes.length / 1048576).toFixed(1)} MB: pasa del tope de 4 MB`);
  }
  if (modo === "simular") {
    cuenta.simulados++;
    return null;
  }
  if (!poster) fallar(`el vídeo ${fichero} necesita su póster`);
  const doc = await payload.create({
    collection: "videos",
    data: { descripcion, poster: poster!, decorativo },
    file: { data: bytes, mimetype: "video/mp4", name: fichero, size: bytes.length },
    overrideAccess: true,
  });
  yaVistos.set(`videos:${fichero}`, doc.id);
  manifiesto.creado.videos.push(await guardado("videos", doc.id, fichero));
  guardarManifiesto();
  cuenta.subidos++;
  return doc.id;
}

/**
 * La MINIATURA de un vídeo de YouTube (la de 1280 × 720 que publica YouTube) a
 * «Imágenes», para pintarla como portada sin cargar YouTube hasta pulsar
 * (como los testimonios). Nombre determinista: `wp-youtube-<id>-miniatura.jpg`.
 */
async function miniaturaYoutube(enlace: string, alt: string): Promise<number | null> {
  const id = enlace.match(/(?:youtu\.be\/|v=|shorts\/)([A-Za-z0-9_-]{11})/)?.[1];
  if (!id) fallar(`no se reconoce el vídeo de YouTube de ${enlace}`);
  const url = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  const fichero = `wp-youtube-${id!.toLowerCase()}-miniatura.jpg`;
  const ya = await buscarFichero("media", fichero);
  if (ya) {
    cuenta.reutilizados++;
    return ya;
  }
  if (modo === "simular") {
    await existe(url);
    cuenta.simulados++;
    return null;
  }
  const bytes = await descargar(url);
  const doc = await payload.create({
    collection: "media",
    data: { alt, focalX: 50, focalY: 50 },
    file: { data: bytes, mimetype: "image/jpeg", name: fichero, size: bytes.length },
    overrideAccess: true,
  });
  yaVistos.set(`media:${fichero}`, doc.id);
  manifiesto.creado.media.push(await guardado("media", doc.id, fichero));
  guardarManifiesto();
  cuenta.subidos++;
  return doc.id;
}

// ---------- Texto enriquecido (Lexical) ----------

type Trozo = string | { negrita: string };
const nodoTexto = (t: Trozo) => ({
  type: "text",
  text: typeof t === "string" ? t : t.negrita,
  format: typeof t === "string" ? 0 : 1,
  style: "",
  mode: "normal",
  detail: 0,
  version: 1,
});
const base = { format: "", indent: 0, version: 1, direction: "ltr" };
const parrafo = (...trozos: Trozo[]) => ({
  type: "paragraph",
  ...base,
  textFormat: 0,
  textStyle: "",
  children: trozos.map(nodoTexto),
});
const lexical = (...hijos: object[]) => ({ root: { type: "root", ...base, children: hijos } });

// ---------- Apunta el valor anterior antes de tocar ----------

async function anotarAnterior(coleccion: Coleccion, id: number, campos: string[]) {
  const clave = `${coleccion}:${id}`;
  const ya = manifiesto.anteriores[clave];
  // La primera pasada manda; de un campo que entonces no se tocaba (p. ej.
  // `diseno`, 2026-10-19) se apunta el valor de ahora, que aún es el de antes.
  if (ya && campos.every((c) => c in ya)) return;
  const doc = (await payload.findByID({
    collection: coleccion,
    id,
    depth: 0,
    overrideAccess: true,
  })) as unknown as Record<string, unknown>;
  manifiesto.anteriores[clave] = {
    ...Object.fromEntries(campos.map((c) => [c, doc[c] ?? null])),
    ...ya,
  };
  guardarManifiesto();
}

async function actualizar(
  coleccion: Coleccion,
  id: number,
  data: Record<string, unknown>,
): Promise<void> {
  if (modo !== "importar") return;
  await anotarAnterior(coleccion, id, Object.keys(data));
  await payload.update({ collection: coleccion, id, data: data as never, overrideAccess: true });
}

// ---------- Servicio técnico ----------

const s = datos.servicio;
const pagina = (
  await payload.find({
    collection: "paginas",
    where: { slug: { equals: "servicio-tecnico" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
).docs[0];
if (!pagina) fallar("no existe la página «servicio-tecnico» en el destino");

/**
 * Sube lo que faltaba frente a WordPress y pinta la plantilla de Andrés
 * (2026-10-19): el vídeo de las etapas, con su póster, y la miniatura del
 * corto de YouTube. La textura y el vídeo de fondo de WordPress ya no se
 * suben: la plantilla no los lleva.
 */
async function subirFaltantes() {
  const a = s.alistamiento;
  if (!a.videoAlojado) {
    fallar(
      "el contenido extraído no trae el vídeo de las etapas: vuelve a ejecutar extraer-xml.py",
    );
  }
  const posterEtapas = await imagen(a.miniatura, "Alistamiento de maquinaria en el taller");
  const etapas = await videoLocal(
    a.videoAlojado!,
    posterEtapas,
    "Las etapas del alistamiento de maquinaria pesada en el taller de Partequipos",
    false,
  );
  const miniatura = await miniaturaYoutube(
    a.youtube,
    "Técnico de Partequipos explicando una fase del alistamiento de una máquina",
  );
  log(
    `faltantes: vídeo de etapas ${etapas ?? "(por subir)"} · miniatura de YouTube ${miniatura ?? "(por subir)"}`,
  );
  return { etapas, miniatura };
}

const faltantes = await subirFaltantes();
if (SOLO === "faltantes") {
  log(
    `ficheros: subidos ${cuenta.subidos} · reutilizados ${cuenta.reutilizados} · por subir ${cuenta.simulados}`,
  );
  if (modo === "importar") log(`manifiesto: ${MANIFIESTO}`);
  process.exit(0);
}

const imgCabecera = await imagen(s.cabecera.imagen, "Taller de servicio técnico de Partequipos");
const vidCabecera = await video(
  s.cabecera.video,
  imgCabecera,
  "Trabajos en el taller de servicio técnico de Partequipos",
);
const imgTaller = await imagen(s.taller.imagen, "Taller de Partequipos");
const imgAlistamiento = await imagen(
  s.alistamiento.miniatura,
  "Alistamiento de maquinaria en el taller",
);
const imgPosventa = await imagen(s.posventa.imagen, "Maquinaria en obra");
const galeria: number[] = [];
for (const f of s.siniestros.galeria) {
  const id = await imagen(f, "Maquinaria accidentada");
  if (id) galeria.push(id);
}

const BOTON_CONTACTO = { botonTexto: "Contáctanos", botonEnlace: "/contactanos/" };
const bloques = [
  {
    blockType: "cabeceraVideo",
    titulo: "Servicio técnico",
    video: vidCabecera,
    imagen: imgCabecera,
  },
  {
    blockType: "presentacionImagen",
    ancla: "taller",
    antetitulo: s.taller.antetitulo,
    titulo: s.taller.titulo,
    imagen: imgTaller,
    texto: lexical(
      ...s.taller.parrafos.map((p) => parrafo(p)),
      parrafo({ negrita: s.taller.destacado }),
    ),
    ...BOTON_CONTACTO,
  },
  {
    blockType: "videoYoutube",
    ancla: "alistamiento",
    titulo: s.alistamiento.titulo,
    texto: lexical(...s.alistamiento.parrafos.map((p) => parrafo(p))),
    youtube: s.alistamiento.youtube,
    // La portada del corto es SU miniatura de YouTube; el póster de WordPress
    // (`imgAlistamiento`) es el del vídeo del taller, que ya lo lleva.
    miniatura: faltantes.miniatura ?? imgAlistamiento,
    videoTaller: faltantes.etapas,
  },
  {
    blockType: "presentacionImagen",
    ancla: "posventa",
    titulo: s.posventa.titulo,
    imagen: imgPosventa,
    texto: lexical(...s.posventa.parrafos.map((p) => parrafo(p))),
    ...BOTON_CONTACTO,
  },
  {
    // El proceso de siniestros, paso a paso (diseño «Servicio técnico», 2026-10-19).
    blockType: "procesoPasos",
    ancla: "Siniestros",
    titulo: s.siniestros.titulo,
    entradilla: s.siniestros.intro,
    // Las etiquetas, tal cual (en mayúsculas en WordPress; decisión del cliente, 2026-10-18).
    pasos: s.siniestros.apartados.map((a) => ({ etiqueta: a.etiqueta, texto: a.texto })),
    ...BOTON_CONTACTO,
  },
  ...(galeria.length
    ? [
        {
          blockType: "galeria",
          // «Trabajamos con las principales aseguradoras» presenta la galería.
          titulo: `${s.siniestros.aseguradoras}.`,
          imagenes: galeria.map((id) => ({ imagen: id })),
        },
      ]
    : []),
  {
    blockType: "formularioContacto",
    ancla: "contacto",
    // El bloque de contacto de las plantillas de Andrés de repuestos (dirección, 2026-10-19).
    titulo: "Contacto Partequipos",
    texto: "Si deseas más información, contáctanos",
    botonTexto: "Enviar",
  },
];
await actualizar("paginas", pagina!.id, {
  entradilla: s.taller.parrafos[0],
  contenido: null,
  secciones: [],
  diseno: "servicioTecnico",
  bloques,
});
log(`servicio técnico: ${bloques.length} bloques (galería: ${galeria.length} fotos)`);

// `solo=servicio` (2026-10-19): solo la página de servicio técnico, sin tocar lubricantes.
if (SOLO === "servicio") {
  log(
    `ficheros: subidos ${cuenta.subidos} · reutilizados ${cuenta.reutilizados} · por subir ${cuenta.simulados}`,
  );
  if (modo === "importar") log(`manifiesto: ${MANIFIESTO}`);
  process.exit(0);
}

// ---------- Lubricantes ----------

const l = datos.lubricantes;
const marca = (
  await payload.find({
    collection: "marcas-lubricante",
    where: { slug: { equals: "lubricantes-eni" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
).docs[0];
if (!marca) fallar("no existe la marca «lubricantes-eni» en el destino");

await actualizar("marcas-lubricante", marca!.id, {
  entradilla: l.texto,
  descripcion: null,
  logo: await imagen(l.logo, "Logo de Eni"),
  imagenCabecera: await imagen(l.cabecera, "Lubricantes Eni"),
});

let productos = 0;
let fichas = 0;
for (const c of l.categorias) {
  const cat = (
    await payload.find({
      collection: "categorias-lubricante",
      where: { and: [{ slug: { equals: c.slug } }, { marca: { equals: marca!.id } }] },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
  if (!cat) fallar(`no existe la categoría «${c.slug}» de la marca en el destino`);
  const lista = [];
  for (const p of c.productos) {
    const nombreCompleto = [p.nombre, p.grado].filter(Boolean).join(" ");
    const ficha = await pdf(p.ficha, `Ficha técnica Eni ${nombreCompleto}`);
    if (ficha || (modo === "simular" && p.ficha)) fichas++;
    lista.push({
      nombre: p.nombre,
      grado: p.grado,
      grupo: p.grupo,
      imagen: await imagen(p.imagen, `Envase de lubricante Eni ${nombreCompleto}`),
      ficha,
    });
  }
  productos += lista.length;
  await actualizar("categorias-lubricante", cat!.id, {
    // Sin texto propio en el sitio actual (repetía el de la marca), sin entradilla.
    entradilla: c.entradilla,
    imagen: await imagen(c.imagen, `Lubricantes Eni para ${cat!.nombre.toLowerCase()}`),
    productos: lista,
  });
  log(`${c.slug}: ${lista.length} productos`);
}

log(`modo: ${modo} · destino: ${destino} · productos: ${productos} · fichas: ${fichas}`);
log(
  `ficheros: subidos ${cuenta.subidos} · reutilizados ${cuenta.reutilizados} · por subir ${cuenta.simulados}`,
);
log(`erratas del sitio actual (para el cliente): ${datos.erratas.length}`);
for (const e of datos.erratas) log(`  · ${e}`);
if (modo === "importar") {
  log(
    `manifiesto: ${MANIFIESTO} (creados: ${manifiesto.creado.media.length} imágenes, ${manifiesto.creado.videos.length} vídeos, ${manifiesto.creado.documentos.length} PDF; anteriores: ${Object.keys(manifiesto.anteriores).length})`,
  );
}
