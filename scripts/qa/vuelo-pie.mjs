/**
 * ¿TAPA LA IMAGEN DECORATIVA DEL PIE EL CONTENIDO DE LA PÁGINA?
 * (docs/diseno/decisiones-home-ux9.md §13, CLAUDE.md §10.25)
 *
 * La imagen sobresale por encima del pie. Esta comprobación cruza cada línea
 * de texto y cada elemento visible ANTERIOR al pie con los PÍXELES OPACOS del
 * recorte, leídos del canal alfa y deshaciendo el giro de 90°. Hacerlo con la
 * caja no sirve: el PNG es transparente en su mayor parte y daría falsos
 * positivos.
 *
 * POR QUÉ NO VA EN `npm run qa`: `qa` lee el HTML servido (`fetch`), y esto
 * necesita la página PINTADA: posiciones, la imagen cargada y su canal alfa.
 * Exige un navegador, y `puppeteer` no es dependencia del proyecto (añadirla
 * pide aprobación, CLAUDE.md §2). Se ejecuta con `npx`, sin instalarlo:
 *
 *   npx -y -p puppeteer-core@24.43.1 node scripts/qa/vuelo-pie.mjs [base] [fichero-de-rutas]
 *
 * - `base`: por defecto https://partequipos.vercel.app. Contra un preview, la
 *   protección de Vercel lo impide sin sesión (CLAUDE.md §10.20).
 * - `fichero-de-rutas`: una ruta por línea. Por defecto, las 21 plantillas.
 * - Navegador: Chrome instalado. Otra ruta, con `CHROME_PATH`.
 *
 * Anchos: 1025, 1280 y 1440, los de escritorio donde la imagen se pinta.
 * Sale con código 1 si tapa algo; con código 2 si la imagen no está puesta en
 * el global (no hay nada que medir).
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/*
 * `puppeteer-core` NO está en node_modules: lo trae `npx -p`, que deja su
 * `node_modules/.bin` en el PATH. Un `import` de ES no mira ahí (medido:
 * ERR_MODULE_NOT_FOUND), así que se resuelve desde esa carpeta.
 */
function cargarPuppeteer() {
  const bins = (process.env.PATH || "").split(path.delimiter).filter((p) => /_npx/.test(p));
  for (const bin of bins) {
    try {
      return createRequire(path.join(bin, "..", "x.js"))("puppeteer-core");
    } catch {
      /* siguiente */
    }
  }
  throw new Error(
    "No encuentro puppeteer-core. Ejecuta: npx -y -p puppeteer-core@24.43.1 node scripts/qa/vuelo-pie.mjs",
  );
}
const puppeteer = cargarPuppeteer();

const PLANTILLAS = [
  "/",
  "/category/noticias/",
  "/contactanos/",
  "/lubricantes/lubricantes-eni/",
  "/lubricantes/lubricantes-eni/auto-liviano/",
  "/maquinaria-pesada/",
  "/maquinaria-pesada/maquinaria-pesada-nueva/",
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/",
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/",
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/aditamentos/",
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/bulldozer-case-construction-1150m/",
  "/maquinaria-pesada/maquinaria-pesada-usada/",
  "/maquinaria-pesada/maquinaria-pesada-usada/vibrocompactadores/",
  "/nosotros/",
  "/noticias/",
  "/repuestos-maquinaria-pesada-colombia/",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-bobcat/",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-bobcat/repuestos-para-maquinaria-pesada-miniexcavadora-bobcat/repuestos-miniexcavadora-bobcat-e32/",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-caterpillar/repuestos-para-maquinaria-pesada-bulldozer-caterpillar/",
  "/tipos-de-cucharones-de-servicio-para-excavadora/",
];
const ANCHOS = [1025, 1280, 1440];
/** Alfa por encima del cual un píxel del recorte cuenta como opaco (0–255). */
const UMBRAL_ALFA = 24;

const base = (process.argv[2] || "https://partequipos.vercel.app").replace(/\/$/, "");
const rutas = process.argv[3]
  ? fs.readFileSync(process.argv[3], "utf8").split(/\r?\n/).filter(Boolean)
  : PLANTILLAS;
const escribir = (m) => process.stdout.write(`${m}\n`);

/** Se ejecuta DENTRO de la página. */
function medir(umbral) {
  const img = document.querySelector("footer img[class*=decorativa]");
  if (!img || !img.naturalWidth) return { sinImagen: true };
  if (getComputedStyle(img).display === "none") return { oculta: true };
  const lienzo = document.createElement("canvas");
  lienzo.width = img.naturalWidth;
  lienzo.height = img.naturalHeight;
  const ctx = lienzo.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const alfa = ctx.getImageData(0, 0, lienzo.width, lienzo.height).data;
  const caja = img.getBoundingClientRect(); // ya girada
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const escala = img.offsetWidth / W;
  // Punto de pantalla → píxel del original. Giro de 90° horario: x' = H − oy, y' = ox.
  const opaco = (x, y) => {
    const ox = Math.floor((y - caja.top) / escala);
    const oy = Math.floor(H - (x - caja.left) / escala);
    if (ox < 0 || oy < 0 || ox >= W || oy >= H) return false;
    return alfa[(oy * W + ox) * 4 + 3] > umbral;
  };
  const pie = document.querySelector("footer");
  const zonas = [];
  const paseo = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (paseo.nextNode()) {
    const n = paseo.currentNode;
    if (!n.textContent.trim() || pie.contains(n)) continue;
    if (n.parentElement.closest("header, [aria-hidden=true]")) continue;
    const rango = document.createRange();
    rango.selectNodeContents(n);
    for (const r of rango.getClientRects()) {
      zonas.push({ r, que: `texto «${n.textContent.trim().slice(0, 50)}»` });
    }
  }
  for (const e of document.querySelectorAll(
    "img, button, input, select, textarea, video, iframe",
  )) {
    if (pie.contains(e) || e.closest("header")) continue;
    const r = e.getBoundingClientRect();
    if (r.width && r.height) zonas.push({ r, que: e.tagName.toLowerCase() });
  }
  const tapados = [];
  for (const { r, que } of zonas) {
    const x0 = Math.max(r.left, caja.left);
    const x1 = Math.min(r.right, caja.right);
    const y0 = Math.max(r.top, caja.top);
    const y1 = Math.min(r.bottom, caja.bottom);
    if (x0 >= x1 || y0 >= y1) continue;
    let puntos = 0;
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) if (opaco(x, y)) puntos++;
    if (puntos) tapados.push(`${que} (${puntos} puntos)`);
  }
  const tarjeta = img.closest("[class*=tarjeta]").getBoundingClientRect();
  let ultimo = -Infinity;
  for (const { r } of zonas) if (r.bottom <= tarjeta.top) ultimo = Math.max(ultimo, r.bottom);
  return {
    tapados,
    vuelo: Math.round(tarjeta.top - caja.top),
    hueco: Math.round(tarjeta.top - ultimo),
    margenPie: getComputedStyle(pie).marginTop,
  };
}

const navegador = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
let fallos = 0;
let sinImagen = false;
for (const ruta of rutas) {
  for (const ancho of ANCHOS) {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: ancho, height: 900 });
    await pagina.goto(base + ruta, { waitUntil: "networkidle2", timeout: 90000 });
    // La imagen va con carga diferida: hay que llegar al pie para que se pida.
    await pagina.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, document.body.scrollHeight);
    });
    await pagina
      .waitForFunction(
        () => {
          const i = document.querySelector("footer img[class*=decorativa]");
          return !i || (i.complete && i.naturalWidth > 0);
        },
        { timeout: 15000 },
      )
      .catch(() => {});
    const r = await pagina.evaluate(medir, UMBRAL_ALFA);
    await pagina.close();
    if (r.sinImagen) {
      sinImagen = true;
      escribir(`— ${ancho} ${ruta}: la imagen decorativa no está puesta en el global «pie»`);
      continue;
    }
    if (r.oculta) continue;
    const datos = `[vuelo ${r.vuelo} px · hueco ${r.hueco} px · margen del pie ${r.margenPie}]`;
    if (r.tapados.length) {
      fallos++;
      escribir(`✗ ${ancho} ${ruta} TAPA: ${r.tapados.slice(0, 3).join(" | ")} ${datos}`);
    } else {
      escribir(`✓ ${ancho} ${ruta} ${datos}`);
    }
  }
}
await navegador.close();
if (fallos) {
  escribir(`\n✗ La imagen tapa contenido en ${fallos} comprobación(es).`);
  process.exit(1);
}
if (sinImagen) process.exit(2);
escribir("\n✓ La imagen no tapa contenido en ninguna plantilla ni ancho de escritorio.");
