/**
 * «DOCUMENTO EN VISOR» (2026-10-20): prepara los datos del visor tipo libro.
 *
 * 1. `paginas` — sube a «Imágenes» las páginas de un PDF ya convertidas a PNG
 *    (`scripts/documentos/rasterizar-pdf.mjs`), en WebP, y las pone en las
 *    «Páginas como imágenes» del documento:
 *
 *      npm run preview:ejecutar -- payload run scripts/documentos/visor.ts paginas preview documento=<id> carpeta=<carpeta del rasterizado>
 *
 *    En vez de `documento=<id>`, `fichero=<parte del nombre del PDF>` (p. ej.
 *    `fichero=da-mvl-09`): tiene que coincidir con UN solo documento.
 *
 * 1b. `fichas` — lo mismo, de una vez, para los PDF de «Ficha técnica completa
 *    (PDF)» de los equipos nuevos que aún no tienen páginas (los descarga y los
 *    rasteriza él mismo; `limite=<n>` o `documento=<id>` para hacer menos):
 *
 *      npm run preview:ejecutar -- payload run scripts/documentos/visor.ts fichas preview
 *
 *    Con `de=lubricantes` (2026-10-22), los PDF de «Ficha técnica» de los productos de las
 *    líneas de lubricante, que se abren en el visor desde la página de cada línea:
 *
 *      npm run preview:ejecutar -- payload run scripts/documentos/visor.ts fichas preview de=lubricantes
 *
 * 2. `pagina` — en una página institucional, cambia cada párrafo que solo
 *    enlaza a un PDF de «Documentos» por el bloque «Documento en visor» de ese
 *    documento (dentro de su sección, en el mismo sitio):
 *
 *      npm run preview:ejecutar -- payload run scripts/documentos/visor.ts pagina preview slug=politica-de-garantia-de-repuestos
 *
 * 3. `retirar` — deshace EXACTAMENTE lo del manifiesto: devuelve las secciones
 *    y las «Páginas como imágenes» a como estaban y borra las imágenes subidas
 *    (comprueba que dan 404 en el Blob).
 *
 * Añadir `simular` como argumento enseña lo que haría sin escribir nada.
 * MANIFIESTO fuera del repositorio:
 * `Desktop/partequipos-cierre/manifiesto-documento-visor-<destino>.json`.
 * Destinos: `preview` (con la guarda del hero de prueba) o `produccion` (por
 * runbook de dirección, con la guarda de destino y del almacén).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { cambiarEnlacesPorVisor, type EstadoLexical } from "../../src/lib/documentos/enPagina";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find(
  (a) => a === "paginas" || a === "fichas" || a === "pagina" || a === "retirar",
);
const destino = args.find((a) => a === "preview" || a === "produccion");
const simular = args.includes("simular");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  // `payload run` sale con 0 tras el import: para fallar, hay que lanzar (CLAUDE.md §10.25).
  const e = new Error(`[visor] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: paginas, fichas, pagina o retirar");
if (!destino) fallar("indica el destino: preview o produccion");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[visor]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-documento-visor-${destino}.json`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[visor] ${m}\n`);

// ---------- Manifiesto ----------

type Fichero = { id: number; filename: string; url: string };
type Manifiesto = {
  destino: string;
  /** Por documento: sus «Páginas como imágenes» de antes y las imágenes subidas. */
  documentos: { id: number; antes: number[]; media: Fichero[] }[];
  /** Por página: el contenido de cada sección ANTES de poner los visores. */
  paginas: { id: number; slug: string; secciones: { id: string; contenido: unknown }[] }[];
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, documentos: [], paginas: [] };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
function guardarManifiesto() {
  if (simular) return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
}

const idDe = (v: unknown): number | null =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? Number(v.id) : null;

// ---------- 1. Páginas de un documento ----------

/** El id del ÚNICO documento cuyo nombre de fichero contiene `parte` (sin distinguir mayúsculas). */
async function idPorFichero(parte: string | undefined): Promise<number> {
  if (!parte) return fallar("falta documento=<id> o fichero=<parte del nombre del PDF>");
  const buscado = parte.toLowerCase();
  const docs = (
    await payload.find({ collection: "documentos", depth: 0, limit: 0, overrideAccess: true })
  ).docs.filter((d) => (d.filename ?? "").toLowerCase().includes(buscado));
  if (docs.length !== 1) {
    fallar(
      `fichero=${parte}: ${docs.length} documentos coinciden (${docs.map((d) => `${d.id} ${d.filename}`).join(", ") || "ninguno"}); tiene que ser uno`,
    );
  }
  return docs[0]!.id;
}

async function subirPaginas(): Promise<void> {
  const carpeta = valorDe("carpeta");
  const id = Number(valorDe("documento")) || (await idPorFichero(valorDe("fichero")));
  if (!carpeta || !fs.existsSync(path.join(carpeta, "paginas.json"))) {
    fallar(`falta carpeta=<carpeta> con el paginas.json del rasterizado (${carpeta ?? "—"})`);
  }
  await subirPaginasDe(id, carpeta!);
}

/** Sube las páginas ya rasterizadas en `carpeta` y las pone en el documento `id`. */
async function subirPaginasDe(id: number, carpeta: string): Promise<void> {
  const doc = await payload.findByID({
    collection: "documentos",
    id,
    depth: 0,
    overrideAccess: true,
  });
  const antes = (doc.paginas ?? []).flatMap((p) => idDe(p) ?? []);
  // Una ejecución cortada a medias deja el documento en el manifiesto y sin páginas: se reanuda.
  const previa = manifiesto.documentos.find((d) => d.id === id);
  if (previa && antes.length) {
    log(`el documento ${id} («${doc.titulo}») ya tiene sus páginas de este script: nada que hacer`);
    return;
  }
  if (!previa && antes.length) {
    fallar(
      `el documento ${id} ya tiene ${antes.length} «Páginas como imágenes» que no puso este script: no se pisan`,
    );
  }
  const { paginas } = JSON.parse(fs.readFileSync(path.join(carpeta, "paginas.json"), "utf8")) as {
    paginas: { n: number; fichero: string }[];
  };
  // Sin el sufijo aleatorio que el Blob puso al PDF («-AbC…» de 30 caracteres).
  const base = path
    .basename(doc.filename ?? `documento-${id}`, ".pdf")
    .replace(/-[A-Za-z0-9]{30}$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .replace(/-$/, "");
  const hechas = previa?.media.length ?? 0;
  log(
    `documento ${id} («${doc.titulo}»): ${paginas.length} páginas${hechas ? `, se reanuda tras la ${hechas}` : ""}${simular ? " (simulación)" : ""}`,
  );
  if (simular) return;

  const entrada = previa ?? { id, antes, media: [] as Fichero[] };
  if (!previa) manifiesto.documentos.push(entrada);
  // Las páginas se suben en orden: las `hechas` primeras ya están en el manifiesto.
  for (const p of paginas.slice(hechas)) {
    const webp = await sharp(path.join(carpeta, p.fichero)).webp({ quality: 82 }).toBuffer();
    const nombre = `${base}-pagina-${String(p.n).padStart(2, "0")}.webp`;
    const media = await payload.create({
      collection: "media",
      data: {
        alt: `Página ${p.n} de ${paginas.length} de «${doc.titulo}»`,
        focalX: 50,
        focalY: 50,
      },
      file: { data: webp, mimetype: "image/webp", name: nombre, size: webp.length },
      overrideAccess: true,
    });
    // La URL, leída después de crear: la que devuelve `create` no lleva el sufijo del Blob.
    const guardada = await payload.findByID({
      collection: "media",
      id: media.id,
      depth: 0,
      overrideAccess: true,
    });
    entrada.media.push({
      id: media.id,
      filename: guardada.filename ?? nombre,
      url: guardada.url ?? "",
    });
    guardarManifiesto();
    log(`  página ${p.n}: media ${media.id} (${Math.round(webp.length / 1024)} KB)`);
  }
  await payload.update({
    collection: "documentos",
    id,
    data: { paginas: entrada.media.map((m) => m.id) },
    overrideAccess: true,
  });
  log(`✓ «Páginas como imágenes» del documento ${id}: ${entrada.media.length}`);
}

// ---------- 1b. Páginas de las fichas técnicas de maquinaria nueva ----------

/*
 * `fichas` (2026-10-21, ficha nueva de Andrés): «Ficha técnica» abre el PDF del
 * equipo en el visor, así que cada PDF de «Ficha técnica completa (PDF)» de los
 * equipos nuevos necesita sus «Páginas como imágenes». Para cada uno que aún no
 * las tenga: lo descarga, lo rasteriza con `rasterizar-pdf.mjs` (pdf.js por
 * `npx`, fuera del proyecto) y sube sus páginas como `paginas`. Lo que sube
 * queda en el manifiesto: `retirar` lo deshace igual que lo demás.
 * `limite=<n>` hace solo los n primeros; `documento=<id>`, solo ese. Si se
 * corta (la conexión a la base cayó en el preview con el equipo en reposo),
 * volver a lanzarlo salta los hechos y reanuda el que quedó a medias.
 * `rehacer=<id>` borra las páginas que ESTE script subió a ese documento (las
 * del manifiesto) y las vuelve a generar: así se rehízo la ZX690LC-6, que se
 * rasterizó sin el decodificador de JPEG 2000 (imágenes en blanco).
 */
async function paginasDeFichas(): Promise<void> {
  const limite = Number(valorDe("limite")) || Infinity;
  const rehacer = Number(valorDe("rehacer")) || null;
  const solo = Number(valorDe("documento")) || rehacer;
  if (rehacer) {
    const entrada = manifiesto.documentos.find((d) => d.id === rehacer);
    if (!entrada) fallar(`rehacer=${rehacer}: ese documento no está en el manifiesto`);
    log(
      `rehacer el documento ${rehacer}: ${entrada!.media.length} páginas a borrar${simular ? " (simulación)" : ""}`,
    );
    if (simular) return;
    await payload.update({
      collection: "documentos",
      id: rehacer,
      data: { paginas: entrada!.antes },
      overrideAccess: true,
    });
    for (const m of entrada!.media) {
      await payload
        .delete({ collection: "media", id: m.id, overrideAccess: true })
        .catch(() => null);
    }
    manifiesto.documentos = manifiesto.documentos.filter((d) => d.id !== rehacer);
    guardarManifiesto();
    log(`  páginas del documento ${rehacer} borradas; se vuelven a generar`);
  }
  const de = valorDe("de") ?? "equipos";
  if (de !== "equipos" && de !== "lubricantes") fallar("de=equipos o de=lubricantes");
  const idsDeOrigen =
    de === "lubricantes"
      ? (
          await payload.find({
            collection: "categorias-lubricante",
            depth: 0,
            limit: 0,
            pagination: false,
            overrideAccess: true,
          })
        ).docs.flatMap((c) => (c.productos ?? []).flatMap((p) => idDe(p.ficha) ?? []))
      : (
          await payload.find({
            collection: "equipos-nuevos",
            depth: 0,
            limit: 0,
            pagination: false,
            overrideAccess: true,
          })
        ).docs.flatMap((e) => idDe(e.fichaTecnicaPdf) ?? []);
  const ids = [...new Set(idsDeOrigen)].filter((id) => !solo || id === solo).sort((a, b) => a - b);
  const pendientes: { id: number; url: string; titulo: string }[] = [];
  for (const id of ids) {
    const doc = await payload.findByID({
      collection: "documentos",
      id,
      depth: 0,
      overrideAccess: true,
    });
    // Con páginas, hecho. En el manifiesto y sin páginas: una ejecución cortada, se reanuda.
    if ((doc.paginas ?? []).length > 0) continue;
    if (!doc.url) {
      log(`documento ${id} («${doc.titulo}») sin URL: se salta`);
      continue;
    }
    pendientes.push({ id, url: doc.url, titulo: doc.titulo });
  }
  const tanda = pendientes.slice(0, limite);
  log(
    `${ids.length} PDF de fichas; ${pendientes.length} sin páginas; ahora ${tanda.length}${simular ? " (simulación)" : ""}`,
  );
  if (simular) {
    for (const d of tanda) log(`  documento ${d.id}: «${d.titulo}»`);
    return;
  }
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "visor-fichas-"));
  const rasterizador = path.resolve("scripts", "documentos", "rasterizar-pdf.mjs");
  for (const [i, d] of tanda.entries()) {
    log(`(${i + 1}/${tanda.length}) documento ${d.id}: «${d.titulo}»`);
    const r = await fetch(d.url);
    if (!r.ok) fallar(`no se pudo descargar el PDF del documento ${d.id}: HTTP ${r.status}`);
    const carpeta = path.join(raiz, String(d.id));
    fs.mkdirSync(carpeta, { recursive: true });
    const pdf = path.join(carpeta, "documento.pdf");
    fs.writeFileSync(pdf, Buffer.from(await r.arrayBuffer()));
    const comando = [
      "npx -y -p pdfjs-dist@6.4.299 -p @napi-rs/canvas@1.0.10 node",
      `"${rasterizador}"`,
      `"${pdf}"`,
      `"${carpeta}"`,
    ].join(" ");
    const salida = spawnSync(comando, { shell: true, stdio: ["ignore", "ignore", "inherit"] });
    if (salida.status !== 0 || !fs.existsSync(path.join(carpeta, "paginas.json"))) {
      fallar(`no se pudo rasterizar el documento ${d.id} (código ${salida.status})`);
    }
    await subirPaginasDe(d.id, carpeta);
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
  fs.rmSync(raiz, { recursive: true, force: true });
  log(`✓ ${tanda.length} documentos con sus páginas`);
}

// ---------- 2. Visores en una página ----------

async function ponerEnPagina(): Promise<void> {
  const slug = valorDe("slug");
  if (!slug) fallar("falta slug=<dirección de la página>");
  const pagina = (
    await payload.find({
      collection: "paginas",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
  if (!pagina) fallar(`no hay ninguna página «${slug}»`);
  if (manifiesto.paginas.some((p) => p.id === pagina!.id)) {
    log(`la página «${slug}» ya tiene los visores de este script: nada que hacer`);
    return;
  }
  const docs = (
    await payload.find({ collection: "documentos", depth: 0, limit: 0, overrideAccess: true })
  ).docs.flatMap((d) => (d.url ? [{ id: d.id, url: d.url, titulo: d.titulo }] : []));

  const antes: { id: string; contenido: unknown }[] = [];
  let cambios = 0;
  const secciones = (pagina!.secciones ?? []).map((s) => {
    const r = cambiarEnlacesPorVisor(s.contenido as EstadoLexical | null, docs, () =>
      randomBytes(12).toString("hex"),
    );
    if (r.cambiados.length && s.id) {
      antes.push({ id: s.id, contenido: s.contenido });
      cambios += r.cambiados.length;
      for (const c of r.cambiados)
        log(`  sección «${s.titulo}»: enlace → visor de «${c.titulo}» (documento ${c.id})`);
    }
    return r.cambiados.length ? { ...s, contenido: r.estado } : s;
  });
  if (!cambios)
    fallar(`la página «${slug}» no tiene ningún párrafo que solo enlace a un PDF de «Documentos»`);
  log(`página «${slug}»: ${cambios} visores${simular ? " (simulación)" : ""}`);
  if (simular) return;
  manifiesto.paginas.push({ id: pagina!.id, slug: slug!, secciones: antes });
  guardarManifiesto();
  await payload.update({
    collection: "paginas",
    id: pagina!.id,
    data: { secciones } as never,
    overrideAccess: true,
  });
  log(`✓ página «${slug}» guardada con sus visores`);
}

// ---------- 3. Retirada ----------

async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  for (const p of manifiesto.paginas) {
    const pagina = await payload
      .findByID({ collection: "paginas", id: p.id, depth: 0, overrideAccess: true })
      .catch(() => null);
    if (!pagina) continue;
    const porId = new Map(p.secciones.map((s) => [s.id, s.contenido]));
    const secciones = (pagina.secciones ?? []).map((s) =>
      s.id && porId.has(s.id) ? { ...s, contenido: porId.get(s.id) } : s,
    );
    if (!simular) {
      await payload.update({
        collection: "paginas",
        id: p.id,
        data: { secciones } as never,
        overrideAccess: true,
      });
    }
    log(`página «${p.slug}»: ${p.secciones.length} secciones devueltas a como estaban`);
  }
  const urls: string[] = [];
  for (const d of manifiesto.documentos) {
    if (!simular) {
      await payload
        .update({
          collection: "documentos",
          id: d.id,
          data: { paginas: d.antes },
          overrideAccess: true,
        })
        .catch(() => null);
    }
    for (const m of d.media) {
      const r = simular
        ? null
        : await payload
            .delete({ collection: "media", id: m.id, overrideAccess: true })
            .catch(() => null);
      if (r && m.url) urls.push(m.url);
    }
    log(
      `documento ${d.id}: páginas devueltas a ${d.antes.length}; ${d.media.length} imágenes a borrar`,
    );
  }
  if (simular) return;
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

if (modo === "paginas") await subirPaginas();
else if (modo === "fichas") await paginasDeFichas();
else if (modo === "pagina") await ponerEnPagina();
else await retirar();
