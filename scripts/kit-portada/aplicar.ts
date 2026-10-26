/**
 * EL KIT DE LA PORTADA DEL CLIENTE (2026-10-26): sube a «Imágenes» las imágenes del kit (renders,
 * reflejos, piezas de las categorías y logos, ya optimizadas en WebP/PNG) y las elige en el panel:
 *
 * - Página «inicio» → «Maquinaria pesada usada»: la máquina de la cabecera y las tres del filtro.
 * - «Venta de repuestos»: la máquina y su reflejo, y «Ver todos» en el botón de cada tarjeta.
 * - «Logos de marcas»: la máquina y su reflejo, y los logos del kit (Dynapac, Yanmar, Caterpillar,
 *   Hitachi, Case y LiuGong, en el orden del diseño) delante de los demás, que siguen como estaban.
 * - Cada categoría técnica: su «Foto en la portada».
 *
 *   npm run preview:ejecutar -- npx payload run scripts/kit-portada/aplicar.ts <modo> <destino>
 *
 *   modo:     simular | aplicar | retirar
 *   destino:  preview | produccion (solo dirección, con runbook)
 *
 * - Las imágenes están FUERA del repositorio: `Desktop/partequipos-diseno/portada/_optimizadas/`.
 * - Idempotente: una imagen ya subida (mismo nombre) no se vuelve a subir.
 * - El manifiesto guarda el valor de antes de cada campo; la retirada lo devuelve y borra solo las
 *   imágenes que subió.
 * - NO refresca el sitio: después, `POST /api/revalidar/`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { claveDeMarca } from "../../src/lib/marca/logoMarca";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[kit-portada] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!destino) fallar("indica el destino: preview o produccion");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino!, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[kit-portada]");

const ESCRITORIO = path.join(os.homedir(), "Desktop");
const KIT = path.join(ESCRITORIO, "partequipos-diseno", "portada", "_optimizadas");
const MANIFIESTO = path.join(
  ESCRITORIO,
  "partequipos-cierre",
  `manifiesto-kit-portada-${destino}.json`,
);
const PREFIJO = "kit-portada-";

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
const log = (m: string) => process.stdout.write(`[kit-portada] ${m}\n`);

/** Las imágenes del kit: fichero optimizado y texto alternativo (descriptivo, `altFlojo`). */
const IMAGENES = {
  excavadora: [
    "usados-excavadora-hitachi-zx210.webp",
    "Excavadora Hitachi ZX210 recortada sobre fondo transparente",
  ],
  otros: ["usados-filtro-otros-case.webp", "Bulldozer Case recortado sobre fondo transparente"],
  aditamento: [
    "usados-filtro-aditamento-balde.webp",
    "Balde de excavadora recortado sobre fondo transparente",
  ],
  yanmar: [
    "repuestos-miniexcavadora-yanmar.webp",
    "Miniexcavadora Yanmar recortada sobre fondo transparente",
  ],
  yanmarReflejo: [
    "repuestos-miniexcavadora-yanmar-reflejo.webp",
    "Reflejo en el piso de la miniexcavadora Yanmar",
  ],
  case580: [
    "marcas-retroexcavadora-case-580n.webp",
    "Retroexcavadora Case 580N recortada sobre fondo transparente",
  ],
  case580Reflejo: [
    "marcas-retroexcavadora-case-580n-reflejo.webp",
    "Reflejo en el piso de la retroexcavadora Case 580N",
  ],
} as const;

/** Los logos del kit, en el orden del diseño (los SVG del cliente, pasados a PNG). */
const LOGOS: [string, string][] = [
  ["Dynapac", "logo-dynapac.png"],
  ["Yanmar", "logo-yanmar.png"],
  ["Caterpillar", "logo-caterpillar.png"],
  ["Hitachi", "logo-hitachi.png"],
  ["Case", "logo-case.png"],
  ["LiuGong", "logo-liugong.png"],
];

/**
 * La pieza de cada categoría técnica, por el PRINCIPIO de su dirección web y solo entre las de
 * primer nivel («Filtros Donaldson», que cuelga de «Filtración», no cuenta).
 */
const CATEGORIAS: [RegExp, string, string][] = [
  [/^tren/, "repuestos-categoria-tren.webp", "Cadena y rodillos de tren de rodaje"],
  [/^filtracion/, "repuestos-categoria-filtracion.webp", "Filtros para maquinaria pesada"],
  [
    /^(herramienta|balde)/,
    "repuestos-categoria-baldes.webp",
    "Balde y dientes de herramienta de corte",
  ],
  [/^lubric/, "repuestos-categoria-lubricantes.webp", "Envases de lubricantes para maquinaria"],
  [/^llanta/, "repuestos-categoria-llantas.webp", "Llanta y rin para maquinaria pesada"],
  [/^miscel/, "repuestos-categoria-miscelaneos.webp", "Repuestos misceláneos para maquinaria"],
  [
    /^componentes-mayores/,
    "repuestos-categoria-componentes.webp",
    "Componentes mayores de maquinaria pesada",
  ],
  [
    /^(motor|repuestos-para-motor)/,
    "repuestos-categoria-motor.webp",
    "Repuestos para motor diésel",
  ],
  [/^transmis/, "repuestos-categoria-transmision.webp", "Piezas de transmisión para maquinaria"],
  [
    /^(componentes-hidraul|hidraul)/,
    "repuestos-categoria-hidraulicos.webp",
    "Componentes hidráulicos para maquinaria",
  ],
];

type Manifiesto = {
  destino: string;
  /** Los grupos de la página «inicio» tal como estaban (solo los campos que toca). */
  inicio: Record<string, Record<string, unknown>> | null;
  categorias: { id: number; slug: string; antes: number | null }[];
  media: { id: number; filename: string; url: string }[];
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, inicio: null, categorias: [], media: [] };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};
const idDe = (v: unknown): number | null =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? idDe(v.id) : null;

async function paginaInicio() {
  const r = await payload.find({
    collection: "paginas",
    where: { slug: { equals: "inicio" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return r.docs[0] ?? fallar("no está la página «inicio»");
}

/** Sube una imagen del kit (o devuelve la ya subida con ese nombre). En simulación, `null`. */
async function subir(fichero: string, alt: string): Promise<number | null> {
  const nombre = `${PREFIJO}${fichero}`;
  const base = nombre.replace(/\.[a-z]+$/, "");
  const ya = await payload.find({
    collection: "media",
    where: { filename: { contains: base } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const hallada = ya.docs.find((d) => d.filename?.startsWith(base));
  if (hallada) return hallada.id;
  const ruta = path.join(KIT, fichero);
  if (!fs.existsSync(ruta)) fallar(`no está la imagen del kit: ${ruta}`);
  const datos = fs.readFileSync(ruta);
  const mimetype = fichero.endsWith(".png") ? "image/png" : "image/webp";
  log(`sube ${nombre} (${Math.round(datos.length / 1024)} kB)`);
  if (modo === "simular") return null;
  const doc = await payload.create({
    collection: "media",
    data: { alt, focalX: 50, focalY: 50 },
    file: { data: datos, mimetype, name: nombre, size: datos.length },
    overrideAccess: true,
  });
  const g = await payload.findByID({
    collection: "media",
    id: doc.id,
    depth: 0,
    overrideAccess: true,
  });
  manifiesto.media.push({ id: doc.id, filename: g.filename ?? nombre, url: g.url ?? "" });
  guardar();
  return doc.id;
}

async function aplicar(): Promise<void> {
  const inicio = await paginaInicio();
  const usada = (inicio.seccionUsada ?? {}) as Record<string, unknown>;
  const repuestos = (inicio.seccionRepuestos ?? {}) as Record<string, unknown>;
  const logos = (inicio.seccionLogos ?? {}) as Record<string, unknown>;

  // El valor de antes, la primera vez (una segunda pasada no lo pisa).
  if (!manifiesto.inicio) {
    manifiesto.inicio = {
      seccionUsada: {
        imagen: idDe(usada.imagen),
        imagenExcavadoras: idDe(usada.imagenExcavadoras),
        imagenOtros: idDe(usada.imagenOtros),
        imagenAditamentos: idDe(usada.imagenAditamentos),
      },
      seccionRepuestos: {
        maquina: idDe(repuestos.maquina),
        maquinaReflejo: idDe(repuestos.maquinaReflejo),
        verMasTexto: repuestos.verMasTexto ?? null,
      },
      seccionLogos: {
        maquina: idDe(logos.maquina),
        maquinaReflejo: idDe(logos.maquinaReflejo),
        logos: ((logos.logos as { nombre: string; logo: unknown }[] | undefined) ?? []).map(
          (l) => ({
            nombre: l.nombre,
            logo: idDe(l.logo),
          }),
        ),
      },
    };
    guardar();
  }

  const id = async (k: keyof typeof IMAGENES) => subir(IMAGENES[k][0], IMAGENES[k][1]);
  const excavadora = await id("excavadora");
  const nuevaUsada = {
    ...usada,
    imagen: excavadora,
    imagenExcavadoras: excavadora,
    imagenOtros: await id("otros"),
    imagenAditamentos: await id("aditamento"),
  };
  const nuevaRepuestos = {
    ...repuestos,
    maquina: await id("yanmar"),
    maquinaReflejo: await id("yanmarReflejo"),
    verMasTexto: "Ver todos",
  };

  // Los logos del kit primero, en el orden del diseño; los demás detrás, como estaban.
  const actuales =
    (manifiesto.inicio.seccionLogos!.logos as { nombre: string; logo: number | null }[]) ?? [];
  const kit = new Set(LOGOS.map(([n]) => claveDeMarca(n)));
  // En simulación las imágenes no se suben (`null`), pero tampoco se escribe nada.
  const delKit: { nombre: string; logo: number }[] = [];
  for (const [nombre, fichero] of LOGOS) {
    const previo = actuales.find((l) => claveDeMarca(l.nombre) === claveDeMarca(nombre));
    delKit.push({
      nombre: previo?.nombre ?? nombre,
      logo: (await subir(fichero, `Logo de ${nombre}`)) as number,
    });
  }
  const resto = actuales
    .filter((l) => !kit.has(claveDeMarca(l.nombre)))
    .map((l) => ({ nombre: l.nombre, logo: l.logo as number }));
  const nuevaLogos = {
    ...logos,
    maquina: await id("case580"),
    maquinaReflejo: await id("case580Reflejo"),
    logos: [...delKit, ...resto],
  };
  log(`logos de la banda: ${[...delKit, ...resto].map((l) => l.nombre).join(", ")}`);

  if (modo === "aplicar") {
    await payload.update({
      collection: "paginas",
      id: inicio.id,
      data: {
        seccionUsada: nuevaUsada,
        seccionRepuestos: nuevaRepuestos,
        seccionLogos: nuevaLogos,
      },
      overrideAccess: true,
    });
  }
  log(`${modo === "simular" ? "pondría" : "pone"} las imágenes de la página «inicio»`);

  const { docs: todas } = await payload.find({
    collection: "categorias-tecnicas",
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });
  const cats = todas.filter((c) => !c.padre);
  const conPieza = new Set<number>();
  for (const [patron, fichero, alt] of CATEGORIAS) {
    const cat = cats.find((c) => patron.test(c.slug));
    if (!cat) {
      log(`⚠ ninguna categoría técnica casa con ${patron}: su pieza no se pone`);
      continue;
    }
    conPieza.add(cat.id);
    const foto = await subir(fichero, alt);
    log(`${modo === "simular" ? "pondría" : "pone"} ${cat.slug}: ${fichero}`);
    if (!manifiesto.categorias.some((c) => c.id === cat.id)) {
      manifiesto.categorias.push({ id: cat.id, slug: cat.slug, antes: idDe(cat.imagenPortada) });
      guardar();
    }
    if (modo === "aplicar") {
      await payload.update({
        collection: "categorias-tecnicas",
        id: cat.id,
        data: { imagenPortada: foto },
        overrideAccess: true,
      });
    }
  }
  for (const c of cats) {
    if (typeof c.ordenPortada === "number" && !conPieza.has(c.id)) {
      log(`⚠ ${c.slug} sale en la portada y se queda sin pieza (usa su «Imagen de la tarjeta»)`);
    }
  }
  log(
    modo === "simular"
      ? "SIMULACIÓN: no se ha escrito nada."
      : "APLICADO. Después, POST /api/revalidar/.",
  );
}

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  if (manifiesto.inicio) {
    const inicio = await paginaInicio();
    const antes = manifiesto.inicio;
    await payload.update({
      collection: "paginas",
      id: inicio.id,
      data: {
        seccionUsada: { ...(inicio.seccionUsada ?? {}), ...antes.seccionUsada },
        seccionRepuestos: { ...(inicio.seccionRepuestos ?? {}), ...antes.seccionRepuestos },
        seccionLogos: { ...(inicio.seccionLogos ?? {}), ...antes.seccionLogos },
      },
      overrideAccess: true,
    });
    log("página «inicio» devuelta a sus valores de antes");
  }
  for (const c of manifiesto.categorias) {
    await payload.update({
      collection: "categorias-tecnicas",
      id: c.id,
      data: { imagenPortada: c.antes },
      overrideAccess: true,
    });
  }
  log(`categorías devueltas: ${manifiesto.categorias.length}`);
  for (const f of manifiesto.media) {
    await payload.delete({ collection: "media", id: f.id, overrideAccess: true }).catch(() => null);
  }
  const urls = manifiesto.media.map((f) => f.url).filter(Boolean);
  if (urls.length > 0) {
    log(`imágenes borradas: ${urls.length}; espero 70 s (propagación del Blob)`);
    await new Promise((r) => setTimeout(r, 70_000));
    const vivas: string[] = [];
    for (const u of urls) if ((await fetch(u, { method: "HEAD" })).status !== 404) vivas.push(u);
    if (vivas.length > 0) fallar(`siguen respondiendo en el Blob: ${vivas.join(", ")}`);
    log("las imágenes responden 404 en el Blob");
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Después, POST /api/revalidar/.");
}

if (modo === "retirar") await retirar();
else await aplicar();
process.exit(0);
