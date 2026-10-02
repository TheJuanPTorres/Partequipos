/**
 * COPIA DE DEMOSTRACIÓN DEL PREVIEW A PRODUCCIÓN (CLAUDE.md §10.38).
 *
 * Copia del PREVIEW al DESTINO el contenido de las secciones 2 a 8, 10 y 11 de
 * la portada, las sedes de la sección 9 CON sus fotos (§10.38 cubre todos los
 * assets de ux-9 desde el 2026-10-02) y la imagen decorativa del pie, si el
 * preview la tiene. De los equipos usados, SOLO las fichas de ejemplo de ux-9
 * (las de `preview:ejemplo:sembrar`, marcadas «EJEMPLO UX-9 —»), con su
 * pestaña de la portada. NO toca el hero.
 *
 * Todo lo que CREA es contenido de EJEMPLO de ux-9: el manifiesto lo apunta en
 * `ejemplo`, y `retirar` lo quita de una vez.
 *
 *   npx payload run scripts/demo/copia-demo.ts <modo> <destino> origen=<url del preview> [manifiesto=<ruta>]
 *
 *   modo:     simular  → lista exactamente qué crearía y qué cambiaría; no escribe
 *             copiar    → hace la copia; idempotente (dos veces no duplica)
 *             retirar   → deshace EXACTAMENTE lo que hizo la copia (con el manifiesto)
 *   destino:  produccion → exige base Y token del almacén de producción
 *             prueba     → exige una base LOCAL desechable Y el almacén del preview
 *   origen:   URL FIJA de un despliegue de preview (no el alias).
 *
 * Argumentos POSICIONALES: `payload run` descarta las banderas con guiones.
 *
 * DE DÓNDE LEE: el origen por su API REST, con la cabecera de derivación de la
 * protección de Vercel leída de `.env.preview.local` (nunca se imprime). El
 * destino, con la API local de Payload y la base y el Blob de la sesión.
 *
 * EL MANIFIESTO (JSON, por defecto en `Desktop/partequipos-cierre/`) apunta lo
 * que la copia CREA (ids) y el valor ANTERIOR de lo que MODIFICA. Se escribe
 * tras cada paso: si la copia se corta, se puede repetir y sigue donde iba. La
 * retirada lo usa para dejar el destino como estaba, hero incluido.
 *
 * Lo que ya existe en el destino y NO creó la copia (mismo nombre, misma
 * pregunta…) no se toca ni se borra nunca.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import type { CategoriasTecnica } from "@/payload-types";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import {
  REFERENCIA_AUTORIZACION,
  clave,
  esDeEjemplo,
  origenValido,
  veredictoDestino,
} from "../../src/lib/demo/copiaDemo";
import { almacenDeUrl } from "../../src/lib/blob/almacen";
import { FICHERO_ENTORNO_PREVIEW, leerFicheroEntorno } from "../../src/lib/preview/entornoPreview";

// ------------------------------------------------------------------ argumentos
const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "copiar" || a === "retirar");
const destino = args.find((a) => a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[copia] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};

if (!modo) fallar("indica el modo: simular, copiar o retirar");
const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
if (!v.valido) process.exit(1); // (para el compilador)
// La guarda de las colecciones (§10.37) espera, fuera de Vercel, el almacén del
// preview: aquí se DECLARA el del destino, ya validado arriba con su base.
process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
exigirAlmacen("[copia]");

const MANIFIESTO =
  valorDe("manifiesto") ??
  path.join(os.homedir(), "Desktop", "partequipos-cierre", `manifiesto-copia-demo-${destino}.json`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[copia] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
log(`modo ${modo} · destino ${destino} (${v.host}, almacén ${v.almacen})`);

// ------------------------------------------------------------------ tipos
type Id = number;
type Rel = Id | { id: Id } | null | undefined;
const idDe = (r: Rel): Id | null => (r == null ? null : typeof r === "number" ? r : r.id);

type MediaOrigen = {
  id: Id;
  url: string;
  filename: string;
  mimeType: string;
  filesize: number;
  alt?: string | null;
  focalX?: number | null;
  focalY?: number | null;
};
type VideoOrigen = MediaOrigen & {
  descripcion?: string | null;
  decorativo?: boolean | null;
  poster?: MediaOrigen | null;
};
type Manifiesto = {
  version: 1;
  destino: string;
  origen: string;
  inicio: string;
  estado: "en-curso" | "completa" | "retirada";
  /** El hero del destino ANTES de la copia: la retirada comprueba que sigue igual. */
  hero: string;
  media: Record<string, Id>;
  videos: Record<string, Id>;
  urlsCreadas: string[];
  creados: Record<"equipos-usados" | "testimonios" | "preguntas-frecuentes" | "sedes", Id[]>;
  /**
   * CONTENIDO DE EJEMPLO de ux-9 (§10.38): todo lo creado, por colección, más
   * las imágenes y los vídeos. Es lo que `retirar` borra de una vez.
   */
  ejemplo?: Record<string, Id[]>;
  antes: {
    marcas: Record<
      string,
      {
        logo: Id | null;
        imagenTarjeta: Id | null;
        ordenPortada?: number | null;
        descripcion?: string | null;
      }
    >;
    categorias: Record<
      string,
      {
        ordenPortada: number | null;
        icono: CategoriasTecnica["icono"];
        imagen: Id | null;
        enlace: string | null;
        tituloPortada?: string | null;
      }
    >;
    portada?: {
      id: Id;
      seccionUsada: { imagen: Id | null };
      seccionLogos: { logos: { nombre: string; logo: Id }[] };
      seccionCompania: { video: Id | null; youtube: string | null };
      seccionFaq: { imagen: Id | null };
    };
    pie?: { imagenDecorativa: Id | null };
  };
};

const guardar = (m: Manifiesto) => {
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(m, null, 2));
};
const leerManifiesto = (): Manifiesto | null =>
  fs.existsSync(MANIFIESTO)
    ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
    : null;

// ------------------------------------------------------------------ destino: lecturas
async function portadaDestino() {
  const { docs } = await payload.find({
    collection: "paginas",
    where: { slug: { equals: "inicio" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return docs[0] ?? fallar("el destino no tiene portada (slug «inicio»)");
}
/** El hero, normalizado (ids y textos), para compararlo antes y después. */
const huellaHero = async () => JSON.stringify((await portadaDestino()).hero ?? null);

// ================================================================== RETIRAR
if (modo === "retirar") {
  const m = leerManifiesto() ?? fallar(`no hay manifiesto en ${MANIFIESTO}: nada que retirar`);
  if (m.destino !== destino) fallar(`el manifiesto es del destino «${m.destino}»`);
  if (m.estado === "retirada") {
    log("el manifiesto ya está retirado: nada que hacer");
  } else {
    // 1. Devolver lo modificado a su valor anterior.
    const p = m.antes.portada;
    if (p) {
      await payload.update({
        collection: "paginas",
        id: p.id,
        data: {
          seccionUsada: p.seccionUsada,
          seccionLogos: p.seccionLogos,
          seccionCompania: p.seccionCompania,
          seccionFaq: p.seccionFaq,
        },
        overrideAccess: true,
      });
      log("portada: secciones devueltas a su valor anterior");
    }
    if (m.antes.pie) {
      await payload.updateGlobal({ slug: "pie", data: m.antes.pie, overrideAccess: true });
      log("pie: imagen decorativa devuelta a su valor anterior");
    }
    for (const [id, a] of Object.entries(m.antes.categorias)) {
      await payload.update({
        collection: "categorias-tecnicas",
        id: Number(id),
        data: a,
        overrideAccess: true,
      });
    }
    log(`categorías técnicas devueltas: ${Object.keys(m.antes.categorias).length}`);
    for (const [id, a] of Object.entries(m.antes.marcas)) {
      await payload.update({
        collection: "marcas-maquinaria",
        id: Number(id),
        data: a,
        overrideAccess: true,
      });
    }
    log(`marcas de maquinaria devueltas: ${Object.keys(m.antes.marcas).length}`);

    // 2. Borrar lo creado: primero lo que apunta a ficheros, después los ficheros.
    for (const col of ["sedes", "preguntas-frecuentes", "testimonios", "equipos-usados"] as const) {
      for (const id of m.creados[col]) {
        await payload.delete({ collection: col, id, overrideAccess: true }).catch((e: unknown) => {
          log(`  ${col} ${id}: no estaba (${(e as Error).message.slice(0, 60)})`);
        });
      }
      log(`${col}: ${m.creados[col].length} borrados`);
    }
    for (const id of Object.values(m.videos)) {
      await payload
        .delete({ collection: "videos", id, overrideAccess: true })
        .catch(() => undefined);
    }
    for (const id of Object.values(m.media)) {
      await payload
        .delete({ collection: "media", id, overrideAccess: true })
        .catch(() => undefined);
    }
    log(
      `ficheros borrados: ${Object.keys(m.videos).length} vídeos y ${Object.keys(m.media).length} imágenes`,
    );

    // 3. Comprobaciones.
    const hero = await huellaHero();
    if (hero !== m.hero)
      fallar("el HERO del destino ya no es el de antes de la copia: revisar a mano");
    log("hero: idéntico al de antes de la copia ✓");
    log("espero 70 s (propagación del Blob) y compruebo que los ficheros dan 404");
    await esperar(70_000);
    const vivos: string[] = [];
    for (const u of m.urlsCreadas)
      if ((await fetch(u, { method: "HEAD" })).status !== 404) vivos.push(u);
    if (vivos.length) fallar(`${vivos.length} ficheros siguen en el Blob: ${vivos.join(" ")}`);
    log(`✓ los ${m.urlsCreadas.length} ficheros creados dan 404`);
    m.estado = "retirada";
    guardar(m);
    log(`✓ RETIRADA COMPLETA. Manifiesto: ${MANIFIESTO}`);
  }
}

// ================================================================== SIMULAR / COPIAR
if (modo === "simular" || modo === "copiar") {
  const origen =
    origenValido(valorDe("origen")) ?? fallar("origen=<URL fija de un preview> obligatorio");
  const ficheroPreview = path.resolve(FICHERO_ENTORNO_PREVIEW);
  const bypass = fs.existsSync(ficheroPreview)
    ? leerFicheroEntorno(fs.readFileSync(ficheroPreview, "utf8")).VERCEL_AUTOMATION_BYPASS_SECRET
    : undefined;
  if (!bypass) fallar(`falta el secreto de derivación del preview en ${FICHERO_ENTORNO_PREVIEW}`);
  const get = async <T>(ruta: string): Promise<T> => {
    const r = await fetch(origen + ruta, {
      headers: { "x-vercel-protection-bypass": bypass ?? "" },
    });
    if (!r.ok) fallar(`origen ${ruta}: HTTP ${r.status}`);
    return (await r.json()) as T;
  };
  type Lista<T> = { docs: T[] };

  // ---------------------------------------------------------------- origen: lecturas
  type PaginaO = {
    seccionUsada?: { imagen?: MediaOrigen | null };
    seccionLogos?: { logos?: { nombre: string; logo?: MediaOrigen | null }[] };
    seccionCompania?: { video?: VideoOrigen | null; youtube?: string | null };
    seccionFaq?: { imagen?: MediaOrigen | null };
  };
  const pO =
    (await get<Lista<PaginaO>>("/api/paginas/?where[slug][equals]=inicio&depth=2&limit=1"))
      .docs[0] ?? fallar("el origen no tiene portada");
  type MarcaO = {
    slug: string;
    logo?: MediaOrigen | null;
    imagenTarjeta?: MediaOrigen | null;
    ordenPortada?: number | null;
    descripcion?: string | null;
  };
  const marcasO = (
    await get<Lista<MarcaO>>("/api/marcas-maquinaria/?depth=1&limit=100")
  ).docs.filter((x) => x.logo || x.imagenTarjeta);
  type CatO = {
    slug: string;
    ordenPortada?: number | null;
    icono?: string | null;
    imagen?: MediaOrigen | null;
    enlace?: string | null;
    tituloPortada?: string | null;
  };
  const catsO = (await get<Lista<CatO>>("/api/categorias-tecnicas/?depth=1&limit=100")).docs.filter(
    (x) => typeof x.ordenPortada === "number",
  );
  type EquipoO = {
    nombre: string;
    categoria?: { slug: string } | null;
    marca?: string | null;
    modelo?: string | null;
    anio?: number | null;
    horometro?: number | null;
    ubicacion?: string | null;
    pesoOperativo?: number | null;
    potencia?: number | null;
    motor?: string | null;
    descripcion?: string | null;
    imagenes?: MediaOrigen[] | null;
    disponible?: boolean | null;
    pestanaPortada?: "categoria" | "aditamentos" | null;
  };
  // Solo las fichas de EJEMPLO de ux-9 (marca al principio de la descripción).
  const equiposO = (
    await get<Lista<EquipoO>>("/api/equipos-usados/?depth=1&limit=200")
  ).docs.filter((x) => esDeEjemplo(x.descripcion));
  type TestO = {
    nombre: string;
    empresa?: string | null;
    ciudad?: string | null;
    cita: string;
    foto?: MediaOrigen | null;
    youtube?: string | null;
    orden?: number | null;
    publicado?: boolean | null;
  };
  const testO = (await get<Lista<TestO>>("/api/testimonios/?depth=1&limit=100")).docs.filter(
    (x) => x.publicado,
  );
  type PregO = {
    pregunta: string;
    respuesta: string;
    orden?: number | null;
    publicada?: boolean | null;
  };
  const pregO = (await get<Lista<PregO>>("/api/preguntas-frecuentes/?limit=100")).docs.filter(
    (x) => x.publicada,
  );
  type SedeO = {
    nombre: string;
    ciudad: string;
    departamento: string;
    latitud: number;
    longitud: number;
    lineas?:
      | { linea: string; localidad?: string | null; direccion: string; telefono?: string | null }[]
      | null;
    orden?: number | null;
    foto?: MediaOrigen | null;
  };
  const sedesO = (await get<Lista<SedeO>>("/api/sedes/?depth=1&limit=100")).docs;
  const pieO = await get<{ imagenDecorativa?: MediaOrigen | null }>("/api/globals/pie?depth=1");

  // ---------------------------------------------------------------- plan
  const plan: string[] = [];
  const ficheros = new Map<number, MediaOrigen>();
  const anotar = (x: MediaOrigen | null | undefined) => {
    if (x && typeof x === "object") ficheros.set(x.id, x);
  };
  anotar(pO.seccionUsada?.imagen);
  (pO.seccionLogos?.logos ?? []).forEach((l) => anotar(l.logo));
  anotar(pO.seccionCompania?.video?.poster);
  anotar(pO.seccionFaq?.imagen);
  marcasO.forEach((x) => (anotar(x.logo), anotar(x.imagenTarjeta)));
  catsO.forEach((x) => anotar(x.imagen));
  equiposO.forEach((x) => (x.imagenes ?? []).forEach(anotar));
  testO.forEach((x) => anotar(x.foto));
  sedesO.forEach((x) => anotar(x.foto));
  anotar(pieO.imagenDecorativa);
  const video = pO.seccionCompania?.video ?? null;
  const ajenos = [...ficheros.values()].filter((f) => almacenDeUrl(f.url) === null);
  if (ajenos.length)
    fallar(`hay ficheros del origen fuera del Blob: ${ajenos.map((f) => f.url).join(" ")}`);

  const portada = await portadaDestino();
  const existentes = {
    equipos: (
      await payload.find({
        collection: "equipos-usados",
        limit: 500,
        depth: 0,
        overrideAccess: true,
      })
    ).docs,
    testimonios: (
      await payload.find({ collection: "testimonios", limit: 500, depth: 0, overrideAccess: true })
    ).docs,
    preguntas: (
      await payload.find({
        collection: "preguntas-frecuentes",
        limit: 500,
        depth: 0,
        overrideAccess: true,
      })
    ).docs,
    sedes: (await payload.find({ collection: "sedes", limit: 500, depth: 0, overrideAccess: true }))
      .docs,
    marcas: (
      await payload.find({
        collection: "marcas-maquinaria",
        limit: 500,
        depth: 0,
        overrideAccess: true,
      })
    ).docs,
    categorias: (
      await payload.find({
        collection: "categorias-tecnicas",
        limit: 500,
        depth: 0,
        overrideAccess: true,
      })
    ).docs,
    categoriasUsada: (
      await payload.find({
        collection: "categorias-usada",
        limit: 500,
        depth: 0,
        overrideAccess: true,
      })
    ).docs,
  };
  const previo = leerManifiesto();
  if (previo && previo.estado !== "retirada" && previo.destino !== destino)
    fallar(`el manifiesto ${MANIFIESTO} es de otro destino`);
  const m: Manifiesto =
    previo && previo.estado !== "retirada"
      ? previo
      : {
          version: 1,
          destino: destino ?? "",
          origen,
          inicio: new Date().toISOString(),
          estado: "en-curso",
          hero: await huellaHero(),
          media: {},
          videos: {},
          urlsCreadas: [],
          creados: { "equipos-usados": [], testimonios: [], "preguntas-frecuentes": [], sedes: [] },
          ejemplo: {},
          antes: { marcas: {}, categorias: {} },
        };
  if (m.estado === "completa")
    log("el manifiesto dice que la copia ya está COMPLETA: se comprueba y no se duplica nada");

  const nuevosFicheros = [...ficheros.values()].filter((f) => m.media[String(f.id)] === undefined);
  const kb = (n: number) => `${Math.round(n / 1024)} kB`;
  plan.push(
    `IMÁGENES a crear en Media: ${nuevosFicheros.length} (${kb(nuevosFicheros.reduce((s, f) => s + f.filesize, 0))})`,
  );
  nuevosFicheros.forEach((f) =>
    plan.push(`  + ${f.filename} · ${kb(f.filesize)} · alt «${(f.alt ?? "").slice(0, 50)}»`),
  );
  if (video && m.videos[String(video.id)] === undefined)
    plan.push(
      `VÍDEO a crear: ${video.filename} · ${kb(video.filesize)} (póster ${video.poster?.filename ?? "-"})`,
    );

  const crear = <T>(
    etq: string,
    lista: T[],
    k: (x: T) => string,
    yaEnDestino: string[],
    nombre: (x: T) => string,
  ) => {
    const claves = new Set(yaEnDestino);
    const nuevos = lista.filter((x) => !claves.has(k(x)));
    const saltados = lista.length - nuevos.length;
    plan.push(
      `${etq} a crear: ${nuevos.length}${saltados ? ` (ya existen ${saltados}: no se tocan)` : ""}`,
    );
    nuevos.forEach((x) => plan.push(`  + ${nombre(x)}`));
    return nuevos;
  };
  const equiposNuevos = crear(
    "EQUIPOS USADOS (fichas de ejemplo)",
    equiposO,
    clave.equipo,
    existentes.equipos.map(clave.equipo),
    (x) => `${x.nombre} · ${(x.descripcion ?? "").slice(0, 60)}`,
  );
  const testNuevos = crear(
    "TESTIMONIOS",
    testO,
    clave.testimonio,
    existentes.testimonios.map(clave.testimonio),
    (x) => `${x.empresa} · ${x.nombre}`,
  );
  const pregNuevas = crear(
    "PREGUNTAS FRECUENTES",
    pregO,
    clave.pregunta,
    existentes.preguntas.map(clave.pregunta),
    (x) => x.pregunta,
  );
  const sedesNuevas = crear(
    "SEDES (con foto)",
    sedesO,
    clave.sede,
    existentes.sedes.map(clave.sede),
    (x) => `${x.nombre} · ${x.ciudad}, ${x.departamento}`,
  );

  const marcasMod = marcasO.flatMap((x) => {
    const d = existentes.marcas.find((y) => y.slug === x.slug);
    return d
      ? [{ o: x, d }]
      : (plan.push(`  ! marca «${x.slug}» no existe en el destino: se omite`), []);
  });
  plan.push(
    `MARCAS DE MAQUINARIA a modificar (logo, imagen de tarjeta, posición y texto): ${marcasMod.map((x) => x.o.slug).join(", ") || "ninguna"}`,
  );
  const catsMod = catsO.flatMap((x) => {
    const d = existentes.categorias.find((y) => y.slug === x.slug);
    return d
      ? [{ o: x, d }]
      : (plan.push(`  ! categoría «${x.slug}» no existe en el destino: se omite`), []);
  });
  plan.push(
    `CATEGORÍAS TÉCNICAS a modificar (posición, icono, imagen, enlace y título en portada): ${catsMod.map((x) => x.o.slug).join(", ") || "ninguna"}`,
  );
  plan.push(
    `PORTADA a modificar: sección 3 (imagen), sección 4 (${(pO.seccionLogos?.logos ?? []).length} logos), sección 6–8 (vídeo y YouTube), sección 11 (imagen). EL HERO NO SE TOCA.`,
  );
  plan.push(
    `PIE: imagen decorativa ${pieO.imagenDecorativa ? `→ ${pieO.imagenDecorativa.filename}` : "— el origen no tiene; no se toca"}`,
  );

  log("===== PLAN =====");
  plan.forEach((l) => log(l));
  log("================");

  if (modo === "copiar") {
    guardar(m);
    log(`manifiesto: ${MANIFIESTO}`);

    /** Sube al destino una copia del fichero del origen (o reutiliza la ya copiada). */
    const copiarMedia = async (f: MediaOrigen | null | undefined): Promise<Id | null> => {
      if (!f) return null;
      const ya = m.media[String(f.id)];
      if (ya !== undefined) return ya;
      const r = await fetch(f.url);
      if (!r.ok) fallar(`no se pudo leer ${f.url}: HTTP ${r.status}`);
      const data = Buffer.from(await r.arrayBuffer());
      const doc = await payload.create({
        collection: "media",
        data: { alt: f.alt ?? "", focalX: f.focalX ?? 50, focalY: f.focalY ?? 50 },
        file: { data, mimetype: f.mimeType, name: f.filename, size: data.length },
        overrideAccess: true,
      });
      m.media[String(f.id)] = doc.id;
      if (doc.url) m.urlsCreadas.push(doc.url);
      guardar(m);
      log(`  media ${f.filename} → id ${doc.id}`);
      return doc.id;
    };

    // Portada: valores anteriores (solo la primera vez) y nuevos.
    m.antes.portada ??= {
      id: portada.id,
      seccionUsada: { imagen: idDe(portada.seccionUsada?.imagen as Rel) },
      seccionLogos: {
        logos: (portada.seccionLogos?.logos ?? []).flatMap((l) => {
          const logo = idDe(l.logo as Rel);
          return logo === null ? [] : [{ nombre: l.nombre, logo }];
        }),
      },
      seccionCompania: {
        video: idDe(portada.seccionCompania?.video as Rel),
        youtube: portada.seccionCompania?.youtube ?? null,
      },
      seccionFaq: { imagen: idDe(portada.seccionFaq?.imagen as Rel) },
    };
    guardar(m);

    let videoId: Id | null = null;
    if (video) {
      videoId = m.videos[String(video.id)] ?? null;
      if (videoId === null) {
        const poster = await copiarMedia(video.poster);
        const r = await fetch(video.url);
        if (!r.ok) fallar(`no se pudo leer el vídeo: HTTP ${r.status}`);
        const data = Buffer.from(await r.arrayBuffer());
        const doc = await payload.create({
          collection: "videos",
          data: {
            descripcion: video.descripcion ?? "",
            decorativo: video.decorativo ?? true,
            poster: poster ?? 0,
          },
          file: { data, mimetype: video.mimeType, name: video.filename, size: data.length },
          overrideAccess: true,
        });
        videoId = doc.id;
        m.videos[String(video.id)] = doc.id;
        if (doc.url) m.urlsCreadas.push(doc.url);
        guardar(m);
        log(`  vídeo ${video.filename} → id ${doc.id}`);
      }
    }
    const logos: { nombre: string; logo: Id }[] = [];
    for (const l of pO.seccionLogos?.logos ?? []) {
      const logo = await copiarMedia(l.logo);
      if (logo !== null) logos.push({ nombre: l.nombre, logo });
    }
    await payload.update({
      collection: "paginas",
      id: portada.id,
      data: {
        seccionUsada: { imagen: await copiarMedia(pO.seccionUsada?.imagen) },
        seccionLogos: { logos },
        seccionCompania: { video: videoId, youtube: pO.seccionCompania?.youtube ?? null },
        seccionFaq: { imagen: await copiarMedia(pO.seccionFaq?.imagen) },
      },
      overrideAccess: true,
    });
    log("portada: secciones 3, 4, 6–8 y 11");

    for (const { o, d } of marcasMod) {
      m.antes.marcas[String(d.id)] ??= {
        logo: idDe(d.logo as Rel),
        imagenTarjeta: idDe(d.imagenTarjeta as Rel),
        ordenPortada: d.ordenPortada ?? null,
        descripcion: d.descripcion ?? null,
      };
      guardar(m);
      await payload.update({
        collection: "marcas-maquinaria",
        id: d.id,
        data: {
          logo: await copiarMedia(o.logo),
          imagenTarjeta: await copiarMedia(o.imagenTarjeta),
          ordenPortada: o.ordenPortada ?? null,
          ...(o.descripcion ? { descripcion: o.descripcion } : {}),
        },
        overrideAccess: true,
      });
    }
    log(`marcas: ${marcasMod.length}`);

    for (const { o, d } of catsMod) {
      m.antes.categorias[String(d.id)] ??= {
        ordenPortada: d.ordenPortada ?? null,
        icono: d.icono ?? null,
        imagen: idDe(d.imagen as Rel),
        enlace: d.enlace ?? null,
        tituloPortada: d.tituloPortada ?? null,
      };
      guardar(m);
      await payload.update({
        collection: "categorias-tecnicas",
        id: d.id,
        data: {
          ordenPortada: o.ordenPortada ?? null,
          icono: (o.icono ?? null) as CategoriasTecnica["icono"],
          imagen: await copiarMedia(o.imagen),
          enlace: o.enlace ?? null,
          tituloPortada: o.tituloPortada ?? null,
        },
        overrideAccess: true,
      });
    }
    log(`categorías técnicas: ${catsMod.length}`);

    for (const e of equiposNuevos) {
      const cat = existentes.categoriasUsada.find((c) => c.slug === e.categoria?.slug);
      if (!cat) {
        log(
          `  ! equipo «${e.nombre}»: la categoría «${e.categoria?.slug}» no existe en el destino; se omite`,
        );
        continue;
      }
      const imagenes: Id[] = [];
      for (const i of e.imagenes ?? []) {
        const id = await copiarMedia(i);
        if (id !== null) imagenes.push(id);
      }
      const doc = await payload.create({
        collection: "equipos-usados",
        data: {
          nombre: e.nombre,
          categoria: cat.id,
          marca: e.marca ?? null,
          modelo: e.modelo ?? null,
          anio: e.anio ?? null,
          horometro: e.horometro ?? null,
          ubicacion: e.ubicacion ?? null,
          pesoOperativo: e.pesoOperativo ?? null,
          potencia: e.potencia ?? null,
          motor: e.motor ?? null,
          descripcion: e.descripcion ?? null,
          imagenes,
          disponible: e.disponible ?? true,
          pestanaPortada: e.pestanaPortada ?? "categoria",
        },
        overrideAccess: true,
      });
      m.creados["equipos-usados"].push(doc.id);
      guardar(m);
    }
    log(`equipos usados: ${equiposNuevos.length}`);

    for (const t of testNuevos) {
      const doc = await payload.create({
        collection: "testimonios",
        data: {
          nombre: t.nombre,
          empresa: t.empresa ?? null,
          ciudad: t.ciudad ?? null,
          cita: t.cita,
          foto: await copiarMedia(t.foto),
          youtube: t.youtube ?? null,
          orden: t.orden ?? null,
          autorizacionUso: true,
          fechaAutorizacion: new Date().toISOString(),
          referenciaAutorizacion: REFERENCIA_AUTORIZACION,
          publicado: true,
        },
        overrideAccess: true,
      });
      m.creados.testimonios.push(doc.id);
      guardar(m);
    }
    log(`testimonios: ${testNuevos.length}`);

    for (const q of pregNuevas) {
      const doc = await payload.create({
        collection: "preguntas-frecuentes",
        data: {
          pregunta: q.pregunta,
          respuesta: q.respuesta,
          orden: q.orden ?? null,
          publicada: true,
        },
        overrideAccess: true,
      });
      m.creados["preguntas-frecuentes"].push(doc.id);
      guardar(m);
    }
    log(`preguntas frecuentes: ${pregNuevas.length}`);

    for (const s of sedesNuevas) {
      const doc = await payload.create({
        collection: "sedes",
        data: {
          nombre: s.nombre,
          ciudad: s.ciudad,
          departamento: s.departamento,
          latitud: s.latitud,
          longitud: s.longitud,
          lineas: (s.lineas ?? []).map(({ linea, localidad, direccion, telefono }) => ({
            linea,
            localidad: localidad ?? null,
            direccion,
            telefono: telefono ?? null,
          })),
          orden: s.orden ?? null,
          foto: await copiarMedia(s.foto),
        },
        overrideAccess: true,
      });
      m.creados.sedes.push(doc.id);
      guardar(m);
    }
    log(`sedes: ${sedesNuevas.length}`);

    if (pieO.imagenDecorativa) {
      const pie = await payload.findGlobal({ slug: "pie", depth: 0, overrideAccess: true });
      m.antes.pie ??= { imagenDecorativa: idDe(pie.imagenDecorativa as Rel) };
      guardar(m);
      await payload.updateGlobal({
        slug: "pie",
        data: { imagenDecorativa: await copiarMedia(pieO.imagenDecorativa) },
        overrideAccess: true,
      });
      log("pie: imagen decorativa");
    }

    if ((await huellaHero()) !== m.hero) fallar("el HERO cambió durante la copia: revisar a mano");
    log("hero: sin cambios ✓");
    // Todo lo creado es contenido de EJEMPLO de ux-9 (§10.38).
    m.ejemplo = {
      ...m.creados,
      media: Object.values(m.media),
      videos: Object.values(m.videos),
    };
    m.estado = "completa";
    guardar(m);
    log(`✓ COPIA COMPLETA. Manifiesto: ${MANIFIESTO}`);
    log("Recuerda: la copia no refresca el sitio desplegado. Redespliega (§10.6).");
  }
}
