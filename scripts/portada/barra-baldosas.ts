/**
 * CARGA DEL KIT DEL CLIENTE para la BARRA DE SECCIONES de la portada y las BALDOSAS DE COLOR del
 * índice de marcas de repuestos (2026-11-04, #417):
 *
 * - Página «inicio», grupo «Barra de secciones»: los 3 botones (textos de siempre, su sección y
 *   la máquina del kit `portada-nav-secciones/public/partequipos/nav/{nueva,usada,repuestos}.webp`).
 * - Marcas de repuestos: «Color de la baldosa» y «Logo para la baldosa» de las 13 del kit
 *   (`repuestos-marcas-baldosas`, colores de `RepuestosMarcas.tsx` y sus logos `.webp`).
 *
 *   npm run preview:barra-baldosas:simular   # no escribe nada: qué subiría y qué cambiaría
 *   npm run preview:barra-baldosas:aplicar
 *   npm run preview:barra-baldosas:retirar   # deja cada campo como estaba y borra lo subido
 *
 * Opciones: `kit=<carpeta>` (por defecto `Desktop\partequipos-diseno`); `revalidar=<origen del
 * preview>` vacía la caché de ese preview al terminar.
 *
 * Como los demás importadores: MANIFIESTO fuera del repositorio
 * (`manifiesto-barra-baldosas-<destino>.json`) y RETIRADA EXACTA: solo devuelve un campo a su
 * valor de antes si sigue con el que puso este script (lo cambiado después en el panel se
 * respeta). Volver a aplicar no duplica: lo subido se reconoce por el manifiesto. Doble cierre en
 * la simulación: sin token del Blob y con `create`/`update`/`delete` que lanzan. No revalida el
 * sitio publicado: al terminar, `POST /api/revalidar/` (runbook).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import type { AnclaNav } from "../../src/lib/portada/navSecciones";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[barra-baldosas] ✗ ${m}`);
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
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[barra-baldosas]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const KIT = valorDe("kit") ?? path.join(os.homedir(), "Desktop", "partequipos-diseno");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-barra-baldosas-${destino}.json`);
const REVALIDAR = valorDe("revalidar");
if (REVALIDAR && (destino !== "preview" || !origenDePreview(REVALIDAR))) {
  fallar("`revalidar=` solo con el destino preview y la URL de un preview");
}

// ---------- Lo que se carga ----------

const NAV = path.join(KIT, "portada-nav-secciones", "public", "partequipos", "nav");
const BOTONES = [
  { texto: "Maquinaria pesada nueva", ancla: "nueva", fichero: "nueva", maquina: "nueva" },
  {
    texto: "Maquinaria pesada usada",
    ancla: "maquinaria-usada",
    fichero: "usada",
    maquina: "usada",
  },
  {
    texto: "Repuestos para maquinaria pesada",
    ancla: "repuestos",
    fichero: "repuestos",
    maquina: "repuestos",
  },
] as const;

const LOGOS = path.join(
  KIT,
  "repuestos-marcas-baldosas",
  "public",
  "partequipos",
  "repuestos",
  "marcas",
);
/**
 * [slug del kit, nombre, fichero del logo, color]: los de `RepuestosMarcas.tsx`, tal cual,
 * salvo dos (dirección, 2026-11-04): Hitachi (`#f37021`, 2,94:1) y Kobelco (`#17b0bc`,
 * 2,63:1) se oscurecen lo justo, con el mismo tono y saturación, para que el logo blanco
 * llegue a 3:1 (3,01 y 3,02).
 */
const MARCAS: [string, string, string, string][] = [
  ["bobcat", "Bobcat", "bobcat-blanco", "#ff3600"],
  ["case-construction", "Case Construction", "case", "#f3e7cc"],
  ["caterpillar", "Caterpillar", "caterpillar", "#ffcd11"],
  ["doosan", "Doosan", "doosan-blanco", "#005eb7"],
  ["hitachi", "Hitachi LANDCROS", "hitachi-landcros-blanco", "#f36c1b"],
  ["hyundai", "Hyundai", "hyundai-blanco", "#2c4b97"],
  ["kobelco", "Kobelco", "kobelco-blanco", "#15a4af"],
  ["komatsu", "Komatsu", "komatsu-blanco", "#000099"],
  ["link-belt", "Link-Belt", "link-belt-blanco", "#e51b24"],
  ["liugong", "LiuGong", "liugong-blanco", "#002568"],
  ["okada", "Okada", "okada-blanco", "#0070b3"],
  ["volvo", "Volvo", "volvo-blanco", "#25277c"],
  ["yanmar", "Yanmar", "yanmar-blanco", "#e20d1a"],
];
/** El slug de la base lleva delante «repuestos-para-maquinaria-pesada-» (la URL de WordPress). */
const slugsPosibles = (s: string) => [s, `repuestos-para-maquinaria-pesada-${s}`];

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
const log = (m: string) => process.stdout.write(`[barra-baldosas] ${m}\n`);

type Id = number;
const idDe = (x: unknown): Id | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;

// ---------- Manifiesto ----------

type BotonGuardado = { texto: string; ancla: AnclaNav; imagen: Id | null };
type Manifiesto = {
  destino: string;
  inicio: string;
  /** Lo subido a «Imágenes»: clave (nav-… o baldosa-…), id y URL. */
  creado: { clave: string; id: Id; url: string }[];
  /** La barra de la página «inicio»: los botones de antes y los que puso el script. */
  barra: { pagina: Id; antes: BotonGuardado[]; ahora: BotonGuardado[] } | null;
  /** Por marca: color y logo de antes y los que puso el script. */
  marcas: {
    id: Id;
    slug: string;
    antes: { color: string | null; logo: Id | null };
    ahora: { color: string; logo: Id };
  }[];
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, inicio: new Date().toISOString(), creado: [], barra: null, marcas: [] };
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

// ---------- Lectura ----------

type Boton = { texto?: string | null; ancla?: string | null; imagen?: unknown };
type Pagina = { id: Id; barraSecciones?: { botones?: Boton[] | null } | null };
type Marca = { id: Id; slug: string; colorBaldosa?: string | null; logoBaldosa?: unknown };

const pagina = (
  await payload.find({
    collection: "paginas",
    where: { slug: { equals: "inicio" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
).docs[0] as unknown as Pagina | undefined;
if (!pagina) fallar("no existe la página «inicio»");

const marcas = (
  await payload.find({
    collection: "marcas",
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })
).docs as unknown as Marca[];

const comoGuardado = (b: Boton): BotonGuardado => ({
  texto: b.texto ?? "",
  ancla: (b.ancla ?? "nueva") as AnclaNav,
  imagen: idDe(b.imagen),
});
const iguales = (a: BotonGuardado[], b: BotonGuardado[]) => JSON.stringify(a) === JSON.stringify(b);

// ---------- Retirar ----------

if (modo === "retirar") {
  if (manifiesto.barra) {
    const ahora = (pagina!.barraSecciones?.botones ?? []).map(comoGuardado);
    if (iguales(ahora, manifiesto.barra.ahora)) {
      await payload.update({
        collection: "paginas",
        id: pagina!.id,
        data: { barraSecciones: { botones: manifiesto.barra.antes } },
        depth: 0,
        overrideAccess: true,
      });
      log("barra de secciones: devuelta a como estaba");
    } else log("barra de secciones: cambiada después en el panel, se respeta");
  }
  for (const m of manifiesto.marcas) {
    const actual = marcas.find((x) => x.id === m.id);
    if (!actual) continue;
    const data: Record<string, unknown> = {};
    if ((actual.colorBaldosa ?? null) === m.ahora.color) data.colorBaldosa = m.antes.color;
    if (idDe(actual.logoBaldosa) === m.ahora.logo) data.logoBaldosa = m.antes.logo;
    if (Object.keys(data).length === 0) continue;
    await payload.update({
      collection: "marcas",
      id: m.id,
      data,
      depth: 0,
      overrideAccess: true,
    });
    log(`marca ${m.slug}: devuelta (${Object.keys(data).join(", ")})`);
  }
  for (const c of manifiesto.creado) {
    await payload
      .delete({ collection: "media", id: c.id, overrideAccess: true })
      .catch((e: unknown) => log(`no se pudo borrar ${c.clave} (${c.id}): ${String(e)}`));
  }
  log(`borradas ${manifiesto.creado.length} imágenes subidas`);
  manifiesto.creado = [];
  manifiesto.barra = null;
  manifiesto.marcas = [];
  guardar();
  await revalidar();
  log("RETIRADA COMPLETA");
} else {
  // ---------- Simular / aplicar ----------

  const subir = async (clave: string, fichero: string, alt: string): Promise<Id | null> => {
    const previo = manifiesto.creado.find((c) => c.clave === clave);
    if (previo) return previo.id;
    if (!fs.existsSync(fichero)) fallar(`no existe ${fichero}`);
    const datos = fs.readFileSync(fichero);
    const meta = await sharp(datos).metadata();
    if (meta.format !== "webp") fallar(`${fichero} no es WebP (${meta.format})`);
    log(
      `subir ${clave}: ${path.basename(fichero)} ${meta.width}×${meta.height}, ${datos.length} B`,
    );
    if (modo === "simular") return null;
    const doc = await payload.create({
      collection: "media",
      data: { alt },
      file: { data: datos, mimetype: "image/webp", name: `${clave}.webp`, size: datos.length },
      overrideAccess: true,
    });
    manifiesto.creado.push({ clave, id: doc.id, url: doc.url ?? "" });
    guardar();
    return doc.id;
  };

  // La barra.
  const nuevos: BotonGuardado[] = [];
  for (const b of BOTONES) {
    const id = await subir(
      `nav-${b.fichero}`,
      path.join(NAV, `${b.fichero}.webp`),
      `Máquina del botón «${b.texto}» de la barra de secciones`,
    );
    nuevos.push({ texto: b.texto, ancla: b.ancla, imagen: id });
  }
  const antesBarra = (pagina!.barraSecciones?.botones ?? []).map(comoGuardado);
  log(`barra de secciones: ${antesBarra.length} botones ahora → ${nuevos.length}`);
  if (modo === "aplicar") {
    if (!manifiesto.barra)
      manifiesto.barra = { pagina: pagina!.id, antes: antesBarra, ahora: nuevos };
    else manifiesto.barra.ahora = nuevos;
    guardar();
    await payload.update({
      collection: "paginas",
      id: pagina!.id,
      data: { barraSecciones: { botones: nuevos } },
      depth: 0,
      overrideAccess: true,
    });
  }

  // Las marcas.
  const sinMarca: string[] = [];
  for (const [slug, nombre, fichero, color] of MARCAS) {
    const marca = marcas.find((m) => slugsPosibles(slug).includes(m.slug));
    if (!marca) {
      sinMarca.push(slug);
      continue;
    }
    const id = await subir(
      `baldosa-${slug}`,
      path.join(LOGOS, `${fichero}.webp`),
      `Logo de ${nombre} para su baldosa de color`,
    );
    log(`marca ${marca.slug}: color ${marca.colorBaldosa ?? "—"} → ${color}`);
    if (modo !== "aplicar" || id === null) continue;
    const previa = manifiesto.marcas.find((m) => m.id === marca.id);
    if (previa) previa.ahora = { color, logo: id };
    else
      manifiesto.marcas.push({
        id: marca.id,
        slug: marca.slug,
        antes: { color: marca.colorBaldosa ?? null, logo: idDe(marca.logoBaldosa) },
        ahora: { color, logo: id },
      });
    guardar();
    await payload.update({
      collection: "marcas",
      id: marca.id,
      data: { colorBaldosa: color, logoBaldosa: id },
      depth: 0,
      overrideAccess: true,
    });
  }
  if (sinMarca.length) log(`SIN MARCA en la base (no se tocan): ${sinMarca.join(", ")}`);
  const sobran = marcas.filter((m) => !MARCAS.some(([s]) => slugsPosibles(s).includes(m.slug)));
  if (sobran.length)
    log(`marcas sin datos en el kit (siguen en gris): ${sobran.map((m) => m.slug).join(", ")}`);
  if (modo === "aplicar") await revalidar();
  log(modo === "aplicar" ? "APLICADO" : "SIMULACIÓN: no se escribió nada");
}
