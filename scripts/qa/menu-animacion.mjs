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
 *   5. hay desplazamiento de maqueta (CLS) o barra horizontal;
 *   8. (tanda 25) al cerrar, el contorno pierde el filete o el radio de las esquinas de abajo
 *      (tiene que recogerse con su alto real, no con un recorte recto);
 *   9. (tanda 25) al cambiar de un apartado a otro del mismo desplegable, el panel se desmonta
 *      o se oculta, el alto da un salto (el que se cierra vuelve a crecer) o los dos acordeones
 *      no se mueven a la vez. Igual en el menú móvil.
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
    // Cuánto se ha desplegado: el alto REAL del contorno frente al del panel (tanda 25).
    const forma = marco.querySelector("[class*='forma']");
    const estiloForma = forma ? getComputedStyle(forma) : null;
    const altoForma = forma ? forma.getBoundingClientRect().height : 0;
    const altoPanel = activo ? activo.getBoundingClientRect().height : 0;
    return {
      abierto: marco.getAttribute("data-abierto") === "si",
      visible: getComputedStyle(marco).visibility === "visible",
      desplegado: !forma || !altoPanel ? null : Math.round((altoForma / altoPanel) * 100) / 100,
      // El contorno, tal como se pinta: filete, radio de abajo y si algo lo recorta en recto.
      filete: estiloForma ? parseFloat(estiloForma.borderBottomWidth) : null,
      radio: estiloForma ? parseFloat(estiloForma.borderBottomLeftRadius) : null,
      altoForma: Math.round(altoForma),
      recorteRecto: getComputedStyle(lienzo).clipPath !== "none",
      opacidad: caja ? Math.round(Number(getComputedStyle(caja).opacity) * 100) / 100 : null,
      panel: activo?.id ?? null,
      saliendo: marco.querySelectorAll("nav[data-estado='saliendo']").length,
    };
  });

/**
 * 9. CAMBIO ENTRE APARTADOS: pulsa el acordeón `indice` de nivel 1 dentro de `raiz` y mide, en
 * cada fotograma, el alto del panel y el de cada región. Devuelve los fallos.
 */
async function cambioEntreApartados(pagina, raiz, donde) {
  const fallos = [];
  const medir = (indice) =>
    pagina.evaluate(
      ({ raiz, indice }) =>
        new Promise((resolver) => {
          const r = document.querySelector(raiz);
          const botones = [...r.querySelectorAll("[data-nivel='1'] > button[aria-expanded]")];
          if (botones.length < 2) return resolver(null);
          const regiones = botones.map((b) =>
            document.getElementById(b.getAttribute("aria-controls")),
          );
          const marco = r.closest("[class*='marco']");
          const muestras = [];
          const t0 = performance.now();
          botones[indice].click();
          const paso = () => {
            const t = performance.now() - t0;
            muestras.push({
              t: Math.round(t),
              montado: document.contains(r) && !r.hidden && r.getClientRects().length > 0,
              visible: marco ? getComputedStyle(marco).visibility === "visible" : true,
              panel: Math.round(r.getBoundingClientRect().height),
              regiones: regiones.map((g) =>
                g.hidden ? 0 : Math.round(g.getBoundingClientRect().height),
              ),
            });
            if (t < 520) requestAnimationFrame(paso);
            else resolver(muestras);
          };
          requestAnimationFrame(paso);
        }),
      { raiz, indice },
    );

  // Las pulsaciones de esta medida son de script (para muestrear desde el mismo instante): el
  // navegador no las cuenta como entrada del usuario y sumaria como CLS lo que un acordeon
  // empuja al abrirse. El CLS de la pagina se deja como estaba al acabar.
  const clsAntes = await pagina.evaluate(() => window.__cls);
  const abrir = await medir(0);
  if (!abrir) return fallos; // menos de dos apartados que desplieguen: nada que cambiar
  await pagina.waitForTimeout(200);
  for (const [de, a] of [
    [0, 1],
    [1, 0],
  ]) {
    const m = await medir(a);
    await pagina.waitForTimeout(200);
    const nombre = `${donde}, del apartado ${de + 1} al ${a + 1}`;
    if (m.some((x) => !x.montado || !x.visible)) {
      fallos.push(`${nombre}: el panel se desmonta o se oculta por el camino`);
    }
    // El que se cierra nunca vuelve a crecer (el salto «reaparece todo abierto»).
    let salto = 0;
    for (let i = 1; i < m.length; i++) {
      salto = Math.max(salto, m[i].regiones[de] - m[i - 1].regiones[de]);
    }
    if (salto > 2) fallos.push(`${nombre}: el apartado que se cierra vuelve a crecer ${salto} px`);
    const fin = m[m.length - 1];
    if (fin.regiones[de] !== 0 || fin.regiones[a] === 0) {
      fallos.push(`${nombre}: no acaba con uno cerrado y el otro abierto (${fin.regiones})`);
    }
    // A la vez: hay fotogramas con los dos a medias.
    const alto = { de: m[0].regiones[de], a: fin.regiones[a] };
    const juntos = m.filter(
      (x) =>
        x.regiones[de] > 0 &&
        x.regiones[de] < alto.de &&
        x.regiones[a] > 0 &&
        x.regiones[a] < alto.a,
    ).length;
    if (juntos < 3) fallos.push(`${nombre}: no se mueven a la vez (${juntos} fotogramas juntos)`);
    // El alto del panel va del de antes al nuevo sin salirse (ni un salto hacia fuera).
    const min = Math.min(m[0].panel, fin.panel) - 3;
    const max = Math.max(m[0].panel, fin.panel) + 3;
    const fuera = m.filter((x) => x.panel < min || x.panel > max);
    if (fuera.length > 0) {
      fallos.push(
        `${nombre}: el alto del panel se sale del trayecto (${m[0].panel} → ${fin.panel} px, pasa por ${fuera[0].panel})`,
      );
    }
  }
  await pagina.evaluate((v) => {
    window.__cls = v;
  }, clsAntes);
  return fallos;
}

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
  // 8. Las esquinas de abajo, iguales de principio a fin: el contorno lleva su filete y su
  // radio, mide más que el radio (a mitad) y nada lo recorta en recto.
  exigir(
    mitad && !mitad.recorteRecto,
    "a mitad del cierre un recorte recto corta el contorno (esquinas de abajo recortadas)",
  );
  exigir(
    mitad && a && mitad.filete === a.filete && mitad.radio === a.radio && mitad.radio > 0,
    `a mitad del cierre el contorno no conserva filete y radio (abierto ${a?.filete}/${a?.radio}, a mitad ${mitad?.filete}/${mitad?.radio})`,
  );
  exigir(
    mitad && mitad.altoForma >= mitad.radio,
    `a mitad del cierre el contorno mide menos que su radio (${mitad?.altoForma} px)`,
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

  /* 9. Cambio entre apartados del primer desplegable. */
  await pagina.mouse.move(700, 850);
  await pagina.waitForTimeout(900);
  await botones.nth(0).click();
  await pagina.waitForTimeout(700);
  fallos.push(
    ...(await cambioEntreApartados(
      pagina,
      "[class*='marco'] nav[data-estado='activo']",
      "megamenú",
    )),
  );

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
  // 9. Cambio entre apartados dentro del primer desplegable del menú móvil.
  if ((await acordeon.count()) > 0) {
    await acordeon.tap();
    await pagina.waitForTimeout(450);
    const region = await acordeon.getAttribute("aria-controls");
    fallos.push(...(await cambioEntreApartados(pagina, `[id="${region}"]`, "menú móvil")));
    await acordeon.tap();
    await pagina.waitForTimeout(450);
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
