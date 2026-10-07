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
 *   (la pantalla de acceso, §17–§19 de decisiones-panel.md), `avisos` (los
 *   avisos del panel, §22), `listas` (estados, fechas, miniaturas y ordenar,
 *   filtrar y buscar, §24) y `oscuro`, solo o detrás de otro modo
 *   («avisos oscuro»). Sin modo, la pasada normal en claro.
 * - No escribe nada en el panel: solo navega y lee. En modo `ficha` pulsa
 *   «Guardar» con 5 «Destacar» marcados, que la validación rechaza, y comprueba
 *   después en la API que no se guardó nada.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { instalarDerivacion } from "../../src/lib/preview/derivacion.mjs";

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
// `oscuro` puede ir solo o detrás de otro modo («avisos oscuro»).
const OSCURO = process.argv.slice(3).includes("oscuro");
const MODO = (process.argv.slice(3).find((a) => a !== "oscuro") ?? "").trim();
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
const fecha = `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}${MODO ? `-${MODO}` : ""}${OSCURO ? "-oscuro" : ""}`;
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
    // El token solo a ese origen, nunca a terceros (`derivacion.mjs`).
    await instalarDerivacion(contexto, origin, bypass);
    // Modo `oscuro`: la misma pasada con el tema oscuro, como entra el usuario
    // (cookie `payload-theme`, CLAUDE.md §10.23). Sin modo, el claro.
    await contexto.addCookies([
      { name: "payload-theme", value: OSCURO ? "dark" : "light", url: origin },
    ]);
    let pagina = await contexto.newPage();
    const errores = [];
    pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));
    // Peticiones que fallan (p. ej. una miniatura que no carga y sale como icono).
    // Solo host y ruta: sin query, que podría llevar algo que no debe salir.
    const fallidas = [];
    // El host solo si es el del preview: de otros orígenes (el Blob, por
    // ejemplo) se anota «otro-origen», para que ningún fichero de hallazgos
    // lleve el nombre de un almacén.
    const sinQuery = (u) => {
      const x = new URL(u);
      return `${x.origin === origin ? x.host : "otro-origen"}${x.pathname}`;
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

    /*
     * Modo `listas` (F3, decisiones-panel.md §24): captura las listas con
     * estados, fechas y miniaturas, y registra el resultado de ORDENAR, FILTRAR
     * y BUSCAR (las primeras filas) para comparar antes y después. Solo lee.
     * Solicitudes, con un filtro que no encuentra nada: no carga datos personales.
     */
    if (MODO === "listas") {
      const LISTAS = [
        ["lista-equipos-nuevos", "/admin/collections/equipos-nuevos"],
        ["lista-equipos-usados", "/admin/collections/equipos-usados"],
        ["lista-modelos", "/admin/collections/modelos-repuesto"],
        ["lista-articulos", "/admin/collections/articulos"],
        ["lista-imagenes", "/admin/collections/media"],
        ["lista-documentos", "/admin/collections/documentos"],
        ["lista-testimonios", "/admin/collections/testimonios"],
        ["lista-preguntas", "/admin/collections/preguntas-frecuentes"],
        ["lista-redirecciones", "/admin/collections/redirects"],
        ["lista-solicitudes-vacia", "/admin/collections/solicitudes?where[id][equals]=0"],
      ];
      const filas = () =>
        pagina.evaluate(() =>
          [...document.querySelectorAll("table tbody tr")]
            .slice(0, 5)
            .map((tr) => tr.querySelector("td:nth-child(2)")?.textContent?.trim().slice(0, 60)),
        );
      for (const [nombre, ruta] of LISTAS) {
        await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
        await pagina.waitForTimeout(1500);
        await pagina.screenshot({
          path: path.join(salida, `${nombre}-${ancho.nombre}.png`),
          fullPage: true,
        });
        const celdas = await pagina.evaluate(() => ({
          insignias: [...document.querySelectorAll(".pq-insignia")].map((e) =>
            e.textContent.trim(),
          ),
          fechas: [...document.querySelectorAll(".pq-fecha")].slice(0, 3).map((e) => ({
            texto: e.textContent.trim(),
            title: e.getAttribute("title"),
            tabIndex: e.tabIndex,
          })),
          miniaturas: [...document.querySelectorAll(".pq-miniatura img, .file__thumbnail img")]
            .slice(0, 3)
            .map((i) => ({
              loading: i.getAttribute("loading"),
              // Solo SI pasa por el optimizador: la URL lleva dentro el host
              // del almacén, que no debe acabar en ningún fichero de hallazgos.
              optimizada: (i.getAttribute("src") ?? "").startsWith("/_next/image"),
            })),
          columnas: [...document.querySelectorAll("table thead th")].map((th) =>
            th.textContent.trim(),
          ),
        }));
        hallazgos.push({ pantalla: nombre, ancho: ancho.nombre, ...celdas });
        decir(`✓ ${nombre} (${ancho.nombre})`);
      }
      // ORDENAR, FILTRAR y BUSCAR: mismas URL antes y después; se comparan las filas.
      const PRUEBAS = [
        ["orden-nombre-asc", "/admin/collections/equipos-nuevos?sort=nombre"],
        ["orden-nombre-desc", "/admin/collections/equipos-nuevos?sort=-nombre"],
        ["orden-actualizado", "/admin/collections/media?sort=-updatedAt"],
        ["filtro-disponible", "/admin/collections/equipos-usados?where[disponible][equals]=true"],
        ["filtro-sin-fotos", "/admin/collections/equipos-nuevos?where[imagenes][exists]=false"],
        ["busqueda-modelos", "/admin/collections/modelos-repuesto?search=320"],
        ["busqueda-articulos", "/admin/collections/articulos?search=excavadora"],
      ];
      const resultados = {};
      for (const [nombre, ruta] of PRUEBAS) {
        await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
        await pagina.waitForTimeout(1000);
        resultados[nombre] = {
          filas: await filas(),
          total: await pagina
            .locator(".page-controls__page-info")
            .first()
            .textContent()
            .catch(() => null),
        };
      }
      hallazgos.push({ pantalla: "ordenar-filtrar-buscar", ancho: ancho.nombre, resultados });
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      hallazgos.push({ pantalla: "peticiones-fallidas", ancho: ancho.nombre, fallidas });
      await contexto.close();
      continue;
    }

    /*
     * Modo `avisos` (F4, decisiones-panel.md §22): abre cada pantalla donde sale
     * un aviso del panel y captura la página y cada aviso. No guarda nada: en
     * las vistas de crear solo se mira (y en el equipo usado se desmarca
     * «Disponible» SIN guardar). Las solicitudes se abren con un filtro que no
     * encuentra ninguna, así que no se carga ninguna fila con datos personales.
     */
    if (MODO === "avisos") {
      const primero = async (coleccion, filtro = "") => {
        await pagina.goto(`${base}/admin/collections/${coleccion}${filtro}`, {
          waitUntil: "networkidle",
        });
        const hrefs = await pagina
          .locator(`table a[href*="/admin/collections/${coleccion}/"]`)
          .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
        return hrefs.find((h) => h && !/\/create\/?$/.test(h)) ?? null;
      };
      const paginaNosotros = await primero("paginas", "?where[slug][equals]=nosotros");
      const redireccion = await primero("redirects");
      const CASOS = [
        { nombre: "aviso-alt-flojos", ruta: "/admin/collections/media" },
        { nombre: "aviso-sin-fotos-equipo", ruta: "/admin/collections/equipos-nuevos/create" },
        { nombre: "aviso-sin-fotos-modelo", ruta: "/admin/collections/modelos-repuesto/create" },
        {
          nombre: "aviso-no-disponible",
          ruta: "/admin/collections/equipos-usados/create",
          antes: async () => {
            const casilla = pagina.locator("#field-disponible");
            if (await casilla.isChecked()) await casilla.uncheck({ force: true });
          },
        },
        { nombre: "aviso-autorizacion", ruta: "/admin/collections/testimonios/create" },
        { nombre: "aviso-buscadores", ruta: "/admin/globals/seo" },
        ...(redireccion ? [{ nombre: "aviso-redirecciones", ruta: redireccion }] : []),
        // Filtro imposible: la lista sale vacía y no se piden filas.
        { nombre: "aviso-solicitudes", ruta: "/admin/collections/solicitudes?where[id][equals]=0" },
        ...(paginaNosotros ? [{ nombre: "aviso-bloques", ruta: paginaNosotros }] : []),
      ];
      for (const caso of CASOS) {
        await pagina.goto(`${base}${caso.ruta}`, { waitUntil: "networkidle" });
        await pagina.waitForTimeout(1500);
        if (caso.antes) {
          await caso.antes();
          await pagina.waitForTimeout(500);
        }
        const avisos = pagina.locator(".pq-aviso");
        const n = await avisos.count();
        await pagina.screenshot({
          path: path.join(salida, `${caso.nombre}-${ancho.nombre}.png`),
          fullPage: true,
        });
        for (let i = 0; i < n; i++) {
          await avisos
            .nth(i)
            .screenshot({ path: path.join(salida, `${caso.nombre}-${ancho.nombre}-${i + 1}.png`) })
            .catch(() => {});
        }
        const textos = await avisos.allInnerTexts();
        hallazgos.push({ pantalla: caso.nombre, ancho: ancho.nombre, avisos: n, textos });
        decir(`${n ? "✓" : "·"} ${caso.nombre} (${ancho.nombre}): ${n} aviso(s)`);
      }
      // Pasa por las páginas con cambios sin guardar: se cierra sin guardar.
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      hallazgos.push({ pantalla: "peticiones-fallidas", ancho: ancho.nombre, fallidas });
      await contexto.close();
      continue;
    }

    /*
     * Payload 3.89 solo pinta un grupo de campos cuando llega a 1000 px de la
     * pantalla (`RenderIfInViewport`, `rootMargin: "1000px"`): una captura de
     * página completa SIN desplazarse deja vacío lo que quede más abajo (la
     * sección SEO de un equipo nuevo largo salía con su título y sin campos).
     * Se recorre la página hasta el final, hasta que deja de crecer, y se
     * vuelve arriba antes de capturar.
     */
    const pintarTodo = async () => {
      let alto = 0;
      for (let vuelta = 0; vuelta < 10; vuelta++) {
        const nuevo = await pagina.evaluate(() => document.documentElement.scrollHeight);
        if (nuevo === alto) break;
        alto = nuevo;
        for (let y = 0; y <= alto; y += 600) {
          await pagina.evaluate((v) => window.scrollTo(0, v), y);
          await pagina.waitForTimeout(80);
        }
        await pagina.waitForTimeout(500);
      }
      await pagina.evaluate(() => window.scrollTo(0, 0));
      await pagina.waitForTimeout(500);
    };

    const visitar = async (nombre, ruta, { formulario = false } = {}) => {
      await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
      await pagina.waitForTimeout(1500); // dejar asentar (CLAUDE.md §10.24)
      // Control: si los campos SEO ya estaban antes de recorrer la página.
      const seoSinRecorrer = formulario
        ? await pagina.evaluate(() => Boolean(document.querySelector("#field-seo__metaTitle")))
        : undefined;
      await pintarTodo();
      const fichero = path.join(salida, `${nombre}-${ancho.nombre}.png`);
      await pagina.screenshot({ path: fichero, fullPage: true });
      const texto = await pagina.locator("body").innerText();
      const ingles = [...new Set(texto.split(/\n+/).filter((l) => INGLES.test(l)))].slice(0, 15);
      // En un formulario, que la sección SEO llegó a pintarse con sus campos.
      const seo = formulario
        ? await pagina.evaluate(() => ({
            titulo: Boolean(document.querySelector("#field-seo__metaTitle")),
            descripcion: Boolean(document.querySelector("#field-seo__metaDescription")),
            vistaGoogle: document.querySelector(".pq-seo__google-titulo")?.textContent ?? null,
          }))
        : undefined;
      if (seo) seo.sinRecorrer = seoSinRecorrer;
      hallazgos.push({ pantalla: nombre, ancho: ancho.nombre, ingles, ...(seo ? { seo } : {}) });
      const marcaSeo = seo
        ? ` · SEO ${seo.titulo && seo.descripcion ? "con campos" : "SIN CAMPOS"}`
        : "";
      decir(`✓ ${nombre} (${ancho.nombre}) → ${path.basename(fichero)}${marcaSeo}`);
    };

    for (const p of PANTALLAS) await visitar(p.nombre, p.ruta);

    // La PORTADA PROPIA (F2): estructura y que de «solicitudes» no haya
    // ningún enlace a una solicitud concreta (solo contadores).
    await pagina.goto(`${base}/admin`, { waitUntil: "networkidle" });
    const portada = await pagina.evaluate(() => ({
      h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()),
      secciones: [...document.querySelectorAll(".pq-portada h2")].map((h) => h.textContent.trim()),
      tarjetas: [...document.querySelectorAll(".pq-portada__tarjeta h3")].map((h) =>
        h.textContent.trim(),
      ),
      avisos: [...document.querySelectorAll(".pq-portada .pq-aviso")].map((a) =>
        a.textContent.trim(),
      ),
      accesos: [...document.querySelectorAll(".pq-portada__acceso")].map((a) =>
        a.textContent.trim(),
      ),
      recientes: document.querySelectorAll(".pq-portada__reciente").length,
      enlacesASolicitudes: [...document.querySelectorAll('a[href*="/collections/solicitudes"]')]
        .map((a) => a.getAttribute("href") ?? "")
        // Una solicitud concreta es /collections/solicitudes/<id>; la lista
        // (con o sin barra y filtros) y «crear» no cuentan.
        .filter((h) => /\/collections\/solicitudes\/(?!create)[^/?#]+/.test(h)),
    }));
    hallazgos.push({ pantalla: "portada-estructura", ancho: ancho.nombre, ...portada });
    if (portada.enlacesASolicitudes.length) {
      fallar("La portada enlaza a solicitudes concretas: solo debe haber contadores.");
    }

    // El MENÚ LATERAL desplegado (F1 del rediseño): se abre con su botón y se
    // captura la ventana visible, que es donde vive el menú.
    // En escritorio el botón está junto a las migas; en móvil, en la cabecera.
    const toggler = pagina
      .locator(ancho.movil ? ".app-header__mobile-nav-toggler" : ".template-default__nav-toggler")
      .first();
    if (!(await pagina.locator(".nav--nav-open").count())) await toggler.click().catch(() => {});
    await pagina.waitForTimeout(1500);
    const ficheroMenu = path.join(salida, `menu-${ancho.nombre}.png`);
    await pagina.screenshot({ path: ficheroMenu });
    const menu = await pagina.evaluate(() => {
      const caja = (e) => {
        if (!e) return null;
        const r = e.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) };
      };
      const scroll = document.querySelector(".nav__scroll");
      const controles = document.querySelector(".nav__controls");
      return {
        abierto: Boolean(document.querySelector(".nav--nav-open")),
        grupos: [...document.querySelectorAll(".nav-group")].map((g) => ({
          grupo: g.querySelector(".nav-group__label")?.textContent?.trim(),
          id: g.id,
          entradas: [...g.querySelectorAll("a")].map((a) => a.textContent.trim()),
          icono: Boolean(g.querySelector(".nav-group__label svg")),
        })),
        // ¿Se puede llegar a la última entrada? El pie («Salir») va fijo abajo.
        scroll: scroll && { alto: scroll.clientHeight, contenido: scroll.scrollHeight },
        controles: controles && {
          ...caja(controles),
          fondo: getComputedStyle(controles).backgroundColor,
          position: getComputedStyle(controles).position,
        },
      };
    });
    // Desplaza el menú hasta el final y captura: la última entrada no puede
    // quedar debajo del pie.
    await pagina.evaluate(() => {
      const s = document.querySelector(".nav__scroll");
      if (s) s.scrollTop = s.scrollHeight;
    });
    await pagina.waitForTimeout(500);
    menu.final = await pagina.evaluate(() => {
      const enlaces = [...document.querySelectorAll(".nav-group a")];
      const ultimo = enlaces[enlaces.length - 1];
      const pie = document.querySelector(".nav__controls");
      const u = ultimo?.getBoundingClientRect();
      const p = pie?.getBoundingClientRect();
      return {
        ultimo: ultimo?.textContent.trim(),
        ultimoBottom: u && Math.round(u.bottom),
        pieTop: p && Math.round(p.top),
        anchoPie: p && Math.round(p.width),
        anchoMenu: Math.round(
          document.querySelector(".nav__scroll")?.getBoundingClientRect().width ?? 0,
        ),
      };
    });
    await pagina.screenshot({ path: path.join(salida, `menu-final-${ancho.nombre}.png`) });
    hallazgos.push({ pantalla: "menu", ancho: ancho.nombre, menu });
    decir(`✓ menú (${ancho.nombre}) → ${path.basename(ficheroMenu)}`);

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
        await visitar(f.nombre, fichas[f.coleccion], { formulario: true });
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
