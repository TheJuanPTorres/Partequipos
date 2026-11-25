/**
 * LA ANIMACIÓN DEL MEGAMENÚ Y DEL MENÚ MÓVIL, EN LOS DOS SENTIDOS (tanda 24, tarea 5).
 *
 * Con navegador, sobre la portada. FALLA (código 1) si:
 *   ESCRITORIO (1440, ratón y teclado)
 *   1. al cerrar, el contenido desaparece antes que el panel (a mitad del cierre los dos tienen
 *      que estar a medias: el panel recogiéndose y el contenido fundiéndose), o el panel deja de
 *      estar montado antes de acabar;
 *   2. al volver a entrar a mitad del cierre no se abre otra vez, o lo hace con un salto;
 *   3. al pasar de un desplegable a otro el marco se cierra por el camino;
 *   4. Escape no cierra o no devuelve el foco al botón;
 *   5. hay desplazamiento de maqueta (CLS) o barra horizontal.
 *   MÓVIL (390, táctil)
 *   6. el panel no se despliega (nace ya entero) o, al cerrar, desaparece de golpe;
 *   7. tras cerrarse sigue montado, o hay CLS.
 *   «REDUCIR MOVIMIENTO»: abre y cierra sin transición.
 *
 *   npm run qa:menu-animacion -- https://<sitio>
 *   npm run preview:ejecutar -- npm run qa:menu-animacion -- https://<preview>
 *
 * `MENU_NAVEGADOR=msedge` para Edge. En un preview, el secreto de derivación solo va por
 * `derivacion.mjs` (CLAUDE.md §10.40). No guarda HTML. Con `MENU_VIDEO=<carpeta>` graba un vídeo
 * de cada parte.
 */
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

const base = process.argv[2];
if (!base) throw new Error("Uso: menu-animacion.mjs <url>");
const origen = new URL(base).origin;
const canal = process.env.MENU_NAVEGADOR || "chrome";
const video = process.env.MENU_VIDEO;
const decir = (linea) => process.stdout.write(`${linea}\n`);

const DISPARADOR = 'header button[aria-controls^="mega-"]';

async function abrirContexto(navegador, opciones) {
  const contexto = await navegador.newContext({
    ...opciones,
    ...(video ? { recordVideo: { dir: video, size: opciones.viewport } } : {}),
  });
  if (origenDePreview(origen)) {
    await instalarDerivacion(contexto, origen, process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
  }
  const pagina = await contexto.newPage();
  await pagina.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((lista) => {
      for (const e of lista.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await pagina.goto(base, { waitUntil: "load", timeout: 90000 });
  await pagina.waitForTimeout(1500);
  return { contexto, pagina };
}

/** El marco del megamenú ahora: abierto, visible, cuánto se ha desplegado y la opacidad del contenido. */
const leerMarco = (pagina) =>
  pagina.evaluate(() => {
    const marco = document.querySelector("[data-abierto][class*='marco']");
    if (!marco) return null;
    const lienzo = marco.firstElementChild;
    const activo = marco.querySelector("nav[data-estado='activo']");
    const caja = activo?.firstElementChild;
    // inset(arriba derecha ABAJO izquierda): el tercero dice cuánto queda recogido.
    const abajo = /inset\(\S+ \S+ (-?[\d.]+)(px|%)/.exec(getComputedStyle(lienzo).clipPath);
    const alto = lienzo.getBoundingClientRect().height || 1;
    const recogido = !abajo
      ? null
      : abajo[2] === "%"
        ? Number(abajo[1]) / 100
        : Math.max(0, Number(abajo[1])) / alto;
    return {
      abierto: marco.getAttribute("data-abierto") === "si",
      visible: getComputedStyle(marco).visibility === "visible",
      desplegado: recogido === null ? null : Math.round((1 - recogido) * 100) / 100,
      opacidad: caja ? Math.round(Number(getComputedStyle(caja).opacity) * 100) / 100 : null,
      panel: activo?.id ?? null,
      saliendo: marco.querySelectorAll("nav[data-estado='saliendo']").length,
    };
  });

async function escritorio(navegador, reducido) {
  const fallos = [];
  const exigir = (condicion, mensaje) => {
    if (!condicion) fallos.push(mensaje);
  };
  const { contexto, pagina } = await abrirContexto(navegador, {
    viewport: { width: 1440, height: 900 },
    reducedMotion: reducido ? "reduce" : "no-preference",
  });
  const botones = pagina.locator(DISPARADOR);
  const cuantos = await botones.count();
  if (cuantos === 0) {
    await contexto.close();
    return ["no hay ningún desplegable en la cabecera"];
  }

  /* Abrir con el ratón y esperar a que acabe. */
  await botones.nth(0).hover();
  await pagina.waitForTimeout(700);
  const a = await leerMarco(pagina);
  exigir(
    a?.abierto && a.visible && a.opacidad === 1,
    `no se abre al pasar el ratón (${JSON.stringify(a)})`,
  );
  exigir(
    a?.desplegado === null || a.desplegado >= 1,
    `abierto, el panel no está desplegado del todo (${a?.desplegado})`,
  );

  if (reducido) {
    await pagina.mouse.move(700, 850);
    await pagina.waitForTimeout(420);
    const r = await leerMarco(pagina);
    exigir(r && !r.abierto && !r.visible, "con «reducir movimiento», el cierre no es inmediato");
    await contexto.close();
    return fallos;
  }

  /* 1. Cerrar: a mitad, el panel y el contenido van a medias, los dos. */
  await pagina.mouse.move(700, 850);
  let cerrado = null;
  for (let i = 0; i < 60; i++) {
    const e = await leerMarco(pagina);
    if (e && !e.abierto) {
      cerrado = e;
      break;
    }
    await pagina.waitForTimeout(15);
  }
  exigir(Boolean(cerrado), "al salir con el ratón no se cierra");
  await pagina.waitForTimeout(80);
  const mitad = await leerMarco(pagina);
  exigir(mitad?.visible, "a mitad del cierre el panel ya no está montado/visible");
  exigir(
    mitad && mitad.desplegado !== null && mitad.desplegado > 0.02 && mitad.desplegado < 0.98,
    `a mitad del cierre el panel no se está recogiendo (desplegado ${mitad?.desplegado})`,
  );
  exigir(
    mitad && mitad.opacidad > 0.02 && mitad.opacidad < 0.98,
    `a mitad del cierre el contenido no se está fundiendo (opacidad ${mitad?.opacidad}): desaparece de golpe o no se funde`,
  );
  await pagina.waitForTimeout(400);
  const fin = await leerMarco(pagina);
  exigir(
    fin && !fin.visible && fin.opacidad === 0,
    `tras el cierre sigue a la vista (${JSON.stringify(fin)})`,
  );

  /* 2. Volver a mitad del cierre: se abre otra vez desde donde iba. */
  await botones.nth(0).hover();
  await pagina.waitForTimeout(700);
  const caja = await pagina.evaluate(() => {
    const c = document
      .querySelector("[class*='marco'] nav[data-estado='activo']")
      .getBoundingClientRect();
    return { x: c.left + c.width / 2, y: c.top + Math.min(60, c.height / 2) };
  });
  await pagina.mouse.move(caja.x, caja.y);
  await pagina.waitForTimeout(200);
  await pagina.mouse.move(700, 850);
  for (let i = 0; i < 60; i++) {
    const e = await leerMarco(pagina);
    if (e && !e.abierto) break;
    await pagina.waitForTimeout(15);
  }
  await pagina.waitForTimeout(70);
  const antesDeVolver = await leerMarco(pagina);
  await pagina.mouse.move(caja.x, caja.y, { steps: 3 });
  await pagina.waitForTimeout(40);
  const alVolver = await leerMarco(pagina);
  await pagina.waitForTimeout(500);
  const vuelto = await leerMarco(pagina);
  exigir(
    vuelto?.abierto && vuelto.opacidad === 1,
    "al volver a entrar a mitad del cierre no se abre otra vez",
  );
  exigir(
    antesDeVolver && alVolver && Math.abs(alVolver.opacidad - antesDeVolver.opacidad) < 0.6,
    `al volver a mitad del cierre hay un salto (opacidad ${antesDeVolver?.opacidad} → ${alVolver?.opacidad})`,
  );

  /* 3. De un desplegable a otro: el marco no se cierra por el camino. */
  if (cuantos > 1) {
    await botones.nth(0).hover();
    await pagina.waitForTimeout(700);
    const uno = await leerMarco(pagina);
    await botones.nth(1).hover();
    let seCerro = false;
    let cruce = 0;
    for (let i = 0; i < 40; i++) {
      const e = await leerMarco(pagina);
      if (!e?.abierto || !e.visible) seCerro = true;
      if (e?.saliendo) cruce++;
      await pagina.waitForTimeout(20);
    }
    const dos = await leerMarco(pagina);
    exigir(!seCerro, "al pasar de un desplegable a otro, el marco se cierra por el camino");
    exigir(
      dos?.panel && dos.panel !== uno?.panel,
      "al pasar a otro desplegable no cambia de panel",
    );
    exigir(cruce > 0, "al cambiar de panel no hay fundido cruzado (el saliente no se ve)");
  }

  /* 4. Teclado: Intro abre y lleva el foco dentro; Escape cierra y lo devuelve al botón. */
  await pagina.mouse.move(700, 850);
  await pagina.waitForTimeout(900);
  await botones.nth(0).focus();
  await pagina.keyboard.press("Enter");
  await pagina.waitForTimeout(700);
  const dentro = await pagina.evaluate(() =>
    Boolean(document.activeElement?.closest("nav[data-estado='activo']")),
  );
  exigir(dentro, "con Intro, el foco no entra en el panel");
  await pagina.keyboard.press("Escape");
  await pagina.waitForTimeout(500);
  const trasEscape = await leerMarco(pagina);
  const focoEnBoton = await pagina.evaluate(
    (s) => document.activeElement === document.querySelector(s),
    DISPARADOR,
  );
  exigir(trasEscape && !trasEscape.abierto && !trasEscape.visible, "Escape no cierra el panel");
  exigir(focoEnBoton, "tras Escape, el foco no vuelve al botón");

  /* 5. Maqueta. */
  const medidas = await pagina.evaluate(() => ({
    cls: Math.round(window.__cls * 10000) / 10000,
    desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  exigir(medidas.cls < 0.005, `CLS ${medidas.cls}`);
  exigir(medidas.desborde <= 0, `barra horizontal de ${medidas.desborde} px`);
  await contexto.close();
  return fallos;
}

const leerPanel = (pagina) =>
  pagina.evaluate(() => {
    const p = document.getElementById("menu-movil");
    const cs = getComputedStyle(p);
    const abajo = /inset\(\S+ \S+ (-?[\d.]+)(px|%)/.exec(cs.clipPath);
    return {
      montado: !p.hidden && cs.display !== "none",
      opacidad: Math.round(Number(cs.opacity) * 100) / 100,
      recogido: abajo ? Number(abajo[1]) : 0,
      alto: Math.round(p.getBoundingClientRect().height),
    };
  });

async function movil(navegador) {
  const fallos = [];
  const exigir = (condicion, mensaje) => {
    if (!condicion) fallos.push(mensaje);
  };
  const { contexto, pagina } = await abrirContexto(navegador, {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const boton = 'header button[aria-controls="menu-movil"]';
  await pagina.tap(boton);
  await pagina.waitForTimeout(90);
  const abriendo = await leerPanel(pagina);
  await pagina.waitForTimeout(500);
  const abierto = await leerPanel(pagina);
  exigir(
    abierto.montado && abierto.opacidad === 1 && abierto.recogido === 0,
    `el menú no se abre (${JSON.stringify(abierto)})`,
  );
  exigir(
    abriendo.opacidad < 0.98 || abriendo.recogido > 0,
    `el menú nace ya entero, sin desplegarse (${JSON.stringify(abriendo)})`,
  );
  // Un acordeón, si lo hay: se abre y se cierra sin desmontarse de golpe (M4, ya estaba).
  const acordeon = pagina.locator("#menu-movil button[aria-expanded]").first();
  if ((await acordeon.count()) > 0) {
    await acordeon.tap();
    await pagina.waitForTimeout(450);
    exigir(
      (await acordeon.getAttribute("aria-expanded")) === "true",
      "el acordeón del menú móvil no se abre",
    );
    await acordeon.tap();
    await pagina.waitForTimeout(450);
    exigir(
      (await acordeon.getAttribute("aria-expanded")) === "false",
      "el acordeón del menú móvil no se cierra",
    );
  }
  await pagina.tap(boton);
  await pagina.waitForTimeout(90);
  const cerrando = await leerPanel(pagina);
  await pagina.waitForTimeout(600);
  const cerrado = await leerPanel(pagina);
  exigir(
    cerrando.montado && (cerrando.opacidad > 0.02 || cerrando.recogido < 98),
    `al cerrar, el menú desaparece de golpe (${JSON.stringify(cerrando)})`,
  );
  exigir(!cerrado.montado, "tras cerrarse, el menú sigue montado");
  // Abrir y cerrar seguido, y volver a abrir a mitad: acaba abierto.
  await pagina.tap(boton);
  await pagina.waitForTimeout(400);
  await pagina.tap(boton);
  await pagina.waitForTimeout(80);
  await pagina.tap(boton);
  await pagina.waitForTimeout(500);
  const reabierto = await leerPanel(pagina);
  exigir(
    reabierto.montado && reabierto.opacidad === 1,
    `al volver a abrir a mitad del cierre no queda abierto (${JSON.stringify(reabierto)})`,
  );
  await pagina.keyboard.press("Escape");
  await pagina.waitForTimeout(500);
  const foco = await pagina.evaluate(
    (s) => document.activeElement === document.querySelector(s),
    boton,
  );
  exigir(!(await leerPanel(pagina)).montado, "Escape no cierra el menú móvil");
  exigir(foco, "tras Escape, el foco no vuelve al botón del menú");
  const medidas = await pagina.evaluate(() => ({
    cls: Math.round(window.__cls * 10000) / 10000,
    desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  exigir(medidas.cls < 0.005, `CLS ${medidas.cls}`);
  exigir(medidas.desborde <= 0, `barra horizontal de ${medidas.desborde} px`);
  await contexto.close();
  return fallos;
}

const navegador = await pw.chromium.launch({ channel: canal, headless: true });
let mal = 0;
try {
  for (const [nombre, prueba] of [
    ["escritorio 1440 (ratón y teclado)", () => escritorio(navegador, false)],
    ["escritorio 1440, «reducir movimiento»", () => escritorio(navegador, true)],
    ["móvil 390 (táctil)", () => movil(navegador)],
  ]) {
    const fallos = await prueba();
    mal += fallos.length;
    decir(`${fallos.length === 0 ? "BIEN" : "MAL "} ${canal} · ${nombre}`);
    for (const f of fallos) decir(`     ✗ ${f}`);
  }
} finally {
  await navegador.close();
}
process.exit(mal === 0 ? 0 : 1);
