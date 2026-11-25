/**
 * NADA SE CORTA, SE SOLAPA NI QUEDA TAPADO (tanda 24, regla de Juan Pablo, 2026-11-25).
 *
 * Por página, ancho y zoom, en la página PINTADA (Chrome sin ventana, «reducir movimiento»):
 *
 * - ✗ **barra horizontal**: la página es más ancha que la ventana; dice qué cajas se salen.
 * - ✗ **cortado**: un texto, un enlace, un botón o un campo que un antepasado con
 *   `overflow: hidden`/`clip` corta EN PARTE (de arriba abajo, o de lado si no es un carrusel:
 *   marcado con `aria-roledescription` o colocado con `transform`, como los testimonios).
 *   Lo que queda oculto ENTERO no cuenta (diapositivas fuera de vista, acordeones cerrados), ni lo
 *   que se puede desplazar (`auto`/`scroll`), ni un recorte a propósito: `text-overflow:
 *   ellipsis`, `line-clamp` o un antepasado con `data-qa-recorte` (la descripción plegada con
 *   «Leer más»).
 * - ✗ **tapado**: un enlace, botón o campo debajo del WhatsApp flotante, arriba del todo y abajo
 *   del todo de la página (en medio, al desplazar, pasa por debajo y sale); un texto, solo abajo
 *   del todo o en una página que no se desplaza (ahí no hay forma de sacarlo de debajo).
 * - ⚠ **solape**: dos textos que se pisan (más del 30 % del menor). Aviso: hay que mirarlo.
 *
 * El zoom del navegador se emula como lo hace Chrome: la ventana en píxeles CSS es ancho/zoom y
 * la densidad de píxeles, el zoom (1440 al 200 % = 720 px CSS con densidad 2).
 *
 *   npm run qa:desbordes -- <sitio> <carpeta> [ruta…]
 *   npm run preview:ejecutar -- npm run qa:desbordes -- <preview> <carpeta> [ruta…]
 *
 * Contra un preview, por `preview:ejecutar` (la cabecera de derivación solo va al preview,
 * `derivacion.mjs`). Vistas por defecto: 360, 390, 430, 768, 820, 1024, 1180, 1280, 1366, 1440,
 * 1920, 2560 y 3840 al 100 %, y 1366 y 1440 al 80, 125, 150 y 200 %. Para medir menos,
 * `DESBORDES_VISTAS=390,1440@200` (ancho@zoom). Rutas por defecto: `RUTAS`, abajo (las plantillas
 * principales). Con `DESBORDES_CAPTURAS=1`, una captura de cada página y vista. Escribe `desbordes.json`, `desbordes.md` y una captura por fallo (con el
 * elemento marcado en rojo) en la carpeta; sale con 1 si hay algún ✗. Es pesado: va con el turno
 * de MEDICION y, con todas las vistas y rutas, se parte en tandas (por rutas o por vistas).
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

/** Las plantillas principales: una página de cada una. */
const RUTAS = [
  "/",
  "/nosotros/",
  "/contactanos/",
  "/maquinaria-pesada/maquinaria-pesada-nueva/tipos/",
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/excavadoras/excavadora-case-construction-cx-130d-tier4/",
  "/maquinaria-pesada/maquinaria-pesada-usada/",
  "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/",
  "/maquinaria-pesada/maquinaria-pesada-usada/bulldozer/bulldozer-caterpillar-d3c-1996/",
  "/repuestos-para-maquinaria-pesada/",
  "/repuestos-para-maquinaria-pesada/marcas/hitachi/",
  "/lubricantes/lubricantes-eni/",
  "/servicio-tecnico/",
  "/noticias/",
];

const VISTAS_DEFECTO = [
  ...[360, 390, 430, 768, 820, 1024, 1180, 1280, 1366, 1440, 1920, 2560, 3840].map((a) => `${a}`),
  ...[1366, 1440].flatMap((a) => [80, 125, 150, 200].map((z) => `${a}@${z}`)),
];

const [base, carpeta, ...rutasArg] = process.argv.slice(2);
if (!base || !carpeta) throw new Error("Uso: desbordes.mjs <sitio> <carpeta> [ruta…]");
const origen = new URL(base).origin;
const rutas = rutasArg.length > 0 ? rutasArg : RUTAS;
const vistas = (process.env.DESBORDES_VISTAS?.split(",") ?? VISTAS_DEFECTO).map((v) => {
  const [ancho, zoom = "100"] = v.trim().split("@");
  return { nombre: v.trim(), ancho: Number(ancho), zoom: Number(zoom) / 100 };
});
fs.mkdirSync(carpeta, { recursive: true });

const navegador = await pw.chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const secreto = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "";

/** Se ejecuta en la página: devuelve los fallos, cada uno con un selector para marcarlo. */
function medir() {
  const fallos = [];
  let n = 0;
  const marcar = (el) => {
    if (!el.dataset.qaDesborde) el.dataset.qaDesborde = String(++n);
    return `[data-qa-desborde="${el.dataset.qaDesborde}"]`;
  };
  const describir = (el) => {
    const texto = (el.getAttribute("aria-label") || el.textContent || "")
      .trim()
      .replace(/\s+/g, " ");
    const clase = typeof el.className === "string" ? el.className.split(" ")[0] : "";
    return `<${el.tagName.toLowerCase()}${clase ? `.${clase}` : ""}> «${texto.slice(0, 50)}»`;
  };
  const visible = (el) => {
    if (el.closest("[aria-hidden='true'], [inert], .sr-only, dialog:not([open])")) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let a = el; a; a = a.parentElement) {
      const e = getComputedStyle(a);
      if (e.visibility === "hidden" || e.opacity === "0" || e.display === "none") return false;
    }
    return true;
  };
  const INTERACTIVO = "a[href], button, input:not([type=hidden]), select, textarea, [role=button]";
  // Lo que importa que no se corte: lo interactivo y lo que tiene texto propio.
  const candidatos = [...document.querySelectorAll("body *")].filter((el) => {
    if (el.closest("svg, script, style, noscript, template")) return false;
    if (el.matches(INTERACTIVO)) return true;
    return [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1);
  });
  const vistos = candidatos.filter(visible);

  // 1. Barra horizontal.
  const ancho = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > ancho + 1) {
    const fuera = [...document.querySelectorAll("body *")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.right > ancho + 1 && r.width > 0 && getComputedStyle(el).position !== "fixed";
    });
    // Las más externas (las de dentro se salen por ellas).
    const externas = fuera.filter((el) => !fuera.includes(el.parentElement)).slice(0, 4);
    fallos.push({
      tipo: "barra horizontal",
      detalle: `la página mide ${document.documentElement.scrollWidth} px en ${ancho}: ${externas.map(describir).join(" · ")}`,
      selector: externas[0] ? marcar(externas[0]) : null,
    });
  }

  // 2. Cortado en parte por un antepasado.
  const intencionado = (el, hasta) => {
    for (let a = el; a && a !== hasta.parentElement; a = a.parentElement) {
      const e = getComputedStyle(a);
      if (e.textOverflow === "ellipsis" || e.webkitLineClamp !== "none") return true;
      if (a.hasAttribute("data-qa-recorte")) return true;
    }
    return false;
  };
  for (const el of vistos) {
    const r = el.getBoundingClientRect();
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const e = getComputedStyle(a);
      // Un contenedor con desplazamiento propio (`auto`/`scroll`): lo de dentro se alcanza
      // desplazándolo (la tira de marcas de la portada). Lo decide él, no los de fuera.
      if (/auto|scroll/.test(`${e.overflowX} ${e.overflowY}`)) break;
      const cortaY = e.overflowY === "hidden" || e.overflowY === "clip";
      const cortaX = e.overflowX === "hidden" || e.overflowX === "clip";
      if (!cortaY && !cortaX) continue;
      const c = a.getBoundingClientRect();
      const bordeX = a.clientLeft;
      const bordeY = a.clientTop;
      const caja = {
        left: c.left + bordeX,
        right: c.left + bordeX + a.clientWidth,
        top: c.top + bordeY,
        bottom: c.top + bordeY + a.clientHeight,
      };
      const seCruza =
        r.right > caja.left && r.left < caja.right && r.bottom > caja.top && r.top < caja.bottom;
      if (!seCruza) break; // Oculto entero: a propósito (fuera de vista, plegado).
      const enY = cortaY && (r.top < caja.top - 1 || r.bottom > caja.bottom + 1);
      // Un carrusel: marcado como tal, o lo que se coloca con `transform` dentro del que corta
      // (las tarjetas de testimonios, la pista de la galería). Lo de los lados asoma a propósito.
      let movido = false;
      for (let m = el; m && m !== a; m = m.parentElement)
        if (getComputedStyle(m).transform !== "none") movido = true;
      const carrusel =
        movido || a.closest("[aria-roledescription='carrusel'], [aria-roledescription='carousel']");
      const enX = cortaX && !carrusel && (r.left < caja.left - 1 || r.right > caja.right + 1);
      if ((enY || enX) && !intencionado(el, a)) {
        const px = enY
          ? Math.round(Math.max(caja.top - r.top, r.bottom - caja.bottom))
          : Math.round(Math.max(caja.left - r.left, r.right - caja.right));
        fallos.push({
          tipo: "cortado",
          detalle: `${describir(el)}: ${px} px ${enY ? "de alto" : "de ancho"} fuera de ${describir(a)}`,
          selector: marcar(el),
        });
      }
      break; // El primer antepasado que corta es el que decide.
    }
  }

  // 3. Solape entre textos (aviso). Con la parte VISIBLE de cada uno (lo que corta un antepasado
  // no se ve, así que no pisa nada), solo entre elementos con texto (un botón vacío encima de
  // toda una tarjeta no es un solape) y sin lo fijo (el WhatsApp va en «tapado»).
  const recorteVisible = (el) => {
    const r = el.getBoundingClientRect();
    let v = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const e = getComputedStyle(a);
      if (e.overflowX === "visible" && e.overflowY === "visible") continue;
      const c = a.getBoundingClientRect();
      v = {
        left: Math.max(v.left, c.left),
        right: Math.min(v.right, c.right),
        top: Math.max(v.top, c.top),
        bottom: Math.min(v.bottom, c.bottom),
      };
    }
    return { ...v, width: v.right - v.left, height: v.bottom - v.top };
  };
  const fijo = (el) => {
    for (let a = el; a; a = a.parentElement)
      if (getComputedStyle(a).position === "fixed") return true;
    return false;
  };
  const hojas = vistos.filter(
    (el) =>
      !vistos.some((o) => o !== el && el.contains(o)) &&
      (el.textContent ?? "").trim().length > 0 &&
      !fijo(el),
  );
  const cajas = hojas
    .map((el) => [el, recorteVisible(el)])
    .filter(([, r]) => r.width > 2 && r.height > 2);
  for (let i = 0; i < cajas.length; i++) {
    for (let j = i + 1; j < cajas.length; j++) {
      const [ea, a] = cajas[i];
      const [eb, b] = cajas[j];
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w <= 2 || h <= 2) continue;
      if (ea.contains(eb) || eb.contains(ea)) continue;
      if (ea.closest("[data-qa-solape]") || eb.closest("[data-qa-solape]")) continue;
      const menor = Math.min(a.width * a.height, b.width * b.height);
      if (w * h > 0.3 * menor) {
        fallos.push({
          tipo: "solape",
          aviso: true,
          detalle: `${describir(ea)} pisa ${describir(eb)}`,
          selector: marcar(ea),
        });
      }
    }
  }
  return fallos;
}

/**
 * Lo que queda debajo del WhatsApp flotante, en la posición de desplazamiento actual. Controles y
 * campos (enlaces, botones, entradas), siempre: la regla de §7 es que el WhatsApp no los tapa.
 * Texto, solo donde no se puede sacar de debajo desplazando: abajo del todo (subir lo baja, nunca
 * lo pone por encima del botón) o en una página que no se desplaza. Arriba, el texto que pasa por
 * debajo sale al bajar: no cuenta.
 */
function tapados(donde) {
  const flotante = document.querySelector("a[aria-label='Escríbenos por WhatsApp']");
  if (!flotante) return [];
  const f = flotante.getBoundingClientRect();
  if (f.width < 1) return [];
  const fallos = [];
  const INTERACTIVO = "a[href], button, input:not([type=hidden]), select, textarea, [role=button]";
  const sinDesplazar = document.documentElement.scrollHeight <= innerHeight + 1;
  const conTexto = donde === "abajo" || sinDesplazar;
  const elementos = [...document.querySelectorAll(conTexto ? "body *" : INTERACTIVO)].filter(
    (el) =>
      el.matches(INTERACTIVO) ||
      [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1),
  );
  for (const el of elementos) {
    if (
      flotante.contains(el) ||
      el.contains(flotante) ||
      el.closest("[aria-hidden='true'], [inert]")
    )
      continue;
    // Solo la parte VISIBLE: una miniatura desplazada fuera de su fila no está bajo el botón.
    const b = el.getBoundingClientRect();
    const r = { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const e = getComputedStyle(a);
      if (e.overflowX === "visible" && e.overflowY === "visible") continue;
      const c = a.getBoundingClientRect();
      r.left = Math.max(r.left, c.left);
      r.right = Math.min(r.right, c.right);
      r.top = Math.max(r.top, c.top);
      r.bottom = Math.min(r.bottom, c.bottom);
    }
    if (r.right - r.left < 1 || r.bottom - r.top < 1) continue;
    if (getComputedStyle(el).visibility === "hidden") continue;
    const w = Math.min(r.right, f.right) - Math.max(r.left, f.left);
    const h = Math.min(r.bottom, f.bottom) - Math.max(r.top, f.top);
    if (w > 2 && h > 2) {
      const texto = (el.getAttribute("aria-label") || el.textContent || "")
        .trim()
        .replace(/\s+/g, " ");
      if (!el.dataset.qaDesborde)
        el.dataset.qaDesborde = `t${Math.random().toString(36).slice(2, 7)}`;
      fallos.push({
        tipo: "tapado",
        detalle: `<${el.tagName.toLowerCase()}> «${texto.slice(0, 50)}» bajo el WhatsApp (${donde})`,
        selector: `[data-qa-desborde="${el.dataset.qaDesborde}"]`,
        donde,
      });
    }
  }
  return fallos;
}

const decir = (t) => process.stdout.write(`${t}\n`);
const resultados = [];
for (const vista of vistas) {
  const contexto = await navegador.newContext({
    viewport: { width: Math.round(vista.ancho / vista.zoom), height: Math.round(900 / vista.zoom) },
    deviceScaleFactor: vista.zoom,
    reducedMotion: "reduce",
  });
  if (origenDePreview(origen)) await instalarDerivacion(contexto, origen, secreto);
  const pagina = await contexto.newPage();
  for (const ruta of rutas) {
    const fila = { ruta, vista: vista.nombre, fallos: [] };
    try {
      const r = await pagina.goto(`${origen}${ruta}`, { waitUntil: "load", timeout: 60000 });
      fila.estado = r?.status() ?? 0;
      // Recorrer la página: lo diferido y lo que se monta al acercarse se pinta.
      await pagina.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
          scrollTo(0, y);
          await new Promise((ok) => setTimeout(ok, 120));
        }
        scrollTo(0, 0);
      });
      await pagina.waitForTimeout(800);
      fila.fallos.push(...(await pagina.evaluate(medir)));
      fila.fallos.push(...(await pagina.evaluate(tapados, "arriba")));
      // Con `DESBORDES_CAPTURAS=1`, además, la vista de arriba de cada página (antes y después).
      if (process.env.DESBORDES_CAPTURAS) {
        const nombre = `${ruta.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "portada"}-${vista.nombre.replace("@", "z")}.png`;
        await pagina.screenshot({ path: path.join(carpeta, nombre) });
      }
      await pagina.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await pagina.waitForTimeout(600);
      fila.fallos.push(...(await pagina.evaluate(tapados, "abajo")));
      // Una captura por tipo de fallo, con el elemento marcado.
      const porTipo = new Map();
      for (const f of fila.fallos) if (f.selector && !porTipo.has(f.tipo)) porTipo.set(f.tipo, f);
      for (const [tipo, f] of porTipo) {
        const el = pagina.locator(f.selector).first();
        // Lo tapado, en la posición donde se midió (arriba o abajo del todo); lo demás, a la vista.
        if (f.tipo !== "tapado") await el.scrollIntoViewIfNeeded().catch(() => {});
        else
          await pagina.evaluate(
            (abajo) => scrollTo(0, abajo ? document.documentElement.scrollHeight : 0),
            f.donde === "abajo",
          );
        await pagina.waitForTimeout(300);
        await el
          .evaluate((e) => {
            e.style.outline = "3px solid #ff0000";
            e.style.outlineOffset = "1px";
          })
          .catch(() => {});
        const nombre = `${ruta.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "portada"}-${vista.nombre.replace("@", "z")}-${tipo.replace(" ", "-")}.png`;
        await pagina.screenshot({ path: path.join(carpeta, nombre) });
        f.captura = nombre;
      }
    } catch (error) {
      fila.fallos.push({ tipo: "error", detalle: String(error).slice(0, 200) });
    }
    for (const f of fila.fallos) delete f.selector;
    const graves = fila.fallos.filter((f) => !f.aviso).length;
    const avisos = fila.fallos.length - graves;
    decir(
      `${graves ? "✗" : avisos ? "⚠" : "✓"} ${vista.nombre.padEnd(8)} ${ruta}${graves ? ` — ${graves} fallo(s)` : ""}${avisos ? ` — ${avisos} aviso(s)` : ""}`,
    );
    for (const f of fila.fallos) decir(`    ${f.aviso ? "⚠" : "✗"} ${f.tipo}: ${f.detalle}`);
    resultados.push(fila);
  }
  await contexto.close();
}
await navegador.close();

fs.writeFileSync(path.join(carpeta, "desbordes.json"), JSON.stringify(resultados, null, 2));
const lineas = [`# Desbordes — ${origen} (${new Date().toISOString().slice(0, 16)})`, ""];
for (const fila of resultados) {
  const graves = fila.fallos.filter((f) => !f.aviso).length;
  lineas.push(`- ${graves ? "✗" : fila.fallos.length ? "⚠" : "✓"} ${fila.vista} \`${fila.ruta}\``);
  for (const f of fila.fallos)
    lineas.push(
      `  - ${f.aviso ? "⚠" : "✗"} ${f.tipo}: ${f.detalle}${f.captura ? ` (${f.captura})` : ""}`,
    );
}
fs.writeFileSync(path.join(carpeta, "desbordes.md"), `${lineas.join("\n")}\n`);
const total = resultados.reduce((s, f) => s + f.fallos.filter((x) => !x.aviso).length, 0);
decir(`\n${total ? `✗ ${total} fallo(s)` : "✓ sin fallos"} en ${resultados.length} medidas.`);
if (total) process.exitCode = 1;
