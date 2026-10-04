/**
 * Revisión del panel EN PANTALLA, con una cuenta de editor, contra un preview.
 *
 *   npm run panel:revision -- <url-del-preview>
 *
 * Por qué así: la revisión pintada (CLAUDE.md §10.14) necesita una sesión, y la
 * contraseña no puede pasar por el agente ni por ningún registro. El script la
 * lee él mismo de `.env.editor-preview.local` (lo rellena dirección), la teclea
 * en el formulario de acceso y no la imprime nunca: solo dice qué CLAVES
 * encontró. El agente no abre ese fichero.
 *
 * - Va SOLO contra un preview: rechaza `partequipos.vercel.app` y cualquier
 *   host que no sea un despliegue `*.vercel.app` del proyecto.
 * - El token de la protección de Vercel (`VERCEL_AUTOMATION_BYPASS_SECRET`,
 *   cargado por `scripts/preview/con-entorno.ts`) va en una cabecera y solo a
 *   ese origen.
 * - Capturas a 1440 y a 390 de: portada del panel, Imágenes, Páginas, Modelos
 *   y el formulario de edición del primer modelo. Se guardan FUERA del
 *   repositorio, en `Desktop/partequipos-cierre/capturas/panel-<fecha>/`.
 * - Además lista los textos visibles que parecen inglés (palabras de una lista
 *   corta) y los errores de consola, para no depender solo de mirar.
 * - Navegador: Chrome instalado (otra ruta con `CHROME_PATH`).
 * - No escribe nada en el panel: solo navega y lee.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

/*
 * `playwright-core` NO está en node_modules: lo trae `npx -p`, igual que
 * `puppeteer-core` en `vuelo-pie.mjs`. Un `import` de ES no mira en la carpeta
 * de npx, así que se resuelve desde ella.
 */
function cargarPlaywright() {
  const bins = (process.env.PATH || "").split(path.delimiter).filter((p) => /_npx/.test(p));
  for (const bin of bins) {
    try {
      return createRequire(path.join(bin, "..", "x.js"))("playwright-core");
    } catch {
      /* siguiente */
    }
  }
  throw new Error("No encuentro playwright-core. Ejecuta: npm run panel:revision -- <url>");
}
const { chromium } = cargarPlaywright();

const FICHERO_CUENTA = ".env.editor-preview.local";
const DOMINIO_PRODUCCION = "partequipos.vercel.app";

const decir = (texto) =>
  process.stdout.write(`${texto}
`);

function fallar(mensaje) {
  console.error(`✗ ${mensaje}`);
  process.exit(1);
}

// --- Preview --------------------------------------------------------------
const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!base) fallar("Uso: npm run panel:revision -- <url del preview>");
const { hostname, origin } = new URL(base);
if (hostname === DOMINIO_PRODUCCION || !/^partequipos-[a-z0-9-]+\.vercel\.app$/.test(hostname)) {
  fallar(`Solo contra un preview del proyecto (*.vercel.app), no «${hostname}».`);
}
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "";
if (!bypass) fallar("Falta el token de la protección: ejecútalo con npm run panel:revision.");

// --- Cuenta: se lee aquí y no sale de este proceso ------------------------
const ruta = path.resolve(FICHERO_CUENTA);
if (!fs.existsSync(ruta)) fallar(`Falta ${FICHERO_CUENTA} en la raíz del repo.`);
const cuenta = {};
for (const linea of fs.readFileSync(ruta, "utf8").split(/\r?\n/)) {
  const m = linea.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) cuenta[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
}
const claves = Object.keys(cuenta);
const claveCorreo = claves.find((c) => /EMAIL|CORREO|USUARIO|USER/i.test(c));
const claveClave = claves.find((c) => /PASS|CONTRASE|CLAVE/i.test(c));
decir(`cuenta: claves encontradas ${claves.join(", ") || "(ninguna)"}`);
if (!claveCorreo || !claveClave || !cuenta[claveCorreo] || !cuenta[claveClave]) {
  fallar(
    "No encuentro correo y contraseña en el fichero de la cuenta (solo se listan las claves).",
  );
}

// --- Capturas -------------------------------------------------------------
const fecha = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const salida = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "capturas",
  `panel-${fecha}`,
);
fs.mkdirSync(salida, { recursive: true });

const ANCHOS = [
  { nombre: "1440", viewport: { width: 1440, height: 900 }, movil: false },
  { nombre: "movil", viewport: { width: 390, height: 844 }, movil: true },
];
const PANTALLAS = [
  { nombre: "portada", ruta: "/admin" },
  { nombre: "imagenes", ruta: "/admin/collections/media" },
  { nombre: "paginas", ruta: "/admin/collections/paginas" },
  { nombre: "modelos", ruta: "/admin/collections/modelos-repuesto" },
];
// Palabras inglesas que no deberían verse en un panel en español.
const INGLES =
  /\b(Create New|Search|Filters?|Columns|Loading|Save|Delete|Upload|Collections|Globals|Dashboard|Log ?out|Sign in|Login|No results|Nothing found|Per Page|Sort|Edit|Back|Settings|Previous|Next)\b/;

const navegador = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const hallazgos = [];

try {
  for (const ancho of ANCHOS) {
    const contexto = await navegador.newContext({
      viewport: ancho.viewport,
      isMobile: ancho.movil,
      hasTouch: ancho.movil,
      locale: "es-CO",
    });
    // El token solo a ese origen, nunca a terceros.
    await contexto.route("**/*", (r) =>
      new URL(r.request().url()).origin === origin
        ? r.continue({
            headers: { ...r.request().headers(), "x-vercel-protection-bypass": bypass },
          })
        : r.continue(),
    );
    const pagina = await contexto.newPage();
    const errores = [];
    pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));

    await pagina.goto(`${base}/admin/login`, { waitUntil: "networkidle" });
    await pagina.locator('input[name="email"]').fill(cuenta[claveCorreo]);
    await pagina.locator('input[name="password"]').fill(cuenta[claveClave]);
    await Promise.all([
      pagina.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30_000 }),
      pagina.locator('button[type="submit"]').click(),
    ]).catch(() => fallar(`No se pudo iniciar sesión (${ancho.nombre}).`));

    const visitar = async (nombre, ruta) => {
      await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
      await pagina.waitForTimeout(1500); // dejar asentar (CLAUDE.md §10.24)
      const fichero = path.join(salida, `${nombre}-${ancho.nombre}.png`);
      await pagina.screenshot({ path: fichero, fullPage: true });
      const texto = await pagina.locator("body").innerText();
      const ingles = [...new Set(texto.split(/\n+/).filter((l) => INGLES.test(l)))].slice(0, 15);
      hallazgos.push({ pantalla: nombre, ancho: ancho.nombre, ingles });
      decir(`✓ ${nombre} (${ancho.nombre}) → ${path.basename(fichero)}`);
    };

    for (const p of PANTALLAS) await visitar(p.nombre, p.ruta);

    // Formulario de edición: el primer modelo de la lista.
    await pagina.goto(`${base}/admin/collections/modelos-repuesto`, { waitUntil: "networkidle" });
    // Un enlace de FILA de la tabla: el primero de la página es el de «Crear».
    const enlaces = await pagina
      .locator('table a[href*="/admin/collections/modelos-repuesto/"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const enlace = enlaces.find((h) => h && !/\/create\/?$/.test(h));
    if (enlace) await visitar("formulario-modelo", new URL(enlace, base).pathname);
    else decir(`· sin modelos: no hay formulario que capturar (${ancho.nombre})`);

    hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
    await contexto.close();
  }
} finally {
  await navegador.close();
}

fs.writeFileSync(path.join(salida, "hallazgos.json"), JSON.stringify(hallazgos, null, 2));
decir(`\nCapturas y hallazgos en ${salida}`);
for (const h of hallazgos) {
  if (h.ingles?.length)
    decir(`· posible inglés en ${h.pantalla} (${h.ancho}): ${h.ingles.join(" | ")}`);
  if (h.errores?.length) decir(`· errores de consola (${h.ancho}): ${h.errores.length}`);
}
