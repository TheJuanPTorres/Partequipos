/**
 * Rastreador de URLs de partequipos.com (herramienta interna, no parte de la app).
 *
 * Uso:  npm run crawl
 *
 * Buen ciudadano (obligatorio):
 * - Respeta robots.txt (si una ruta está Disallow para nuestro UA, no se rastrea).
 * - Concurrencia baja (3) y pausa ~500ms entre peticiones por worker.
 * - User-Agent identificable y honesto. Solo GET. Solo el dominio partequipos.com.
 * - No sigue enlaces externos, no envía formularios, no toca /wp-admin.
 *
 * Estrategia:
 * - Fuente principal = sitemaps (Yoast/RankMath). Más fiable y menos invasivo que
 *   rastrear enlaces. Se descubre desde robots.txt -> sitemap index -> sub-sitemaps.
 * - Progreso incremental: cada resultado se anexa a progress.jsonl. Si el proceso
 *   se corta, al reejecutar se saltan las URLs ya hechas (resumible).
 * - Reintentos: hasta 2 ante fallos de red, con espera.
 *
 * Salidas (en docs/):
 *   A) url-map.csv              — una fila por URL con metadatos SEO
 *   B) inventario-repuestos.csv — jerarquía marca/tipo/modelo extraída de las URLs
 *   C) crawl-reporte.md         — totales, conteos, deuda SEO, patrones raros
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://partequipos.com";
const HOST = "partequipos.com";
const UA =
  "PartequiposMigrationBot/1.0 (+inventario de migracion propia; contacto: jpesitotorres@gmail.com)";
const CONCURRENCY = 3;
const DELAY_MS = 500;
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 30000;

const dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(dirname, "../../docs");
const progressFile = path.join(dirname, "progress.jsonl");

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type Seccion = "corporativo" | "maquinaria" | "repuestos" | "blog" | "otro";
type TipoInferido = "marca" | "tipo" | "modelo" | "categoria" | "institucional" | "desconocido";

type CrawlResult = {
  url: string;
  status: number; // 0 = fallo de red tras reintentos
  title: string;
  metaDescription: string;
  h1: string;
  canonical: string;
  redirectTo: string; // si status 3xx, destino del Location
  depth: number;
  seccion: Seccion;
  tipoInferido: TipoInferido;
  error: string;
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .trim();
}

function clean(s: string | undefined): string {
  return decodeEntities((s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}

async function fetchText(
  url: string,
  redirect: "follow" | "manual",
): Promise<{ status: number; body: string; location: string }> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect,
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/xml" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const location = res.headers.get("location") ?? "";
      // Solo leemos el cuerpo si es 2xx (no descargamos binarios ni cuerpos de error grandes).
      const body = res.status >= 200 && res.status < 300 ? await res.text() : "";
      return { status: res.status, body, location };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < MAX_RETRIES) await sleep(1000 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------
async function loadDisallows(): Promise<string[]> {
  const { status, body } = await fetchText(`${BASE}/robots.txt`, "follow");
  if (status !== 200) return [];
  const disallows: string[] = [];
  let appliesToUs = false;
  for (const rawLine of body.split("\n")) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = (rawKey ?? "").toLowerCase().trim();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      // Nuestro bot cae bajo el grupo "*".
      appliesToUs = value === "*";
    } else if (key === "disallow" && appliesToUs && value.length > 0) {
      disallows.push(value);
    }
  }
  return disallows;
}

function isAllowed(url: string, disallows: string[]): boolean {
  const p = new URL(url).pathname;
  return !disallows.some((d) => p.startsWith(d));
}

// ---------------------------------------------------------------------------
// Sitemaps
// ---------------------------------------------------------------------------
function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const loc = decodeEntities((m[1] ?? "").trim());
    if (loc) locs.push(loc);
  }
  return locs;
}

async function collectSitemapUrls(): Promise<string[]> {
  const { body } = await fetchText(`${BASE}/sitemap_index.xml`, "follow");
  const subSitemaps = extractLocs(body).filter((u) => u.endsWith(".xml"));
  console.log(`Sitemap index: ${subSitemaps.length} sub-sitemaps`);

  const urls = new Set<string>();
  for (const sm of subSitemaps) {
    const { body: smBody } = await fetchText(sm, "follow");
    const locs = extractLocs(smBody).filter((u) => !u.endsWith(".xml"));
    locs.forEach((u) => urls.add(u));
    console.log(`  ${sm.replace(BASE, "")}: ${locs.length} URLs`);
    await sleep(DELAY_MS);
  }
  return [...urls];
}

// ---------------------------------------------------------------------------
// Clasificación de URLs
// ---------------------------------------------------------------------------
const REPUESTOS_ROOT = "repuestos-maquinaria-pesada-colombia";
const MARCAS_SEG = "repuestos-maquinaria-pesada-marcas";
const CATEGORIA_SEG = "categoria-repuestos-para-maquinaria-pesada";

function segmentsOf(url: string): string[] {
  return new URL(url).pathname.split("/").filter(Boolean);
}

function inferSeccion(url: string, fromBlog: boolean): Seccion {
  const segs = segmentsOf(url);
  if (segs.length === 0) return "corporativo"; // home
  if (segs[0] === REPUESTOS_ROOT) return "repuestos";
  if (segs[0] === "maquinaria-pesada") return "maquinaria";
  if (fromBlog) return "blog";
  // Páginas de un solo segmento o secciones institucionales conocidas.
  const institucional = ["nosotros", "contacto", "blog", "servicios", "servicio-tecnico"];
  if (segs.length <= 1 || institucional.includes(segs[0] ?? "")) return "corporativo";
  return "otro";
}

function inferTipo(url: string, seccion: Seccion): TipoInferido {
  const segs = segmentsOf(url);

  if (seccion === "repuestos") {
    const i = segs.indexOf(MARCAS_SEG);
    if (i >= 0) {
      const depth = segs.length - (i + 1); // segmentos después de "marcas"
      if (depth === 1) return "marca";
      if (depth === 2) return "tipo";
      if (depth >= 3) return "modelo";
    }
    if (segs.includes(CATEGORIA_SEG)) return "categoria";
    return "institucional"; // páginas raíz/intermedias de la sección repuestos
  }

  if (seccion === "maquinaria") {
    // Estructura análoga: .../marcas/{marca}/{tipo}/{modelo}
    const i = segs.indexOf("marcas");
    if (i >= 0) {
      const depth = segs.length - (i + 1);
      if (depth === 1) return "marca";
      if (depth === 2) return "tipo";
      if (depth >= 3) return "modelo";
    }
    return "institucional";
  }

  if (seccion === "blog" || seccion === "corporativo") return "institucional";
  return "desconocido";
}

// Nombres legibles derivados de los slugs (mejor esfuerzo; el nombre "real" del
// modelo se toma del <h1> durante el rastreo cuando está disponible).
function titleize(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function marcaNameFromSlug(slug: string): string {
  return titleize(slug.replace(/^repuestos-para-maquinaria-pesada-/, ""));
}

function tipoNameFromSlug(slug: string, marcaSlug: string): string {
  const marcaToken = marcaSlug.replace(/^repuestos-para-maquinaria-pesada-/, "");
  const base = slug
    .replace(/^repuestos-para-maquinaria-pesada-/, "")
    .replace(new RegExp(`-${marcaToken}$`), "");
  return titleize(base);
}

// ---------------------------------------------------------------------------
// Extracción de campos SEO del HTML
// ---------------------------------------------------------------------------
function extractField(html: string, result: CrawlResult): void {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  result.title = clean(title?.[1]);

  // meta description: buscar la etiqueta <meta> que contenga name="description".
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    if (/name\s*=\s*["']description["']/i.test(tag)) {
      const content = /content\s*=\s*["']([\s\S]*?)["']/i.exec(tag);
      if (content) result.metaDescription = clean(content[1]);
      break;
    }
  }

  const canonical = /<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i.exec(html);
  if (canonical) {
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(canonical[0]);
    if (href) result.canonical = decodeEntities((href[1] ?? "").trim());
  }

  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  result.h1 = clean(h1?.[1]);
}

// ---------------------------------------------------------------------------
// Rastreo con pool de concurrencia
// ---------------------------------------------------------------------------
async function crawlOne(url: string, blogSet: Set<string>): Promise<CrawlResult> {
  const seccion = inferSeccion(url, blogSet.has(url));
  const result: CrawlResult = {
    url,
    status: 0,
    title: "",
    metaDescription: "",
    h1: "",
    canonical: "",
    redirectTo: "",
    depth: segmentsOf(url).length,
    seccion,
    tipoInferido: inferTipo(url, seccion),
    error: "",
  };

  try {
    const { status, body, location } = await fetchText(url, "manual");
    result.status = status;
    if (status >= 300 && status < 400) {
      result.redirectTo = location;
    } else if (status >= 200 && status < 300) {
      extractField(body, result);
    }
  } catch (err) {
    result.status = 0;
    result.error = err instanceof Error ? err.message : String(err);
  }
  return result;
}

async function runPool(
  urls: string[],
  blogSet: Set<string>,
  onResult: (r: CrawlResult) => void,
): Promise<void> {
  let idx = 0;
  let done = 0;
  const total = urls.length;

  async function worker(): Promise<void> {
    while (idx < urls.length) {
      const myIdx = idx++;
      const url = urls[myIdx];
      if (!url) continue;
      const result = await crawlOne(url, blogSet);
      onResult(result);
      done++;
      if (done % 25 === 0 || done === total) {
        console.log(`  progreso: ${done}/${total} (${Math.round((done / total) * 100)}%)`);
      }
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
}

// ---------------------------------------------------------------------------
// CSV / reporte
// ---------------------------------------------------------------------------
function csvCell(v: string | number): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}
function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

function writeUrlMap(results: CrawlResult[]): void {
  const header = [
    "url",
    "status_http",
    "title",
    "meta_description",
    "h1",
    "canonical",
    "profundidad",
    "seccion",
    "tipo_inferido",
  ];
  const rows = results.map((r) =>
    csvRow([
      r.url,
      r.status,
      r.title,
      r.metaDescription,
      r.h1,
      r.canonical,
      r.depth,
      r.seccion,
      r.tipoInferido,
    ]),
  );
  fs.writeFileSync(path.join(outDir, "url-map.csv"), [csvRow(header), ...rows].join("\n") + "\n");
}

type InventarioRow = {
  marca: string;
  marcaSlug: string;
  tipo: string;
  tipoSlug: string;
  modelo: string;
  modeloSlug: string;
  url: string;
};

function buildInventario(results: CrawlResult[]): InventarioRow[] {
  const rows: InventarioRow[] = [];
  for (const r of results) {
    if (r.seccion !== "repuestos" || r.tipoInferido !== "modelo") continue;
    const segs = segmentsOf(r.url);
    const i = segs.indexOf(MARCAS_SEG);
    if (i < 0) continue;
    const marcaSlug = segs[i + 1] ?? "";
    const tipoSlug = segs[i + 2] ?? "";
    const modeloSlug = segs[i + 3] ?? "";
    if (!marcaSlug || !tipoSlug || !modeloSlug) continue;
    rows.push({
      marca: marcaNameFromSlug(marcaSlug),
      marcaSlug,
      tipo: tipoNameFromSlug(tipoSlug, marcaSlug),
      tipoSlug,
      modelo: r.h1 || titleize(modeloSlug),
      modeloSlug,
      url: r.url,
    });
  }
  return rows;
}

function writeInventario(rows: InventarioRow[]): void {
  const header = [
    "marca",
    "marca_slug",
    "tipo",
    "tipo_slug",
    "modelo",
    "modelo_slug",
    "url_completa",
  ];
  const body = rows.map((r) =>
    csvRow([r.marca, r.marcaSlug, r.tipo, r.tipoSlug, r.modelo, r.modeloSlug, r.url]),
  );
  fs.writeFileSync(
    path.join(outDir, "inventario-repuestos.csv"),
    [csvRow(header), ...body].join("\n") + "\n",
  );
}

function writeReporte(results: CrawlResult[], inventario: InventarioRow[]): void {
  const total = results.length;
  const bySeccion = new Map<string, number>();
  results.forEach((r) => bySeccion.set(r.seccion, (bySeccion.get(r.seccion) ?? 0) + 1));

  const errores = results.filter((r) => r.status === 0 || r.status >= 400);
  const redirects = results.filter((r) => r.status >= 300 && r.status < 400);
  const ok = results.filter((r) => r.status >= 200 && r.status < 300);
  const sinTitle = ok.filter((r) => !r.title);
  const sinDesc = ok.filter((r) => !r.metaDescription);
  const sinH1 = ok.filter((r) => !r.h1);

  // Conteo de modelos por marca (repuestos), excluyendo duplicados "-copy".
  const modelosPorMarca = new Map<string, number>();
  const copias: string[] = [];
  for (const r of inventario) {
    if (/-copy$/.test(r.modeloSlug)) {
      copias.push(r.url);
      continue;
    }
    modelosPorMarca.set(r.marca, (modelosPorMarca.get(r.marca) ?? 0) + 1);
  }

  // Patrones que no encajan en la jerarquía conocida.
  const rarezas = results.filter((r) => r.seccion === "otro" || r.tipoInferido === "desconocido");

  const l: string[] = [];
  l.push("# Reporte de rastreo — partequipos.com");
  l.push("");
  l.push(`Generado: ${new Date().toISOString()}`);
  l.push(`Fuente: sitemaps (Yoast/RankMath) declarados en robots.txt.`);
  l.push("");
  l.push("## 1. Totales");
  l.push("");
  l.push(`- **URLs rastreadas:** ${total}`);
  l.push(
    `- OK (2xx): ${ok.length} · Redirecciones (3xx): ${redirects.length} · Errores (4xx/5xx/red): ${errores.length}`,
  );
  l.push("");
  l.push("### Por sección");
  l.push("");
  l.push("| Sección | URLs |");
  l.push("| --- | ---: |");
  [...bySeccion.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([s, n]) => l.push(`| ${s} | ${n} |`));
  l.push("");
  l.push("## 2. Conteo de modelos por marca (repuestos)");
  l.push("");
  l.push("> Reconciliación del inventario real. Excluye duplicados con sufijo `-copy`.");
  l.push("");
  l.push("| Marca | Modelos |");
  l.push("| --- | ---: |");
  [...modelosPorMarca.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([m, n]) => l.push(`| ${m} | ${n} |`));
  l.push(`| **Total** | **${[...modelosPorMarca.values()].reduce((a, b) => a + b, 0)}** |`);
  l.push("");
  l.push("## 3. URLs con error o redirección");
  l.push("");
  l.push(`- **Errores (4xx/5xx/red):** ${errores.length}`);
  errores
    .slice(0, 50)
    .forEach((r) => l.push(`  - \`${r.status}\` ${r.url}${r.error ? ` — ${r.error}` : ""}`));
  l.push(`- **Redirecciones existentes (3xx):** ${redirects.length}`);
  redirects.slice(0, 50).forEach((r) => l.push(`  - \`${r.status}\` ${r.url} → ${r.redirectTo}`));
  l.push("");
  l.push("## 4. Deuda SEO actual (páginas 2xx)");
  l.push("");
  l.push(`- Sin \`<title>\`: ${sinTitle.length}`);
  l.push(`- Sin meta description: ${sinDesc.length}`);
  l.push(`- Sin \`<h1>\`: ${sinH1.length}`);
  if (sinDesc.length > 0) {
    l.push("");
    l.push("<details><summary>Ejemplos sin meta description</summary>");
    l.push("");
    sinDesc.slice(0, 20).forEach((r) => l.push(`- ${r.url}`));
    l.push("");
    l.push("</details>");
  }
  l.push("");
  l.push("## 5. Patrones fuera de la jerarquía conocida");
  l.push("");
  l.push(`- Duplicados con sufijo \`-copy\`: ${copias.length}`);
  copias.slice(0, 30).forEach((u) => l.push(`  - ${u}`));
  l.push(`- Secciones/tipos no clasificados: ${rarezas.length}`);
  rarezas.slice(0, 30).forEach((r) => l.push(`  - (${r.seccion}/${r.tipoInferido}) ${r.url}`));
  l.push("");

  fs.writeFileSync(path.join(outDir, "crawl-reporte.md"), l.join("\n") + "\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });

  console.log("1) robots.txt");
  const disallows = await loadDisallows();
  console.log(`   Disallow para "*": ${disallows.length ? disallows.join(", ") : "(ninguno)"}`);

  console.log("2) Descubriendo URLs desde sitemaps…");
  const blogUrls = new Set<string>();
  const { body: idxBody } = await fetchText(`${BASE}/sitemap_index.xml`, "follow");
  const postSitemap = extractLocs(idxBody).find((u) => /post-sitemap/.test(u));
  if (postSitemap) {
    const { body } = await fetchText(postSitemap, "follow");
    extractLocs(body)
      .filter((u) => !u.endsWith(".xml"))
      .forEach((u) => blogUrls.add(u));
    await sleep(DELAY_MS);
  }

  let allUrls = (await collectSitemapUrls())
    .filter((u) => new URL(u).host === HOST) // solo el dominio objetivo
    .filter((u) => isAllowed(u, disallows)); // respeta robots.txt
  allUrls = [...new Set(allUrls)].sort();
  console.log(`   Total de URLs a rastrear: ${allUrls.length}`);

  // Progreso incremental / resumible.
  const doneUrls = new Set<string>();
  const collected: CrawlResult[] = [];
  if (fs.existsSync(progressFile)) {
    for (const line of fs.readFileSync(progressFile, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line) as CrawlResult;
        doneUrls.add(r.url);
        collected.push(r);
      } catch {
        /* línea corrupta: se ignora */
      }
    }
    console.log(`   Reanudando: ${doneUrls.size} URLs ya rastreadas se saltan.`);
  }

  const pending = allUrls.filter((u) => !doneUrls.has(u));
  console.log(
    `3) Rastreando ${pending.length} URLs (concurrencia ${CONCURRENCY}, pausa ${DELAY_MS}ms)…`,
  );

  const stream = fs.createWriteStream(progressFile, { flags: "a" });
  await runPool(pending, blogUrls, (r) => {
    collected.push(r);
    stream.write(JSON.stringify(r) + "\n");
  });
  stream.end();

  console.log("4) Generando salidas…");
  collected.sort((a, b) => a.url.localeCompare(b.url));
  const inventario = buildInventario(collected);
  writeUrlMap(collected);
  writeInventario(inventario);
  writeReporte(collected, inventario);

  console.log(`   docs/url-map.csv              (${collected.length} filas)`);
  console.log(`   docs/inventario-repuestos.csv (${inventario.length} filas)`);
  console.log(`   docs/crawl-reporte.md`);
  console.log("Listo.");
}

try {
  await main();
  process.exit(0);
} catch (err) {
  console.error("Rastreo abortado por un error no controlado:");
  console.error(err);
  process.exit(1);
}
