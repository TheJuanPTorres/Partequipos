/**
 * EL HUECO REAL ENTRE SECCIONES (ronda 12, tarea 5, 2026-11-08).
 *
 * Por página y por ancho, mide la distancia VISIBLE entre secciones consecutivas: del último
 * píxel pintado de una al primero de la siguiente. «Pintado» es texto, imagen, vídeo, svg, o una
 * caja con fondo, imagen de fondo o borde que se distinga de lo que tiene detrás. Así, dos
 * secciones con 60 px de relleno cada una dan un hueco de 120 aunque sus cajas se toquen: es lo
 * que ve quien visita la página, y lo que se suma sin querer.
 *
 * Secciones: los hijos de `<main>` (entrando en los contenedores sin clase, que solo agrupan) y,
 * dentro del pie (`<footer>` del sitio), sus hijos; del pie también el aire de arriba y de abajo
 * dentro de su fondo. El último hueco de `<main>` va contra el pie.
 *
 * Con «reducir movimiento» emulado: las animaciones de entrada (que suben o bajan las cajas) no
 * falsean la medida. El CLS de carga se mide aparte, sin emular nada.
 *
 * Marca (⚠) cada hueco que pasa del ESPACIADO COMÚN a ese ancho más 8 px de margen, y (✗) los que
 * pasan de 80 px, el máximo. El espaciado común es `--espacio-seccion` de `globals.css`:
 * clamp(40px, 24px + 4vw, 80px).
 *
 *   npm run preview:ejecutar -- npx -y -p playwright-core@1.63.0 node scripts/qa/huecos-secciones.mjs <preview> <carpeta> [ruta…]
 *
 * Contra el sitio publicado, sin `preview:ejecutar` (la cabecera de derivación solo va a un
 * preview, `derivacion.mjs`). Rutas por defecto: la portada y /maquinaria-pesada/. Escribe
 * `huecos.json` y `huecos.md` en la carpeta.
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

const [base, carpeta, ...rutasArg] = process.argv.slice(2);
if (!base || !carpeta) throw new Error("Uso: huecos-secciones.mjs <base> <carpeta> [ruta…]");
const origen = new URL(base).origin;
const rutas = rutasArg.length > 0 ? rutasArg : ["/", "/maquinaria-pesada/"];
/** `HUECOS_ANCHOS=390,1440` para medir solo esos anchos. */
const ANCHOS = process.env.HUECOS_ANCHOS
  ? process.env.HUECOS_ANCHOS.split(",").map(Number)
  : [390, 768, 1010, 1440, 1920, 2560];
const MAXIMO = 80;
/** El espaciado común a un ancho: clamp(40px, 24px + 4vw, 80px). */
const comun = (ancho) => Math.min(MAXIMO, Math.max(40, 24 + 0.04 * ancho));
fs.mkdirSync(carpeta, { recursive: true });

const navegador = await pw.chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});

async function contexto(ancho, reducir) {
  const ctx = await navegador.newContext({
    viewport: { width: ancho, height: 900 },
    reducedMotion: reducir ? "reduce" : "no-preference",
  });
  if (origenDePreview(origen)) {
    await instalarDerivacion(ctx, origen, process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "");
  }
  return ctx;
}

/** En la página: las secciones, su caja pintada y los huecos entre ellas. */
function medirEnPagina() {
  const opaco = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    return p.length < 4 || Number(p[3]) > 0.02;
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0)
      return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 2 && r.height <= 2) return false; // sr-only
    return true;
  };
  const fondoDe = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (opaco(cs.backgroundColor)) return cs.backgroundColor;
    }
    return "rgb(255, 255, 255)";
  };
  const pinta = (el, fondo) => {
    const cs = getComputedStyle(el);
    if (cs.backgroundImage !== "none") return true;
    if (opaco(cs.backgroundColor) && cs.backgroundColor !== fondo) return true;
    for (const lado of ["Top", "Right", "Bottom", "Left"]) {
      if (parseFloat(cs[`border${lado}Width`]) > 0 && opaco(cs[`border${lado}Color`])) return true;
    }
    return false;
  };
  // La unión de lo que se pinta dentro de `raiz` (con su propio fondo si lo pinta). Lo fijo
  // (`position: fixed`) no cuenta, y cada caja se recorta a sus antepasados con `overflow` oculto:
  // lo que queda fuera no se ve.
  const pintado = (raiz, fondo) => {
    let top = Infinity;
    let bottom = -Infinity;
    let deArriba = "";
    let deAbajo = "";
    const anadir = (r, recorte, quien) => {
      const t = Math.max(r.top, recorte.top);
      const b = Math.min(r.bottom, recorte.bottom);
      if (r.width < 1 || b - t < 1) return;
      if (t + scrollY < top) {
        top = t + scrollY;
        deArriba = quien;
      }
      if (b + scrollY > bottom) {
        bottom = b + scrollY;
        deAbajo = quien;
      }
    };
    const etiqueta = (el) =>
      `${el.tagName.toLowerCase()}.${(el.className?.toString?.() ?? "").replace(/\w+-module__\w+__/g, "").slice(0, 30)}`;
    const recorrer = (el, fondoActual, recorte) => {
      if (!visible(el)) return;
      const cs = getComputedStyle(el);
      if (cs.position === "fixed") return;
      const caja = el.getBoundingClientRect();
      if (/^(IMG|SVG|VIDEO|CANVAS|IFRAME|PICTURE)$/i.test(el.tagName)) {
        anadir(caja, recorte, etiqueta(el));
        return;
      }
      let f = fondoActual;
      if (pinta(el, fondoActual)) {
        anadir(caja, recorte, etiqueta(el));
        if (opaco(cs.backgroundColor)) f = cs.backgroundColor;
      }
      const corta = cs.overflowY !== "visible" || cs.overflowX !== "visible";
      const dentro = corta
        ? { top: Math.max(recorte.top, caja.top), bottom: Math.min(recorte.bottom, caja.bottom) }
        : recorte;
      for (const n of el.childNodes) {
        if (n.nodeType === 3 && n.textContent.trim()) {
          const rango = document.createRange();
          rango.selectNodeContents(n);
          for (const r of rango.getClientRects())
            anadir(r, dentro, `texto «${n.textContent.trim().slice(0, 20)}»`);
        } else if (n.nodeType === 1) recorrer(n, f, dentro);
      }
    };
    recorrer(raiz, fondo, { top: -Infinity, bottom: Infinity });
    return top === Infinity
      ? null
      : { top: Math.round(top), bottom: Math.round(bottom), deArriba, deAbajo };
  };
  const nombre = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const clase = (el.className?.toString?.() ?? "")
      .split(/\s+/)
      .map((c) => c.replace(/-module__\w+__/, ".").replace(/^(\w+)\./, "$1:"))
      .filter(Boolean)[0];
    const titulo = el
      .querySelector("h1, h2, h3")
      ?.textContent.replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
    return [el.tagName.toLowerCase() + id, clase, titulo ? `«${titulo}»` : ""]
      .filter(Boolean)
      .join(" ");
  };
  // Hijos de `raiz` como secciones; un contenedor sin clase ni id solo agrupa: se entra.
  const secciones = (raiz) => {
    const salida = [];
    for (const hijo of raiz.children) {
      if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(hijo.tagName)) continue;
      if (!visible(hijo)) continue;
      if (hijo.tagName === "DIV" && !hijo.className && !hijo.id && hijo.children.length > 1) {
        salida.push(...secciones(hijo));
        continue;
      }
      salida.push(hijo);
    }
    return salida;
  };
  const main = document.querySelector("main");
  const pie = [...document.querySelectorAll("footer")].find((f) => !main?.contains(f));
  const fondoPagina = fondoDe(main ?? document.body);
  const filas = [];
  const conCaja = (els, fondo) =>
    els.map((el) => ({ el, caja: pintado(el, fondo) })).filter((s) => s.caja);
  const enMain = main ? conCaja(secciones(main), fondoPagina) : [];
  for (let i = 1; i < enMain.length; i++) {
    filas.push({
      zona: "main",
      entre: `${nombre(enMain[i - 1].el)} → ${nombre(enMain[i].el)}`,
      hueco: enMain[i].caja.top - enMain[i - 1].caja.bottom,
      desde: enMain[i - 1].caja.deAbajo,
      hasta: enMain[i].caja.deArriba,
    });
  }
  if (pie) {
    const cajaPie = pintado(pie, fondoPagina);
    const ultimo = enMain[enMain.length - 1];
    if (ultimo && cajaPie) {
      filas.push({
        zona: "main→pie",
        entre: `${nombre(ultimo.el)} → pie`,
        hueco: cajaPie.top - ultimo.caja.bottom,
        desde: ultimo.caja.deAbajo,
        hasta: cajaPie.deArriba,
      });
    }
    const fondoPie = fondoDe(pie);
    const dentro = conCaja(secciones(pie), fondoPie);
    const rPie = pie.getBoundingClientRect();
    const pieTop = Math.round(rPie.top + scrollY);
    const pieBottom = Math.round(rPie.bottom + scrollY);
    if (dentro.length > 0 && fondoPie !== fondoPagina) {
      filas.push({
        zona: "pie",
        entre: `borde de arriba del pie → ${nombre(dentro[0].el)}`,
        hueco: dentro[0].caja.top - pieTop,
      });
    }
    for (let i = 1; i < dentro.length; i++) {
      filas.push({
        zona: "pie",
        entre: `${nombre(dentro[i - 1].el)} → ${nombre(dentro[i].el)}`,
        hueco: dentro[i].caja.top - dentro[i - 1].caja.bottom,
        desde: dentro[i - 1].caja.deAbajo,
        hasta: dentro[i].caja.deArriba,
      });
    }
    if (dentro.length > 0) {
      filas.push({
        zona: "pie",
        entre: `${nombre(dentro[dentro.length - 1].el)} → final de la página`,
        hueco:
          Math.max(pieBottom, document.documentElement.scrollHeight) -
          dentro[dentro.length - 1].caja.bottom,
      });
    }
  }
  return { filas, alto: document.documentElement.scrollHeight };
}

const resultado = [];
for (const ruta of rutas) {
  for (const ancho of ANCHOS) {
    // 1) Huecos, con «reducir movimiento» y tras recorrer la página (lo diferido se carga).
    const ctx = await contexto(ancho, true);
    const p = await ctx.newPage();
    const errores = [];
    p.on("pageerror", (e) => errores.push(String(e.message).slice(0, 120)));
    const r = await p.goto(`${origen}${ruta}`, { waitUntil: "load" });
    for (let y = 0; y < 30; y++) {
      const fin = await p.evaluate(() => {
        scrollBy(0, innerHeight * 0.8);
        return innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      });
      await p.waitForTimeout(250);
      if (fin) break;
    }
    await p.waitForTimeout(1200);
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(800);
    const m = await p.evaluate(medirEnPagina);
    await p.screenshot({
      path: path.join(
        carpeta,
        `${ruta === "/" ? "portada" : ruta.replace(/\W+/g, "-").replace(/^-|-$/g, "")}-${ancho}.png`,
      ),
      fullPage: true,
    });
    await ctx.close();
    // 2) CLS de carga, sin emular nada.
    const ctx2 = await contexto(ancho, false);
    const p2 = await ctx2.newPage();
    await p2.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await p2.goto(`${origen}${ruta}`, { waitUntil: "load" });
    await p2.waitForTimeout(4000);
    const cls = await p2.evaluate(() => Number(window.__cls.toFixed(4)));
    await ctx2.close();
    resultado.push({ ruta, ancho, http: r?.status(), errores, cls, alto: m.alto, filas: m.filas });
    process.stdout.write(`${ruta} ${ancho}: ${m.filas.length} huecos, CLS ${cls}\n`);
  }
}
await navegador.close();

fs.writeFileSync(path.join(carpeta, "huecos.json"), JSON.stringify(resultado, null, 2));
const lineas = [`# Huecos entre secciones — ${origen}`, ""];
for (const ruta of rutas) {
  const deRuta = resultado.filter((x) => x.ruta === ruta);
  lineas.push(`## ${ruta}`, "");
  lineas.push(
    `| Entre | ${ANCHOS.join(" | ")} |`,
    `| --- | ${ANCHOS.map(() => "---").join(" | ")} |`,
  );
  const claves = [...new Set(deRuta.flatMap((x) => x.filas.map((f) => f.entre)))];
  for (const clave of claves) {
    const celdas = ANCHOS.map((a) => {
      const f = deRuta.find((x) => x.ancho === a)?.filas.find((g) => g.entre === clave);
      if (!f) return "—";
      const marca = f.hueco > MAXIMO ? " ✗" : f.hueco > comun(a) + 8 ? " ⚠" : "";
      return `${f.hueco}${marca}`;
    });
    lineas.push(`| ${clave.replace(/\|/g, "/")} | ${celdas.join(" | ")} |`);
  }
  lineas.push(
    `| _CLS de carga_ | ${ANCHOS.map((a) => deRuta.find((x) => x.ancho === a)?.cls ?? "—").join(" | ")} |`,
    `| _Alto de la página_ | ${ANCHOS.map((a) => deRuta.find((x) => x.ancho === a)?.alto ?? "—").join(" | ")} |`,
    "",
  );
}
lineas.push(
  `Espaciado común por ancho: ${ANCHOS.map((a) => `${a}: ${Math.round(comun(a))}`).join(" · ")}. ⚠ pasa del común + 8 px; ✗ pasa de ${MAXIMO} px.`,
);
fs.writeFileSync(path.join(carpeta, "huecos.md"), lineas.join("\n") + "\n");
