// QA DEL MODO ADMINISTRACIÓN (tanda 23): lo que recibe un VISITANTE ANÓNIMO no lleva nada de él.
//
//   npm run qa:modo-admin -- https://<preview o sitio>
//
// Sin navegador ni sesión, sobre 10 rutas (9 fijas y la primera ficha de usada que enlaza el
// listado). FALLA (código 1) si:
//   1. el HTML de alguna trae textos, clases o enlaces del modo administración;
//   2. alguno de los scripts que ese HTML carga contiene el MÓDULO (la franja y los botones):
//      un visitante solo debe recibir el cargador, que sin la pista del panel no hace nada;
//   3. el endpoint del mapa responde otra cosa que 401 sin sesión, o se deja cachear.
//
// Lo ÚNICO del modo administración que sí llega a todos es la referencia al cargador en los datos
// de React (el nombre del componente y su trozo de código), igual para todo el mundo.
//
// En un preview, el secreto de derivación solo va por `derivacion.mjs` (CLAUDE.md §10.40).
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const { fetchAlPreview, puedeLlevarDerivacion } = await import(
  pathToFileURL(path.join(aqui, "../../src/lib/preview/derivacion.mjs")).href
);

const origen = (process.argv[2] ?? "").replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9.-]+$/.test(origen)) {
  console.error("Uso: npm run qa:modo-admin -- https://<preview o sitio>");
  process.exit(2);
}
const secreto = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const pedir = (url) =>
  puedeLlevarDerivacion(url, origen)
    ? fetchAlPreview(url, origen, secreto)
    : fetch(url, { redirect: "manual" });

const RUTAS_FIJAS = [
  "/",
  "/nosotros/",
  "/contactanos/",
  "/noticias/",
  "/servicio-tecnico/",
  "/maquinaria-pesada/",
  "/maquinaria-pesada/maquinaria-pesada-nueva/tipos/",
  "/maquinaria-pesada/maquinaria-pesada-usada/",
  "/repuestos-maquinaria-pesada-colombia/",
];

/** Lo que NO puede estar en el HTML de un visitante. */
const PROHIBIDO_EN_HTML = [
  /Est[aá]s viendo la web como/i,
  /Editar esta p[aá]gina/i,
  /Ocultar marcas de edici[oó]n/i,
  /pqma-/,
  /data-modo-admin/,
  /api\/modo-admin/,
  /href="\/admin/,
  /\/vista-previa\//,
];
/** Lo que delata al MÓDULO dentro de un script (no al cargador). */
// Solo ASCII (el minificador puede escapar las tildes). `modoAdmin.test.ts` exige que el módulo
// los contenga, para que esta comprobación no pase en vacío si se renombra algo.
const MODULO = [/pqma-franja/, /api\/modo-admin\/mapa/, /pqma-editar/];

const decir = (texto) =>
  process.stdout.write(`${texto}
`);
const fallos = [];
const scripts = new Set();
let rutas = [...RUTAS_FIJAS];

async function leerHtml(ruta) {
  const r = await pedir(origen + ruta);
  const html = r.status === 200 ? await r.text() : "";
  return { status: r.status, html };
}

// La décima ruta: la primera ficha de usada que enlaza el índice de usados.
{
  const { html } = await leerHtml("/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/");
  const ficha =
    /href="(\/maquinaria-pesada\/maquinaria-pesada-usada\/excavadoras\/[a-z0-9-]+\/)"/.exec(html);
  if (ficha && !/\/pagina\/$/.test(ficha[1])) rutas.push(ficha[1]);
  else fallos.push("no encontré una ficha de usada que comprobar");
}

for (const ruta of rutas) {
  const { status, html } = await leerHtml(ruta);
  if (status !== 200) {
    fallos.push(`${ruta}: HTTP ${status}`);
    continue;
  }
  const malos = PROHIBIDO_EN_HTML.filter((p) => p.test(html)).map(String);
  if (malos.length) fallos.push(`${ruta}: el HTML trae ${malos.join(", ")}`);
  for (const m of html.matchAll(/\/_next\/static\/[^"'\\ )]+\.js/g)) scripts.add(m[0]);
  decir(`${malos.length ? "MAL" : "ok "} ${ruta}`);
}

let conCargador = 0;
for (const src of scripts) {
  const r = await pedir(origen + src);
  if (r.status !== 200) {
    fallos.push(`${src}: HTTP ${r.status}`);
    continue;
  }
  const js = await r.text();
  if (js.includes("pq-modo-admin")) conCargador++;
  const delata = MODULO.filter((p) => p.test(js)).map(String);
  if (delata.length) fallos.push(`un visitante descarga el módulo: ${src} (${delata.join(", ")})`);
}
decir(
  `scripts que cargan esas ${rutas.length} páginas: ${scripts.size}; con el cargador: ${conCargador}; con el módulo: ${fallos.filter((f) => f.startsWith("un visitante")).length}`,
);
if (conCargador === 0) fallos.push("ningún script lleva el cargador: ¿se ha quitado del layout?");

// El endpoint, sin sesión: 401 y sin caché, también con una ruta rara.
for (const consulta of ["?ruta=/", "?ruta=/../admin/", ""]) {
  const r = await pedir(`${origen}/api/modo-admin/mapa/${consulta}`);
  const cache = r.headers.get("cache-control") ?? "";
  const cuerpo = await r.text();
  const bien = r.status === 401 && /no-store/.test(cache) && !/bloques|selector/.test(cuerpo);
  if (!bien) fallos.push(`mapa${consulta}: HTTP ${r.status}, cache-control «${cache}»`);
  decir(`${bien ? "ok " : "MAL"} /api/modo-admin/mapa/${consulta} → ${r.status} · ${cache}`);
}

if (fallos.length) {
  console.error(`\nFALLA (${fallos.length}):\n- ${fallos.join("\n- ")}`);
  process.exit(1);
}
decir("\nEl modo administración no llega a un visitante.");
