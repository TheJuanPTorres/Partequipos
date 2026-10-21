/**
 * Convierte cada página de un PDF en una imagen PNG, para el bloque
 * «Documento en visor» (2026-10-20). Así el visor del sitio no carga pdf.js.
 *
 * pdf.js y su lienzo NO son dependencias del proyecto: los trae `npx` solo
 * para esto (versiones fijas, de más de dos semanas):
 *
 *   npx -y -p pdfjs-dist@6.4.299 -p @napi-rs/canvas@1.0.10 node scripts/documentos/rasterizar-pdf.mjs <pdf o URL> <carpeta> [ancho]
 *
 * Escribe `pagina-01.png`, `pagina-02.png`… y `paginas.json` (orden y medidas)
 * en la carpeta, que conviene que esté FUERA del repositorio. Ancho por
 * defecto: 1600 px por página (se lee bien con el zoom al doble del libro).
 * El PDF se lee de un fichero local o de una URL https.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

/*
 * Los paquetes los deja `npx -p` en su propia carpeta, que está en el PATH
 * (`…/_npx/<hash>/node_modules/.bin`). Un `import` de ES no mira ahí, así que
 * se resuelven desde esa carpeta (como `scripts/qa/vuelo-pie.mjs`).
 */
function resolverDeNpx(nombre) {
  const bins = (process.env.PATH || "").split(path.delimiter).filter((p) => /_npx/.test(p));
  for (const bin of bins) {
    try {
      return createRequire(path.join(bin, "..", "x.js")).resolve(nombre);
    } catch {
      /* siguiente */
    }
  }
  throw new Error(
    `No encuentro ${nombre}. Ejecuta: npx -y -p pdfjs-dist@6.4.299 -p @napi-rs/canvas@1.0.10 node scripts/documentos/rasterizar-pdf.mjs …`,
  );
}

const [origen, carpeta, anchoArg] = process.argv.slice(2);
if (!origen || !carpeta) {
  console.error("Uso: rasterizar-pdf.mjs <pdf o URL https> <carpeta> [ancho]");
  process.exit(1);
}
const ANCHO = Number(anchoArg) || 1600;

const pdfjs = await import(pathToFileURL(resolverDeNpx("pdfjs-dist/legacy/build/pdf.mjs")).href);
const { createCanvas } = await import(pathToFileURL(resolverDeNpx("@napi-rs/canvas")).href);

let datos;
if (/^https:\/\//i.test(origen)) {
  const r = await fetch(origen);
  if (!r.ok) throw new Error(`No se pudo descargar el PDF: HTTP ${r.status}`);
  datos = new Uint8Array(await r.arrayBuffer());
} else {
  datos = new Uint8Array(fs.readFileSync(origen));
}

// Las fuentes estándar, los mapas de caracteres y los decodificadores van con pdf.js:
// sin ellos, un PDF que no incrusta sus fuentes sale con otra letra.
const raizPdfjs = path.dirname(resolverDeNpx("pdfjs-dist/package.json"));
// En Node, pdf.js lee estas carpetas con `fs`: ruta del disco (no `file://`) con barra final.
const conBarra = (p) => p.replace(/[\\/]?$/, "/");
const doc = await pdfjs.getDocument({
  data: datos,
  isEvalSupported: false,
  standardFontDataUrl: conBarra(path.join(raizPdfjs, "standard_fonts")),
  cMapUrl: conBarra(path.join(raizPdfjs, "cmaps")),
  cMapPacked: true,
  // Los decodificadores de JPEG 2000 y JBIG2 (WebAssembly). Sin esto, las imágenes en
  // JPEG 2000 de un PDF salen en blanco («JpxError: OpenJPEG failed to initialize»).
  wasmUrl: conBarra(path.join(raizPdfjs, "wasm")),
}).promise;
fs.mkdirSync(carpeta, { recursive: true });
const paginas = [];
for (let n = 1; n <= doc.numPages; n++) {
  const pagina = await doc.getPage(n);
  const base = pagina.getViewport({ scale: 1 });
  const viewport = pagina.getViewport({ scale: ANCHO / base.width });
  const lienzo = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const ctx = lienzo.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  await pagina.render({ canvas: lienzo, canvasContext: ctx, viewport }).promise;
  const fichero = `pagina-${String(n).padStart(2, "0")}.png`;
  fs.writeFileSync(path.join(carpeta, fichero), await lienzo.encode("png"));
  paginas.push({ n, fichero, width: lienzo.width, height: lienzo.height });
  process.stdout.write(
    `[rasterizar] página ${n}/${doc.numPages}: ${lienzo.width} × ${lienzo.height}\n`,
  );
}
fs.writeFileSync(path.join(carpeta, "paginas.json"), JSON.stringify({ paginas }, null, 2));
process.stdout.write(`[rasterizar] ✓ ${paginas.length} páginas en ${carpeta}\n`);
