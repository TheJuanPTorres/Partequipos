/**
 * Verificación automatizada de TODAS las URLs publicadas.
 *
 * Uso:  npm run qa                                   (contra local)
 *       QA_BASE=https://partequipos.vercel.app npm run qa
 *       QA_MAX=20 npm run qa                         (muestra, para iterar)
 *
 * Sale con código 1 si hay algún ERROR — ruidoso a propósito. Los AVISOS no
 * cortan: son cosas a mirar, no defectos demostrados.
 *
 * De dónde salen las URLs: del **sitemap** del propio destino. Es la lista que
 * el sitio declara al mundo, así que verificar exactamente eso es lo pertinente;
 * y de paso, si una ruta viva quedara fuera del sitemap, el análisis lo avisa
 * al comparar contra las rutas que sí responden.
 *
 * La lógica de cada criterio vive en `src/lib/qa/analizar.ts`, que es pura y
 * está probada. Aquí solo se hacen peticiones y se ordena el informe.
 */
import {
  type Contexto,
  type Hallazgo,
  analizarPagina,
  conBarra,
  enlacesRotos,
} from "../../src/lib/qa/analizar";

const BASE_CRUDA = process.env.QA_BASE || "http://localhost:3000";
const BASE = BASE_CRUDA.endsWith("/") ? BASE_CRUDA : `${BASE_CRUDA}/`;
const MAX = Number(process.env.QA_MAX || 0);
/** Peticiones simultáneas. Bajo a propósito: no es una prueba de carga. */
const CONCURRENCIA = Number(process.env.QA_CONCURRENCIA || 6);

type Resultado = { ruta: string; estado: number; html: string; hallazgos: Hallazgo[] };

async function rutasDelSitemap(): Promise<string[]> {
  const r = await fetch(`${BASE}sitemap.xml`);
  if (!r.ok) throw new Error(`El sitemap respondió ${r.status}`);
  const xml = await r.text();

  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1] ?? "")
    .filter(Boolean)
    .map((u) => {
      try {
        return conBarra(new URL(u).pathname);
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

/** Descarga en tandas para no abrir 200 conexiones a la vez. */
async function descargar(rutas: string[]): Promise<Map<string, { estado: number; html: string }>> {
  const mapa = new Map<string, { estado: number; html: string }>();

  for (let i = 0; i < rutas.length; i += CONCURRENCIA) {
    const tanda = rutas.slice(i, i + CONCURRENCIA);
    await Promise.all(
      tanda.map(async (ruta) => {
        try {
          const r = await fetch(`${BASE.slice(0, -1)}${ruta}`, {
            redirect: "manual",
            signal: AbortSignal.timeout(20_000),
          });
          const html = r.status === 200 ? await r.text() : "";
          mapa.set(ruta, { estado: r.status, html });
        } catch (e) {
          mapa.set(ruta, { estado: 0, html: `error de red: ${(e as Error).message}` });
        }
      }),
    );
    process.stdout.write(
      `\r  descargando ${Math.min(i + CONCURRENCIA, rutas.length)}/${rutas.length}`,
    );
  }
  process.stdout.write("\r".padEnd(40) + "\r");
  return mapa;
}

async function main(): Promise<number> {
  console.log(`\n===== QA: ${BASE} =====`);

  const todas = await rutasDelSitemap();
  const rutas = MAX > 0 ? todas.slice(0, MAX) : todas;
  console.log(`URLs en el sitemap : ${todas.length}${MAX ? ` (se revisan ${rutas.length})` : ""}`);

  const descargas = await descargar(rutas);

  const rutasVivas = new Set(
    [...descargas.entries()].filter(([, v]) => v.estado === 200).map(([k]) => k),
  );

  const ctx: Contexto = { base: BASE, enSitemap: new Set(todas), rutasVivas };

  const resultados: Resultado[] = [];
  for (const [ruta, { estado, html }] of descargas) {
    const pagina = { ruta, estado, html };
    resultados.push({
      ruta,
      estado,
      html,
      hallazgos: [...analizarPagina(pagina, ctx), ...enlacesRotos(pagina, ctx)],
    });
  }

  // --- Informe --------------------------------------------------------------
  const errores = resultados.flatMap((r) =>
    r.hallazgos.filter((x) => x.gravedad === "error").map((x) => ({ ruta: r.ruta, ...x })),
  );
  const avisos = resultados.flatMap((r) =>
    r.hallazgos.filter((x) => x.gravedad === "aviso").map((x) => ({ ruta: r.ruta, ...x })),
  );

  const porCriterio = (lista: { criterio: string }[]) => {
    const m = new Map<string, number>();
    for (const x of lista) m.set(x.criterio, (m.get(x.criterio) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  console.log(`Revisadas          : ${resultados.length}`);
  console.log(`  sin hallazgos    : ${resultados.filter((r) => r.hallazgos.length === 0).length}`);
  console.log(`ERRORES            : ${errores.length}`);
  console.log(`AVISOS             : ${avisos.length}`);

  if (errores.length > 0) {
    console.log("\n--- ERRORES por criterio ---");
    porCriterio(errores).forEach(([c, n]) => console.log(`  ${String(n).padStart(4)}  ${c}`));
    console.log("\n--- Detalle (primeros 25) ---");
    errores
      .slice(0, 25)
      .forEach((e) => console.error(`  ✗ [${e.criterio}] ${e.ruta}\n      ${e.detalle}`));
    if (errores.length > 25) console.error(`  … y ${errores.length - 25} más`);
  }

  if (avisos.length > 0) {
    console.log("\n--- AVISOS por criterio ---");
    porCriterio(avisos).forEach(([c, n]) => console.log(`  ${String(n).padStart(4)}  ${c}`));
    const ejemplos = new Map<string, string>();
    for (const a of avisos)
      if (!ejemplos.has(a.criterio)) ejemplos.set(a.criterio, `${a.ruta} — ${a.detalle}`);
    console.log("\n--- Un ejemplo de cada uno ---");
    for (const [c, ej] of ejemplos) console.log(`  ⚠ [${c}] ${ej}`);
  }

  console.log(`\n${errores.length === 0 ? "✓ SIN ERRORES" : "✗ HAY ERRORES"}`);
  console.log("=".repeat(40) + "\n");

  return errores.length > 0 ? 1 : 0;
}

try {
  process.exit(await main());
} catch (error) {
  console.error("✗ QA abortado:");
  console.error(error);
  process.exit(1);
}
