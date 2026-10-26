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
 *   modo:     simular | aplicar | retirar | simular-logos | retirar-logos
 *   destino:  preview | produccion (solo dirección, con runbook)
 *
 * SOLO LOS LOGOS (Juan Pablo, 2026-10-26: en la banda se quedan los logos de antes, con el diseño
 * nuevo): `retirar-logos` devuelve la lista «Logos de marcas» a la de antes del kit (la del
 * manifiesto) y borra del Blob los 6 logos del kit si nada más los usa; no toca máquinas, reflejos
 * ni fotos. Se niega si la lista ya no es la que dejó el kit (un editor la cambió después).
 * `simular-logos` enseña qué haría, sin escribir. Después, un `aplicar` ya no vuelve a poner los
 * logos del kit (`logosRetirados` en el manifiesto).
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
const MODOS = ["simular", "aplicar", "retirar", "simular-logos", "retirar-logos"] as const;
const modo = args.find((a): a is (typeof MODOS)[number] =>
  (MODOS as readonly string[]).includes(a),
);
/** Las simulaciones no escriben nada (ni base ni Blob). */
const simula = modo === "simular" || modo === "simular-logos";
const destino = args.find((a) => a === "preview" || a === "produccion");
const fallar = (m: string): never => {
  const e = new Error(`[kit-portada] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar(`indica el modo: ${MODOS.join(", ")}`);
if (!destino) fallar("indica el destino: preview o produccion");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino!, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
if (simula) process.env.BLOB_READ_WRITE_TOKEN = "";
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
if (simula) {
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
  /** Los logos del kit se retiraron (`retirar-logos`): `aplicar` ya no los vuelve a poner. */
  logosRetirados?: boolean;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, inicio: null, categorias: [], media: [] };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (!simula) fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
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
  // El nombre exacto, con o sin el sufijo aleatorio del Blob («-d1MBTC…»): «…-yanmar» no es «…-yanmar-reflejo».
  const exacto = new RegExp(`^${base}(-[A-Za-z0-9]+)?[.](webp|png)$`);
  const hallada = ya.docs.find((d) => exacto.test(d.filename ?? ""));
  if (hallada) return hallada.id;
  const ruta = path.join(KIT, fichero);
  if (!fs.existsSync(ruta)) fallar(`no está la imagen del kit: ${ruta}`);
  const datos = fs.readFileSync(ruta);
  const mimetype = fichero.endsWith(".png") ? "image/png" : "image/webp";
  log(`sube ${nombre} (${Math.round(datos.length / 1024)} kB)`);
  if (simula) return null;
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

  // Retirados los del kit, la lista se queda como esté.
  const lista = manifiesto.logosRetirados
    ? ((logos.logos as { nombre: string; logo: number }[] | undefined) ?? [])
    : await listaConElKit();
  const nuevaLogos = {
    ...logos,
    maquina: await id("case580"),
    maquinaReflejo: await id("case580Reflejo"),
    logos: lista,
  };
  log(`logos de la banda: ${lista.map((l) => l.nombre).join(", ")}`);

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
  log(`${simula ? "pondría" : "pone"} las imágenes de la página «inicio»`);

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
    log(`${simula ? "pondría" : "pone"} ${cat.slug}: ${fichero}`);
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
  log(simula ? "SIMULACIÓN: no se ha escrito nada." : "APLICADO. Después, POST /api/revalidar/.");
}

/**
 * La lista «Logos de marcas» con el kit: sus logos primero, en el orden del diseño (con el nombre
 * que ya tenía la marca en la lista), y los demás detrás, como estaban. En simulación las imágenes
 * no se suben (`null`), pero tampoco se escribe nada.
 */
async function listaConElKit(): Promise<{ nombre: string; logo: number }[]> {
  const antes =
    (manifiesto.inicio!.seccionLogos!.logos as { nombre: string; logo: number | null }[]) ?? [];
  const kit = new Set(LOGOS.map(([n]) => claveDeMarca(n)));
  const delKit: { nombre: string; logo: number }[] = [];
  for (const [nombre, fichero] of LOGOS) {
    const previo = antes.find((l) => claveDeMarca(l.nombre) === claveDeMarca(nombre));
    delKit.push({
      nombre: previo?.nombre ?? nombre,
      logo: (await subir(fichero, `Logo de ${nombre}`)) as number,
    });
  }
  const resto = antes
    .filter((l) => !kit.has(claveDeMarca(l.nombre)))
    .map((l) => ({ nombre: l.nombre, logo: l.logo as number }));
  return [...delKit, ...resto];
}

/**
 * SOLO LOS LOGOS: la lista «Logos de marcas» vuelve a la de antes del kit y los 6 logos del kit se
 * borran del Blob si nada más los usa. Lo demás que puso el kit (máquinas, reflejos, fotos) se queda.
 */
async function retirarLogos(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO) || !manifiesto.inicio) {
    fallar(`no hay manifiesto con la lista de antes (${MANIFIESTO})`);
  }
  if (manifiesto.logosRetirados) {
    log("los logos del kit ya se retiraron: nada que hacer");
    return;
  }
  const antes = (
    manifiesto.inicio!.seccionLogos!.logos as { nombre: string; logo: number | null }[]
  ).map((l) => ({ nombre: l.nombre, logo: l.logo as number }));
  const inicio = await paginaInicio();
  const ahora = ((inicio.seccionLogos?.logos ?? []) as { nombre: string; logo: unknown }[]).map(
    (l) => ({ nombre: l.nombre, logo: idDe(l.logo) }),
  );
  // Los 6 logos que subió el kit, por su fichero.
  const delKit = LOGOS.map(([nombre, fichero]) => ({
    nombre,
    media: manifiesto.media.find((f) =>
      f.filename.startsWith(`${PREFIJO}${fichero.replace(/[.]png$/, "")}-`),
    ),
  }));
  const conKit = new Set(LOGOS.map(([n]) => claveDeMarca(n)));

  // La lista tiene que ser la que dejó el kit: los 6 del kit primero y los demás como estaban. Si
  // un editor la cambió después, no se pisa su cambio.
  const esperada = [
    ...delKit.map(({ nombre, media }) => {
      const previo = antes.find((l) => claveDeMarca(l.nombre) === claveDeMarca(nombre));
      return { nombre: previo?.nombre ?? nombre, logo: media?.id ?? null };
    }),
    ...antes.filter((l) => !conKit.has(claveDeMarca(l.nombre))),
  ];
  const texto = (l: { nombre: string; logo: unknown }[]) =>
    l.map((x) => `${x.nombre} (${String(x.logo)})`).join(", ");
  log(`ahora:     ${texto(ahora)}`);
  log(`vuelve a:  ${texto(antes)}`);
  if (JSON.stringify(ahora) !== JSON.stringify(esperada)) {
    fallar(
      `la lista ya no es la que dejó el kit (${texto(esperada)}): no se toca; hazlo en el panel`,
    );
  }

  // Los logos del kit se borran solo si nada más los usa (marcas de repuestos, de nueva o de usados).
  const subidos = delKit.flatMap(({ media }) => (media ? [media] : []));
  const usados = new Set<number>();
  for (const collection of ["marcas", "marcas-maquinaria", "marcas-usada"] as const) {
    const r = await payload.find({
      collection,
      where: { logo: { in: subidos.map((f) => f.id) } },
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });
    for (const d of r.docs) {
      const id = idDe((d as { logo?: unknown }).logo);
      if (id !== null) usados.add(id);
    }
  }
  const borrar = subidos.filter((f) => !usados.has(f.id));
  for (const f of subidos.filter((f) => usados.has(f.id))) {
    log(`⚠ ${f.filename} lo usa una marca: se queda`);
  }
  log(
    `${simula ? "borraría" : "borra"} ${borrar.length} logos del kit: ${borrar.map((f) => f.filename).join(", ")}`,
  );
  if (simula) {
    log("SIMULACIÓN: no se ha escrito nada.");
    return;
  }

  await payload.update({
    collection: "paginas",
    id: inicio.id,
    data: { seccionLogos: { ...(inicio.seccionLogos ?? {}), logos: antes } },
    overrideAccess: true,
  });
  log("lista «Logos de marcas» devuelta a la de antes del kit");
  manifiesto.logosRetirados = true;
  guardar();
  for (const f of borrar) {
    await payload.delete({ collection: "media", id: f.id, overrideAccess: true });
  }
  manifiesto.media = manifiesto.media.filter((f) => !borrar.some((b) => b.id === f.id));
  guardar();
  const urls = borrar.map((f) => f.url).filter(Boolean);
  if (urls.length > 0) {
    log(`logos borrados: ${urls.length}; espero 70 s (propagación del Blob)`);
    await new Promise((r) => setTimeout(r, 70_000));
    const vivas: string[] = [];
    for (const u of urls) if ((await fetch(u, { method: "HEAD" })).status !== 404) vivas.push(u);
    if (vivas.length > 0) fallar(`siguen respondiendo en el Blob: ${vivas.join(", ")}`);
    log("los logos del kit responden 404 en el Blob");
  }
  log("LOGOS DEVUELTOS. Después, POST /api/revalidar/.");
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
else if (modo === "simular-logos" || modo === "retirar-logos") await retirarLogos();
else await aplicar();
process.exit(0);
