/**
 * FILTROS DONALDSON (2026-10-26, dirección): saca de la página de WordPress lo que monta la
 * página nueva (`importar.ts`) y lo deja FUERA del repositorio, en
 * `Desktop/partequipos-cierre/donaldson-wordpress.json`, como las demás importaciones:
 *
 * - el título y la descripción para buscadores;
 * - el logo de Donaldson;
 * - los tipos de filtro: nombre, frase y foto (las tarjetas de WordPress);
 * - el texto de presentación y dos fotos de obra (cabecera y tarjeta);
 * - las secciones propias (2026-10-26): la presentación con las 4 fotos de su carrusel y su
 *   «¿Por qué elegirnos?» (texto, compromiso y foto), que monta `secciones.ts`;
 *
 * El contenido va TAL CUAL (decisión del cliente, 2026-10-17: se migra todo aunque tenga
 * erratas). Las fotos se piden a su tamaño original (sin el «-768x543» de WordPress).
 *
 *   node scripts/donaldson/extraer-wp.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const URL_WP =
  "https://partequipos.com/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtracion-para-maquinaria-pesada/filtros-donaldson-maquinaria-pesada/";
const SALIDA = path.join(os.homedir(), "Desktop", "partequipos-cierre", "donaldson-wordpress.json");
const AGENTE = "Mozilla/5.0 (Partequipos; importación de Filtros Donaldson)";

const fallar = (m) => {
  throw new Error(`[donaldson] ✗ ${m}`);
};
const limpio = (t) =>
  t
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/\s+/g, " ")
    // Lo que deja quitar las etiquetas: «PARTEQUIPOS</b>,» → «PARTEQUIPOS ,».
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
/** La URL del original: sin el sufijo de tamaño que pone WordPress («-768x543»). */
const original = (u) => u.replace(/-\d+x\d+(\.[a-z]+)$/i, "$1");

const r = await fetch(URL_WP, { headers: { "User-Agent": AGENTE } });
if (!r.ok) fallar(`HTTP ${r.status} al leer ${URL_WP}`);
const html = (await r.text())
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<style[\s\S]*?<\/style>/g, "");

const meta = (re) => limpio(html.match(re)?.[1] ?? "");
const tituloSeo = meta(/<title>([^<]*)/).replace(/\s*-\s*Partequipos$/i, "");
const descripcionSeo = meta(/<meta name="description" content="([^"]*)/);

// Las tarjetas de los tipos: entre la primera («Filtro Combustible…») y «Protegiendo…».
const ini = html.indexOf("Filtro Combustible Donaldson");
const fin = html.indexOf("Protegiendo su Maquinaria");
if (ini < 0 || fin < 0) fallar("no encuentro las tarjetas de los tipos de filtro");
const fichas = [
  ...html.slice(ini - 3000, fin).matchAll(/<img[^>]*?src="([^"]+)"[^>]*>|>([^<>]{3,})</g),
]
  .map((m) => (m[1] ? { img: m[1] } : { t: limpio(m[2]) }))
  .filter((x) => x.img || (x.t && x.t.length > 3));
const tipos = [];
for (let i = 0; i < fichas.length; i++) {
  const f = fichas[i];
  if (!f.img || !/\/uploads\//.test(f.img)) continue;
  // Tras cada foto: el nombre, el nombre largo («… para maquinaria pesada») y la frase.
  const [nombre, , frase] = [fichas[i + 1]?.t, fichas[i + 2]?.t, fichas[i + 3]?.t];
  if (!nombre || !frase) continue;
  tipos.push({ nombre, descripcion: frase, foto: original(f.img) });
}
if (tipos.length !== 8) fallar(`esperaba 8 tipos de filtro y hay ${tipos.length}`);

// El texto de presentación («Bienvenidos a PARTEQUIPOS…») y sus fotos.
const bloque = html.slice(fin, html.indexOf("elegirnos", fin));
const presentacion = limpio(
  (bloque.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "").replace(/<[^>]+>/g, " "),
);
const fotosObra = [...bloque.matchAll(/<img[^>]*?src="([^"]+)"/g)].map((m) => original(m[1]));
if (!presentacion || fotosObra.length < 2) fallar("no encuentro la presentación o sus fotos");

// «¿Por qué elegirnos?» propio (2026-10-26): su texto, la frase del compromiso y la foto de los
// filtros. Los títulos van en tipo frase, como los escribió dirección (WordPress los pinta en
// mayúsculas con CSS y su texto trae las mayúsculas cambiadas: «cONSTRUCCIÓN mINERIA»).
const finPorQue = html.indexOf("TESTIMONIOS", fin);
const bloquePorQue = html.slice(html.indexOf("elegirnos", fin), finPorQue);
const parrafos = [...bloquePorQue.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
  .map((m) => limpio(m[1].replace(/<[^>]+>/g, " ")))
  .filter(Boolean);
const fotoPorQue = bloquePorQue.match(/<img[^>]*?src="([^"]+)"/)?.[1];
if (parrafos.length < 2 || !fotoPorQue)
  fallar("no encuentro el «¿Por qué elegirnos?» de Donaldson");
const secciones = {
  antetitulo: "Protegiendo su maquinaria pesada en la",
  titulo: "Construcción, minería y agricultura",
  texto: presentacion,
  // Las CUATRO fotos del carrusel de WordPress, en su orden.
  fotos: fotosObra,
  porQue: {
    titulo: "¿Por qué elegirnos?",
    texto: parrafos[0],
    foto: original(fotoPorQue),
    compromisoTitulo: "Nuestro compromiso es ofrecerle soluciones",
    compromisoTexto: parrafos[1],
  },
};

const logo = original(
  html.match(/<img[^>]*?src="([^"]*donaldson_logo[^"]*)"/)?.[1] ?? fallar("no encuentro el logo"),
);

const datos = {
  fuente: URL_WP,
  extraido: new Date().toISOString(),
  seo: { titulo: tituloSeo, descripcion: descripcionSeo },
  logo,
  presentacion,
  // La primera foto de obra, para la cabecera; la segunda, para la tarjeta.
  fondo: fotosObra[0],
  tarjeta: fotosObra[1],
  tipos,
  secciones,
};
fs.writeFileSync(SALIDA, JSON.stringify(datos, null, 2));
process.stdout.write(
  `[donaldson] ${tipos.length} tipos, logo y ${fotosObra.length} fotos de obra → ${SALIDA}\n`,
);
