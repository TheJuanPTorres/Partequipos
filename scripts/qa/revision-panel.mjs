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
 * - Modo `imagenes <carpeta>`: sube imágenes de prueba, lee lo guardado y las borra (reducción al
 *   subir, 2026-11-23).
 * - Modos (tercer argumento): `ficha` (aviso de más de 4 «Destacar»), `acceso`
 *   (la pantalla de acceso, §17–§19 de decisiones-panel.md), `avisos` (los
 *   avisos del panel, §22), `listas` (estados, fechas, miniaturas y ordenar,
 *   filtrar y buscar, §24), `orden` (las listas de tipos y equipos nuevos de Case por su
 *   «Orden», #379), `arrastrar` (ordena «Categorías de maquinaria nueva» arrastrando y lo
 *   devuelve a como estaba, #441), `pestanas` (cada pestaña de una ficha de maquinaria y una de
 *   lubricantes, solo a 1440, #507) y `oscuro`, solo o detrás de otro modo
 *   («avisos oscuro»). Sin modo, la pasada normal en claro.
 * - No escribe nada en el panel, salvo el modo `arrastrar`, que cambia el orden y lo devuelve: solo navega y lee. En modo `ficha` pulsa
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
const PANTALLAS_TODAS = [
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
const FORMULARIOS_TODOS = [
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
/*
 * Modo `nuevos` (`npm run panel:revision -- <preview> nuevos`): solo lo que ha
 * entrado en el panel desde la última revisión (2026-10-13): las marcas de
 * usados y su campo en los equipos, y lo nuevo de repuestos (fondo de la
 * marca, imagen del tipo, orden e icono de las categorías técnicas y el
 * global de las páginas de marca). Menos pantallas: menos memoria y tiempo.
 */
const PANTALLAS_NUEVAS = [
  { nombre: "portada", ruta: "/admin" },
  { nombre: "lista-marcas-usada", ruta: "/admin/collections/marcas-usada" },
  { nombre: "lista-equipos-usados", ruta: "/admin/collections/equipos-usados" },
  { nombre: "lista-categorias-tecnicas", ruta: "/admin/collections/categorias-tecnicas" },
  { nombre: "repuestos-marca", ruta: "/admin/globals/repuestos-marca" },
];
const FORMULARIOS_NUEVOS = [
  { nombre: "formulario-marca-usada", coleccion: "marcas-usada" },
  { nombre: "formulario-equipo-usado", coleccion: "equipos-usados" },
  { nombre: "formulario-marca-repuestos", coleccion: "marcas" },
  { nombre: "formulario-tipo-repuestos", coleccion: "tipos-equipo" },
  { nombre: "formulario-categoria-tecnica", coleccion: "categorias-tecnicas" },
  { nombre: "formulario-equipo-nuevo", coleccion: "equipos-nuevos" },
];
/*
 * Modo `marca-nueva` (2026-11-09): solo el formulario de una marca de maquinaria nueva, para el
 * runbook de la portada: dónde están «PORTADA: tarjeta…» y «Foto de la marca (fondo de su página)».
 */
const FORMULARIOS_MARCA_NUEVA = [
  {
    nombre: "formulario-marca-nueva",
    coleccion: "marcas-maquinaria",
    filtro: "?where[slug][equals]=case-construction",
  },
];
const PANTALLAS =
  MODO === "nuevos" ? PANTALLAS_NUEVAS : MODO === "marca-nueva" ? [] : PANTALLAS_TODAS;
const FORMULARIOS =
  MODO === "nuevos"
    ? FORMULARIOS_NUEVOS
    : MODO === "marca-nueva"
      ? FORMULARIOS_MARCA_NUEVA
      : FORMULARIOS_TODOS;
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
      // Modo `modo-admin`: vídeo del recorrido a 1440 (tanda 23).
      ...(MODO === "modo-admin" && !ancho.movil
        ? { recordVideo: { dir: salida, size: ancho.viewport } }
        : {}),
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
     * Modo `facil` (2026-11-23, tarea 3, fase 2): la EDICIÓN FÁCIL de las fichas de producto. Por
     * colección (las de `… facil <col1,col2>`; por defecto nuevas, modelos y usadas), la lista y la
     * cabecera de la primera ficha, y si salen el resumen «Así se ve hoy en la web», la columna
     * «Estado», los interruptores y las sugerencias. Solo lee.
     */
    if (MODO === "facil") {
      const colecciones = (process.argv[4] ?? "equipos-nuevos,modelos-repuesto,equipos-usados")
        .split(",")
        .filter(Boolean);
      for (const coleccion of colecciones) {
        await pagina.goto(`${base}/admin/collections/${coleccion}?limit=5&sort=id`, {
          waitUntil: "networkidle",
        });
        await pagina.waitForTimeout(1500);
        await pagina.screenshot({
          path: path.join(salida, `lista-${coleccion}-${ancho.nombre}.png`),
          fullPage: true,
        });
        const lista = await pagina.evaluate(() => ({
          columnas: [...document.querySelectorAll("table thead th")].map((th) =>
            th.textContent.trim(),
          ),
          celdasNombre: document.querySelectorAll(".pq-celda-nombre").length,
          estados: [...document.querySelectorAll(".pq-insignia")].map((e) => e.textContent.trim()),
          interruptores: document.querySelectorAll('[role="switch"]').length,
        }));
        // `… facil <colecciones> <id>`: esa ficha en lugar de la primera.
        const primera = /^\d+$/.test(process.argv[5] ?? "")
          ? Number(process.argv[5])
          : await pagina.evaluate(
              async (r) =>
                (await (await fetch(r, { credentials: "include" })).json())?.docs?.[0]?.id,
              `${base}/api/${coleccion}?limit=1&sort=id&depth=0`,
            );
        let ficha = null;
        if (primera) {
          await pagina.goto(`${base}/admin/collections/${coleccion}/${primera}`, {
            waitUntil: "networkidle",
          });
          await pagina.waitForTimeout(2500);
          await pagina.screenshot({
            path: path.join(salida, `ficha-${coleccion}-${ancho.nombre}.png`),
            fullPage: false,
          });
          // Las filas de una lista (los productos de lubricante): su etiqueta, a la vista.
          const etiquetas = pagina.locator(".pq-etiqueta-producto");
          if ((await etiquetas.count()) > 0) {
            await etiquetas.first().scrollIntoViewIfNeeded();
            await pagina.waitForTimeout(500);
            await pagina.screenshot({
              path: path.join(salida, `filas-${coleccion}-${ancho.nombre}.png`),
              fullPage: false,
            });
          }
          ficha = await pagina.evaluate(() => ({
            filas: [...document.querySelectorAll(".pq-etiqueta-producto")]
              .slice(0, 6)
              .map((e) => e.textContent.trim()),
            resumen:
              document.querySelector(".pq-resumen-web__completa strong")?.textContent?.trim() ??
              null,
            falta:
              document.querySelector(".pq-resumen-web__barra-texto span")?.textContent?.trim() ??
              null,
            estado:
              document.querySelector(".pq-resumen-web .pq-insignia")?.textContent?.trim() ?? null,
            verEnLaWeb: Boolean(document.querySelector(".pq-resumen-web__ver")),
            sugerencias: [...document.querySelectorAll(".pq-sugerencias")].map((s) =>
              s.textContent.trim().slice(0, 120),
            ),
          }));
        }
        hallazgos.push({ pantalla: `facil-${coleccion}`, ancho: ancho.nombre, lista, ficha });
        decir(
          `✓ ${coleccion} (${ancho.nombre}): ${lista.celdasNombre} nombres con foto, estados ${[...new Set(lista.estados)].join("/") || "-"}, ${lista.interruptores} interruptores · ficha ${primera ?? "-"}: ${ficha?.estado ?? "-"}, ${ficha?.resumen ?? "sin resumen"}${ficha?.verEnLaWeb ? ", «Ver en la web»" : ""}${ficha?.sugerencias?.length ? ` · sugerencias: ${ficha.sugerencias.join(" | ")}` : ""}`,
        );
      }
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      hallazgos.push({ pantalla: "peticiones-fallidas", ancho: ancho.nombre, fallidas });
      await contexto.close();
      continue;
    }

    /*
     * Modo `bloque` (2026-11-23, #558): CAMBIOS EN BLOQUE y DUPLICAR, por efecto (§10.15), a 1440.
     * En usadas y nuevas marca las 2 primeras filas visibles y en la web y disponibles, pulsa cada
     * acción («Sí, hacerlo»), y lee por la API con la sesión que solo cambian esas 2 (las otras 8
     * de la página, no); al final tienen que quedar como estaban (si no, se devuelven). Después,
     * «Duplicar» desde el formulario de una de ellas: la copia lleva «(copia)», otra dirección y
     * nace oculta, el original no cambia, y la copia se BORRA.
     */
    if (MODO === "bloque") {
      if (ancho.movil) {
        await contexto.close();
        continue;
      }
      const api = (ruta, opciones = {}) =>
        pagina.evaluate(
          async ([r, o]) => {
            const res = await fetch(r, { credentials: "include", ...o });
            return { estado: res.status, cuerpo: await res.json().catch(() => null) };
          },
          [`${base}/api${ruta}`, opciones],
        );
      const CASOS = [
        {
          coleccion: "equipos-usados",
          acciones: [
            ["Ocultar de la web", { mostrarEnWeb: false }],
            ["Mostrar en la web", { mostrarEnWeb: true }],
            ["Marcar vendida", { disponible: false }],
            ["Marcar disponible", { disponible: true }],
          ],
        },
        {
          coleccion: "equipos-nuevos",
          acciones: [
            ["Ocultar de la web", { mostrarEnWeb: false }],
            ["Mostrar en la web", { mostrarEnWeb: true }],
          ],
        },
      ];
      const LISTA = "?sort=id&limit=10";
      const estados = async (coleccion) => {
        const { cuerpo } = await api(`/${coleccion}${LISTA}&depth=0`);
        return Object.fromEntries(
          (cuerpo?.docs ?? []).map((d) => [
            d.id,
            { mostrarEnWeb: d.mostrarEnWeb, disponible: d.disponible, nombre: d.nombre },
          ]),
        );
      };
      const resultado = [];
      const ok = (texto, bien) => {
        resultado.push(`${bien ? "✓" : "✗"} ${texto}`);
        decir(`${bien ? "✓" : "✗"} ${texto}`);
      };
      for (const caso of CASOS) {
        const ruta = `/admin/collections/${caso.coleccion}${LISTA}`;
        await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
        await pagina.waitForTimeout(1500);
        const inicial = await estados(caso.coleccion);
        const ids = Object.keys(inicial).map(Number);
        // Las 2 primeras que están en la web (y, en usadas, disponibles): así acaban igual.
        const elegidas = ids
          .filter(
            (id) =>
              inicial[id].mostrarEnWeb === true &&
              (caso.coleccion !== "equipos-usados" || inicial[id].disponible === true),
          )
          .slice(0, 2);
        if (elegidas.length < 2) {
          ok(`${caso.coleccion}: no hay 2 fichas en la web en la primera página`, false);
          continue;
        }
        decir(`${caso.coleccion}: marco ${elegidas.join(", ")} de ${ids.length} filas`);
        let paso = 0;
        for (const [boton, datos] of caso.acciones) {
          paso++;
          await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
          await pagina.waitForTimeout(1200);
          // Marcar SOLO las elegidas: por la posición de su id en la lista (orden por id).
          for (const id of elegidas) {
            const fila = pagina.locator("table tbody tr").nth(ids.indexOf(id));
            await fila.locator('input[type="checkbox"]').first().check();
          }
          await pagina.locator(".pq-en-bloque").getByRole("button", { name: boton }).click();
          if (paso === 1) {
            await pagina.screenshot({
              path: path.join(salida, `bloque-${caso.coleccion}-pregunta-1440.png`),
            });
          }
          await pagina
            .locator(".pq-en-bloque")
            .getByRole("button", { name: "Sí, hacerlo" })
            .click();
          const aviso = await pagina
            .locator(".pq-en-bloque__estado")
            .first()
            .textContent({ timeout: 20_000 })
            .catch(() => "(sin aviso)");
          await pagina.waitForTimeout(1500);
          if (paso === 1) {
            await pagina.screenshot({
              path: path.join(salida, `bloque-${caso.coleccion}-hecho-1440.png`),
            });
          }
          const ahora = await estados(caso.coleccion);
          const [campo, valor] = Object.entries(datos)[0];
          const marcadasBien = elegidas.every((id) => ahora[id]?.[campo] === valor);
          const otrasIgual = ids
            .filter((id) => !elegidas.includes(id))
            .every(
              (id) =>
                ahora[id]?.mostrarEnWeb === inicial[id].mostrarEnWeb &&
                ahora[id]?.disponible === inicial[id].disponible,
            );
          ok(`${caso.coleccion} · «${boton}»: las 2 marcadas con ${campo}=${valor}`, marcadasBien);
          ok(`${caso.coleccion} · «${boton}»: las otras ${ids.length - 2} sin cambios`, otrasIgual);
          // El interruptor de la fila (solo en usadas) tiene que enseñar lo guardado, sin recargar.
          if (caso.coleccion === "equipos-usados") {
            const indice = campo === "mostrarEnWeb" ? 0 : 1;
            const interruptores = await Promise.all(
              elegidas.map((id) =>
                pagina
                  .locator("table tbody tr")
                  .nth(ids.indexOf(id))
                  .locator('[role="switch"]')
                  .nth(indice)
                  .getAttribute("aria-checked"),
              ),
            );
            ok(
              `${caso.coleccion} · «${boton}»: el interruptor de las 2 filas enseña ${valor} sin recargar (${interruptores.join(", ")})`,
              interruptores.every((v) => v === String(valor)),
            );
          }
          decir(`   aviso: «${aviso?.trim()}»`);
        }
        const final = await estados(caso.coleccion);
        const igual = ids.every(
          (id) =>
            final[id]?.mostrarEnWeb === inicial[id].mostrarEnWeb &&
            final[id]?.disponible === inicial[id].disponible,
        );
        ok(`${caso.coleccion}: al final, las ${ids.length} como estaban`, igual);
        if (!igual) {
          for (const id of elegidas) {
            const { mostrarEnWeb, disponible } = inicial[id];
            await api(`/${caso.coleccion}/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                caso.coleccion === "equipos-usados"
                  ? { mostrarEnWeb, disponible }
                  : { mostrarEnWeb },
              ),
            });
          }
          decir(`   devueltas ${elegidas.join(", ")} a su estado inicial`);
        }

        // DUPLICAR desde el formulario de la primera elegida.
        const original = elegidas[0];
        const antes = (await api(`/${caso.coleccion}/${original}?depth=0`)).cuerpo;
        await pagina.goto(`${base}/admin/collections/${caso.coleccion}/${original}`, {
          waitUntil: "networkidle",
        });
        await pagina.waitForTimeout(1500);
        await pagina.locator(".doc-controls__popup button, .doc-controls__dots").first().click();
        await pagina.waitForTimeout(500);
        await pagina.screenshot({
          path: path.join(salida, `duplicar-${caso.coleccion}-menu-1440.png`),
        });
        await Promise.all([
          pagina.waitForURL(
            (u) =>
              /\/collections\/[^/]+\/\d+/.test(u.pathname) && !u.pathname.endsWith(`/${original}`),
            { timeout: 30_000 },
          ),
          pagina
            .getByRole("button", { name: /Duplicar/ })
            .first()
            .click(),
        ]).catch(() => null);
        await pagina.waitForTimeout(2000);
        const nuevaId = Number(new URL(pagina.url()).pathname.match(/\/(\d+)\/?$/)?.[1]);
        if (!nuevaId || nuevaId === original) {
          ok(`${caso.coleccion}: «Duplicar» no llevó a una ficha nueva`, false);
          continue;
        }
        await pagina.screenshot({
          path: path.join(salida, `duplicar-${caso.coleccion}-copia-1440.png`),
          fullPage: false,
        });
        const copia = (await api(`/${caso.coleccion}/${nuevaId}?depth=0`)).cuerpo;
        const despues = (await api(`/${caso.coleccion}/${original}?depth=0`)).cuerpo;
        ok(
          `${caso.coleccion}: copia ${nuevaId} con «(copia)» en el nombre («${copia?.nombre}»)`,
          typeof copia?.nombre === "string" && copia.nombre.includes("(copia)"),
        );
        ok(
          `${caso.coleccion}: copia con otra dirección («${copia?.slug}»)`,
          Boolean(copia?.slug) && copia.slug !== antes?.slug,
        );
        ok(
          `${caso.coleccion}: copia oculta (mostrarEnWeb=${copia?.mostrarEnWeb})`,
          copia?.mostrarEnWeb === false,
        );
        ok(
          `${caso.coleccion}: el original sin cambios`,
          despues?.nombre === antes?.nombre &&
            despues?.slug === antes?.slug &&
            despues?.mostrarEnWeb === antes?.mostrarEnWeb,
        );
        const borrado = await api(`/${caso.coleccion}/${nuevaId}`, { method: "DELETE" });
        const queda = await api(`/${caso.coleccion}/${nuevaId}?depth=0`);
        ok(
          `${caso.coleccion}: copia ${nuevaId} borrada (DELETE ${borrado.estado}, después ${queda.estado})`,
          queda.estado === 404,
        );
      }
      hallazgos.push({ pantalla: "bloque-duplicar", ancho: ancho.nombre, resultado });
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      hallazgos.push({ pantalla: "peticiones-fallidas", ancho: ancho.nombre, fallidas });
      await contexto.close();
      continue;
    }

    /*
     * Modo `versiones` (2026-11-24, #575): el HISTORIAL SIN BORRADORES por efecto, a 1440, en
     * `… versiones <coleccion> <id>` (por defecto, el equipo nuevo 1). Dos guardados con la sesión
     * del editor (la entradilla con « v» y otra vez como estaba), la pestaña «Versiones», comparar,
     * y RESTAURAR la versión con « v» y después la de antes: al final la ficha queda como estaba
     * (si no, se devuelve con la API). Capturas de la lista y de la comparación.
     */
    if (MODO === "versiones") {
      const coleccion = process.argv[4] ?? "equipos-nuevos";
      const id = Number(process.argv[5] ?? 1);
      if (ancho.movil) {
        // En móvil, solo las capturas de la lista y de la última versión: sin guardar ni restaurar.
        await pagina.goto(`${base}/admin/collections/${coleccion}/${id}/versions`, {
          waitUntil: "networkidle",
        });
        await pagina.waitForTimeout(2000);
        await pagina.screenshot({
          path: path.join(salida, `versiones-lista-${coleccion}-movil.png`),
          fullPage: false,
        });
        const enlace = pagina.locator("table tbody tr a").first();
        if (await enlace.count()) {
          await enlace.click();
          await pagina.waitForLoadState("networkidle");
          await pagina.waitForTimeout(2000);
          await pagina.screenshot({
            path: path.join(salida, `versiones-comparar-${coleccion}-movil.png`),
            fullPage: false,
          });
        }
        hallazgos.push({
          pantalla: "versiones",
          ancho: ancho.nombre,
          coleccion,
          id,
          errores,
          fallidas,
        });
        await contexto.close();
        continue;
      }
      // `… versiones <coleccion> <id> <campo de texto>`: en usadas y modelos no hay entradilla.
      const campo = process.argv[6] && process.argv[6] !== "api" ? process.argv[6] : "entradilla";
      const api = (ruta, opciones = {}) =>
        pagina.evaluate(
          async ([r, o]) => {
            const res = await fetch(r, { credentials: "include", ...o });
            return { estado: res.status, cuerpo: await res.json().catch(() => null) };
          },
          [`${base}/api${ruta}`, opciones],
        );
      const poner = (valor) =>
        api(`/${coleccion}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [campo]: valor }),
        });
      const leer = async () => (await api(`/${coleccion}/${id}?depth=0`)).cuerpo?.[campo] ?? null;
      const versiones = async () =>
        (
          await api(
            `/${coleccion}/versions?where[parent][equals]=${id}&sort=-updatedAt&limit=10&depth=0`,
          )
        ).cuerpo?.docs ?? [];
      const resultado = [];
      const ok = (texto, bien) => {
        resultado.push(`${bien ? "✓" : "✗"} ${texto}`);
        decir(`${bien ? "✓" : "✗"} ${texto}`);
      };
      const original = await leer();
      const conV = `${original ?? ""} v`;
      const r1 = await poner(conV);
      const r2 = await poner(original);
      ok(
        `dos guardados con la sesión del editor (${r1.estado}, ${r2.estado})`,
        r1.estado === 200 && r2.estado === 200,
      );
      const lista = await versiones();
      ok(`el historial tiene versiones (${lista.length})`, lista.length >= 2);
      const vConV = lista.find((v) => v.version?.[campo] === conV);
      const vOriginal = lista.find((v) => v.version?.[campo] === original);
      ok("están la versión con « v» y la de antes", Boolean(vConV && vOriginal));
      // Sin sesión, el historial no se lee.
      const anonimo = await pagina.evaluate(
        async (r) => (await fetch(r, { credentials: "omit" })).status,
        `${base}/api/${coleccion}/versions?limit=1`,
      );
      ok(
        `sin sesión, el historial no se lee (HTTP ${anonimo})`,
        anonimo === 403 || anonimo === 401,
      );
      await pagina.goto(`${base}/admin/collections/${coleccion}/${id}/versions`, {
        waitUntil: "networkidle",
      });
      await pagina.waitForTimeout(2000);
      await pagina.screenshot({
        path: path.join(salida, `versiones-lista-${coleccion}-1440.png`),
        fullPage: false,
      });
      const filasVista = await pagina.locator("table tbody tr").count();
      ok(`la pestaña «Versiones» lista ${filasVista} guardados`, filasVista >= 2);
      const restaurar = async (v, nombre) => {
        await pagina.goto(`${base}/admin/collections/${coleccion}/${id}/versions/${v.id}`, {
          waitUntil: "networkidle",
        });
        await pagina.waitForTimeout(2000);
        if (nombre === "con « v»") {
          await pagina.screenshot({
            path: path.join(salida, `versiones-comparar-${coleccion}-1440.png`),
            fullPage: false,
          });
        }
        await pagina
          .getByRole("button", { name: /Restaurar/i })
          .first()
          .click({ timeout: 8000 });
        await pagina.waitForTimeout(800);
        await pagina
          .getByRole("button", { name: /Confirmar|Restaurar|Sí/i })
          .last()
          .click({ timeout: 8000 })
          .catch(() => null);
        await pagina.waitForTimeout(3500);
      };
      if (vConV && vOriginal && process.argv.includes("api")) {
        // Diagnóstico: el mismo restaurar por la API, con la respuesta (sin datos de la ficha).
        const r = await api(`/${coleccion}/versions/${vConV.id}?depth=0`, { method: "POST" });
        const errores = JSON.stringify(r.cuerpo?.errors ?? r.cuerpo?.message ?? null).slice(0, 600);
        decir(`   restaurar por la API: HTTP ${r.estado} · ${errores}`);
      } else if (vConV && vOriginal) {
        await restaurar(vConV, "con « v»");
        ok(`restaurar la versión con « v» la pone en la ficha`, (await leer()) === conV);
        const otra = (await versiones()).find((v) => v.version?.[campo] === original);
        if (otra) await restaurar(otra, "la de antes");
      }
      const final = await leer();
      ok("al final, la ficha queda como estaba", final === original);
      if (final !== original) {
        await poner(original);
        decir("   devuelta con la API");
      }
      hallazgos.push({
        pantalla: "versiones",
        ancho: ancho.nombre,
        coleccion,
        id,
        resultado,
        errores,
        fallidas,
      });
      await contexto.close();
      continue;
    }

    /*
     * Modo `joins` (2026-11-24, para dirección): en la ficha de cada colección
     * (`… joins <col1,col2,…>`), el primer listado de la pestaña «Contenido» (un campo `join`, con
     * su asa de arrastre), a la vista y capturado. NO arrastra nada: solo lee.
     */
    if (MODO === "joins") {
      const colecciones = (
        process.argv[4] ??
        "marcas-maquinaria,tipos-maquinaria,marcas,tipos-equipo,marcas-lubricante"
      )
        .split(",")
        .filter(Boolean);
      for (const coleccion of colecciones) {
        const id = await pagina.evaluate(
          async (r) => (await (await fetch(r, { credentials: "include" })).json())?.docs?.[0]?.id,
          `${base}/api/${coleccion}?limit=1&sort=id&depth=0`,
        );
        if (!id) {
          decir(`${coleccion} (${ancho.nombre}): sin fichas`);
          continue;
        }
        await pagina.goto(`${base}/admin/collections/${coleccion}/${id}`, {
          waitUntil: "networkidle",
        });
        await pagina.waitForTimeout(2500);
        const listado = pagina.locator(".relationship-table, .join-field, [class*='join']").first();
        const hay = (await listado.count()) > 0;
        if (hay) {
          await listado.scrollIntoViewIfNeeded();
          await pagina.waitForTimeout(800);
        }
        await pagina.screenshot({
          path: path.join(salida, `listado-${coleccion}-${ancho.nombre}.png`),
          fullPage: false,
        });
        const info = await pagina.evaluate(() => {
          const t = document.querySelector(".relationship-table, .join-field, [class*='join']");
          return {
            titulo:
              t
                ?.querySelector("h2, h3, h4, label, .relationship-table__header")
                ?.textContent?.trim()
                ?.slice(0, 80) ?? null,
            filas: t ? t.querySelectorAll("tbody tr").length : 0,
            asas: t
              ? t.querySelectorAll(
                  "[class*='drag'], [aria-roledescription='sortable'], [data-dnd-kit]",
                ).length
              : 0,
          };
        });
        hallazgos.push({ pantalla: `joins-${coleccion}`, ancho: ancho.nombre, id, hay, ...info });
        decir(
          `${coleccion} ${id} (${ancho.nombre}): ${hay ? `listado «${info.titulo ?? "-"}», ${info.filas} filas, ${info.asas} asas` : "SIN listado"}`,
        );
      }
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      await contexto.close();
      continue;
    }

    /*
     * Modo `abrir` (2026-11-24, #574): en la lista de cada colección (`… abrir <col1,col2>`), pulsa
     * en la primera fila la PRIMERA celda (el logo, la foto o el estado) y la del NOMBRE, y anota si
     * entra en la ficha. Solo lee.
     */
    if (MODO === "abrir") {
      const colecciones = (process.argv[4] ?? "marcas-maquinaria,solicitudes")
        .split(",")
        .filter(Boolean);
      for (const coleccion of colecciones) {
        const lista = `${base}/admin/collections/${coleccion}?limit=5`;
        await pagina.goto(lista, { waitUntil: "networkidle" });
        await pagina.waitForTimeout(1500);
        await pagina.screenshot({
          path: path.join(salida, `abrir-${coleccion}-${ancho.nombre}.png`),
          fullPage: false,
        });
        const cabeceras = await pagina
          .locator("table thead th")
          .evaluateAll((ths) => ths.map((th) => th.textContent.trim()));
        const iNombre = cabeceras.findIndex((t) => /^Nombre/.test(t));
        // La primera columna de datos: la que sigue a la casilla de marcar (si la hay).
        const iPrimera = cabeceras.findIndex((t) => t !== "");
        const resultados = [];
        for (const [que, indice] of [
          [`primera celda («${cabeceras[iPrimera] || "-"}»)`, iPrimera],
          ["celda «Nombre»", iNombre],
        ]) {
          if (indice < 0) {
            resultados.push(`${que}: no hay esa columna`);
            continue;
          }
          await pagina.goto(lista, { waitUntil: "networkidle" });
          await pagina.waitForTimeout(1200);
          const celda = pagina.locator("table tbody tr").first().locator("td").nth(indice);
          const enlace = celda.locator("a").first();
          const objetivo = (await enlace.count()) > 0 ? enlace : celda;
          await objetivo.click({ timeout: 5000 }).catch(() => null);
          await pagina.waitForTimeout(2500);
          const ruta = new URL(pagina.url()).pathname;
          const entra = new RegExp(`/collections/${coleccion}/\\d+/?$`).test(ruta);
          resultados.push(`${que}: ${entra ? "ENTRA" : "NO entra"} (${ruta})`);
        }
        hallazgos.push({
          pantalla: `abrir-${coleccion}`,
          ancho: ancho.nombre,
          cabeceras,
          resultados,
        });
        decir(`${coleccion} (${ancho.nombre}): ${resultados.join(" · ")}`);
      }
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      await contexto.close();
      continue;
    }

    /*
     * Modo `csp-subidas` (2026-11-24, para A, tras el #566): los avisos de la CSP HACIENDO cosas en
     * el panel, a 1440: subir una imagen y un PDF (subida directa al Blob), abrir la vista previa
     * del documento, escribir en un texto enriquecido y guardar una ficha (y deshacerlo). Imprime
     * los ids de lo subido: se borra después con la API local (el editor no puede borrar).
     */
    if (MODO === "csp-subidas") {
      if (ancho.movil) {
        await contexto.close();
        continue;
      }
      const consola = [];
      pagina.on("console", (m) => {
        const t = m.text();
        if (/Content[- ]Security[- ]Policy|Report Only/i.test(t)) consola.push(t.slice(0, 300));
      });
      await contexto.addInitScript(() => {
        window.__violaciones = [];
        document.addEventListener("securitypolicyviolation", (e) =>
          window.__violaciones.push(`${e.effectiveDirective} ← ${e.blockedURI}`),
        );
      });
      const limpiar = (v) =>
        v.replace(/(https?:\/\/[^/\s?]+)([^\s?]*)\?\S*/g, "$1$2").replace(origin, "(mismo origen)");
      const pasos = [];
      const anotar = async (paso, extra = "") => {
        const v = await pagina.evaluate(() => window.__violaciones ?? []).catch(() => []);
        const unicas = [...new Set(v.map(limpiar))];
        pasos.push({ paso, violaciones: unicas, extra });
        decir(
          `· ${paso}: ${unicas.length ? unicas.join(" | ") : "limpio"}${extra ? ` (${extra})` : ""}`,
        );
      };
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "csp-subidas-"));
      const png = path.join(tmp, "prueba-csp-panel.png");
      fs.writeFileSync(
        png,
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "base64",
        ),
      );
      const pdf = path.join(tmp, "prueba-csp-panel.pdf");
      fs.writeFileSync(
        pdf,
        "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n164\n%%EOF\n",
      );
      const guardar = async () => {
        await pagina.getByRole("button", { name: "Guardar" }).first().click();
        await pagina.waitForTimeout(4000);
      };
      const subidos = {};
      for (const [coleccion, fichero, campo, texto] of [
        ["media", png, "alt", "Prueba de subida para la CSP del panel"],
        ["documentos", pdf, "titulo", "Prueba de subida para la CSP del panel"],
      ]) {
        await pagina.goto(`${base}/admin/collections/${coleccion}/create`, {
          waitUntil: "networkidle",
        });
        await pagina.waitForTimeout(1500);
        await pagina.locator('input[type="file"]').first().setInputFiles(fichero);
        await pagina.waitForTimeout(800);
        await pagina.locator(`input[name="${campo}"]`).fill(texto);
        await guardar();
        await pagina
          .waitForURL((u) => /\/\d+\/?$/.test(u.pathname), { timeout: 30_000 })
          .catch(() => null);
        const id = Number(new URL(pagina.url()).pathname.match(/\/(\d+)\/?$/)?.[1]) || null;
        subidos[coleccion] = id;
        await anotar(`subir a ${coleccion}`, id ? `id ${id}` : "NO se guardó");
      }
      if (subidos.documentos) {
        // La vista previa del documento: su miniatura o el enlace al fichero (otra pestaña o un panel).
        const nueva = contexto.waitForEvent("page", { timeout: 6000 }).catch(() => null);
        await pagina
          .locator(".file-details a, .file-details__thumbnail, .thumbnail, .file-meta__url a")
          .first()
          .click({ timeout: 5000 })
          .catch(() => null);
        const pestana = await nueva;
        await pagina.waitForTimeout(1500);
        await anotar(
          "vista previa del documento",
          pestana
            ? `abre otra pestaña en ${new URL(pestana.url()).host === new URL(base).host ? "el mismo origen" : "otro origen (el Blob)"}`
            : "en el mismo panel",
        );
        if (pestana) await pestana.close();
      }
      // Escribir en un texto enriquecido y guardar; después, deshacerlo y guardar otra vez.
      const leerDescripcion = () =>
        pagina.evaluate(
          async (r) =>
            JSON.stringify(
              (await (await fetch(r, { credentials: "include" })).json())?.descripcion ?? null,
            ),
          `${base}/api/equipos-nuevos/1?depth=0`,
        );
      const antes = await leerDescripcion();
      await pagina.goto(`${base}/admin/collections/equipos-nuevos/1`, { waitUntil: "networkidle" });
      await pagina.waitForTimeout(2000);
      const editor = pagina.locator('[data-lexical-editor="true"]').first();
      await editor.click();
      await pagina.keyboard.press("ControlOrMeta+End");
      await pagina.keyboard.type(" CSP");
      await anotar("escribir en el texto enriquecido");
      await guardar();
      await anotar("guardar la ficha");
      await editor.click();
      await pagina.keyboard.press("ControlOrMeta+End");
      for (let i = 0; i < 4; i++) await pagina.keyboard.press("Backspace");
      await guardar();
      const despues = await leerDescripcion();
      await anotar(
        "deshacer y guardar",
        despues === antes ? "la descripción queda como estaba" : "¡la descripción NO quedó igual!",
      );
      hallazgos.push({
        pantalla: "csp-subidas",
        ancho: ancho.nombre,
        pasos,
        subidos,
        consola,
        // Solo si no quedó igual: para devolverla con la API local.
        ...(despues === antes ? {} : { descripcionAntes: antes }),
      });
      decir(`subidos (para borrar): ${JSON.stringify(subidos)}`);
      fs.rmSync(tmp, { recursive: true, force: true });
      await contexto.close();
      continue;
    }

    /*
     * Modo `csp` (2026-11-23, para A): los avisos de la Content-Security-Policy (en modo
     * report-only) en el panel con sesión: inicio, lista de usadas, una usada y una nueva. Junta los
     * eventos `securitypolicyviolation` de la página y los mensajes de consola que nombran la CSP.
     * Solo lee.
     */
    if (MODO === "csp") {
      const consola = [];
      pagina.on("console", (m) => {
        const t = m.text();
        if (/Content[- ]Security[- ]Policy|Report Only/i.test(t)) consola.push(t.slice(0, 400));
      });
      await contexto.addInitScript(() => {
        window.__violaciones = [];
        document.addEventListener("securitypolicyviolation", (e) =>
          window.__violaciones.push({
            directiva: e.effectiveDirective,
            bloqueado: e.blockedURI,
            fuente: e.sourceFile ? `${e.sourceFile}:${e.lineNumber}` : "",
            disposicion: e.disposition,
            muestra: (e.sample ?? "").slice(0, 80),
          }),
        );
      });
      const idDe = async (coleccion) =>
        pagina.evaluate(
          async (r) => (await (await fetch(r, { credentials: "include" })).json())?.docs?.[0]?.id,
          `${base}/api/${coleccion}?limit=1&sort=id&depth=0`,
        );
      const usada = await idDe("equipos-usados");
      const nueva = await idDe("equipos-nuevos");
      const RUTAS = [
        ["inicio", "/admin"],
        ["lista-usadas", "/admin/collections/equipos-usados"],
        ["ficha-usada", `/admin/collections/equipos-usados/${usada}`],
        ["ficha-nueva", `/admin/collections/equipos-nuevos/${nueva}`],
      ];
      for (const [nombre, ruta] of RUTAS) {
        const antes = consola.length;
        await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
        await pagina.waitForTimeout(2500);
        const violaciones = await pagina.evaluate(() => window.__violaciones ?? []);
        const unicas = [...new Map(violaciones.map((v) => [JSON.stringify(v), v])).values()];
        // Sin la query: solo origen y ruta de lo bloqueado.
        const limpias = unicas.map((v) => ({
          ...v,
          bloqueado: /^https?:/.test(v.bloqueado)
            ? (() => {
                const u = new URL(v.bloqueado);
                return `${u.origin === origin ? "(mismo origen)" : u.origin}${u.pathname}`;
              })()
            : v.bloqueado,
          fuente: v.fuente.replace(origin, ""),
        }));
        hallazgos.push({
          pantalla: `csp-${nombre}`,
          ancho: ancho.nombre,
          violaciones: limpias,
          consola: consola.slice(antes),
        });
        decir(
          `· ${nombre} (${ancho.nombre}): ${limpias.length} violaciones${limpias.length ? `: ${limpias.map((v) => `${v.directiva} ← ${v.bloqueado}`).join(" | ")}` : ""} · ${consola.length - antes} mensajes de consola`,
        );
      }
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      await contexto.close();
      continue;
    }

    /*
     * Modo `borrador` (`… borrador <id de la página>`, PR 8b): con la sesión abierta, el botón del
     * panel (`/api/borrador/?pagina=<id>`) lleva a la página con su ÚLTIMO BORRADOR y el aviso de
     * vista previa; «Salir de la vista previa» vuelve a lo publicado. El borrador de prueba lo
     * pone y lo quita `scripts/paginas/prueba-borrador.ts` (marca «PRUEBA BORRADOR 8B»).
     */
    /*
     * Modo `vivo` (`… vivo <id> [colección] [campo]`, punto 5): la VISTA PREVIA EN VIVO por efecto.
     * Por defecto, una unidad usada y su nombre. Sin sesión la ruta da 404; con sesión pinta la
     * ficha con `noindex`. A 1440, en el formulario se abre «Vista previa en vivo», se escribe una
     * marca en el campo SIN GUARDAR y el iframe la muestra. En móvil, la ruta misma. Nada se
     * guarda: el contexto se cierra.
     */
    if (MODO === "vivo") {
      const id = process.argv[4];
      if (!/^\d+$/.test(id ?? "")) fallar("Uso: … vivo <id> [colección] [campo]");
      const coleccion = process.argv[5] ?? "equipos-usados";
      const campo = process.argv[6] ?? "nombre";
      const ruta = `${base}/vista-previa/${coleccion}/${id}/`;
      const resultado = [];
      const ok = (texto, bien) => {
        resultado.push(`${bien ? "✓" : "✗"} ${texto}`);
        decir(`${bien ? "✓" : "✗"} ${texto} (${ancho.nombre})`);
      };
      const anonimo = await pagina.evaluate(
        async (r) => (await fetch(r, { credentials: "omit" })).status,
        ruta,
      );
      ok(`sin sesión, la ruta da 404 (HTTP ${anonimo})`, anonimo === 404);
      await pagina.goto(ruta, { waitUntil: "networkidle" });
      const directa = await pagina.evaluate(() => ({
        h1: document.querySelector("h1")?.textContent?.trim() ?? "",
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
      }));
      ok(`con sesión pinta la ficha («${directa.h1.slice(0, 50)}»)`, directa.h1.length > 0);
      ok(`noindex (${directa.robots})`, /noindex/.test(directa.robots));
      await pagina.screenshot({
        path: path.join(salida, `vivo-ruta-${coleccion}-${ancho.nombre}.png`),
      });
      if (!ancho.movil) {
        const MARCA = " PRUEBA VIVO";
        // Lo guardado antes de empezar: al final tiene que seguir igual (la vista previa no guarda).
        const huella = () =>
          pagina.evaluate(
            async ([b, c, i]) => {
              const doc = await (await fetch(`${b}/api/${c}/${i}?depth=0`)).json();
              const v = await (
                await fetch(`${b}/api/${c}/versions?where[parent][equals]=${i}&limit=1`)
              ).json();
              return `${doc.updatedAt} · ${v.totalDocs} versiones`;
            },
            [base, coleccion, id],
          );
        const antes = await huella();
        // La petición a la función de servidor (las pintadas en el servidor), para repetirla sin sesión.
        let accion = null;
        pagina.on("request", (r) => {
          const h = r.headers();
          if (!accion && r.method() === "POST" && h["next-action"])
            accion = { url: r.url(), cuerpo: r.postData() ?? "", cabeceras: h };
        });
        await pagina.goto(`${base}/admin/collections/${coleccion}/${id}`, {
          waitUntil: "networkidle",
        });
        const paso = async (nombrePaso, accion) => {
          try {
            await accion();
          } catch (e) {
            await pagina.screenshot({ path: path.join(salida, `vivo-fallo-${ancho.nombre}.png`) });
            const estado = await pagina.evaluate(() => {
              const v = document.querySelector(".live-preview-window");
              const f = document.querySelector("iframe.live-preview-iframe");
              const caja = (el) => (el ? JSON.stringify(el.getBoundingClientRect()) : "—");
              return {
                ventana: v ? `${v.className} ${caja(v)}` : "no hay",
                iframe: f ? `${f.getAttribute("src")} ${caja(f)}` : "no hay",
                boton: document.querySelector(".live-preview-toggler")?.className ?? "no hay",
                html: v ? v.innerHTML.replace(/<svg[\s\S]*?<\/svg>/g, "").slice(0, 1500) : "",
              };
            });
            decir(`   estado: ${JSON.stringify(estado)}`);
            fallar(`vivo: falló «${nombrePaso}» (${String(e).split("\n")[0]})`);
          }
        };
        // Payload recuerda por usuario si la dejó abierta: solo se pulsa si está cerrada.
        await paso("abrir la vista previa en vivo", async () => {
          const boton = pagina.locator(".live-preview-toggler").first();
          await boton.waitFor({ timeout: 10000 });
          const activa = (await boton.getAttribute("class"))?.includes("--active");
          if (!activa) await boton.click();
        });
        const marco = pagina.frameLocator("#live-preview-iframe");
        await paso("la ficha en el iframe", () =>
          marco.locator("h1").first().waitFor({ timeout: 20000 }),
        );
        const entrada = pagina.locator(`#field-${campo}`);
        await entrada.click();
        await entrada.press("End");
        await entrada.pressSequentially(MARCA, { delay: 30 });
        // Las pintadas en el servidor tardan más (pausa de 500 ms y la petición): hasta 20 s.
        let vivo = false;
        for (let i = 0; i < 40 && !vivo; i++) {
          await pagina.waitForTimeout(500);
          vivo = ((await marco.locator("body").textContent()) ?? "").includes(MARCA.trim());
        }
        ok(`al escribir en «${campo}» sin guardar, el iframe lo muestra`, vivo);
        if (coleccion !== "equipos-usados") {
          ok("la ficha la pide a la función de servidor", Boolean(accion));
          if (accion) {
            // La misma petición, SIN cookies: no puede devolver la ficha ni lo escrito.
            const cabeceras = { ...accion.cabeceras };
            delete cabeceras.cookie;
            const anon = await pagina.evaluate(
              async ([u, h, c]) => {
                const r = await fetch(u, {
                  method: "POST",
                  headers: h,
                  body: c,
                  credentials: "omit",
                });
                const t = await r.text();
                return { estado: r.status, largo: t.length, texto: t.slice(0, 4000) };
              },
              [accion.url, cabeceras, accion.cuerpo],
            );
            const filtra = anon.texto.includes(MARCA.trim()) || /<h1|"h1"/.test(anon.texto);
            ok(
              `sin sesión, la función de servidor no pinta nada (HTTP ${anon.estado}, ${anon.largo} bytes)`,
              !filtra,
            );
            hallazgos.push({
              pantalla: "vivo-sin-sesion",
              coleccion,
              respuesta: anon.texto.slice(0, 500),
            });
          }
        }
        const despues = await huella();
        ok(`no se guardó nada (${antes} → ${despues})`, antes === despues);
        await pagina.screenshot({
          path: path.join(salida, `vivo-panel-${coleccion}-${ancho.nombre}.png`),
        });
      }
      hallazgos.push({
        pantalla: "vivo",
        ancho: ancho.nombre,
        coleccion,
        id,
        resultado,
        errores,
        fallidas,
      });
      // Sin guardar: se cierra el contexto y lo escrito se pierde.
      await contexto.close();
      continue;
    }

    /*
     * Modo `versiones-orden` (`… versiones-orden <colección> <id>`, #578 de B): la lista de
     * versiones sale por fecha, la más reciente primero, y la hora de la lista, de la comparación y
     * del aviso de «Restaurar» es la de Colombia (no la UTC). NO restaura: el aviso se cancela.
     */
    if (MODO === "versiones-orden") {
      const coleccion = process.argv[4] ?? "equipos-usados";
      const id = process.argv[5] ?? "27";
      const resultado = [];
      const ok = (texto, bien) => {
        resultado.push(`${bien ? "✓" : "✗"} ${texto}`);
        decir(`${bien ? "✓" : "✗"} ${texto} (${ancho.nombre})`);
      };
      const hora = (iso, zona) =>
        new Intl.DateTimeFormat("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
          timeZone: zona,
        }).format(new Date(iso));
      await pagina.goto(`${base}/admin/collections/${coleccion}/${id}/versions`, {
        waitUntil: "networkidle",
      });
      await pagina.waitForTimeout(1500);
      const api = await pagina.evaluate(
        async ([b, c, i]) =>
          (
            await (
              await fetch(
                `${b}/api/${c}/versions?where[parent][equals]=${i}&sort=-updatedAt&limit=10&depth=0`,
              )
            ).json()
          ).docs.map((d) => ({ id: d.id, updatedAt: d.updatedAt })),
        [base, coleccion, id],
      );
      const filas = await pagina
        .locator("table tbody tr")
        .evaluateAll((trs) =>
          trs.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent?.trim() ?? "")),
        );
      // La columna del id de versión: la que coincide con los ids de la API.
      const ids = filas.map((f) => f.find((c) => /^\d+$/.test(c)) ?? "");
      ok(
        `la lista va por fecha, la más reciente primero (${ids.join(",")})`,
        ids.join(",") === api.map((v) => String(v.id)).join(","),
      );
      const reciente = api[0];
      const colombia = hora(reciente.updatedAt, "America/Bogota");
      const utc = hora(reciente.updatedAt, "UTC");
      ok(
        `la primera fila lleva la hora de Colombia (${colombia}; UTC sería ${utc}): «${filas[0]?.[0]}»`,
        (filas[0] ?? []).join(" ").includes(colombia),
      );
      await pagina.screenshot({
        path: path.join(salida, `versiones-orden-lista-${ancho.nombre}.png`),
      });
      await pagina.goto(`${base}/admin/collections/${coleccion}/${id}/versions/${reciente.id}`, {
        waitUntil: "networkidle",
      });
      await pagina.waitForTimeout(1500);
      const migas =
        (await pagina.locator(".step-nav, nav[aria-label]").first().textContent()) ?? "";
      ok(
        `las migas de la comparación, en hora de Colombia («${migas.trim().slice(-30)}»)`,
        migas.includes(colombia) && !migas.includes(utc),
      );
      await pagina.screenshot({
        path: path.join(salida, `versiones-orden-comparar-${ancho.nombre}.png`),
      });
      const boton = pagina.getByRole("button", { name: /Restaurar/i }).first();
      if (await boton.count()) {
        await boton.click();
        await pagina.waitForTimeout(800);
        const aviso =
          (await pagina
            .locator("dialog, [role=dialog], .modal, .confirmation-modal")
            .last()
            .textContent()
            .catch(() => "")) ?? "";
        ok(
          `el aviso de «Restaurar», en hora de Colombia («${aviso.trim().slice(0, 120)}»)`,
          aviso.includes(colombia) && !aviso.includes(utc),
        );
        await pagina.screenshot({
          path: path.join(salida, `versiones-orden-aviso-${ancho.nombre}.png`),
        });
        await pagina
          .getByRole("button", { name: /Cancelar/i })
          .last()
          .click()
          .catch(() => pagina.keyboard.press("Escape"));
      } else {
        ok("hay botón «Restaurar» en la comparación", false);
      }
      hallazgos.push({
        pantalla: "versiones-orden",
        ancho: ancho.nombre,
        coleccion,
        id,
        resultado,
        errores,
        fallidas,
      });
      await contexto.close();
      continue;
    }

    /*
     * Modo `editar` (`… editar <colección> <id>`, tanda 23): los enlaces «Editar» de la web por
     * efecto. Con `?pestana=buscadores&campo=seo.metaTitle` se abre esa pestaña y el foco queda en
     * ese campo; con `?pestana=fotos`, la pestaña de fotos; y con valores maliciosos no pasa nada
     * (ni diálogo, ni imagen inyectada, ni otra pestaña). No guarda nada.
     */
    if (MODO === "editar") {
      const coleccion = process.argv[4] ?? "equipos-usados";
      const id = process.argv[5] ?? "27";
      const resultado = [];
      const ok = (texto, bien) => {
        resultado.push(`${bien ? "✓" : "✗"} ${texto}`);
        decir(`${bien ? "✓" : "✗"} ${texto} (${ancho.nombre})`);
      };
      let dialogos = 0;
      pagina.on("dialog", (d) => {
        dialogos++;
        d.dismiss().catch(() => null);
      });
      const ficha = `${base}/admin/collections/${coleccion}/${id}`;
      const pestanaActiva = () =>
        pagina
          .locator(".tabs-field__tab-button--active")
          .first()
          .textContent({ timeout: 1500 })
          .then((t) => t?.trim() ?? "")
          .catch(() => "");
      // ¿Responde la página? Un evaluate con límite de 2 s (si el hilo estuviera bloqueado, no vuelve).
      const responde = () =>
        Promise.race([
          pagina.evaluate(() => 1).then(() => true),
          new Promise((r) => setTimeout(() => r(false), 2000)),
        ]);
      await pagina.goto(`${ficha}?pestana=buscadores&campo=seo.metaTitle`, {
        waitUntil: "load",
        timeout: 30000,
      });
      let foco = "";
      for (let i = 0; i < 40 && foco !== "field-seo__metaTitle"; i++) {
        await pagina.waitForTimeout(250);
        foco = await pagina.evaluate(() => document.activeElement?.id ?? "");
      }
      ok(
        `pestaña y campo: abre «${await pestanaActiva()}»`,
        (await pestanaActiva()) === "Buscadores y redes",
      );
      ok(`pestaña y campo: el foco queda en el campo (${foco})`, foco === "field-seo__metaTitle");
      await pagina.screenshot({ path: path.join(salida, `editar-campo-${ancho.nombre}.png`) });
      await pagina.goto(`${ficha}?pestana=fotos`, { waitUntil: "load", timeout: 30000 });
      for (let i = 0; i < 24 && (await pestanaActiva()) !== "Fotos"; i++)
        await pagina.waitForTimeout(250);
      ok(`solo pestaña: abre «${await pestanaActiva()}»`, (await pestanaActiva()) === "Fotos");
      await pagina.screenshot({ path: path.join(salida, `editar-pestana-${ancho.nombre}.png`) });
      // Control: la misma ficha sin `pestana` ni `campo` (IrAlCampo no hace nada).
      await pagina.goto(ficha, { waitUntil: "load", timeout: 30000 });
      await pagina.waitForTimeout(2500);
      ok(
        `control sin parámetros: la página responde (pestaña «${await pestanaActiva()}»)`,
        await responde(),
      );
      // Valores inválidos que NO parecen un ataque: con `<img onerror>` el antivirus de esta máquina
      // (Bitdefender) bloquea la URL y la página probada es la suya, no el panel (visto el 2026-11-24).
      const malicioso = "?pestana=__proto__&campo=" + encodeURIComponent("nombre' x..#field-seo");
      await pagina.goto(`${ficha}${malicioso}`, { waitUntil: "load", timeout: 30000 });
      await pagina.waitForTimeout(2500);
      const vivaMal = await responde();
      const esPanel = (await pagina.locator(".tabs-field__tab-button").count()) > 0;
      ok("con valores inválidos se pinta el panel de verdad (no una página de bloqueo)", esPanel);
      const inyectada = vivaMal ? await pagina.locator('img[src="x"]').count() : -1;
      const focoMalo = vivaMal
        ? await pagina.evaluate(() => document.activeElement?.id ?? "")
        : "?";
      // La pestaña es la que Payload recuerde del usuario: lo que importa es que nada se inyecte.
      ok(
        `valores maliciosos: la página responde y no pasa nada (${inyectada} imágenes inyectadas, ${dialogos} diálogos, foco «${focoMalo}», pestaña «${await pestanaActiva()}»)`,
        esPanel && vivaMal && inyectada === 0 && dialogos === 0 && !focoMalo.startsWith("field-"),
      );
      await pagina
        .screenshot({
          path: path.join(salida, `editar-malicioso-${ancho.nombre}.png`),
          timeout: 10000,
        })
        .catch(() => null);
      hallazgos.push({ pantalla: "editar", ancho: ancho.nombre, resultado, errores, fallidas });
      await contexto.close();
      continue;
    }

    /*
     * Modo `pista` (tanda 23, modo administración): la pista `pq-modo-admin` por efecto. Con
     * sesión, en el panel, vale «1»; al pulsar «Cerrar sesión» desaparece y en la pantalla de
     * acceso sigue sin estar. Cierra la sesión del editor de pruebas (es lo que se prueba).
     */
    if (MODO === "pista") {
      const resultado = [];
      const ok = (texto, bien) => {
        resultado.push(`${bien ? "✓" : "✗"} ${texto}`);
        decir(`${bien ? "✓" : "✗"} ${texto} (${ancho.nombre})`);
      };
      const pista = () =>
        pagina.evaluate(() => {
          try {
            return localStorage.getItem("pq-modo-admin");
          } catch {
            return "(sin localStorage)";
          }
        });
      await pagina.goto(`${base}/admin/`, { waitUntil: "load", timeout: 30000 });
      let valor = null;
      for (let i = 0; i < 20 && valor !== "1"; i++) {
        await pagina.waitForTimeout(250);
        valor = await pista();
      }
      ok(`con sesión, en el panel, la pista vale «${valor}»`, valor === "1");
      // El enlace de salir está en el menú: si está cerrado, se abre.
      if ((await pagina.locator(".nav--nav-open").count()) === 0)
        await pagina
          .locator(
            ancho.movil ? ".app-header__mobile-nav-toggler" : ".template-default__nav-toggler",
          )
          .first()
          .click()
          .catch(() => null);
      await pagina.waitForTimeout(400);
      await pagina.locator("a.nav__log-out").first().click({ timeout: 10000 });
      await pagina.waitForURL(/\/admin\/(login|logout)/, { timeout: 20000 }).catch(() => null);
      await pagina.waitForTimeout(1500);
      const tras = await pista();
      ok(`al cerrar sesión desaparece (${tras === null ? "no está" : `«${tras}»`})`, tras === null);
      await pagina.goto(`${base}/admin/login`, { waitUntil: "load", timeout: 30000 });
      await pagina.waitForTimeout(1500);
      const enAcceso = await pista();
      ok(
        `en la pantalla de acceso no está (${enAcceso === null ? "no está" : `«${enAcceso}»`})`,
        enAcceso === null,
      );
      hallazgos.push({ pantalla: "pista", ancho: ancho.nombre, resultado, errores, fallidas });
      await contexto.close();
      continue;
    }

    /*
     * Modo `modo-admin` (tanda 23, la barra de A en la web, con la pista de C): por efecto, con la
     * sesión del editor de pruebas. En la portada y en una usada sale la franja con su nombre y los
     * botones «Editar»; cada «Editar» es de algo que ese usuario puede editar (`/api/access`); uno
     * cae en la pestaña y el campo exactos; «Ver borrador» (si lo hay) e «Ir al panel» abren;
     * «Cerrar sesión» quita la franja, la sesión y la pista. A 1440 graba el vídeo del recorrido.
     */
    if (MODO === "modo-admin") {
      const resultado = [];
      const ok = (texto, bien) => {
        resultado.push(`${bien ? "✓" : "✗"} ${texto}`);
        decir(`${bien ? "✓" : "✗"} ${texto} (${ancho.nombre})`);
      };
      const foto = (n, p = pagina) =>
        p
          .screenshot({
            path: path.join(salida, `modo-admin-${n}-${ancho.nombre}.png`),
            timeout: 10000,
          })
          .catch(() => null);
      const franja = () => pagina.locator(".pqma-franja");
      const esperarFranja = () =>
        franja()
          .waitFor({ timeout: 20000 })
          .then(
            () => true,
            () => false,
          );
      // 1) Entrar al panel deja la pista.
      await pagina.goto(`${base}/admin/`, { waitUntil: "load", timeout: 30000 });
      await pagina.waitForTimeout(1500);
      const pista = await pagina.evaluate(() => localStorage.getItem("pq-modo-admin"));
      ok(`al entrar al panel queda la pista («${pista}»)`, pista === "1");
      const permisos = await pagina.evaluate(async () => (await fetch("/api/access/")).json());
      const puede = (s) =>
        Boolean(permisos?.collections?.[s]?.update || permisos?.globals?.[s]?.update);
      // 2) Portada y una usada.
      const usada = await pagina.evaluate(async () => {
        const d = await (await fetch("/api/equipos-usados/27/?depth=1")).json();
        return d?.slug && d?.categoria?.slug
          ? `/maquinaria-pesada/maquinaria-pesada-usada/${d.categoria.slug}/${d.slug}/`
          : null;
      });
      for (const [nombre, ruta] of [
        ["portada", "/"],
        ["usada", usada],
      ]) {
        if (!ruta) {
          ok(`${nombre}: no se encontró la página`, false);
          continue;
        }
        await pagina.goto(`${base}${ruta}`, { waitUntil: "load", timeout: 30000 });
        const hay = await esperarFranja();
        const quien = hay
          ? (
              (await pagina
                .locator(".pqma-quien")
                .textContent()
                .catch(() => "")) ?? ""
            ).trim()
          : "";
        ok(
          `${nombre}: sale la franja con el usuario («${quien.replace(/^·\s*/, "")}»)`,
          hay && quien.length > 2,
        );
        const enlaces = await pagina
          .locator(".pqma-editar, .pqma-boton--principal")
          .evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
        const slugs = enlaces.map(
          (h) => (h.match(/\/admin\/(?:collections|globals)\/([a-z0-9-]+)/) ?? [])[1] ?? "?",
        );
        const ajenos = slugs.filter((s) => !puede(s));
        ok(
          `${nombre}: ${enlaces.length} botones «Editar», todos de lo que puede editar (${[...new Set(slugs)].join(", ")})`,
          enlaces.length > 0 && ajenos.length === 0,
        );
        await foto(nombre);
      }
      // 3) Un «Editar» con campo cae en la pestaña y el campo (se abre en otra pestaña).
      await pagina.goto(`${base}${usada ?? "/"}`, { waitUntil: "load", timeout: 30000 });
      await esperarFranja();
      const conCampo = pagina.locator('.pqma-editar[href*="campo="]').first();
      if (await conCampo.count()) {
        const href = (await conCampo.getAttribute("href")) ?? "";
        const campo = new URL(href, base).searchParams.get("campo") ?? "";
        const idCampo = `field-${campo.replace(/\./g, "__")}`;
        const [nueva] = await Promise.all([
          contexto.waitForEvent("page", { timeout: 15000 }),
          conCampo.click({ force: true }),
        ]);
        let foco = "";
        for (let i = 0; i < 48 && foco !== idCampo; i++) {
          await nueva.waitForTimeout(250);
          foco = await nueva.evaluate(() => document.activeElement?.id ?? "").catch(() => "");
        }
        ok(
          `«Editar» de «${campo}» abre la ficha con el foco en el campo (${foco})`,
          foco === idCampo,
        );
        await foto("editar-campo", nueva);
        await nueva.close();
      } else {
        ok("hay algún «Editar» con campo en la usada", false);
      }
      // 4) «Ver borrador» (si la página lo tiene) e «Ir al panel».
      await pagina.goto(`${base}/`, { waitUntil: "load", timeout: 30000 });
      await esperarFranja();
      const borrador = pagina.locator(".pqma-franja a", { hasText: "Ver borrador" });
      if (await borrador.count()) {
        const [p2] = await Promise.all([
          contexto.waitForEvent("page", { timeout: 15000 }),
          borrador.click(),
        ]);
        await p2.waitForLoadState("load").catch(() => null);
        const texto =
          (await p2
            .locator("body")
            .textContent()
            .catch(() => "")) ?? "";
        ok(
          `«Ver borrador» abre la vista previa del borrador (${new URL(p2.url()).pathname})`,
          /borrador/i.test(texto),
        );
        await foto("ver-borrador", p2);
        await p2.close();
      } else {
        ok("«Ver borrador» no sale en la portada (no tiene borrador guardado)", true);
      }
      const [p3] = await Promise.all([
        contexto.waitForEvent("page", { timeout: 15000 }),
        pagina.locator(".pqma-franja a", { hasText: "Ir al panel" }).click(),
      ]);
      await p3.waitForLoadState("load").catch(() => null);
      ok(
        `«Ir al panel» abre el panel (${new URL(p3.url()).pathname})`,
        /^\/admin\/?$/.test(new URL(p3.url()).pathname),
      );
      await p3.close();
      // 5) Vídeo (1440): portada → Editar → campo → volver, en la MISMA pestaña (un solo vídeo).
      if (!ancho.movil) {
        await pagina.goto(`${base}/`, { waitUntil: "load", timeout: 30000 });
        await esperarFranja();
        await pagina.waitForTimeout(1500);
        const primero = pagina.locator('.pqma-editar[href*="campo="], .pqma-editar').first();
        await primero.hover({ force: true }).catch(() => null);
        await pagina.waitForTimeout(1200);
        const href = await primero.getAttribute("href").catch(() => null);
        if (href) {
          await pagina.goto(new URL(href, base).toString(), { waitUntil: "load", timeout: 30000 });
          await pagina.waitForTimeout(4000);
          await pagina.goBack({ waitUntil: "load" }).catch(() => null);
          await esperarFranja();
          await pagina.waitForTimeout(1500);
        }
      }
      // 6) «Cerrar sesión» quita la franja, la sesión y la pista.
      await pagina.locator(".pqma-franja button", { hasText: "Cerrar sesión" }).click();
      const fuera = await franja()
        .waitFor({ state: "detached", timeout: 15000 })
        .then(
          () => true,
          () => false,
        );
      await pagina.waitForTimeout(1000);
      const yo = await pagina.evaluate(
        async () => (await (await fetch("/api/users/me/")).json())?.user ?? null,
      );
      const pistaFinal = await pagina.evaluate(() => localStorage.getItem("pq-modo-admin"));
      ok(
        `«Cerrar sesión» quita la franja, la sesión y la pista (franja ${fuera ? "fuera" : "sigue"}, usuario ${yo ? "sigue" : "ninguno"}, pista ${pistaFinal ?? "fuera"})`,
        fuera && !yo && pistaFinal === null,
      );
      await foto("tras-salir");
      await pagina.waitForTimeout(1000);
      hallazgos.push({ pantalla: "modo-admin", ancho: ancho.nombre, resultado, errores, fallidas });
      await contexto.close();
      continue;
    }

    if (MODO === "borrador") {
      const id = process.argv[4];
      if (!/^\d+$/.test(id ?? "")) fallar("Uso: … borrador <id de la página>");
      const MARCA_BORRADOR = "PRUEBA BORRADOR 8B";
      const leer = () =>
        pagina.evaluate(
          (marca) => ({
            ruta: location.pathname,
            marca: document.body.innerText.includes(marca),
            aviso: document.body.innerText.includes("Vista previa del borrador"),
            h1: document.querySelector("h1")?.textContent?.trim().slice(0, 80) ?? "",
          }),
          MARCA_BORRADOR,
        );
      await pagina.goto(`${base}/api/borrador/?pagina=${id}`, { waitUntil: "networkidle" });
      const dentro = await leer();
      await pagina.screenshot({ path: path.join(salida, `borrador-dentro-${ancho.nombre}.png`) });
      await Promise.all([
        pagina.waitForNavigation({ waitUntil: "networkidle" }),
        pagina.getByRole("button", { name: "Salir de la vista previa" }).click(),
      ]).catch(() => fallar(`No se pudo salir de la vista previa (${ancho.nombre}).`));
      const fuera = await leer();
      await pagina.screenshot({ path: path.join(salida, `borrador-fuera-${ancho.nombre}.png`) });
      hallazgos.push({ pantalla: "borrador", ancho: ancho.nombre, dentro, fuera });
      decir(
        `borrador (${ancho.nombre}): dentro ${JSON.stringify(dentro)} · fuera ${JSON.stringify(fuera)}`,
      );
      if (!dentro.marca || !dentro.aviso)
        fallar(`La vista previa no muestra el borrador (${ancho.nombre}).`);
      if (fuera.marca || fuera.aviso) fallar(`Al salir sigue el borrador (${ancho.nombre}).`);
      if (fuera.ruta !== dentro.ruta) fallar(`Al salir cambió de página: ${fuera.ruta}.`);
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      hallazgos.push({ pantalla: "peticiones-fallidas", ancho: ancho.nombre, fallidas });
      await contexto.close();
      continue;
    }

    /*
     * Modo `fuentes` (`… fuentes <carpeta>`): sube por el formulario del panel
     * cada `*.woff2`, `*.woff`, `*.ttf` y `*.otf` de la carpeta con el tipo
     * que manda Chrome en Windows (`application/octet-stream`) y lee lo que
     * guardó Payload (tipo MIME y «Formato»). Crea fuentes «PRUEBA FUENTES —»:
     * borrarlas después (un editor no puede).
     */
    if (MODO === "fuentes") {
      const carpeta = process.argv[4];
      if (!carpeta || !fs.existsSync(carpeta)) fallar("Uso: … fuentes <carpeta con las fuentes>");
      if (ancho.movil) {
        await contexto.close();
        continue;
      }
      const ficheros = fs.readdirSync(carpeta).filter((f) => /\.(woff2?|ttf|otf)$/i.test(f));
      for (const nombre of ficheros) {
        await pagina.goto(`${base}/admin/collections/fuentes/create`, { waitUntil: "networkidle" });
        await pagina.locator('input[type="file"]').setInputFiles({
          name: nombre,
          mimeType: "application/octet-stream",
          buffer: fs.readFileSync(path.join(carpeta, nombre)),
        });
        await pagina.locator("#field-nombre").fill(`PRUEBA FUENTES — ${nombre} ${Date.now()}`);
        await pagina.locator("#action-save").click();
        const creada = await pagina
          .waitForURL((u) => /\/fuentes\/\d+/.test(u.pathname), { timeout: 30_000 })
          .then(() => true)
          .catch(() => false);
        await pagina.waitForTimeout(1500);
        const fichero = path.join(salida, `fuente-${nombre}.png`);
        await pagina.screenshot({ path: fichero, fullPage: true });
        if (!creada) {
          const aviso = await pagina
            .locator(".toast-error, .Toastify__toast--error, [data-sonner-toast]")
            .allTextContents();
          hallazgos.push({ pantalla: "fuente", nombre, creada, aviso });
          decir(`✗ ${nombre}: no se guardó — ${aviso.join(" | ").slice(0, 200)}`);
          continue;
        }
        const id = new URL(pagina.url()).pathname.split("/").filter(Boolean).pop();
        const doc = await pagina.evaluate(async (i) => {
          const r = await fetch(`/api/fuentes/${i}?depth=0`, { credentials: "include" });
          const d = await r.json();
          return { mimeType: d.mimeType, formato: d.formato, filename: d.filename };
        }, id);
        hallazgos.push({ pantalla: "fuente", nombre, creada, id, ...doc });
        decir(`✓ ${nombre}: id ${id} · ${doc.mimeType} · formato ${doc.formato}`);
      }
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      await contexto.close();
      continue;
    }

    /*
     * Modo `imagenes` (`… imagenes <carpeta>`): sube por el formulario del panel cada JPEG, PNG y
     * WebP de la carpeta y lee lo que guardó Payload (nombre, tipo, peso y medidas) y lo que
     * sirve el almacén, para comprobar la reducción al subir (3840 px de ancho, WebP). Crea
     * imágenes «Prueba de reducción al subir…» y las BORRA al terminar (si no puede, lo dice).
     */
    if (MODO === "imagenes") {
      const carpeta = process.argv[4];
      if (!carpeta || !fs.existsSync(carpeta)) fallar("Uso: … imagenes <carpeta con las imágenes>");
      if (ancho.movil) {
        await contexto.close();
        continue;
      }
      const TIPOS = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
      const ficheros = fs.readdirSync(carpeta).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
      for (const nombre of ficheros) {
        const datos = fs.readFileSync(path.join(carpeta, nombre));
        await pagina.goto(`${base}/admin/collections/media/create`, { waitUntil: "networkidle" });
        await pagina.locator('input[type="file"]').setInputFiles({
          name: nombre,
          mimeType: TIPOS[nombre.split(".").pop().toLowerCase()],
          buffer: datos,
        });
        await pagina
          .locator("#field-alt")
          .fill(
            `Prueba de reducción al subir, fichero ${nombre.replace(/\W+/g, " ")} ${Date.now()}`,
          );
        await pagina.locator("#action-save").click();
        const creada = await pagina
          .waitForURL((u) => /\/media\/\d+/.test(u.pathname), { timeout: 60_000 })
          .then(() => true)
          .catch(() => false);
        await pagina.waitForTimeout(1500);
        const avisos = await pagina.locator("[data-sonner-toast]").allTextContents();
        await pagina.screenshot({
          path: path.join(salida, `imagen-${nombre}.png`),
          fullPage: true,
        });
        if (!creada) {
          hallazgos.push({ pantalla: "imagen", nombre, creada, avisos });
          decir(`✗ ${nombre}: no se guardó — ${avisos.join(" | ").slice(0, 300)}`);
          continue;
        }
        const id = new URL(pagina.url()).pathname.split("/").filter(Boolean).pop();
        const doc = await pagina.evaluate(async (i) => {
          const r = await fetch(`/api/media/${i}?depth=0`, { credentials: "include" });
          const d = await r.json();
          const f = await fetch(d.url);
          const b = new Uint8Array(await f.arrayBuffer());
          const firma = String.fromCharCode(...b.slice(0, 4), ...b.slice(8, 12));
          const mapa = await createImageBitmap(new Blob([b]));
          return {
            filename: d.filename,
            mimeType: d.mimeType,
            filesize: d.filesize,
            medidas: `${d.width}x${d.height}`,
            servido: {
              estado: f.status,
              tipo: f.headers.get("content-type"),
              bytes: b.length,
              firma,
              medidas: `${mapa.width}x${mapa.height}`,
            },
          };
        }, id);
        const borrada = await pagina.evaluate(async (i) => {
          const r = await fetch(`/api/media/${i}`, { method: "DELETE", credentials: "include" });
          return r.status;
        }, id);
        hallazgos.push({
          pantalla: "imagen",
          nombre,
          original: datos.length,
          id,
          ...doc,
          avisos,
          borrada,
        });
        decir(
          `✓ ${nombre} (${datos.length} bytes) → id ${id} · ${doc.filename} · ${doc.mimeType} · ` +
            `${doc.filesize} bytes · ${doc.medidas} · servido ${JSON.stringify(doc.servido)} · ` +
            `avisos: ${avisos.join(" | ").slice(0, 300) || "ninguno"} · borrado: HTTP ${borrada}`,
        );
      }
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
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
     * Modo `orden` (2026-10-26, #379): las listas de tipos y de equipos nuevos de Case,
     * ordenadas por la columna «Orden» (vacíos al final), con la columna a la vista. Solo lee.
     */
    if (MODO === "orden") {
      const LISTAS = [
        [
          "orden-tipos-case",
          "/admin/collections/tipos-maquinaria?sort=orden&where[marca.slug][equals]=case-construction",
        ],
        [
          "orden-equipos-case",
          "/admin/collections/equipos-nuevos?sort=orden&where[marca.slug][equals]=case-construction",
        ],
      ];
      for (const [nombre, ruta] of LISTAS) {
        await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
        await pagina.waitForTimeout(1500);
        await pagina.screenshot({
          path: path.join(salida, `${nombre}-${ancho.nombre}.png`),
          fullPage: true,
        });
        const lista = await pagina.evaluate(() => {
          const columnas = [...document.querySelectorAll("table thead th")].map((th) =>
            th.textContent.trim(),
          );
          const iOrden = columnas.findIndex((c) => /^orden/i.test(c));
          return {
            columnas,
            filas: [...document.querySelectorAll("table tbody tr")].slice(0, 8).map((tr) => ({
              nombre: tr.querySelector("td:nth-child(2)")?.textContent?.trim().slice(0, 50),
              orden: iOrden >= 0 ? tr.children[iOrden]?.textContent?.trim() : null,
            })),
          };
        });
        hallazgos.push({ pantalla: nombre, ancho: ancho.nombre, ...lista });
        decir(`✓ ${nombre} (${ancho.nombre})`);
      }
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      hallazgos.push({ pantalla: "peticiones-fallidas", ancho: ancho.nombre, fallidas });
      await contexto.close();
      continue;
    }

    /*
     * Modo `pestanas` (2026-11-19, #507): las fichas con pestañas (Contenido · Fotos · Buscadores y
     * redes · Avanzado), solo a 1440: un equipo usado (maquinaria) y una línea de lubricantes.
     * Pulsa cada pestaña, la captura y anota qué pestañas ve la cuenta (un editor no ve
     * «Avanzado») y si sale el aviso de foto pequeña. Solo lee: no guarda nada.
     */
    if (MODO === "pestanas") {
      if (ancho.movil) {
        await contexto.close();
        continue;
      }
      const FICHAS = [
        ["pestanas-equipo-usado", "equipos-usados"],
        ["pestanas-linea-lubricante", "categorias-lubricante"],
      ];
      for (const [nombre, coleccion] of FICHAS) {
        const primero = await pagina.evaluate(
          async (u) => (await (await fetch(u, { credentials: "include" })).json()).docs?.[0]?.id,
          `/api/${coleccion}/?limit=1&depth=0&select[nombre]=true`,
        );
        if (!primero) {
          decir(`· ${nombre}: la colección está vacía`);
          continue;
        }
        await pagina.goto(`${base}/admin/collections/${coleccion}/${primero}`, {
          waitUntil: "networkidle",
        });
        await pagina.waitForTimeout(1500);
        const botones = pagina.locator(".tabs-field__tab-button");
        const etiquetas = (await botones.allInnerTexts()).map((t) => t.trim());
        const vistas = [];
        for (let i = 0; i < etiquetas.length; i++) {
          await botones.nth(i).click();
          await pagina.waitForTimeout(1200);
          const aviso = await pagina
            .locator(".pq-aviso")
            .filter({ hasText: /pequeñ/ })
            .count();
          const fichero = `${nombre}-${i + 1}-${etiquetas[i]
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}-${ancho.nombre}.png`;
          await pagina.screenshot({ path: path.join(salida, fichero), fullPage: true });
          vistas.push({ pestana: etiquetas[i], avisoFotoPequena: aviso > 0, fichero });
          decir(`✓ ${nombre} · ${etiquetas[i]}${aviso ? " (aviso de foto pequeña)" : ""}`);
        }
        hallazgos.push({ pantalla: nombre, ancho: ancho.nombre, pestanas: etiquetas, vistas });
      }
      hallazgos.push({ pantalla: "consola", ancho: ancho.nombre, errores });
      hallazgos.push({ pantalla: "peticiones-fallidas", ancho: ancho.nombre, fallidas });
      await contexto.close();
      continue;
    }

    /*
     * Modo `arrastrar` (2026-11-09, #441): la lista de «Categorías de maquinaria nueva» tal como
     * entra el editor (desde el menú, sin `?sort`), con su asa por fila. A 1440, ARRASTRA la
     * última fila al principio, comprueba por su efecto que el índice de tipos y «Por tipo de
     * máquina» del menú la ponen primera y la DEVUELVE a su sitio (y comprueba que todo queda
     * como estaba). A 390 solo captura. Escribe solo el orden, y lo deja como lo encontró.
     */
    if (MODO === "arrastrar") {
      const LISTA = "/admin/collections/categorias-maquinaria";
      const INDICE = "/maquinaria-pesada/maquinaria-pesada-nueva/tipos/";
      const filas = async () => {
        await pagina.goto(`${base}${LISTA}`, { waitUntil: "networkidle" });
        await pagina.waitForSelector("table tbody tr", { timeout: 30_000 });
        await pagina.waitForTimeout(1000);
        return pagina.evaluate(() =>
          [...document.querySelectorAll("table tbody tr")].map((tr) => ({
            nombre: tr.querySelector("a")?.textContent?.trim() ?? "",
            asa: !!tr.querySelector(".sort-row"),
            activa: !!tr.querySelector(".sort-row.active"),
          })),
        );
      };
      // El índice y el menú, leídos del HTML servido (sin pintar): el orden de los enlaces.
      const ordenPublico = async () => {
        // Por una pestaña del mismo contexto: la derivación solo va por sus rutas (`derivacion.mjs`).
        const lector = await contexto.newPage();
        await lector.goto(`${base}${INDICE}`, { waitUntil: "domcontentloaded" });
        const html = await lector.content();
        await lector.close();
        const enlaces = (trozo) =>
          [
            ...new Set(
              [
                ...trozo.matchAll(
                  /href="\/maquinaria-pesada\/maquinaria-pesada-nueva\/([a-z0-9-]+)\/"/g,
                ),
              ].map((m) => m[1]),
            ),
          ].filter((s) => !["tipos", "marcas", "pagina"].includes(s));
        const main = html.slice(html.indexOf("<main"));
        const menu = html.slice(html.indexOf("Por tipo de máquina"), html.indexOf("<main"));
        return { indice: enlaces(main), menu: enlaces(menu) };
      };
      const arrastrar = async (desde, hasta) => {
        const asas = pagina.locator("table tbody tr .sort-row");
        const a = await asas.nth(desde).boundingBox();
        const b = await asas.nth(hasta).boundingBox();
        if (!a || !b) fallar("No encuentro las asas de arrastre.");
        const respuesta = pagina.waitForResponse((r) => r.url().includes("/reorder"), {
          timeout: 30_000,
        });
        await pagina.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
        await pagina.mouse.down();
        const destinoY = hasta < desde ? b.y + 2 : b.y + b.height - 2;
        for (let i = 1; i <= 15; i++)
          await pagina.mouse.move(
            a.x + a.width / 2,
            a.y + a.height / 2 + ((destinoY - a.y - a.height / 2) * i) / 15,
          );
        await pagina.waitForTimeout(300);
        await pagina.mouse.up();
        const r = await respuesta.catch(() => null);
        return r ? r.status() : "sin petición";
      };
      const esperarPrimera = async (slug, deMenu = true) => {
        for (let i = 0; i < 18; i++) {
          const o = await ordenPublico();
          if (o.indice[0] === slug && (!deMenu || o.menu[0] === slug))
            return { ...o, segundos: i * 5 };
          await pagina.waitForTimeout(5000);
        }
        return { ...(await ordenPublico()), segundos: "más de 90" };
      };

      const antes = await filas();
      await pagina.screenshot({
        path: path.join(salida, `arrastrar-lista-${ancho.nombre}.png`),
        fullPage: true,
      });
      const ingles = await pagina.evaluate(
        (re) => (document.body.innerText.match(new RegExp(re.source, "g")) ?? []).slice(0, 10),
        { source: INGLES.source },
      );
      hallazgos.push({ pantalla: "arrastrar-lista", ancho: ancho.nombre, filas: antes, ingles });
      decir(
        `✓ lista (${ancho.nombre}): ${antes.length} filas, ${antes.filter((f) => f.asa).length} con asa, ${antes.filter((f) => f.activa).length} activas · ${antes.map((f) => f.nombre).join(" · ")}`,
      );
      if (!ancho.movil && antes.length >= 2) {
        const publicoAntes = await ordenPublico();
        decir(`  índice antes: ${publicoAntes.indice.join(" · ")}`);
        decir(`  menú antes:   ${publicoAntes.menu.join(" · ")}`);
        const ultima = antes.length - 1;
        const estado1 = await arrastrar(ultima, 0);
        const despues = await filas();
        await pagina.screenshot({
          path: path.join(salida, `arrastrar-movida-${ancho.nombre}.png`),
          fullPage: true,
        });
        decir(
          `  arrastrar «${antes[ultima].nombre}» al principio: reorder ${estado1} · lista ${despues.map((f) => f.nombre).join(" · ")}`,
        );
        const slugMovida = publicoAntes.indice[publicoAntes.indice.length - 1];
        const publicoMovido = await esperarPrimera(slugMovida);
        decir(`  índice tras ${publicoMovido.segundos} s: ${publicoMovido.indice.join(" · ")}`);
        decir(`  menú:         ${publicoMovido.menu.join(" · ")}`);
        // Devolverla: de la primera fila a la última.
        const estado2 = await arrastrar(0, despues.length - 1);
        const final = await filas();
        decir(`  devolverla: reorder ${estado2} · lista ${final.map((f) => f.nombre).join(" · ")}`);
        const publicoFinal = await esperarPrimera(publicoAntes.indice[0]);
        decir(`  índice tras ${publicoFinal.segundos} s: ${publicoFinal.indice.join(" · ")}`);
        decir(`  menú:         ${publicoFinal.menu.join(" · ")}`);
        const igual = (x, y) => JSON.stringify(x) === JSON.stringify(y);
        decir(
          `  restaurado: lista ${igual(
            final.map((f) => f.nombre),
            antes.map((f) => f.nombre),
          )} · índice ${igual(publicoFinal.indice, publicoAntes.indice)} · menú ${igual(publicoFinal.menu, publicoAntes.menu)}`,
        );
        hallazgos.push({
          pantalla: "arrastrar",
          antes,
          despues,
          final,
          publicoAntes,
          publicoMovido,
          publicoFinal,
          estado1,
          estado2,
        });
      }
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
      // La portada: el aviso de diapositiva sin imagen para móvil (§30).
      const paginaPortada = await primero("paginas", "?where[slug][equals]=inicio");
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
        ...(paginaPortada
          ? [
              {
                nombre: "aviso-recorte-movil",
                ruta: paginaPortada,
                // Payload pinta cada diapositiva al acercarse (`RenderIfInViewport`):
                // se recorre la página antes de contar los avisos.
                antes: async () => {
                  const alto = await pagina.evaluate(() => document.documentElement.scrollHeight);
                  for (let y = 0; y <= alto; y += 600) {
                    await pagina.evaluate((v) => window.scrollTo(0, v), y);
                    await pagina.waitForTimeout(80);
                  }
                  await pagina.evaluate(() => window.scrollTo(0, 0));
                },
              },
            ]
          : []),
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
      /*
       * FICHAS CON PESTAÑAS (organización del panel, 2026-11-18): el bloque SEO vive en «Buscadores
       * y redes» y Payload no lo pinta hasta abrirla. Si la pestaña existe, se abre, se recorre y
       * se captura aparte (`<pantalla>-<ancho>-buscadores.png`) ANTES de buscar los campos.
       */
      let pestanaBuscadores = false;
      if (formulario) {
        const pestana = pagina.getByRole("button", { name: "Buscadores y redes", exact: true });
        if (await pestana.count()) {
          await pestana.first().click();
          await pagina.waitForTimeout(1000);
          await pintarTodo();
          await pagina.screenshot({
            path: path.join(salida, `${nombre}-${ancho.nombre}-buscadores.png`),
            fullPage: true,
          });
          pestanaBuscadores = true;
        }
      }
      // En un formulario, que la sección SEO llegó a pintarse con sus campos.
      const seo = formulario
        ? await pagina.evaluate(() => ({
            titulo: Boolean(document.querySelector("#field-seo__metaTitle")),
            descripcion: Boolean(document.querySelector("#field-seo__metaDescription")),
            vistaGoogle: document.querySelector(".pq-seo__google-titulo")?.textContent ?? null,
          }))
        : undefined;
      if (seo) {
        seo.sinRecorrer = seoSinRecorrer;
        seo.enPestana = pestanaBuscadores;
      }
      hallazgos.push({ pantalla: nombre, ancho: ancho.nombre, ingles, ...(seo ? { seo } : {}) });
      const marcaSeo = seo
        ? ` · SEO ${seo.titulo && seo.descripcion ? "con campos" : "SIN CAMPOS"}${pestanaBuscadores ? " (pestaña «Buscadores y redes»)" : ""}`
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
      // Una solicitud concreta es /collections/solicitudes/<id>; la lista (con o sin barra y
      // filtros) y «crear» no cuentan. Desde el #515 (decisiones-panel.md §35) la portada las
      // enlaza A PROPÓSITO en el bloque «Mensajes» (las 5 nuevas más recientes): se separan las
      // de ese bloque de las de cualquier otro sitio.
      ...(() => {
        const concretas = [
          ...document.querySelectorAll('a[href*="/collections/solicitudes"]'),
        ].filter((a) =>
          /\/collections\/solicitudes\/(?!create(?:[/?#]|$))[^/?#]+/.test(
            a.getAttribute("href") ?? "",
          ),
        );
        const enMensajes = (a) =>
          Boolean(a.closest('section[aria-labelledby="pq-portada-mensajes"]'));
        return {
          mensajesEnlazados: concretas.filter(enMensajes).length,
          enlacesASolicitudes: concretas
            .filter((a) => !enMensajes(a))
            .map((a) => a.getAttribute("href") ?? ""),
        };
      })(),
    }));
    hallazgos.push({ pantalla: "portada-estructura", ancho: ancho.nombre, ...portada });
    if (portada.enlacesASolicitudes.length) {
      fallar(
        "La portada enlaza a solicitudes concretas fuera de «Mensajes»: ahí solo debe haber contadores.",
      );
    }
    if (portada.mensajesEnlazados > 5) {
      fallar(
        `«Mensajes» de la portada enlaza ${portada.mensajesEnlazados} solicitudes: el tope es 5.`,
      );
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
