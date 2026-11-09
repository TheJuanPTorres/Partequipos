/**
 * Una selección de PRUEBA en «Marcas de la banda» (portada → «Marcas de repuestos») en el PREVIEW,
 * con marcas y LOGOS LIBRES, para ver la banda con lo elegido y en su orden, y su retirada exacta.
 *
 *   npm run preview:marcas-banda:ver
 *   npm run preview:marcas-banda:aplicar -- revalidar=<URL del preview>
 *   npm run preview:marcas-banda:retirar -- revalidar=<URL del preview>
 *   npm run preview:ejecutar -- npx.cmd payload run scripts/portada/marcas-banda-preview.ts comprobar-repetida
 *
 * - `ver`: las filas del campo y las marcas de repuestos con logo, por orden alfabético.
 * - `aplicar`: con `cuantas=<n>` (5 por defecto), n marcas con logo en orden alfabético INVERSO
 *   (manda el orden del panel, no el alfabético). Con `libres=si` (por defecto), además sube un
 *   logo de PRUEBA (PNG transparente generado aquí, «LOGO DE PRUEBA», nunca un logo real) y pone
 *   dos filas de logo libre: una con enlace a otro sitio (`https://example.com/`), tras la primera
 *   marca, y otra sin enlace, al final. Guarda en el manifiesto lo que había antes y lo subido.
 * - `retirar`: devuelve las filas de antes, solo si el campo sigue con la selección de prueba (lo
 *   cambiado después a mano se respeta y se avisa), y borra la imagen subida.
 * - `comprobar-repetida`: intenta guardar la primera marca dos veces y exige que el servidor lo
 *   RECHACE y que el campo siga como estaba (por efecto, CLAUDE.md §10.15).
 *
 * SOLO preview: el mismo guardián que el hero de prueba, antes de conectar, y la guarda del
 * almacén del Blob. No toca el esquema. `revalidar=` (con `REVALIDACION_TOKEN` del preview en el
 * entorno) revalida el preview al terminar; sin él, redesplegar.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { idDe, type FilaBanda } from "../../src/lib/portada/marcasBanda";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

const args = process.argv.slice(2);
const modo = args.find((a) => ["ver", "aplicar", "retirar", "comprobar-repetida"].includes(a));
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
// Para fallar se LANZA: `payload run` sale con 0 tras el import y pisaría un `exitCode` (§10.25).
const fallar = (m: string): never => {
  const e = new Error(`[marcas-banda] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: ver, aplicar, retirar o comprobar-repetida");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
if (modo === "aplicar" || modo === "retirar") exigirAlmacen("[marcas-banda]");

const REVALIDAR = valorDe("revalidar");
if (REVALIDAR && !origenDePreview(REVALIDAR)) fallar("`revalidar=` solo con la URL de un preview");
const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-marcas-banda-preview.json",
);
const CUANTAS = Number(valorDe("cuantas") ?? 5);
if (!Number.isInteger(CUANTAS) || CUANTAS < 1) fallar("`cuantas=` tiene que ser un entero ≥ 1");
const LIBRES = (valorDe("libres") ?? "si") !== "no";
const NOMBRE_FICHERO = "prueba-banda-logo-libre.png";
const NOMBRE_LIBRE = "PRUEBA logo libre";
const ENLACE_EXTERNO = "https://example.com/";

// Un script de datos no toca el esquema ni deja el hijo de tipos (CLAUDE.md §10.9, §10.34, §10.25).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[marcas-banda] ${m}\n`);

/** Una fila como la guarda el campo, sin su id (Payload pone uno nuevo al guardar). */
type FilaGuardable =
  | { blockType: "bandaMarca"; marca: number }
  | { blockType: "bandaLogo"; imagen: number; nombre: string; enlace?: string | null };
type Manifiesto = {
  inicio: string;
  pagina: number;
  antes: FilaGuardable[];
  ahora: FilaGuardable[];
  imagen: number | null;
};

/** Las filas de la base en forma comparable y guardable. */
const guardables = (filas: readonly FilaBanda[] | null | undefined): FilaGuardable[] =>
  (filas ?? []).flatMap((f): FilaGuardable[] => {
    if (f.blockType === "bandaMarca") {
      const id = idDe(f.marca);
      return id === null ? [] : [{ blockType: "bandaMarca", marca: id }];
    }
    const img = idDe(f.imagen as Parameters<typeof idDe>[0]);
    return img === null
      ? []
      : [
          {
            blockType: "bandaLogo",
            imagen: img,
            nombre: f.nombre ?? "",
            enlace: f.enlace?.trim() || null,
          },
        ];
  });
const iguales = (a: FilaGuardable[], b: FilaGuardable[]) => JSON.stringify(a) === JSON.stringify(b);

const leerPagina = async () =>
  (
    await payload.find({
      collection: "paginas",
      where: { slug: { equals: "inicio" } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
const pagina = await leerPagina();
if (!pagina) fallar("no hay página «inicio»");
const grupo = pagina!.seccionMarcasRepuestos ?? {};
const actual = guardables(grupo.marcasBanda as FilaBanda[] | null | undefined);

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

const guardarCampo = (filas: FilaGuardable[]) =>
  payload.update({
    collection: "paginas",
    id: pagina!.id,
    data: { seccionMarcasRepuestos: { ...grupo, marcasBanda: filas } },
    overrideAccess: true,
  });
const releer = async () =>
  guardables(
    (await payload.findByID({ collection: "paginas", id: pagina!.id, depth: 0 }))
      .seccionMarcasRepuestos?.marcasBanda as FilaBanda[] | null | undefined,
  );

/** Un PNG transparente de 600 × 160 con el texto «LOGO DE PRUEBA» en gris oscuro. */
async function pngDePrueba(): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="160">
    <rect x="6" y="6" width="588" height="148" rx="20" fill="none" stroke="#2b2b2b" stroke-width="10"/>
    <text x="300" y="104" font-family="Arial, sans-serif" font-size="64" font-weight="700"
      text-anchor="middle" fill="#2b2b2b">LOGO DE PRUEBA</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

if (modo === "comprobar-repetida") {
  const { docs } = await payload.find({
    collection: "marcas",
    depth: 0,
    limit: 1,
    sort: "nombre",
    overrideAccess: true,
  });
  const id = docs[0]?.id;
  if (!id) fallar("no hay marcas");
  let rechazo = "";
  try {
    await guardarCampo([
      { blockType: "bandaMarca", marca: id! },
      { blockType: "bandaMarca", marca: id! },
    ]);
  } catch (e) {
    rechazo = e instanceof Error ? e.message : String(e);
  }
  const leido = await releer();
  log(`rechazo: ${rechazo || "NINGUNO"}`);
  log(`campo después: ${JSON.stringify(leido)} (antes ${JSON.stringify(actual)})`);
  if (!rechazo) fallar("el servidor aceptó una marca repetida");
  if (!iguales(leido, actual)) fallar("el campo cambió");
  log("✓ REPETIDA RECHAZADA y el campo sin cambios");
} else if (modo === "ver") {
  const { docs } = await payload.find({
    collection: "marcas",
    depth: 0,
    limit: 0,
    pagination: false,
    sort: "nombre",
    select: { nombre: true, slug: true, logo: true },
    overrideAccess: true,
  });
  log(`«Marcas de la banda» ahora: ${JSON.stringify(actual)}`);
  log(
    `marcas con logo: ${docs
      .filter((m) => m.logo && m.slug)
      .map((m) => `${m.id}:${m.nombre}`)
      .join(", ")}`,
  );
  log(`manifiesto: ${fs.existsSync(MANIFIESTO) ? MANIFIESTO : "no hay"}`);
} else if (modo === "aplicar") {
  if (fs.existsSync(MANIFIESTO)) {
    const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
    if (!iguales(actual, m.ahora)) {
      fallar(`hay un manifiesto y el campo no coincide con él: retira primero (${MANIFIESTO})`);
    }
    log(`ya aplicada: ${JSON.stringify(m.ahora)}; nada que hacer`);
    await revalidar();
  } else {
    const { docs } = await payload.find({
      collection: "marcas",
      depth: 0,
      limit: 0,
      pagination: false,
      sort: "-nombre",
      select: { nombre: true, slug: true, logo: true },
      overrideAccess: true,
    });
    const elegidas = docs.filter((m) => m.logo && m.slug).slice(0, CUANTAS);
    if (elegidas.length < CUANTAS) fallar(`no hay ${CUANTAS} marcas con logo`);
    const manifiesto: Manifiesto = {
      inicio: new Date().toISOString(),
      pagina: pagina!.id,
      antes: actual,
      ahora: [],
      imagen: null,
    };
    const filas: FilaGuardable[] = elegidas.map((m) => ({ blockType: "bandaMarca", marca: m.id }));
    if (LIBRES) {
      const png = await pngDePrueba();
      const imagen = await payload.create({
        collection: "media",
        data: { alt: "Logo de prueba de la banda de marcas" },
        file: { data: png, mimetype: "image/png", name: NOMBRE_FICHERO, size: png.length },
        overrideAccess: true,
      });
      manifiesto.imagen = imagen.id;
      // Antes de tocar la página: si lo siguiente falla, la retirada sabe qué borrar.
      fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
      fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
      log(`imagen de prueba subida: media ${imagen.id} (${imagen.filename})`);
      filas.splice(1, 0, {
        blockType: "bandaLogo",
        imagen: imagen.id,
        nombre: NOMBRE_LIBRE,
        enlace: ENLACE_EXTERNO,
      });
      filas.push({
        blockType: "bandaLogo",
        imagen: imagen.id,
        nombre: `${NOMBRE_LIBRE} sin enlace`,
        enlace: null,
      });
    }
    manifiesto.ahora = filas;
    fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
    fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
    await guardarCampo(filas);
    const leido = await releer();
    if (!iguales(leido, filas)) fallar(`la base dice ${JSON.stringify(leido)}, no lo aplicado`);
    log(`antes: ${JSON.stringify(actual)}`);
    log(`ahora: ${JSON.stringify(filas)}`);
    await revalidar();
    log("✓ SELECCIÓN DE PRUEBA APLICADA");
  }
} else {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
  // Si la aplicación se cortó tras subir la imagen, el campo aún está como antes: se acepta.
  if (!iguales(actual, m.ahora) && !iguales(actual, m.antes)) {
    fallar(
      `el campo cambió desde la prueba (${JSON.stringify(actual)}): no se toca; revísalo a mano`,
    );
  }
  if (!iguales(actual, m.antes)) {
    await guardarCampo(m.antes);
    const leido = await releer();
    if (!iguales(leido, m.antes)) fallar(`la base dice ${JSON.stringify(leido)}, no lo de antes`);
  }
  log(`campo devuelto a ${JSON.stringify(m.antes)}`);
  if (m.imagen !== null) {
    await payload.delete({ collection: "media", id: m.imagen, overrideAccess: true });
    const queda = await payload.find({
      collection: "media",
      where: { id: { equals: m.imagen } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (queda.totalDocs !== 0) fallar(`la imagen ${m.imagen} sigue en «Imágenes»`);
    log(`imagen de prueba ${m.imagen} borrada`);
  }
  fs.renameSync(
    MANIFIESTO,
    MANIFIESTO.replace(
      /\.json$/,
      `.retirado-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    ),
  );
  await revalidar();
  log("✓ RETIRADA COMPLETA");
}
