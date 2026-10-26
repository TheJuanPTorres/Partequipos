/**
 * Siembra la muestra del «KIT DE MARCA» de CASE (2026-10-25): sube las imágenes del kit del
 * cliente (foto de fondo de la cabecera, emblema —el águila Old Abe— y el render de cada tipo) a
 * «Imágenes», las asigna a la marca y a sus tipos y deja la marca en el diseño «Kit de marca».
 *
 *   payload run scripts/marca-kit/marca-kit.ts <modo> <destino> [marca] [emblema=on|off]
 *
 *   modo:    simular (no escribe) · sembrar · retirar
 *   destino: preview · produccion
 *   marca:   case (por defecto) · hitachi · yanmar · dynapac. Fase 2 (2026-10-26): mismas piezas
 *            con las imágenes de cada kit (`Desktop/partequipos-diseno/kit-marca-<marca>`).
 *
 * DESTINO validado ANTES de cargar Payload: `preview` solo con la base y el Blob del preview;
 * `produccion` solo con la base y el almacén de producción (`veredictoDestino`), y el almacén se
 * declara para la guarda de las colecciones. Cualquier otra combinación, se niega.
 *
 * EL EMBLEMA: se sube y se ACTIVA (`mostrarEmblema`); el cliente dio permiso para los cuatro
 * (2026-10-26). `emblema=off` lo deja desactivado (casilla «Mostrar el emblema de fondo»).
 *
 * IDEMPOTENTE: una segunda pasada no duplica nada (reutiliza las imágenes `kit-case-…` ya subidas)
 * y NO pisa lo que alguien eligió en el panel (un campo con otra imagen se deja como está).
 * MANIFIESTO fuera del repositorio; `retirar` deshace EXACTAMENTE lo sembrado: vacía los campos
 * que siguen apuntando a nuestras imágenes, devuelve el diseño a «Plantilla 1» y borra las
 * imágenes que creó (no las que ya existían) y comprueba que dan 404 en el Blob.
 *
 * Las imágenes se leen de la carpeta del kit (`KIT_MARCA_DIR`, por defecto
 * `Desktop/partequipos-diseno/kit-marca/public/partequipos/marcas/case`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "sembrar" || a === "retirar");
const MARCAS = ["case", "hitachi", "yanmar", "dynapac"] as const;
const clave = MARCAS.find((m) => args.includes(m)) ?? "case";
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[marca-kit] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
const log = (m: string) => process.stdout.write(`[marca-kit] ${m}\n`);
if (!modo) fallar("indica el modo: simular, sembrar o retirar");
if (!destino) fallar("indica el destino: preview o produccion");

if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(
    "produccion",
    process.env.DATABASE_URI,
    process.env.BLOB_READ_WRITE_TOKEN,
  );
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[marca-kit]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";

const ESCRITORIO = path.join(os.homedir(), "Desktop");

/** El render del kit de un tipo: su slug y, por si el slug cambiara, parte de su nombre. */
type Render = {
  /** Ruta dentro de la carpeta de la marca. */
  fichero: string;
  slug: string;
  /** Principio del nombre del tipo (sin tildes), o parte de él con `incluye`. */
  clave: string;
  nombre: string;
  incluye?: boolean;
};
type Config = {
  nombre: string;
  slug: string;
  carpeta: string;
  emblemaAlt: string;
  renders: readonly Render[];
};

const kitDe = (dir: string, marca: string) =>
  path.join(ESCRITORIO, "partequipos-diseno", dir, "public", "partequipos", "marcas", marca);

const CONFIGS: Record<(typeof MARCAS)[number], Config> = {
  case: {
    nombre: "Case Construction",
    slug: "case-construction",
    carpeta: process.env.KIT_MARCA_DIR ?? kitDe("kit-marca", "case"),
    emblemaAlt: "Emblema de Case Construction, el águila Old Abe",
    renders: [
      {
        fichero: "tipos/bulldozer.png",
        slug: "bulldozer",
        clave: "bulldozer",
        nombre: "Bulldozer",
      },
      { fichero: "tipos/cargador.png", slug: "cargadores", clave: "cargador", nombre: "Cargador" },
      {
        fichero: "tipos/excavadora.png",
        slug: "excavadoras",
        clave: "excavadora",
        nombre: "Excavadora",
      },
      {
        fichero: "tipos/minicargador.png",
        slug: "minicargadores-case",
        clave: "minicargador",
        nombre: "Minicargador",
      },
      {
        fichero: "tipos/motoniveladora.png",
        slug: "motoniveladoras-case",
        clave: "motoniveladora",
        nombre: "Motoniveladora",
      },
      {
        fichero: "tipos/retrocargadora.png",
        slug: "retrocargadoras",
        clave: "retrocargadora",
        nombre: "Retrocargadora",
      },
      {
        fichero: "tipos/vibrocompactador.png",
        slug: "vibrocompactador-case-sv208",
        clave: "vibrocompactador",
        nombre: "Vibrocompactador",
      },
    ],
  },
  hitachi: {
    nombre: "Hitachi",
    slug: "hitachi",
    carpeta: kitDe("kit-marca-hitachi", "hitachi"),
    emblemaAlt: "Emblema de Hitachi, el Ojo Hitachi",
    renders: [
      {
        fichero: "../../maq-hitachi-zx210.png",
        slug: "excavadoras-hitachi",
        clave: "excavadora",
        nombre: "Excavadora",
      },
    ],
  },
  yanmar: {
    nombre: "Yanmar",
    slug: "yanmar",
    carpeta: kitDe("kit-marca-yanmar", "yanmar"),
    emblemaAlt: "Emblema de Yanmar, la libélula",
    renders: [
      {
        fichero: "../../maq-yanmar.png",
        slug: "miniexcavadoras",
        clave: "miniexcavadora",
        nombre: "Miniexcavadora",
      },
    ],
  },
  dynapac: {
    nombre: "Dynapac",
    slug: "dynapac",
    carpeta: kitDe("kit-marca-dynapac", "dynapac"),
    emblemaAlt: "Emblema de Dynapac, el rinoceronte",
    renders: [
      {
        fichero: "tipos/doble-rodillo.png",
        slug: "compactador-doble-rodillo-dynapac",
        clave: "doble rodillo",
        nombre: "doble rodillo",
        incluye: true,
      },
      {
        fichero: "tipos/llantas.png",
        slug: "compactador-de-llantas-dynapac",
        clave: "llantas",
        nombre: "llantas",
        incluye: true,
      },
      {
        fichero: "tipos/suelo.png",
        slug: "compactador-de-suelo-dynapac",
        clave: "de suelo",
        nombre: "suelo",
        incluye: true,
      },
      {
        fichero: "tipos/pavimentadora.png",
        slug: "pavimentadoras-dynapac",
        clave: "pavimentadoras dynapac",
        nombre: "pavimentadora",
        incluye: true,
      },
      {
        fichero: "tipos/regla.png",
        slug: "reglas-dynapac",
        clave: "regla",
        nombre: "regla",
        incluye: true,
      },
    ],
  },
};
const CFG = CONFIGS[clave];
const CARPETA = CFG.carpeta;
const RENDERS = CFG.renders;
const MANIFIESTO = path.join(
  ESCRITORIO,
  "partequipos-cierre",
  `manifiesto-marca-kit-${clave}-${destino}.json`,
);
const PREFIJO = `kit-${clave}-`;
const emblemaPedido = args.find((a) => a.startsWith("emblema="))?.slice("emblema=".length);
const mostrarEmblema = emblemaPedido ? emblemaPedido === "on" : true;

type Subida = { id: number; para: string; url: string; creada: boolean };
type Manifiesto = { destino: string; marca: number; media: Subida[] };

const sinTildes = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const idDe = (x: unknown) =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;

const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const { docs: todasMarcas } = await payload.find({
  collection: "marcas-maquinaria",
  depth: 0,
  limit: 100,
  overrideAccess: true,
});
const marca =
  todasMarcas.find((m) => m.slug === CFG.slug) ??
  todasMarcas.find((m) => sinTildes(m.nombre).startsWith(clave) || m.slug.startsWith(clave)) ??
  fallar(`no existe la marca «${CFG.slug}»`);
const { docs: tipos } = await payload.find({
  collection: "tipos-maquinaria",
  where: { marca: { equals: marca.id } },
  depth: 0,
  limit: 100,
  overrideAccess: true,
});

/** El tipo de CASE de cada render: por su dirección y, si no, por el principio de su nombre. */
function tipoDe(r: Render) {
  const porSlug = tipos.find((t) => t.slug === r.slug);
  if (porSlug) return porSlug;
  const porNombre = tipos.filter((t) =>
    r.incluye ? sinTildes(t.nombre).includes(r.clave) : sinTildes(t.nombre).startsWith(r.clave),
  );
  return porNombre.length === 1 ? porNombre[0] : undefined;
}

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
  if (m.destino !== destino) fallar(`el manifiesto es del destino «${m.destino}»`);
  const nuestras = new Set(m.media.map((x) => x.id));
  const kit = { ...(marca.kit ?? {}) };
  if (nuestras.has(idDe(kit.fotoCabecera) ?? -1)) kit.fotoCabecera = null;
  if (nuestras.has(idDe(kit.emblema) ?? -1)) {
    kit.emblema = null;
    kit.mostrarEmblema = false;
  }
  await payload.update({
    collection: "marcas-maquinaria",
    id: marca.id,
    data: { disenoPagina: "plantilla1", kit },
    overrideAccess: true,
  });
  for (const r of RENDERS) {
    const t = tipoDe(r);
    if (t && nuestras.has(idDe(t.render) ?? -1)) {
      await payload.update({
        collection: "tipos-maquinaria",
        id: t.id,
        data: { render: null },
        overrideAccess: true,
      });
    }
  }
  const creadas = m.media.filter((x) => x.creada);
  for (const x of creadas) {
    await payload.delete({ collection: "media", id: x.id, overrideAccess: true }).catch(() => null);
  }
  log(`retirado: la marca vuelve a «Plantilla 1» y ${creadas.length} imágenes borradas`);
  if (creadas.length > 0) {
    log("espero 70 s (propagación del Blob) y compruebo que los ficheros dan 404");
    await new Promise((r) => setTimeout(r, 70_000));
    for (const x of creadas) {
      let estado = 0;
      for (let i = 0; i < 4; i++) {
        estado = (await fetch(x.url, { method: "HEAD" })).status;
        if (estado === 404) break;
        await new Promise((r) => setTimeout(r, 30_000));
      }
      if (estado !== 404) fallar(`el fichero sigue en el Blob (HTTP ${estado}): ${x.url}`);
    }
    log("✓ todos los ficheros dan 404");
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  process.exit(0);
}

// ---------- sembrar / simular ----------

const sinMatch = RENDERS.filter((r) => !tipoDe(r));
log(`marca ${marca.id} «${marca.nombre}», diseño actual: ${marca.disenoPagina}`);
for (const r of RENDERS) {
  const t = tipoDe(r);
  log(
    `  render ${r.fichero} → ${t ? `tipo ${t.id} «${t.nombre}» (${t.slug})` : "SIN TIPO (se salta)"}`,
  );
}
if (sinMatch.length > 0) log(`⚠ ${sinMatch.length} render(es) sin tipo: revisar antes de sembrar`);
for (const f of ["fondo.jpg", "mascota-tinta.webp", ...RENDERS.map((r) => r.fichero)]) {
  if (!fs.existsSync(path.join(CARPETA, f))) fallar(`falta ${path.join(CARPETA, f)}`);
}
log(`emblema: se sube y queda ${mostrarEmblema ? "ACTIVADO" : "DESACTIVADO"}`);

/** Una imagen `kit-case-…` ya subida (segunda pasada), o null. */
async function yaSubida(nombre: string) {
  const { docs } = await payload.find({
    collection: "media",
    where: { filename: { like: nombre.replace(/\.[^.]+$/, "") } },
    depth: 0,
    limit: 5,
    overrideAccess: true,
  });
  return docs.find((d) => (d.filename ?? "").startsWith(nombre.replace(/\.[^.]+$/, ""))) ?? null;
}

if (modo === "simular") {
  const todos = [
    "fondo.jpg",
    "mascota-tinta.webp",
    ...RENDERS.map((r) => path.basename(r.fichero)),
  ];
  for (const f of todos) {
    const existe = await yaSubida(`${PREFIJO}${f}`);
    log(
      `  ${PREFIJO}${f}: ${existe ? `ya subida (media ${existe.id}), se reutiliza` : "se subiría"}`,
    );
  }
  log("simulación terminada: no se escribió nada");
  process.exit(0);
}

if (fs.existsSync(MANIFIESTO)) {
  log("hay un manifiesto previo: segunda pasada (reutiliza lo subido, no duplica)");
}
const previo: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: String(destino), marca: marca.id, media: [] };
const subidas = [...previo.media];

const mime = (f: string) =>
  f.endsWith(".png") ? "image/png" : f.endsWith(".webp") ? "image/webp" : "image/jpeg";

async function subir(fichero: string, alt: string, para: string): Promise<number> {
  const nombre = `${PREFIJO}${path.basename(fichero)}`;
  const ya = await yaSubida(nombre);
  if (ya) {
    if (!subidas.some((s) => s.id === ya.id)) {
      subidas.push({ id: ya.id, para, url: ya.url ?? "", creada: false });
    }
    log(`  ${nombre}: ya estaba (media ${ya.id})`);
    return ya.id;
  }
  const data = fs.readFileSync(path.join(CARPETA, fichero));
  const doc = await payload.create({
    collection: "media",
    data: { alt },
    file: { data, name: nombre, mimetype: mime(fichero), size: data.length },
    overrideAccess: true,
  });
  subidas.push({ id: doc.id, para, url: doc.url ?? "", creada: true });
  log(`  ${nombre} → media ${doc.id}`);
  return doc.id;
}

try {
  // La marca: no se pisa lo que alguien eligió en el panel.
  const kit = { ...(marca.kit ?? {}) };
  const propia = (campo: unknown) => {
    const id = idDe(campo);
    return id === null || subidas.some((s) => s.id === id);
  };
  if (propia(kit.fotoCabecera)) {
    kit.fotoCabecera = await subir(
      "fondo.jpg",
      `Foto de fondo de la cabecera de ${CFG.nombre}`,
      "fondo",
    );
  } else log("  la marca ya tiene otra foto de cabecera: no se pisa");
  if (propia(kit.emblema)) {
    kit.emblema = await subir("mascota-tinta.webp", CFG.emblemaAlt, "emblema");
    if (idDe(marca.kit?.emblema) === null) kit.mostrarEmblema = mostrarEmblema;
  } else log("  la marca ya tiene otro emblema: no se pisa");
  await payload.update({
    collection: "marcas-maquinaria",
    id: marca.id,
    data: { disenoPagina: "kit", kit },
    overrideAccess: true,
  });
  for (const r of RENDERS) {
    const t = tipoDe(r);
    if (!t) continue;
    if (!propia(t.render)) {
      log(`  «${t.nombre}» ya tiene otro render: no se pisa`);
      continue;
    }
    const id = await subir(
      r.fichero,
      `Render recortado de ${r.nombre} ${CFG.nombre}`,
      `tipo:${r.slug}`,
    );
    await payload.update({
      collection: "tipos-maquinaria",
      id: t.id,
      data: { render: id },
      overrideAccess: true,
    });
  }
} finally {
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(
    MANIFIESTO,
    JSON.stringify({ destino, marca: marca.id, media: subidas }, null, 2),
  );
}
log(
  "✓ hecho. Falta vaciar la caché del sitio (POST /api/revalidar/) para que la página lo muestre.",
);
process.exit(0);
