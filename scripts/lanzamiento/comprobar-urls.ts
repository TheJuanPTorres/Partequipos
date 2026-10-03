/**
 * Recorre las 648 URLs del sitio actual (`docs/url-map.csv`) contra un dominio
 * y comprueba que cada una responde como debe el día del lanzamiento:
 * conservadas en 200, redirects cargados en 301 hasta su destino. Ver
 * `docs/runbook-lanzamiento.md`, paso f.
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
  veredicto,
  type Esperado,
  type Salto,
  type Veredicto,
} from "../../src/lib/lanzamiento/urlMap";

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
const redirects = parsearCsv(
  fs.readFileSync(path.join(raiz, "scripts/import/data/redirects.csv"), "utf8"),
).map((f) => ({ desde: f.desde ?? "", hacia: f.hacia ?? "" }));
const mapa = clasificar(urls, redirects);

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
    return { esperado, ruta, saltos, veredicto: veredicto(ruta, esperado, saltos) };
  } catch (error) {
    return {
      esperado,
      ruta,
      saltos,
      veredicto: veredicto(ruta, esperado, saltos, (error as Error).message),
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

console.log(`Dominio: ${base} · ${filas.length} URLs de docs/url-map.csv\n`);
for (const [clave, n] of [...cuenta.entries()].sort())
  console.log(`  ${String(n).padStart(4)}  ${clave}`);

const bloqueantes = filas.filter((f) => bloquea(f.esperado, f.veredicto));
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
  fs.writeFileSync(informe, JSON.stringify({ base, filas }, null, 2));
  console.log(`\nDetalle guardado en ${informe}`);
}

if (estricto && bloqueantes.length > 0) {
  console.error(`\n✗ ${bloqueantes.length} URLs no responden como deben.`);
  process.exit(1);
}
