/**
 * RECORTE DEL BLANCO DE LAS FOTOS DE «QUÉ INCLUYE» (dirección, 2026-11-03): las fotos de los
 * grupos de las categorías técnicas (y de Filtros Donaldson, que es una de ellas) son ficheros
 * cuadrados con mucho blanco alrededor de la pieza. Este script recorta ese blanco y deja el MISMO
 * margen en todas (`MARGEN_RECORTE`, 4 %), en un cuadrado WebP de calidad alta, como fichero NUEVO
 * de «Imágenes» con el mismo texto alternativo, y hace que cada grupo use el nuevo.
 *
 *   npm run preview:grupos-recorte:simular   # no escribe nada: qué fotos recorta y cuánto ganan
 *   npm run preview:grupos-recorte:aplicar   # sube los recortes y cambia la foto de los grupos
 *   npm run preview:grupos-recorte:retirar   # devuelve los originales y borra los recortes
 *
 * Opciones: `salida=<carpeta>` guarda cada original y su recorte para revisarlos a mano (no sube
 * nada); `revalidar=<origen del preview>` vacía la caché de ese preview al terminar.
 *
 * Qué toca, y nada más: la «Foto del grupo» (`grupos[].imagen`) de las categorías técnicas, solo
 * en las filas que usan una foto que este script recorta, y los ficheros nuevos `…-recorte.webp`.
 * LOS ORIGINALES NO SE BORRAN. La pieza nunca se corta (`recorteCuadrado`), y una foto cuya pieza
 * toca un borde (sin fondo blanco, como las de Donaldson) se deja como está.
 *
 * Como los demás importadores: MANIFIESTO fuera del repositorio
 * (`manifiesto-grupos-recorte-<destino>.json`) y RETIRADA EXACTA, que solo devuelve el original en
 * las filas que siguen con el recorte (lo cambiado después en el panel se respeta). Volver a
 * aplicar no duplica: los recortes ya subidos se reconocen por el manifiesto y por su nombre.
 * Doble cierre en la simulación: sin token del Blob y con `create`/`update`/`delete` que lanzan.
 * No revalida el sitio publicado: al terminar, `POST /api/revalidar/` (runbook).
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
  ficheroRecortado,
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
  const e = new Error(`[recorte] ✗ ${m}`);
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
else exigirAlmacen("[recorte]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-grupos-recorte-${destino}.json`);
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
const log = (m: string) => process.stdout.write(`[recorte] ${m}\n`);

type Id = number;
const idDe = (x: unknown): Id | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;

// ---------- Manifiesto ----------

type Manifiesto = {
  destino: string;
  inicio: string;
  /** Los recortes subidos: id, URL, fichero y el original del que salen. */
  creado: { id: Id; url: string; fichero: string; de: Id }[];
  /** Por fila de grupo cambiada: su categoría, el id de la fila y la foto de ANTES. */
  filas: { categoria: Id; fila: string; antes: Id; ahora: Id }[];
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

type Fila = Record<string, unknown> & { id?: string; imagen?: unknown };
type Categoria = { id: Id; slug: string; grupos?: Fila[] | null };

const categorias = (
  await payload.find({
    collection: "categorias-tecnicas",
    where: { "grupos.imagen": { exists: true } },
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })
).docs as unknown as Categoria[];

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

const cambiarFotos = async (cat: Categoria, cambio: (f: Fila) => Id | null) => {
  const grupos = (cat.grupos ?? []).map((f) => {
    const nuevo = cambio(f);
    return nuevo === null ? f : { ...f, imagen: nuevo };
  });
  await payload.update({
    collection: "categorias-tecnicas",
    id: cat.id,
    data: { grupos } as never,
    overrideAccess: true,
  });
};

// ================================================================== RETIRAR
if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  let devueltas = 0;
  let respetadas = 0;
  for (const cat of categorias) {
    const suyas = manifiesto.filas.filter((f) => f.categoria === cat.id);
    if (!suyas.length) continue;
    let cambia = false;
    await cambiarFotos(cat, (fila) => {
      const m = suyas.find((s) => s.fila === fila.id);
      if (!m) return null;
      if (idDe(fila.imagen) !== m.ahora) {
        respetadas++;
        return null;
      }
      devueltas++;
      cambia = true;
      return m.antes;
    });
    if (!cambia) log(`${cat.slug}: nada que devolver`);
  }
  log(
    `filas devueltas a su foto original: ${devueltas} (cambiadas después en el panel: ${respetadas})`,
  );
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
  log(`✓ RETIRADA COMPLETA: originales devueltos y los ${urls.length} recortes dan 404`);
  process.exit(0);
}

// ================================================================== SIMULAR / APLICAR

// Las fotos que usan los grupos (una misma foto puede ir en varios grupos: lubricantes).
const idsFotos = [
  ...new Set(categorias.flatMap((c) => (c.grupos ?? []).map((f) => idDe(f.imagen)))),
].filter((x): x is Id => x !== null && x > 0);
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

// Recortes ya subidos (por el manifiesto o, si se perdió, por su nombre).
const recortesPrevios = (
  await payload.find({
    collection: "media",
    where: { filename: { like: SUFIJO_RECORTE } },
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })
).docs.filter((d) => (d.filename ?? "").includes(`${SUFIJO_RECORTE}`));
const idsDeRecortes = new Set([
  ...manifiesto.creado.map((c) => c.id),
  ...recortesPrevios.map((d) => d.id),
]);

if (SALIDA) fs.mkdirSync(SALIDA, { recursive: true });

type Informe = {
  id: Id;
  fichero: string;
  decision: string;
  ocupacionAntes: number;
  ocupacionDespues: number | null;
  nuevo: Id | null;
};
const informe: Informe[] = [];
const mapa = new Map<Id, Id>(manifiesto.creado.map((c) => [c.de, c.id]));
let subidas = 0;

for (const m of medios) {
  if (idsDeRecortes.has(m.id)) continue; // ya es un recorte
  const fichero = m.filename ?? `media-${m.id}`;
  if (!m.url) {
    informe.push({
      id: m.id,
      fichero,
      decision: "sin URL",
      ocupacionAntes: 0,
      ocupacionDespues: null,
      nuevo: null,
    });
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
  if (recorte.accion === "conservar") {
    informe.push({
      id: m.id,
      fichero,
      decision: `se conserva: ${recorte.motivo}`,
      ocupacionAntes,
      ocupacionDespues: null,
      nuevo: null,
    });
    continue;
  }
  const previo =
    mapa.get(m.id) ??
    recortesPrevios.find((d) =>
      d.filename?.startsWith(ficheroRecortado(fichero).replace(/\.webp$/, "")),
    )?.id;
  // El cuadrado: lo que cae dentro del fichero y, si se sale, blanco alrededor.
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
    const base = fichero.replace(/\.[a-z0-9]+$/i, "");
    fs.writeFileSync(
      path.join(SALIDA, `${base}-antes${path.extname(fichero) || ".jpg"}`),
      original,
    );
    fs.writeFileSync(path.join(SALIDA, ficheroRecortado(fichero)), webp);
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
          name: ficheroRecortado(fichero),
          size: webp.length,
        },
        overrideAccess: true,
      });
      nuevo = doc.id;
      manifiesto.creado.push({
        id: doc.id,
        url: doc.url ?? "",
        fichero: ficheroRecortado(fichero),
        de: m.id,
      });
      guardar();
      log(`subido ${ficheroRecortado(fichero)} → media ${doc.id} (de ${m.id})`);
    }
  }
  if (nuevo !== null) mapa.set(m.id, nuevo);
  informe.push({
    id: m.id,
    fichero,
    decision: previo ? "recortada (ya subida)" : "recortada",
    ocupacionAntes,
    ocupacionDespues: recorte.ocupacion,
    nuevo,
  });
}

// Cada grupo pasa a usar el recorte de su foto.
let filasCambiadas = 0;
if (modo === "aplicar") {
  for (const cat of categorias) {
    let cambia = false;
    const nuevas: Manifiesto["filas"] = [];
    const grupos = (cat.grupos ?? []).map((f) => {
      const antes = idDe(f.imagen);
      const nuevo = antes !== null ? mapa.get(antes) : undefined;
      if (nuevo === undefined || !f.id) return f;
      cambia = true;
      nuevas.push({ categoria: cat.id, fila: f.id, antes: antes!, ahora: nuevo });
      return { ...f, imagen: nuevo };
    });
    if (!cambia) continue;
    for (const n of nuevas) {
      if (!manifiesto.filas.some((x) => x.categoria === n.categoria && x.fila === n.fila)) {
        manifiesto.filas.push(n);
      }
    }
    guardar();
    await payload.update({
      collection: "categorias-tecnicas",
      id: cat.id,
      data: { grupos } as never,
      overrideAccess: true,
    });
    filasCambiadas += nuevas.length;
    log(`${cat.slug}: ${nuevas.length} grupos con su recorte`);
  }
}

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);
const recortadas = informe.filter((i) => i.decision.startsWith("recortada"));
process.stdout.write(
  JSON.stringify(
    {
      destino,
      modo,
      fotos: informe.length,
      recortadas: recortadas.length,
      conservadas: informe.length - recortadas.length,
      subidasBlob: subidas,
      filasCambiadas,
      detalle: informe.map(
        (i) =>
          `${i.fichero} · ${i.decision} · pieza ${pct(i.ocupacionAntes)} → ${pct(i.ocupacionDespues)}`,
      ),
    },
    null,
    2,
  ) + "\n",
);
if (modo === "aplicar") {
  await revalidar();
  log(
    `✓ RECORTE APLICADO · ${subidas} subidas · ${filasCambiadas} grupos. Después, POST /api/revalidar/.`,
  );
} else {
  log("SIMULACIÓN: no se ha escrito nada.");
}
process.exit(0);
