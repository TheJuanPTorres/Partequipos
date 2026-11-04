/**
 * RECORTE DE LAS FOTOS DE «VENTA DE REPUESTOS» DE LA PORTADA (dirección, 2026-11-04, PR #418):
 * las tarjetas de la portada usan la «Foto en la portada» (`imagenPortada`) de cada categoría
 * técnica, y las piezas del kit que la llenaban medían 130–198 px (se veían pixeladas). Este script
 * toma la foto PROPIA de la categoría («Imagen de la tarjeta», `imagen`, que no cambia: el índice
 * de categorías sigue igual), le recorta el blanco con la MISMA biblioteca que el recorte de los
 * grupos (`src/lib/repuestos/recorteFotos`: caja de la pieza, margen del 4 %, cuadrado WebP), la
 * sube como fichero NUEVO de «Imágenes» con el mismo texto alternativo y la pone en «Foto en la
 * portada». Hermano de `recortar-fotos-grupos.ts`.
 *
 *   npm run preview:portada-recorte:simular   # no escribe nada: qué fotos recorta y cuánto ganan
 *   npm run preview:portada-recorte:aplicar   # sube los recortes y rellena «Foto en la portada»
 *   npm run preview:portada-recorte:retirar   # deja «Foto en la portada» como estaba y borra los recortes
 *
 * Opciones: `salida=<carpeta>` guarda cada original y su recorte para revisarlos a mano;
 * `revalidar=<origen del preview>` vacía la caché de ese preview al terminar.
 *
 * Qué toca, y nada más: la «Foto en la portada» de las categorías técnicas que salen en la portada
 * (`ordenPortada`), y los ficheros nuevos `…-portada-recorte.webp`. Ni la «Imagen de la tarjeta»
 * ni los originales se tocan. La pieza nunca se corta (`recorteCuadrado`): si una foto ya está
 * llena (la pieza toca un borde), no se sube nada y la «Foto en la portada» pasa a ser la propia
 * foto sin recortar.
 *
 * MANIFIESTO fuera del repositorio (`manifiesto-portada-recorte-<destino>.json`) con la «Foto en
 * la portada» de ANTES de cada categoría, y RETIRADA EXACTA: solo devuelve el valor de antes en las
 * categorías que siguen con lo puesto por el script (lo cambiado después en el panel se respeta).
 * Volver a aplicar no duplica. Doble cierre en la simulación: sin token del Blob y con
 * `create`/`update`/`delete` que lanzan. No revalida el sitio publicado: `POST /api/revalidar/`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { almacenDeToken } from "../../src/lib/blob/almacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import {
  cajaDeLaPieza,
  recorteCuadrado,
  SUFIJO_RECORTE,
} from "../../src/lib/repuestos/recorteFotos";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[portada-recorte] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
// El almacén del destino (su id va en cada URL pública): las fotos solo se leen de él.
const ALMACEN = almacenDeToken(process.env.BLOB_READ_WRITE_TOKEN);
if (!ALMACEN) fallar("sin BLOB_READ_WRITE_TOKEN legible");
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[portada-recorte]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-portada-recorte-${destino}.json`);
const SALIDA = valorDe("salida");
const REVALIDAR = valorDe("revalidar");
if (REVALIDAR && (destino !== "preview" || !origenDePreview(REVALIDAR))) {
  fallar("`revalidar=` solo con el destino preview y la URL de un preview");
}

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
const log = (m: string) => process.stdout.write(`[portada-recorte] ${m}\n`);

type Id = number;
const idDe = (x: unknown): Id | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;

/** Nombre del recorte: distinto del de los grupos (`…-recorte.webp`), para no confundirlos. */
const SUFIJO_PORTADA = `-portada${SUFIJO_RECORTE}`;
const ficheroDePortada = (original: string) =>
  `${original.replace(/\.[a-z0-9]+$/i, "")}${SUFIJO_PORTADA}.webp`;

// ---------- Manifiesto ----------

type Manifiesto = {
  destino: string;
  inicio: string;
  /** Los recortes subidos: id, URL, fichero y el original del que salen. */
  creado: { id: Id; url: string; fichero: string; de: Id }[];
  /** Por categoría cambiada: la «Foto en la portada» de ANTES (null = vacía) y la puesta. */
  filas: { categoria: Id; slug: string; antes: Id | null; ahora: Id }[];
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, inicio: new Date().toISOString(), creado: [], filas: [] };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
const guardar = () => {
  if (modo === "simular") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

type Categoria = {
  id: Id;
  slug: string;
  ordenPortada?: number | null;
  imagen?: unknown;
  imagenPortada?: unknown;
};

// Las categorías que salen en la portada (las que pinta `categoriasDePortada`).
const categorias = (
  (
    await payload.find({
      collection: "categorias-tecnicas",
      where: { ordenPortada: { exists: true } },
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
    })
  ).docs as unknown as Categoria[]
).filter((c) => typeof c.ordenPortada === "number");

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

const ponerPortada = (cat: Categoria, id: Id | null) =>
  payload.update({
    collection: "categorias-tecnicas",
    id: cat.id,
    data: { imagenPortada: id } as never,
    overrideAccess: true,
  });

// ================================================================== RETIRAR
if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  let devueltas = 0;
  let respetadas = 0;
  for (const m of manifiesto.filas) {
    const cat = categorias.find((c) => c.id === m.categoria);
    if (!cat || idDe(cat.imagenPortada) !== m.ahora) {
      respetadas++;
      log(`${m.slug}: cambiada después en el panel, se respeta`);
      continue;
    }
    await ponerPortada(cat, m.antes);
    devueltas++;
    log(`${m.slug}: «Foto en la portada» de vuelta a ${m.antes ?? "vacía"}`);
  }
  log(`categorías devueltas: ${devueltas} (cambiadas después en el panel: ${respetadas})`);
  const urls: string[] = [];
  for (const m of manifiesto.creado) {
    const r = await payload
      .delete({ collection: "media", id: m.id, overrideAccess: true })
      .catch(() => null);
    if (r && m.url) urls.push(m.url);
  }
  log(`recortes borrados: ${urls.length} de ${manifiesto.creado.length} (los originales siguen)`);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  await revalidar();
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
  log(
    `✓ RETIRADA COMPLETA: «Foto en la portada» como estaba y los ${urls.length} recortes dan 404`,
  );
  process.exit(0);
}

// ================================================================== SIMULAR / APLICAR

const idsFotos = [...new Set(categorias.map((c) => idDe(c.imagen)))].filter(
  (x): x is Id => x !== null && x > 0,
);
const medios = (
  await payload.find({
    collection: "media",
    where: { id: { in: idsFotos } },
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })
).docs as unknown as {
  id: Id;
  filename?: string | null;
  url?: string | null;
  alt?: string | null;
}[];

// Recortes de portada ya subidos (por el manifiesto o, si se perdió, por su nombre).
const recortesPrevios = (
  await payload.find({
    collection: "media",
    where: { filename: { like: SUFIJO_RECORTE } },
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })
).docs.filter((d) => (d.filename ?? "").includes(SUFIJO_PORTADA));

if (SALIDA) fs.mkdirSync(SALIDA, { recursive: true });

type Informe = {
  categoria: string;
  fichero: string;
  decision: string;
  ocupacionAntes: number;
  ocupacionDespues: number | null;
  ponePortada: Id | null;
};
const informe: Informe[] = [];
const mapa = new Map<Id, Id>(manifiesto.creado.map((c) => [c.de, c.id]));
let subidas = 0;
let cambiadas = 0;

for (const cat of categorias) {
  const idFoto = idDe(cat.imagen);
  const m = medios.find((x) => x.id === idFoto);
  const base = { categoria: cat.slug, ocupacionAntes: 0, ocupacionDespues: null };
  if (!m) {
    informe.push({
      ...base,
      fichero: "—",
      decision: "sin «Imagen de la tarjeta»: no se toca",
      ponePortada: null,
    });
    continue;
  }
  const fichero = m.filename ?? `media-${m.id}`;
  if (!m.url) {
    informe.push({ ...base, fichero, decision: "sin URL: no se toca", ponePortada: null });
    continue;
  }
  // Del Blob del destino y nada más: una URL relativa de la API (`/api/media/file/<fichero>`) se
  // traduce a la del almacén, como hace el adaptador; nunca se completa con un dominio.
  const urlBlob = m.url.startsWith("/api/media/file/")
    ? `https://${ALMACEN}.public.blob.vercel-storage.com/${m.url.slice("/api/media/file/".length)}`
    : m.url;
  if (new URL(urlBlob).host !== `${ALMACEN}.public.blob.vercel-storage.com`) {
    fallar(`la foto ${m.id} (${fichero}) no está en el almacén del destino: ${m.url}`);
  }
  const r = await fetch(urlBlob);
  if (!r.ok) fallar(`HTTP ${r.status} al descargar la foto ${m.id} (${fichero})`);
  const original = Buffer.from(await r.arrayBuffer());
  const plano = await sharp(original)
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: ancho, height: alto, channels } = plano.info;
  const pieza = cajaDeLaPieza(plano.data, ancho, alto, channels);
  const recorte = recorteCuadrado(ancho, alto, pieza);
  const ocupacionAntes = pieza ? Math.max(pieza.ancho, pieza.alto) / Math.max(ancho, alto) : 0;

  let pone: Id;
  let decision: string;
  let ocupacionDespues: number | null = null;
  if (recorte.accion === "conservar") {
    // Ya llena la foto: la portada usa la propia foto, sin recortar ni subir nada.
    pone = m.id;
    decision = `se conserva sin recortar (${recorte.motivo})`;
  } else {
    const previo =
      mapa.get(m.id) ??
      recortesPrevios.find((d) =>
        d.filename?.startsWith(ficheroDePortada(fichero).replace(/\.webp$/, "")),
      )?.id;
    const { cuadrado: c, relleno: p } = recorte;
    const dentro = {
      left: Math.max(0, c.x),
      top: Math.max(0, c.y),
      width: c.ancho - p.izq - p.der,
      height: c.alto - p.arriba - p.abajo,
    };
    const lado = Math.min(c.ancho, 1600);
    const webp = await sharp(original)
      .flatten({ background: "#ffffff" })
      .extract(dentro)
      .extend({ top: p.arriba, bottom: p.abajo, left: p.izq, right: p.der, background: "#ffffff" })
      .resize(lado, lado, { fit: "fill" })
      .webp({ quality: 92, effort: 6 })
      .toBuffer();
    if (SALIDA) {
      const b = fichero.replace(/\.[a-z0-9]+$/i, "");
      fs.writeFileSync(path.join(SALIDA, `${b}-antes${path.extname(fichero) || ".jpg"}`), original);
      fs.writeFileSync(path.join(SALIDA, ficheroDePortada(fichero)), webp);
    }
    let nuevo: Id | null = previo ?? null;
    if (nuevo === null) {
      subidas++;
      if (modo === "aplicar") {
        const doc = await payload.create({
          collection: "media",
          data: { alt: m.alt ?? "" },
          file: {
            data: webp,
            mimetype: "image/webp",
            name: ficheroDePortada(fichero),
            size: webp.length,
          },
          overrideAccess: true,
        });
        nuevo = doc.id;
        manifiesto.creado.push({
          id: doc.id,
          url: doc.url ?? "",
          fichero: ficheroDePortada(fichero),
          de: m.id,
        });
        guardar();
        log(`subido ${ficheroDePortada(fichero)} → media ${doc.id} (de ${m.id}) · ${lado} px`);
      }
    }
    if (nuevo !== null) mapa.set(m.id, nuevo);
    pone = nuevo ?? -1;
    decision = previo ? `recortada (ya subida) · ${lado} px` : `recortada · ${lado} px`;
    ocupacionDespues = recorte.ocupacion;
  }
  informe.push({
    categoria: cat.slug,
    fichero,
    decision,
    ocupacionAntes,
    ocupacionDespues,
    ponePortada: pone > 0 ? pone : null,
  });

  if (modo === "aplicar" && pone > 0) {
    const actual = idDe(cat.imagenPortada);
    if (actual === pone) continue;
    if (!manifiesto.filas.some((f) => f.categoria === cat.id)) {
      manifiesto.filas.push({ categoria: cat.id, slug: cat.slug, antes: actual, ahora: pone });
    } else {
      const f = manifiesto.filas.find((x) => x.categoria === cat.id)!;
      f.ahora = pone;
    }
    guardar();
    await ponerPortada(cat, pone);
    cambiadas++;
    log(`${cat.slug}: «Foto en la portada» ${actual ?? "vacía"} → ${pone}`);
  }
}

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);
const recortadas = informe.filter((i) => i.decision.startsWith("recortada"));
process.stdout.write(
  JSON.stringify(
    {
      destino,
      modo,
      categorias: categorias.length,
      recortadas: recortadas.length,
      conservadas: informe.filter((i) => i.decision.startsWith("se conserva")).length,
      subidasBlob: subidas,
      categoriasCambiadas: cambiadas,
      detalle: informe.map(
        (i) =>
          `${i.categoria} · ${i.fichero} · ${i.decision} · pieza ${pct(i.ocupacionAntes)} → ${pct(i.ocupacionDespues)}`,
      ),
    },
    null,
    2,
  ) + "\n",
);
if (modo === "aplicar") {
  await revalidar();
  log(
    `✓ RECORTE APLICADO · ${subidas} subidas · ${cambiadas} categorías. Después, POST /api/revalidar/.`,
  );
} else {
  log("SIMULACIÓN: no se ha escrito nada.");
}
process.exit(0);
