/**
 * IMÁGENES AMPLIADAS (responsive de marcas de nueva, 2026-11-15).
 *
 * Por página y ancho, para cada `<img>` visible: cuánto se AMPLÍA el fichero que se descargó
 * (`currentSrc`) al pintarlo. Con `object-fit: cover` cuenta el recorte (la escala es la mayor de
 * las dos), con `contain` la menor. 1,00 = a su tamaño; más de 1,05 se marca como ampliada.
 *
 *   npm run preview:ejecutar -- npx -y -p playwright-core@1.63.0 node scripts/qa/escalado-imagenes.mjs <preview> <fichero.md> [ruta…]
 *
 * `ESCALADO_ANCHOS=390,1440` para medir solo esos. Vista a 900 px de alto, escala de pantalla 1.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { instalarDerivacion, origenDePreview } from "../../src/lib/preview/derivacion.mjs";

function cargarPlaywright() {
  const bins = (process.env.PATH || "").split(path.delimiter).filter((p) => /_npx/.test(p));
  for (const bin of bins) {
    try {
      return createRequire(path.join(bin, "..", "x.js"))("playwright-core");
    } catch {
      /* siguiente */
    }
  }
  throw new Error("No encuentro playwright-core: lánzalo con npx -y -p playwright-core@1.63.0");
}
const pw = cargarPlaywright();

const [base, salida, ...rutas] = process.argv.slice(2);
if (!base || !salida || rutas.length === 0) {
  throw new Error("Uso: escalado-imagenes.mjs <base> <fichero.md> <ruta…>");
}
const origen = new URL(base).origin;
const ANCHOS = (process.env.ESCALADO_ANCHOS ?? "390,768,1010,1440,1920,2560,3440,3840")
  .split(",")
  .map(Number);

const navegador = await pw.chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});

function medir() {
  const filas = [];
  for (const img of document.images) {
    const r = img.getBoundingClientRect();
    if (r.width < 40 || r.height < 40 || !img.naturalWidth) continue;
    const cs = getComputedStyle(img);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const sx = r.width / img.naturalWidth;
    const sy = r.height / img.naturalHeight;
    const ajuste = cs.objectFit;
    const escala =
      ajuste === "cover" ? Math.max(sx, sy) : ajuste === "contain" ? Math.min(sx, sy) : sx;
    filas.push({
      que: (img.alt || img.className || img.src).toString().slice(0, 40),
      clase: String(img.className).slice(0, 30),
      natural: `${img.naturalWidth}×${img.naturalHeight}`,
      caja: `${Math.round(r.width)}×${Math.round(r.height)}`,
      escala: Number(escala.toFixed(2)),
    });
  }
  return filas;
}

const lineas = [`# Imágenes ampliadas — ${origen}`, ""];
for (const ruta of rutas) {
  lineas.push(
    `## ${ruta}`,
    "",
    "| Ancho | Imagen | Fichero | Caja | Escala |",
    "| --- | --- | --- | --- | --- |",
  );
  for (const ancho of ANCHOS) {
    const ctx = await navegador.newContext({
      viewport: { width: ancho, height: 900 },
      reducedMotion: "reduce",
    });
    if (origenDePreview(origen)) {
      await instalarDerivacion(ctx, origen, process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "");
    }
    const p = await ctx.newPage();
    await p.goto(`${origen}${ruta}`, { waitUntil: "load" });
    for (let y = 0; y < 40; y++) {
      const fin = await p.evaluate(() => {
        scrollBy(0, innerHeight * 0.8);
        return innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      });
      await p.waitForTimeout(250);
      if (fin) break;
    }
    await p.waitForTimeout(1500);
    const filas = await p.evaluate(medir);
    for (const f of filas.filter((x) => x.escala > 1.05)) {
      lineas.push(`| ${ancho} | ${f.que} | ${f.natural} | ${f.caja} | ×${f.escala} ⚠ |`);
    }
    lineas.push(
      `| ${ancho} | _${filas.length} imágenes; mayor escala_ | | | ×${Math.max(0, ...filas.map((x) => x.escala))} |`,
    );
    await ctx.close();
  }
  lineas.push("");
}
fs.writeFileSync(salida, lineas.join("\n"));
await navegador.close();
console.log(`escrito ${salida}`);
