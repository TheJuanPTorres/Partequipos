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
 * - Capturas a 1440 y a 390 de: portada del panel, Imágenes, Páginas, Modelos,
 *   el global «SEO y datos de la empresa», Documentos, el global «Ficha de
 *   producto» y el formulario de edición del primer modelo, de la primera
 *   categoría técnica y de un equipo nuevo con PDF. Se guardan FUERA del
 *   repositorio, en `Desktop/partequipos-cierre/capturas/panel-<fecha>/`.
 * - Además lista los textos visibles que parecen inglés (palabras de una lista
 *   corta), los errores de consola y las peticiones que fallan (solo host y
 *   ruta), para no depender solo de mirar.
 * - Navegador: Chrome instalado (otra ruta con `CHROME_PATH`).
 * - Modos (tercer argumento): `ficha` (aviso de más de 4 «Destacar»), `acceso`
 *   (la pantalla de acceso, §17–§19 de decisiones-panel.md) y `oscuro` (la
 *   pasada normal con el tema oscuro). Sin modo, la pasada normal en claro.
 * - No escribe nada en el panel: solo navega y lee. En modo `ficha` pulsa
 *   «Guardar» con 5 «Destacar» marcados, que la validación rechaza, y comprueba
 *   después en la API que no se guardó nada.
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
if (!base) fallar("Uso: npm run panel:revision -- <url del preview> [ficha|acceso|oscuro]");
// `ficha`: además, el aviso de más de 4 «Destacar» y la vista de subir un PDF.
const MODO = process.argv[3] ?? "";
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
const fecha = `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}${MODO ? `-${MODO}` : ""}`;
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
  // El global con el horario, las imágenes (logo e imagen al compartir) y el contacto.
  { nombre: "seo-empresa", ruta: "/admin/globals/seo" },
  // Ficha de producto V2: los PDF y lo común a todas las fichas.
  { nombre: "documentos", ruta: "/admin/collections/documentos" },
  { nombre: "ficha-producto", ruta: "/admin/globals/ficha-producto" },
];
// Formularios de edición: el primer registro de cada lista.
const FORMULARIOS = [
  { nombre: "formulario-modelo", coleccion: "modelos-repuesto" },
  // Sin página propia: el SEO guiado tiene que decirlo.
  { nombre: "formulario-categoria-tecnica", coleccion: "categorias-tecnicas" },
  // Un equipo con ficha técnica («Destacar» e «Icono») y PDF, si lo hay.
  {
    nombre: "formulario-equipo-nuevo",
    coleccion: "equipos-nuevos",
    filtro: "?where[fichaTecnicaPdf][exists]=true",
  },
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
    // El token solo a ese origen, nunca a terceros. Se intercepta SOLO ese
    // origen: interceptar también las imágenes del Blob (otro dominio) las
    // hacía fallar con ERR_BLOCKED_BY_ORB y las miniaturas salían como icono.
    await contexto.route(`${origin}/**`, (r) =>
      r.continue({
        headers: { ...r.request().headers(), "x-vercel-protection-bypass": bypass },
      }),
    );
    // Modo `oscuro`: la misma pasada con el tema oscuro, como entra el usuario
    // (cookie `payload-theme`, CLAUDE.md §10.23). Sin modo, el claro.
    await contexto.addCookies([
      { name: "payload-theme", value: MODO === "oscuro" ? "dark" : "light", url: origin },
    ]);
    let pagina = await contexto.newPage();
    const errores = [];
    pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));
    // Peticiones que fallan (p. ej. una miniatura que no carga y sale como icono).
    // Solo host y ruta: sin query, que podría llevar algo que no debe salir.
    const fallidas = [];
    const sinQuery = (u) => {
      const x = new URL(u);
      return `${x.host}${x.pathname}`;
    };
    pagina.on("requestfailed", (r) =>
      fallidas.push(`${sinQuery(r.url())} — ${r.failure()?.errorText ?? "fallo"}`),
    );
    pagina.on(
      "response",
      (r) => r.status() >= 400 && fallidas.push(`${sinQuery(r.url())} — HTTP ${r.status()}`),
    );

    /*
     * Modo `acceso` (`npm run panel:revision -- <preview> acceso`): la
     * pantalla de acceso en claro y en oscuro (cookie `payload-theme`, como
     * entra el usuario, §10.23), un error con un correo que NO existe (no
     * suma intentos a ninguna cuenta), el orden del tabulador y, al entrar,
     * que respeta la redirección pedida.
     */
    const REDIRECCION = "/admin/collections/media";
    if (MODO === "acceso") {
      for (const tema of ["light", "dark"]) {
        await contexto.addCookies([{ name: "payload-theme", value: tema, url: origin }]);
        await pagina.goto(`${base}/admin/login`, { waitUntil: "networkidle" });
        await pagina.waitForTimeout(1500);
        const fichero = path.join(salida, `acceso-${tema}-${ancho.nombre}.png`);
        await pagina.screenshot({ path: fichero, fullPage: true });
        decir(`✓ acceso ${tema} (${ancho.nombre}) → ${path.basename(fichero)}`);
        if (tema === "light") {
          const tabulador = [];
          await pagina.locator("body").focus();
          for (let i = 0; i < 6; i++) {
            await pagina.keyboard.press("Tab");
            tabulador.push(
              await pagina.evaluate(() => {
                const e = document.activeElement;
                const etiqueta = e?.labels?.[0]?.textContent ?? e?.textContent ?? "";
                return `${e?.tagName.toLowerCase()} «${etiqueta.trim().slice(0, 40)}»`;
              }),
            );
          }
          const estado = await pagina.evaluate(() => ({
            h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()),
            microsoft: [...document.querySelectorAll(".pq-acceso__boton--secundario")].map((b) => ({
              texto: b.textContent.trim(),
              desactivado: b.disabled === true,
            })),
            etiquetas: [...document.querySelectorAll(".pq-acceso input")].map(
              (i) => i.labels?.[0]?.textContent.trim() ?? "(sin etiqueta)",
            ),
          }));
          hallazgos.push({ pantalla: "acceso", ancho: ancho.nombre, tabulador, ...estado });
        }
      }
      await contexto.addCookies([{ name: "payload-theme", value: "light", url: origin }]);
      await pagina.locator('input[name="email"]').fill("revision-acceso@ejemplo.invalid");
      await pagina.locator('input[name="password"]').fill("no-es-la-clave");
      await pagina.locator('button[type="submit"]').click();
      await pagina.locator(".pq-acceso__alerta:not(:empty)").waitFor({ timeout: 20_000 });
      await pagina.waitForTimeout(500);
      const fichero = path.join(salida, `acceso-error-${ancho.nombre}.png`);
      await pagina.screenshot({ path: fichero, fullPage: true });
      const error = await pagina.evaluate(() => ({
        alerta: document.querySelector(".pq-acceso__alerta")?.textContent.trim(),
        rol: document.querySelector(".pq-acceso__alerta")?.getAttribute("role"),
        camposInvalidos: document.querySelectorAll('.pq-acceso input[aria-invalid="true"]').length,
        url: location.pathname,
      }));
      hallazgos.push({ pantalla: "acceso-error", ancho: ancho.nombre, ...error });
      decir(`✓ acceso con error (${ancho.nombre}) → ${path.basename(fichero)}`);
      await pagina.goto(`${base}/admin/login?redirect=${encodeURIComponent(REDIRECCION)}`, {
        waitUntil: "networkidle",
      });
    } else {
      await pagina.goto(`${base}/admin/login`, { waitUntil: "networkidle" });
    }
    // Con mensaje fijo: la traza de un error de Playwright podría llevar lo
    // tecleado, y la contraseña no puede salir de este proceso.
    try {
      await pagina.locator('input[name="email"]').fill(cuenta[claveCorreo]);
      await pagina.locator('input[name="password"]').fill(cuenta[claveClave]);
    } catch {
      fallar(`No se pudo rellenar el formulario de acceso (${ancho.nombre}).`);
    }
    await Promise.all([
      pagina.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30_000 }),
      pagina.locator('button[type="submit"]').click(),
    ]).catch(() => fallar(`No se pudo iniciar sesión (${ancho.nombre}).`));

    if (MODO === "acceso") {
      await pagina.waitForLoadState("networkidle");
      const llegada = new URL(pagina.url()).pathname.replace(/\/$/, "");
      // Con sesión abierta, /admin/login no se pinta: redirige al panel.
      await pagina.goto(`${base}/admin/login`, { waitUntil: "networkidle" });
      const conSesion = new URL(pagina.url()).pathname.replace(/\/$/, "");
      hallazgos.push({ pantalla: "acceso-entrada", ancho: ancho.nombre, llegada, conSesion });
      decir(
        `✓ entrada (${ancho.nombre}): llega a ${llegada}; /admin/login con sesión → ${conSesion}`,
      );
      if (llegada !== REDIRECCION) fallar(`No respetó la redirección: llegó a ${llegada}.`);
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      hallazgos.push({ pantalla: "peticiones-fallidas", ancho: ancho.nombre, fallidas });
      await contexto.close();
      continue;
    }

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

    const fichas = {};
    for (const f of FORMULARIOS) {
      await pagina.goto(`${base}/admin/collections/${f.coleccion}${f.filtro ?? ""}`, {
        waitUntil: "networkidle",
      });
      // Un enlace de FILA de la tabla: el primero de la página es el de «Crear».
      const enlaces = await pagina
        .locator(`table a[href*="/admin/collections/${f.coleccion}/"]`)
        .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      const enlace = enlaces.find((h) => h && !/\/create\/?$/.test(h));
      if (enlace) {
        fichas[f.coleccion] = new URL(enlace, base).pathname;
        await visitar(f.nombre, fichas[f.coleccion]);
      } else decir(`· sin registros en ${f.coleccion}: no hay formulario (${ancho.nombre})`);
    }

    /*
     * Modo `ficha` (opcional: `npm run panel:revision -- <preview> ficha`):
     * la ficha técnica de un equipo nuevo con más de 4 «Destacar» y la vista
     * de subir un PDF. Marca la 5.ª fila y pulsa «Guardar»: la validación lo
     * RECHAZA, así que no se escribe nada; después lo comprueba leyendo el
     * equipo por la API (§10.15). Nunca guarda con 4 o menos.
     */
    if (MODO === "ficha" && fichas["equipos-nuevos"]) {
      const ruta = fichas["equipos-nuevos"];
      const id = ruta.split("/").filter(Boolean).pop();
      // Desde la página: así pasa por el interceptor que añade el token del preview.
      const leer = async () =>
        pagina.evaluate(
          async (u) => (await fetch(u, { credentials: "include" })).json(),
          `/api/equipos-nuevos/${id}?depth=0`,
        );
      const antes = (await leer()).fichaTecnica ?? [];
      const marcadasAntes = antes.filter((f) => f.destacar).length;
      await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
      await pagina.waitForTimeout(1500);
      const casillas = pagina.locator(
        'input[type="checkbox"][id^="field-fichaTecnica__"][id$="__destacar"]',
      );
      const total = await casillas.count();
      let marcadas = 0;
      for (let i = 0; i < total; i++) if (await casillas.nth(i).isChecked()) marcadas++;
      for (let i = 0; i < total && marcadas <= 4; i++) {
        if (!(await casillas.nth(i).isChecked())) {
          await casillas.nth(i).check({ force: true });
          marcadas++;
        }
      }
      if (marcadas <= 4) {
        decir(
          `· ficha: el equipo tiene ${total} filas; hacen falta 5 para ver el aviso (${ancho.nombre})`,
        );
      } else {
        await pagina.locator("#action-save").click();
        await pagina.waitForTimeout(2500);
        const avisos = await pagina.locator(".payload-toast-container").allInnerTexts();
        // Junto a cada casilla: el tooltip de error de Payload y la casilla en error.
        const junto = await pagina.evaluate(() => ({
          casillasEnError: document.querySelectorAll(".checkbox.error, .field-type.checkbox.error")
            .length,
          tooltips: [...document.querySelectorAll(".field-error")].map((e) => ({
            texto: e.textContent.trim(),
            visible:
              e.getBoundingClientRect().height > 0 && getComputedStyle(e).visibility !== "hidden",
          })),
        }));
        const fichero = path.join(salida, `ficha-aviso-mas-de-4-${ancho.nombre}.png`);
        await pagina.screenshot({ path: fichero, fullPage: true });
        const despues = (await leer()).fichaTecnica ?? [];
        const marcadasDespues = despues.filter((f) => f.destacar).length;
        hallazgos.push({
          pantalla: "ficha-aviso-mas-de-4",
          ancho: ancho.nombre,
          avisos: [...new Set(avisos.map((a) => a.trim()).filter(Boolean))],
          junto,
          destacadasAntes: marcadasAntes,
          destacadasDespues: marcadasDespues,
        });
        decir(
          `✓ ficha: aviso con ${marcadas} marcadas → ${path.basename(fichero)} · en la base ${marcadasAntes} antes y ${marcadasDespues} después (${ancho.nombre})`,
        );
        if (marcadasDespues !== marcadasAntes)
          fallar("La ficha técnica SE GUARDÓ con más de 4: revisar a mano.");
      }
      // Página nueva: la anterior tiene cambios sin guardar y no se navega desde ella.
      await pagina.close();
      pagina = await contexto.newPage();
      pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));
      await visitar("documentos-crear", "/admin/collections/documentos/create");
    }

    hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
    hallazgos.push({ pantalla: "peticiones-fallidas", ancho: ancho.nombre, fallidas });
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
  if (h.fallidas?.length) decir(`· peticiones fallidas (${h.ancho}): ${h.fallidas.length}`);
}
