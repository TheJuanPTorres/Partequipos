/**
 * ¿SE VE LA FICHA DE UNA MÁQUINA NUEVA IGUAL EN EL PREVIEW QUE EN EL SITIO PUBLICADO?
 * (2026-11-24, «Atributos de ficha»). Para cada ruta y cada ancho abre la ficha en el preview y en
 * el sitio publicado, una página cada vez, y compara el texto de la cabecera (lo que hay hasta
 * «Ficha técnica»): título, descripción y los atributos con su valor y su unidad. Guarda una captura
 * de cada una si hay `SALIDA_CAPTURAS`. Solo LEE.
 *
 *   npm run preview:ejecutar -- npx -y -p puppeteer-core@24.43.1 node scripts/qa/ficha-igual.mjs <preview> <ruta>...
 */
import { createRequire } from "node:module";
import path from "node:path";

import { conDerivacion, origenDePreview } from "../../src/lib/preview/derivacion.mjs";

function cargarPuppeteer() {
  const bins = (process.env.PATH || "").split(path.delimiter).filter((p) => /_npx/.test(p));
  for (const bin of bins) {
    try {
      return createRequire(path.join(bin, "..", "x.js"))("puppeteer-core");
    } catch {
      /* siguiente */
    }
  }
  throw new Error("No encuentro puppeteer-core: lánzalo con `npx -y -p puppeteer-core@24.43.1`.");
}
const puppeteer = cargarPuppeteer();

const [base, ...rutas] = process.argv.slice(2);
const origen = base ? origenDePreview(base) : null;
if (!origen || rutas.length === 0) throw new Error("Uso: <preview> <ruta>...");
const PUBLICADO = "https://partequipos.vercel.app";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "";
const salida = process.env.SALIDA_CAPTURAS;

let fallos = 0;
async function leer(url, ancho, etiqueta, nombre) {
  const navegador = await puppeteer.launch({
    executablePath:
      process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  try {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: ancho, height: 900 });
    await pagina.setRequestInterception(true);
    pagina.on("request", (q) =>
      q.continue({ headers: conDerivacion(q.headers(), q.url(), origen, bypass) }),
    );
    await pagina.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
    const texto = await pagina.evaluate(() => {
      const t = document.querySelector("main")?.innerText ?? "";
      const i = t.indexOf("Ficha técnica");
      return t
        .slice(0, i > 0 ? i : 700)
        .replace(/\s+/g, " ")
        .trim();
    });
    if (salida)
      await pagina.screenshot({ path: path.join(salida, `${nombre}-${etiqueta}-${ancho}.png`) });
    return texto;
  } finally {
    await navegador.close();
  }
}

for (const ruta of rutas) {
  const nombre = ruta.split("/").filter(Boolean).pop();
  for (const ancho of [390, 1440]) {
    const a = await leer(`${origen}${ruta}`, ancho, "preview", nombre);
    const b = await leer(`${PUBLICADO}${ruta}`, ancho, "publicado", nombre);
    const igual = a === b && a.length > 0;
    if (!igual) fallos++;
    process.stdout.write(
      `${igual ? "✓" : "✗"} ${nombre} a ${ancho}${igual ? "" : `\n  preview:   ${a}\n  publicado: ${b}`}\n`,
    );
  }
}
process.stdout.write(fallos ? `\n${fallos} diferencia(s)\n` : "\nTodo igual.\n");
if (fallos) process.exitCode = 1;
