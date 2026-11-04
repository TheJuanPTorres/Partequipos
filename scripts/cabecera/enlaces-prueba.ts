/**
 * OCHO ENLACES DE PRUEBA EN LA CABECERA DEL PREVIEW (2026-11-04, dirección): para
 * medir el desplegable «Más» con el máximo de filas de «Enlaces del menú».
 *
 *   npm run preview:ejecutar -- payload run scripts/cabecera/enlaces-prueba.ts sembrar <manifiesto.json>
 *   … ocultar <manifiesto.json>    # «Industrial»: «Mostrar» desmarcado y SIN enlace
 *   … retirar <manifiesto.json>    # deja los enlaces EXACTAMENTE como estaban
 *   … ver                          # solo lee: los enlaces de la base
 *   (cualquiera) revalidar=<origen del preview>
 *       vacía la caché de ese preview (`POST /api/revalidar/`) y comprueba en el
 *       HTML de su portada que salen los enlaces visibles de la base.
 *
 * El script corre fuera de Next: guardar el global NO refresca el preview (su
 * cabecera va en la caché `datos:marco`). De ahí `revalidar=`.
 *
 * «sembrar» guarda en el manifiesto las filas de antes (con su id, «Mostrar» y
 * enlace) y añade «Transporte» e «Industrial» (los que añadirá Juan Pablo) y, si
 * aún faltan para 8 visibles, filas «Prueba N»; todas a rutas que existen.
 * «retirar» vuelve a poner las filas del manifiesto y comprueba que coinciden.
 * Solo el preview (base y Blob del preview); el sitio publicado, desde el panel.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { getPayload } from "payload";

import { MAX_ENLACES_CABECERA } from "../../src/lib/cabecera/enlaces";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

const fallar = (m: string): never => {
  const e = new Error(`[enlaces-prueba] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
const args = process.argv.slice(2);
const modo = args.find((a) => a === "sembrar" || a === "ocultar" || a === "retirar" || a === "ver");
const manifiesto = args.find((a) => a.endsWith(".json"));
if (!modo || (modo !== "ver" && !manifiesto))
  fallar("uso: sembrar|ocultar|retirar <manifiesto.json> | ver  [revalidar=<preview>]");
const REVALIDAR = args.find((a) => a.startsWith("revalidar="))?.slice("revalidar=".length);
if (REVALIDAR && !origenDePreview(REVALIDAR)) fallar("`revalidar=` solo con la URL de un preview");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

type Fila = {
  id?: string | null;
  etiqueta: string;
  enlace?: string | null;
  mostrar?: boolean | null;
};
const limpia = (f: Fila): Fila => ({
  id: f.id ?? null,
  etiqueta: f.etiqueta,
  enlace: f.enlace ?? null,
  mostrar: f.mostrar ?? true,
});
const log = (m: string) => process.stdout.write(`[enlaces-prueba] ${m}\n`);
const leer = async () =>
  ((await payload.findGlobal({ slug: "cabecera", depth: 0 })).enlaces ?? []).map(limpia);
const guardar = (enlaces: Fila[]) =>
  payload.updateGlobal({ slug: "cabecera", data: { enlaces }, overrideAccess: true });

const CANDIDATAS: Fila[] = [
  { etiqueta: "Transporte", enlace: "/contactanos/" },
  { etiqueta: "Industrial", enlace: "/nosotros/" },
  { etiqueta: "Prueba 3", enlace: "/noticias/" },
  { etiqueta: "Prueba 4", enlace: "/contactanos/" },
];

const actuales = await leer();
if (modo === "ver") {
  // Solo lectura: lo de abajo imprime los enlaces.
} else if (modo === "sembrar") {
  if (existsSync(manifiesto!)) fallar("el manifiesto ya existe: retira antes de volver a sembrar");
  const visibles = actuales.filter((f) => f.mostrar !== false && f.enlace).length;
  const faltan = MAX_ENLACES_CABECERA - visibles;
  if (faltan <= 0) fallar(`ya hay ${visibles} visibles: nada que sembrar`);
  if (actuales.length + faltan > MAX_ENLACES_CABECERA)
    fallar(`hay ${actuales.length} filas (algunas ocultas): no caben ${faltan} más`);
  writeFileSync(manifiesto!, JSON.stringify({ antes: actuales }, null, 2));
  const nuevas = CANDIDATAS.slice(0, faltan).map((f) => ({ ...f, mostrar: true }));
  await guardar([...actuales, ...nuevas]);
  log(`añadidas ${nuevas.map((f) => f.etiqueta).join(", ")}; manifiesto en ${manifiesto}`);
} else {
  if (!existsSync(manifiesto!)) fallar("no hay manifiesto: nada que hacer");
  const { antes } = JSON.parse(readFileSync(manifiesto!, "utf8")) as { antes: Fila[] };
  if (modo === "ocultar") {
    const idx = actuales.findIndex(
      (f) => f.etiqueta === "Industrial" && !antes.some((a) => a.id === f.id),
    );
    if (idx < 0) fallar("no está la fila «Industrial» de prueba");
    const enlaces = actuales.map((f, i) =>
      i === idx ? { ...f, mostrar: false, enlace: null } : f,
    );
    await guardar(enlaces);
    log("«Industrial» oculta y sin enlace");
  } else {
    await guardar(antes);
    const despues = await leer();
    if (JSON.stringify(despues) !== JSON.stringify(antes))
      fallar(`la retirada no deja las filas como antes:\n${JSON.stringify(despues)}`);
    log(
      `retirado: ${despues.length} filas, idénticas a las de antes (id, etiqueta, enlace, «Mostrar»)`,
    );
  }
}
const ahora = await leer();
log(
  `enlaces ahora: ${ahora.map((f) => `${f.etiqueta} → ${f.enlace ?? "(sin enlace)"}${f.mostrar === false ? " [oculta]" : ""}`).join(" | ")}`,
);

if (REVALIDAR) {
  const origen = REVALIDAR.replace(/\/$/, "");
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "";
  const token = process.env.REVALIDACION_TOKEN ?? "";
  if (!token) fallar("sin REVALIDACION_TOKEN del preview: no se revalida");
  const r = await fetchAlPreview(`${origen}/api/revalidar/`, origen, bypass, {
    method: "POST",
    headers: { [CABECERA_REVALIDACION]: token },
  });
  log(`POST /api/revalidar/: HTTP ${r.status}`);
  if (r.status !== 200) fallar("la revalidación del preview no respondió 200");
  // La cabecera del HTML de la portada: cada enlace visible, una vez como mínimo
  // (en la fila de escritorio; los que no caben se reparten al medir, en el navegador).
  const pagina = await fetchAlPreview(`${origen}/`, origen, bypass);
  const html = await pagina.text();
  const cabecera = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
  const visibles = ahora.filter((f) => f.mostrar !== false && f.enlace);
  const faltan = visibles.filter((f) => !cabecera.includes(`>${f.etiqueta}<`));
  log(
    `HTML de / (HTTP ${pagina.status}): ${visibles.length - faltan.length} de ${visibles.length} enlaces en la cabecera` +
      (faltan.length ? `; FALTAN: ${faltan.map((f) => f.etiqueta).join(", ")}` : ""),
  );
  if (faltan.length) fallar("la cabecera del preview no lleva todos los enlaces");
}
process.exit(0);
