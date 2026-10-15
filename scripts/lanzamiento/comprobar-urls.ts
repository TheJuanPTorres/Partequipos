/**
 * Recorre las 650 URLs del sitio actual (`docs/url-map.csv`) contra un dominio
 * y comprueba que cada una responde como debe el día del lanzamiento:
 * conservadas en 200, redirects cargados en 301 hasta su destino. Ver
 * `docs/runbook-lanzamiento.md`, paso f.
 *
 * Los redirects esperados son los de `scripts/import/data/redirects.csv` más
 * los que sirve el propio dominio en `/api/redirects-map/` (la misma lista que
 * aplica el proxy). Si no puede leer esa lista, no sigue: comprobar sin ella
 * daría por bloqueantes los 301 creados por los importadores y el panel.
 *
 * Uso:
 *   LANZAMIENTO_BASE=https://partequipos.com npm run lanzamiento:urls
 *   LANZAMIENTO_ESTRICTO=true  ...   sale con 1 si algo bloquea
 *   LANZAMIENTO_INFORME=<fichero.json>  guarda el detalle de cada URL
 *
 * Solo hace peticiones GET de lectura. No lleva token de derivación: es para
 * dominios públicos; un preview protegido respondería 302 a todo.
 *
 * La DECISIÓN vive en `src/lib/lanzamiento/urlMap.ts`, con pruebas.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  bloquea,
  clasificar,
  MAX_SALTOS,
  parsearCsv,
  rutasAComprobar,
  unirRedirects,
  veredicto,
  type Redirect,
  type Esperado,
  type Salto,
  type Veredicto,
} from "../../src/lib/lanzamiento/urlMap";
import { REDIRECTS_FIJOS } from "../../src/lib/redirects/fijos";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const base = process.env.LANZAMIENTO_BASE?.trim().replace(/\/$/, "");
const estricto = process.env.LANZAMIENTO_ESTRICTO?.trim() === "true";
const informe = process.env.LANZAMIENTO_INFORME?.trim();
const CONCURRENCIA = 4;

if (!base) {
  console.error("✗ Falta LANZAMIENTO_BASE: el dominio a comprobar, p. ej. https://partequipos.com");
  process.exit(1);
}

const urls = parsearCsv(fs.readFileSync(path.join(raiz, "docs/url-map.csv"), "utf8")).map(
  (f) => f.url ?? "",
);
const delFichero = parsearCsv(
  fs.readFileSync(path.join(raiz, "scripts/import/data/redirects.csv"), "utf8"),
).map((f) => ({ desde: f.desde ?? "", hacia: f.hacia ?? "" }));

/**
 * El mapa que aplica el proxy. La cabecera es la misma que pone `proxy.ts`
 * (higiene, no autenticación: ver la ruta). Un preview protegido responde
 * 302 y un mapa vacío es la degradación de la ruta ante un fallo de la base:
 * los dos se tratan como «no se pudo leer».
 */
async function leerMapa(): Promise<Redirect[]> {
  const url = `${base}/api/redirects-map/`;
  const r = await fetch(url, {
    headers: { "x-proxy-internal": "1" },
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
  if (r.status !== 200 || !r.headers.get("content-type")?.includes("application/json")) {
    throw new Error(`HTTP ${r.status} en ${url}`);
  }
  const cuerpo = (await r.json()) as { redirects?: { desde?: string; hacia?: string }[] };
  const lista = (cuerpo.redirects ?? []).filter((x) => x.desde && x.hacia);
  if (lista.length === 0) throw new Error(`mapa vacío en ${url}`);
  return lista.map((x) => ({ desde: x.desde ?? "", hacia: x.hacia ?? "" }));
}

let deLaBase: Redirect[];
try {
  deLaBase = await leerMapa();
} catch (error) {
  console.error(`✗ No se pudo leer el mapa de redirects del dominio: ${(error as Error).message}`);
  console.error("  Sin él, los 301 de los importadores y del panel saldrían como bloqueantes.");
  process.exit(1);
}
// Los fijos de `next.config.ts` cuentan como del fichero: viven en el código.
const fijos = REDIRECTS_FIJOS.map((r) => ({ desde: r.source, hacia: r.destination }));
const { conflictos, redirects } = unirRedirects([...delFichero, ...fijos], deLaBase);
const rutas = rutasAComprobar(urls, redirects);
const mapa = clasificar(rutas, redirects);

type Fila = { esperado: Esperado; ruta: string; saltos: Salto[]; veredicto: Veredicto };

async function pedir(url: string): Promise<Salto> {
  for (let intento = 1; ; intento += 1) {
    try {
      const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
      await r.body?.cancel();
      const salto: Salto = { estado: r.status, location: r.headers.get("location") ?? undefined };
      // Un 5xx puede ser un arranque en frío: un reintento, no más.
      if (r.status >= 500 && intento < 2) continue;
      return salto;
    } catch (error) {
      if (intento >= 2) throw error;
    }
  }
}

async function recorrer(ruta: string, esperado: Esperado): Promise<Fila> {
  const saltos: Salto[] = [];
  let actual = `${base}${ruta}`;
  try {
    for (let i = 0; i <= MAX_SALTOS; i += 1) {
      const salto = await pedir(actual);
      saltos.push(salto);
      if (salto.estado < 300 || salto.estado >= 400 || !salto.location) break;
      actual = new URL(salto.location, actual).toString();
    }
    return {
      esperado,
      ruta,
      saltos,
      veredicto: veredicto(ruta, esperado, saltos, undefined, base),
    };
  } catch (error) {
    return {
      esperado,
      ruta,
      saltos,
      veredicto: veredicto(ruta, esperado, saltos, (error as Error).message, base),
    };
  }
}

const pendientes = [...mapa.entries()];
const filas: Fila[] = [];
async function trabajador() {
  for (let siguiente = pendientes.shift(); siguiente; siguiente = pendientes.shift()) {
    filas.push(await recorrer(siguiente[0], siguiente[1]));
  }
}
await Promise.all(Array.from({ length: CONCURRENCIA }, trabajador));

const cuenta = new Map<string, number>();
for (const f of filas) {
  const clave = `${f.esperado.tipo} · ${f.veredicto}`;
  cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1);
}

console.log(
  `Dominio: ${base} · ${urls.length} URLs de docs/url-map.csv + ${rutas.length - urls.length} orígenes de redirect que no están en él`,
);
console.log(
  `Redirects esperados: ${redirects.length} (${delFichero.length} del fichero, ${fijos.length} de next.config.ts, ${deLaBase.length} de la base)\n`,
);
for (const [clave, n] of [...cuenta.entries()].sort())
  console.log(`  ${String(n).padStart(4)}  ${clave}`);

const bloqueantes = filas.filter((f) => bloquea(f.esperado, f.veredicto));

if (conflictos.length > 0) {
  console.log(`\nConflictos fichero/base (bloquean): ${conflictos.length}`);
  for (const c of conflictos) {
    console.log(`  ✗ ${c.desde}: fichero → ${c.enFichero} · base → ${c.enBase}`);
  }
}

const informativas = filas.filter(
  (f) => f.esperado.tipo === "pendiente" || f.esperado.tipo === "basura",
);

console.log(`\nBloquean el lanzamiento: ${bloqueantes.length}`);
for (const f of bloqueantes.slice(0, 40)) {
  console.log(
    `  ✗ ${f.veredicto.padEnd(19)} ${f.ruta}  [${f.saltos.map((s) => s.estado).join(" → ")}]`,
  );
}
if (bloqueantes.length > 40)
  console.log(`  … y ${bloqueantes.length - 40} más (detalle en LANZAMIENTO_INFORME)`);

console.log(`\nPendientes y basura (informativo, no bloquean): ${informativas.length}`);
for (const f of informativas) {
  console.log(`  · ${f.esperado.tipo.padEnd(9)} ${f.veredicto.padEnd(19)} ${f.ruta}`);
}

if (informe) {
  fs.writeFileSync(informe, JSON.stringify({ base, conflictos, filas }, null, 2));
  console.log(`\nDetalle guardado en ${informe}`);
}

if (estricto && bloqueantes.length + conflictos.length > 0) {
  console.error(
    `\n✗ ${bloqueantes.length} URLs no responden como deben y ${conflictos.length} conflictos de redirects.`,
  );
  process.exit(1);
}
