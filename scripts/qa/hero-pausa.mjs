/**
 * EL CICLO PAUSA → PLAY DEL CARRUSEL DE LA PORTADA (BUG-003, 2026-11-25).
 *
 * Con navegador, sobre la portada. FALLA (código 1) si:
 *   1. el carrusel o el texto circular se detienen solos (ratón encima o foco dentro);
 *   2. una flecha o un punto cambian de diapositiva y dejan el carrusel pausado, o reinician el
 *      giro del texto circular;
 *   3. PAUSA no detiene a la vez la línea de progreso, el Ken Burns y el texto circular, o el
 *      botón no cambia de nombre accesible;
 *   4. PLAY no los reanuda al instante DESDE DONDE IBAN (con el ratón encima y el foco en el botón);
 *   5. el pase automático no llega solo a la diapositiva siguiente;
 *   6. con la pestaña oculta no se detienen, o al volver no siguen solos;
 *   7. con «reducir movimiento» hay giro o pase automático.
 * Además mide los fotogramas por segundo durante un cambio de diapositiva y el CLS, e informa.
 *
 *   npm run qa:hero-pausa -- https://<sitio> [ancho…]
 *   npm run preview:ejecutar -- npm run qa:hero-pausa -- https://<preview> [ancho…]
 *
 * Anchos por defecto: 390 (táctil, como un teléfono) y 1440 (ratón y teclado).
 * `HERO_NAVEGADOR=msedge` para Edge (por defecto, chrome). En un preview, el secreto de derivación
 * solo va por `derivacion.mjs` (CLAUDE.md §10.40). No guarda HTML.
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

const [base, ...anchosArg] = process.argv.slice(2);
if (!base) throw new Error("Uso: hero-pausa.mjs <url> [ancho…]");
const origen = new URL(base).origin;
const anchos = (anchosArg.length > 0 ? anchosArg : ["390", "1440"]).map(Number);
const canal = process.env.HERO_NAVEGADOR || "chrome";
const decir = (linea) => process.stdout.write(`${linea}\n`);

const HERO = 'section[aria-roledescription="carrusel"]';
const PAUSA = `${HERO} button[aria-label$="el pase de diapositivas"]`;

/** El estado del carrusel, leído de la página: diapositiva, pausa y las tres animaciones. */
const leer = (pagina) =>
  pagina.evaluate((selector) => {
    const hero = document.querySelector(selector);
    if (!hero) return null;
    const animaciones = hero.getAnimations({ subtree: true });
    const una = (nombre) => {
      const a = animaciones.find((x) => (x.animationName ?? "").includes(nombre));
      return a ? { estado: a.playState, t: Math.round(Number(a.currentTime)) } : null;
    };
    const puntos = [...hero.querySelectorAll("ul button")];
    return {
      activo: puntos.findIndex((b) => b.getAttribute("aria-current") === "true"),
      total: puntos.length,
      pausado: hero.hasAttribute("data-pausado"),
      oculta: hero.hasAttribute("data-oculta"),
      etiqueta: hero
        .querySelector('button[aria-label$="el pase de diapositivas"]')
        ?.getAttribute("aria-label"),
      progreso: una("progreso"),
      fondo: una("kenBurns"),
      giro: una("girar"),
    };
  }, HERO);

const esperar = (pagina, ms) => pagina.waitForTimeout(ms);

/** Espera a que la diapositiva activa deje de ser `desde`; devuelve el estado o null. */
async function esperarCambio(pagina, desde, maximo) {
  const fin = Date.now() + maximo;
  while (Date.now() < fin) {
    const e = await leer(pagina);
    if (e && e.activo !== desde) return e;
    await esperar(pagina, 150);
  }
  return null;
}

async function probar(navegador, ancho) {
  const tactil = ancho < 600;
  const fallos = [];
  const exigir = (condicion, mensaje) => {
    if (!condicion) fallos.push(mensaje);
  };
  const contexto = await navegador.newContext({
    viewport: { width: ancho, height: tactil ? 844 : 900 },
    hasTouch: tactil,
    isMobile: tactil,
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
  const pulsar = (selector) => (tactil ? pagina.tap(selector) : pagina.click(selector));
  await pagina.goto(base, { waitUntil: "load", timeout: 90000 });
  await esperar(pagina, 1500);
  const inicio = await leer(pagina);
  if (!inicio || inicio.total < 2) {
    await contexto.close();
    return { ancho, fallos: ["no hay carrusel con varias diapositivas en esta página"] };
  }
  const hayGiro = () => leer(pagina).then((e) => Boolean(e?.giro));

  /* 1. Nada se detiene solo: ratón encima y foco dentro. */
  if (!tactil) await pagina.hover(HERO, { position: { x: ancho / 2, y: 300 } });
  await pagina.focus(`${HERO} button[aria-label="Diapositiva siguiente"]`);
  const a1 = await leer(pagina);
  await esperar(pagina, 1200);
  const a2 = await leer(pagina);
  exigir(!a2.pausado, "con el ratón encima y el foco dentro, el hero queda pausado");
  exigir(
    a2.progreso?.estado === "running" &&
      (a2.activo !== a1.activo || a2.progreso.t > a1.progreso.t + 600),
    `con el ratón encima y el foco dentro, la línea de progreso no avanza (${JSON.stringify(a1.progreso)} → ${JSON.stringify(a2.progreso)})`,
  );
  if (a2.giro)
    exigir(a2.giro.estado === "running" && a2.giro.t > a1.giro.t + 600, "el giro no avanza");

  /* 2. Una flecha cambia de diapositiva sin pausar ni reiniciar el giro. */
  const antes = await leer(pagina);
  await pulsar(`${HERO} button[aria-label="Diapositiva siguiente"]`);
  const tras = await esperarCambio(pagina, antes.activo, 5000);
  exigir(Boolean(tras), "la flecha «siguiente» no cambia de diapositiva");
  if (tras) {
    await esperar(pagina, 400);
    const b = await leer(pagina);
    exigir(!b.pausado, "la flecha deja el carrusel pausado");
    exigir(b.progreso?.estado === "running", "tras la flecha, la línea de progreso no corre");
    exigir(/^Pausar /.test(b.etiqueta ?? ""), `tras la flecha, el botón dice «${b.etiqueta}»`);
    if (antes.giro && b.giro)
      exigir(b.giro.t > antes.giro.t, `la flecha reinicia el giro (${antes.giro.t} → ${b.giro.t})`);
  }
  /* Un punto, igual. */
  const antesPunto = await leer(pagina);
  const destino = (antesPunto.activo + 1) % antesPunto.total;
  await pulsar(`${HERO} ul li:nth-child(${destino + 1}) button`);
  const trasPunto = await esperarCambio(pagina, antesPunto.activo, 5000);
  exigir(trasPunto?.activo === destino, "el punto no lleva a su diapositiva");
  exigir(trasPunto ? !trasPunto.pausado : true, "el punto deja el carrusel pausado");

  /* 3. PAUSA: todo quieto a la vez, y el botón cambia de nombre. */
  await esperar(pagina, 1500);
  await pulsar(PAUSA);
  await esperar(pagina, 150);
  const p1 = await leer(pagina);
  await esperar(pagina, 1200);
  const p2 = await leer(pagina);
  exigir(p1.pausado, "PAUSA no pausa el hero");
  exigir(/^Reproducir /.test(p1.etiqueta ?? ""), `en pausa, el botón dice «${p1.etiqueta}»`);
  exigir(
    p2.progreso?.estado === "paused" && p2.progreso.t === p1.progreso.t,
    "en pausa, la línea de progreso sigue",
  );
  exigir(
    p2.fondo?.estado === "paused" && p2.fondo.t === p1.fondo.t,
    "en pausa, el Ken Burns sigue",
  );
  if (p1.giro)
    exigir(p2.giro?.estado === "paused" && p2.giro.t === p1.giro.t, "en pausa, el giro sigue");
  exigir(p2.activo === p1.activo, "en pausa, cambia de diapositiva sola");

  /* 4. PLAY: al instante y desde donde iban (el ratón sigue encima y el foco, en el botón). */
  await pulsar(PAUSA);
  await esperar(pagina, 150);
  const r1 = await leer(pagina);
  await esperar(pagina, 1000);
  const r2 = await leer(pagina);
  exigir(!r1.pausado, "PLAY no quita la pausa");
  exigir(/^Pausar /.test(r1.etiqueta ?? ""), `tras PLAY, el botón dice «${r1.etiqueta}»`);
  exigir(
    r1.progreso?.estado === "running" &&
      r1.progreso.t >= p2.progreso.t &&
      r1.progreso.t < p2.progreso.t + 600,
    `tras PLAY, la línea no sigue desde donde iba (${p2.progreso?.t} → ${r1.progreso?.t})`,
  );
  exigir(
    r2.activo !== r1.activo || r2.progreso.t > r1.progreso.t + 600,
    "tras PLAY, la línea de progreso no avanza",
  );
  exigir(r1.fondo?.estado === "running", "tras PLAY, el Ken Burns no corre");
  if (p2.giro)
    exigir(
      r1.giro?.estado === "running" && r1.giro.t >= p2.giro.t && r2.giro.t > r1.giro.t + 600,
      `tras PLAY, el giro no sigue desde donde iba (${p2.giro.t} → ${r1.giro?.t} → ${r2.giro?.t})`,
    );

  /* Teclado: Enter en el botón pausa y reanuda. */
  if (!tactil) {
    await pagina.focus(PAUSA);
    await pagina.keyboard.press("Enter");
    await esperar(pagina, 150);
    const t1 = await leer(pagina);
    await pagina.keyboard.press("Enter");
    await esperar(pagina, 150);
    const t2 = await leer(pagina);
    exigir(t1.pausado && t1.progreso?.estado === "paused", "con el teclado, Enter no pausa");
    exigir(!t2.pausado && t2.progreso?.estado === "running", "con el teclado, Enter no reanuda");
  }

  /* 5. El pase automático llega solo a la siguiente. Mientras, se cuentan los fotogramas. */
  await pagina.evaluate(() => {
    window.__cuadros = [];
    const paso = (t) => {
      window.__cuadros.push(t);
      if (window.__cuadros.length < 2000) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
  const c = await leer(pagina);
  const solo = await esperarCambio(pagina, c.activo, 12000);
  exigir(Boolean(solo), "el pase automático no llega a la diapositiva siguiente en 12 s");
  await esperar(pagina, 1500); // el fundido entero
  const cuadros = await pagina.evaluate(() => {
    const t = window.__cuadros;
    window.__cuadros = { length: 99999 };
    const saltos = t.slice(1).map((x, i) => x - t[i]);
    const ultimos = saltos.slice(-150); // el cambio y su fundido
    const media = (l) => l.reduce((s, x) => s + x, 0) / Math.max(l.length, 1);
    return {
      fps: Math.round(1000 / media(saltos)),
      fpsEnElCambio: Math.round(1000 / media(ultimos)),
      peorMs: Math.round(Math.max(...ultimos)),
    };
  });

  /* 6. Pestaña oculta: se detienen; al volver, siguen solos. */
  const ocultar = (oculta) =>
    pagina.evaluate((valor) => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => valor });
      document.dispatchEvent(new Event("visibilitychange"));
    }, oculta);
  await ocultar(true);
  await esperar(pagina, 150);
  const o1 = await leer(pagina);
  await ocultar(false);
  await esperar(pagina, 150);
  const o2 = await leer(pagina);
  exigir(
    o1.oculta && o1.progreso?.estado === "paused",
    "con la pestaña oculta no se detiene la línea",
  );
  exigir(
    !o2.oculta && !o2.pausado && o2.progreso?.estado === "running",
    "al volver a la pestaña, no sigue solo",
  );

  const cls = await pagina.evaluate(() => Math.round(window.__cls * 10000) / 10000);
  const conGiro = await hayGiro();
  await contexto.close();

  /* 7. «Reducir movimiento»: ni giro ni pase automático. */
  const quieto = await navegador.newContext({
    viewport: { width: ancho, height: tactil ? 844 : 900 },
    reducedMotion: "reduce",
  });
  if (origenDePreview(origen)) {
    await instalarDerivacion(quieto, origen, process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
  }
  const paginaQuieta = await quieto.newPage();
  await paginaQuieta.goto(base, { waitUntil: "load", timeout: 90000 });
  await esperar(paginaQuieta, 1500);
  const q1 = await leer(paginaQuieta);
  await esperar(paginaQuieta, 2000);
  const q2 = await leer(paginaQuieta);
  exigir(
    q1.pausado && /^Reproducir /.test(q1.etiqueta ?? ""),
    "con «reducir movimiento» no empieza en pausa",
  );
  exigir(!q1.giro && !q1.fondo, "con «reducir movimiento» hay giro o Ken Burns");
  exigir(
    q2.activo === q1.activo && (!q2.progreso || q2.progreso.t === q1.progreso.t),
    "con «reducir movimiento» el pase avanza solo",
  );
  await quieto.close();

  return { ancho, tactil, fallos, cuadros, cls, conGiro };
}

const navegador = await pw.chromium.launch({ channel: canal, headless: true });
let mal = 0;
try {
  for (const ancho of anchos) {
    const r = await probar(navegador, ancho);
    mal += r.fallos.length;
    decir(
      `${r.fallos.length === 0 ? "BIEN" : "MAL "} ${canal} ${r.ancho} px${r.tactil ? " (táctil)" : ""}` +
        (r.cuadros
          ? ` · ${r.cuadros.fps} fps de media, ${r.cuadros.fpsEnElCambio} en el cambio (peor fotograma ${r.cuadros.peorMs} ms) · CLS ${r.cls} · texto circular: ${r.conGiro ? "sí" : "no hay en esta diapositiva"}`
          : ""),
    );
    for (const f of r.fallos) decir(`     ✗ ${f}`);
  }
} finally {
  await navegador.close();
}
process.exit(mal === 0 ? 0 : 1);
