/**
 * LA CONFIRMACIÓN DEL FORMULARIO DE SOLICITUD, PINTADA (2026-11-23, tarea 3: formularios sin spam).
 * Rellena `/contactanos/` con datos inventados, espera pasar el tiempo mínimo, envía y mide la
 * confirmación a 390 y 1440: que se vea entera, sin desbordar la página, con su icono y su
 * mensaje; y que el campo trampa NO se vea ni se pueda llegar a él con el teclado.
 *
 *   npm run preview:ejecutar -- npx -y -p puppeteer-core@24.43.1 node scripts/qa/confirmacion-formulario.mjs <preview>
 *
 * Solo contra un preview (crea una solicitud de prueba en SU base: «PRUEBA SIN SPAM — borrar»).
 * La cabecera de derivación va solo a ese origen (`derivacion.mjs`). Un proceso, un navegador.
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

const base = process.argv[2];
const origen = base ? origenDePreview(base) : null;
if (!origen) throw new Error("Pasa la URL de un PREVIEW del proyecto como primer argumento.");
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "";
const salida = process.env.SALIDA_CAPTURAS;

const navegador = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
let fallos = 0;
const comprobar = (nombre, ok, detalle = "") => {
  if (!ok) fallos++;
  process.stdout.write(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}\n`);
};

try {
  for (const ancho of [390, 1440]) {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: ancho, height: 900 });
    await pagina.setRequestInterception(true);
    pagina.on("request", (q) =>
      new URL(q.url()).origin === origen
        ? q.continue({ headers: conDerivacion(q.headers(), q.url(), origen, bypass) })
        : q.continue(),
    );
    await pagina.goto(`${origen}/contactanos/`, { waitUntil: "networkidle2", timeout: 90000 });

    const trampa = await pagina.evaluate(() => {
      const i = document.querySelector('input[name="sitio_web"]');
      if (!i) return null;
      const r = i.getBoundingClientRect();
      return { x: r.x, tab: i.tabIndex, oculto: i.closest("[aria-hidden=true]") !== null };
    });
    comprobar(
      `${ancho}: el campo trampa está fuera de pantalla, sin teclado y oculto a lectores`,
      !!trampa && trampa.x < -1000 && trampa.tab === -1 && trampa.oculto,
      JSON.stringify(trampa),
    );
    const hora = await pagina.$eval('input[name="tiempo_inicio"]', (i) => i.value);
    comprobar(`${ancho}: el formulario lleva la hora de cuando se mostró`, Number(hora) > 0);

    const F = 'form:has(input[name="sitio_web"])';
    await pagina.$eval(`${F} input[name="nombre"]`, (e) => e.scrollIntoView());
    await pagina.type(`${F} input[name="nombre"]`, "PRUEBA SIN SPAM — borrar");
    await pagina.type(`${F} input[name="correo"]`, "prueba-sin-spam@ejemplo.test");
    await pagina.type(`${F} textarea[name="mensaje"]`, "Prueba automática del formulario.");
    // Tiempo mínimo y, si hay, que el reto de Turnstile llegue a dar su token.
    await new Promise((r) => setTimeout(r, 6000));
    await pagina.click(`${F} button[type="submit"]`);
    await pagina.waitForSelector('[role="status"] svg[data-check]', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 800));

    const m = await pagina.evaluate(() => {
      const c = document.querySelector('[role="status"]:has(svg[data-check])');
      const r = c.getBoundingClientRect();
      const icono = c.querySelector("svg").getBoundingClientRect();
      const doc = document.documentElement;
      return {
        texto: c.textContent.replace(/\s+/g, " ").trim().slice(0, 120),
        x: Math.round(r.x),
        ancho: Math.round(r.width),
        derecha: Math.round(r.right),
        icono: Math.round(icono.width),
        desborda: doc.scrollWidth > window.innerWidth,
        enfocado: document.activeElement === c,
        arriba: Math.round(r.top),
      };
    });
    comprobar(
      `${ancho}: la confirmación sale entera, dentro de la ventana y con foco`,
      m.x >= 0 && m.derecha <= ancho && m.icono >= 32 && m.enfocado,
      JSON.stringify(m),
    );
    comprobar(`${ancho}: la página no desborda en horizontal`, !m.desborda);
    comprobar(`${ancho}: dice «¡Recibimos tu solicitud!»`, /Recibimos tu solicitud/.test(m.texto), m.texto);
    if (salida) await pagina.screenshot({ path: path.join(salida, `confirmacion-${ancho}.png`) });
    await pagina.close();
  }
} finally {
  await navegador.close();
}
process.stdout.write(fallos ? `\n${fallos} fallo(s)\n` : "\nTodo bien.\n");
if (fallos) process.exitCode = 1;
