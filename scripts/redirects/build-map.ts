/**
 * Genera el mapa de redirects 301 de la migración a partir del rastreo del
 * sitio actual (herramienta interna, no forma parte de la aplicación).
 *
 * Uso:  npm run redirects:map
 *
 * Entrada:  docs/url-map.csv            (648 URLs vivas, salida de `npm run crawl`)
 * Salidas:  docs/redirects-map.csv      (desde, hacia, tipo, origen, confianza, notas)
 *           docs/redirects-cobertura.md (informe de cobertura y huérfanas)
 *
 * PRINCIPIO RECTOR: no se inventan destinos. Si una URL no tiene equivalente
 * demostrable en la estructura nueva, se marca como HUÉRFANA y se deja para
 * decisión humana. Un redirect mal puesto es peor que un 404: manda a Google a
 * una página que no responde a la intención de búsqueda original.
 *
 * Es reejecutable: sobrescribe las salidas y no depende de estado previo, así
 * que si el crawl se actualiza basta con volver a lanzarlo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SEGMENTO_MARCAS, SEGMENTO_REPUESTOS } from "../../src/lib/routes";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(dirname, "../../docs");

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      record.push(field);
      field = "";
    } else if (ch === "\n") {
      record.push(field);
      rows.push(record);
      record = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    rows.push(record);
  }

  const header = rows.shift();
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      keys.forEach((k, i) => (obj[k] = (r[i] ?? "").trim()));
      return obj;
    });
}

const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const csvRow = (cells: (string | number)[]) => cells.map(esc).join(",");

// ---------------------------------------------------------------------------
// Estructura NUEVA: qué rutas existen realmente hoy
// ---------------------------------------------------------------------------
/**
 * Devuelve true si la ruta existe en la estructura nueva. Se valida contra los
 * patrones de ruta realmente construidos (`src/app/(site)`), no contra datos:
 * la base de producción está vacía, así que comprobar contra ella daría un
 * falso negativo en todo el catálogo.
 */
function existeEnEstructuraNueva(segs: string[]): boolean {
  if (segs.length === 0) return true; // home
  if (segs[0] !== SEGMENTO_REPUESTOS) return false; // solo migramos repuestos

  if (segs.length === 1) return true; // índice de repuestos
  if (segs[1] !== SEGMENTO_MARCAS) return false; // categorías u otras ramas: no construidas

  // marcas · marcas/{marca} · marcas/{marca}/{tipo} · marcas/{marca}/{tipo}/{modelo}
  return segs.length >= 2 && segs.length <= 5;
}

/** Ruta canónica en el sitio nuevo (sin barra final). */
const aRuta = (segs: string[]) => "/" + segs.join("/");

// ---------------------------------------------------------------------------
// Clasificación
// ---------------------------------------------------------------------------
type Confianza = "alta" | "media" | "baja";

type Fila = {
  desde: string;
  hacia: string;
  tipo: string;
  origen: string;
  confianza: Confianza;
  notas: string;
  seccion: string;
  tipoInferido: string;
  /** true si la ruta se conserva idéntica y por tanto NO necesita redirect. */
  sinRedirect: boolean;
};

function main(): number {
  const mapPath = path.join(docsDir, "url-map.csv");
  if (!fs.existsSync(mapPath)) {
    console.error(`No existe ${mapPath}. Ejecuta antes: npm run crawl`);
    return 1;
  }

  const urls = parseCSV(fs.readFileSync(mapPath, "utf8"));
  console.log(`Leídas ${urls.length} URLs de docs/url-map.csv`);

  // Índice de rutas vivas del sitio actual, para resolver los duplicados "-copy".
  const rutasVivas = new Set(
    urls.map((r) => new URL(r.url ?? "").pathname.replace(/\/+$/, "") || "/"),
  );

  const filas: Fila[] = [];

  for (const row of urls) {
    const url = row.url ?? "";
    if (!url) continue;

    const pathname = new URL(url).pathname;
    const rutaSinBarra = pathname.replace(/\/+$/, "") || "/";
    const segs = rutaSinBarra.split("/").filter(Boolean);
    const seccion = row.seccion ?? "otro";
    const tipoInferido = row.tipo_inferido ?? "desconocido";

    const base: Omit<Fila, "hacia" | "confianza" | "notas" | "sinRedirect"> = {
      desde: rutaSinBarra,
      tipo: "301",
      origen: "migracion",
      seccion,
      tipoInferido,
    };

    /*
     * --- Duplicados "-copy": borradores publicados por error (ADR 0004) -----
     * NO se migran, así que su URL dejará de existir aunque encaje en la
     * estructura nueva: nunca pueden clasificarse como "ruta conservada".
     *
     * Su gemelo canónico puede estar en OTRA rama (el duplicado se creó bajo un
     * tipo distinto del original), así que se busca por slug en todo el rastreo,
     * no solo en la misma ruta. Solo se propone destino si la coincidencia es
     * única: con dos candidatos no hay forma de elegir sin inventar.
     */
    if (/-copy$/.test(rutaSinBarra)) {
      const slugCanonico = (rutaSinBarra.split("/").pop() ?? "").replace(/-copy$/, "");
      const candidatos = [...rutasVivas].filter((p) => p.endsWith(`/${slugCanonico}`));

      if (candidatos.length === 1) {
        filas.push({
          ...base,
          hacia: candidatos[0] as string,
          confianza: "media",
          notas:
            "Duplicado '-copy' (borrador publicado por error, ADR 0004): no se migra. Su gemelo canónico existe y es único en el rastreo, así que el destino es demostrable.",
          sinRedirect: false,
        });
      } else {
        filas.push({
          ...base,
          hacia: "",
          confianza: "baja",
          notas: `HUÉRFANA: duplicado '-copy' que no se migra (ADR 0004) y ${
            candidatos.length === 0
              ? "sin gemelo canónico en el rastreo"
              : "con varios gemelos posibles"
          }. Requiere decisión humana.`,
          sinRedirect: false,
        });
      }
      continue;
    }

    // --- Ruta conservada: la jerarquía es intocable (CLAUDE.md §3.3) ---------
    if (existeEnEstructuraNueva(segs)) {
      filas.push({
        ...base,
        hacia: aRuta(segs),
        confianza: "alta",
        notas:
          "Ruta conservada idéntica en el sitio nuevo. NO necesita redirect (solo difiere la barra final).",
        sinRedirect: true,
      });
      continue;
    }

    // --- Sin equivalente demostrable: HUÉRFANA ------------------------------
    filas.push({
      ...base,
      hacia: "",
      confianza: "baja",
      notas: "HUÉRFANA: sin destino evidente en la estructura nueva. Requiere decisión humana.",
      sinRedirect: false,
    });
  }

  // --- Validaciones (criterio 5) -------------------------------------------
  const conDestino = filas.filter((f) => f.hacia && !f.sinRedirect);
  const mapa = new Map(conDestino.map((f) => [f.desde, f.hacia]));

  const bucles: string[] = [];
  const cadenas: string[] = [];
  const destinoInexistente: string[] = [];

  for (const f of conDestino) {
    if (f.desde === f.hacia) bucles.push(`${f.desde} → sí mismo`);
    if (mapa.has(f.hacia)) cadenas.push(`${f.desde} → ${f.hacia} → ${mapa.get(f.hacia)}`);

    const segsDestino = f.hacia.split("/").filter(Boolean);
    if (!existeEnEstructuraNueva(segsDestino)) destinoInexistente.push(`${f.desde} → ${f.hacia}`);
  }

  // Duplicados de origen: dos reglas para la misma URL.
  const vistos = new Map<string, number>();
  filas.forEach((f) => vistos.set(f.desde, (vistos.get(f.desde) ?? 0) + 1));
  const duplicados = [...vistos.entries()].filter(([, n]) => n > 1).map(([k]) => k);

  // --- Salida A: CSV --------------------------------------------------------
  const header = ["desde", "hacia", "tipo", "origen", "confianza", "notas"];
  const cuerpo = filas.map((f) =>
    csvRow([f.desde, f.hacia, f.tipo, f.origen, f.confianza, f.notas]),
  );
  fs.writeFileSync(
    path.join(docsDir, "redirects-map.csv"),
    [csvRow(header), ...cuerpo].join("\n") + "\n",
  );

  // --- Salida B: informe ----------------------------------------------------
  escribirInforme(filas, { bucles, cadenas, destinoInexistente, duplicados });

  const sinRedirect = filas.filter((f) => f.sinRedirect).length;
  const huerfanas = filas.filter((f) => f.confianza === "baja").length;
  console.log(`  docs/redirects-map.csv      (${filas.length} filas)`);
  console.log(`  docs/redirects-cobertura.md`);
  console.log(
    `Resumen: ${sinRedirect} conservadas · ${conDestino.length} con redirect · ${huerfanas} huérfanas`,
  );
  return 0;
}

function escribirInforme(
  filas: Fila[],
  val: { bucles: string[]; cadenas: string[]; destinoInexistente: string[]; duplicados: string[] },
): void {
  const total = filas.length;
  const conservadas = filas.filter((f) => f.sinRedirect);
  const conRedirect = filas.filter((f) => f.hacia && !f.sinRedirect);
  const huerfanas = filas.filter((f) => f.confianza === "baja");

  const porConfianza = (c: Confianza) => filas.filter((f) => f.confianza === c).length;

  // Huérfanas agrupadas por sección, y dentro por subrama (2.º segmento).
  const porSeccion = new Map<string, Fila[]>();
  for (const f of huerfanas) {
    const lista = porSeccion.get(f.seccion) ?? [];
    lista.push(f);
    porSeccion.set(f.seccion, lista);
  }

  const recomendacion: Record<string, string> = {
    repuestos:
      "**Construir las páginas de categorías técnicas.** La colección `CategoriaTecnica` ya está modelada (Sprint 1) pero no tiene rutas públicas. Son URLs del núcleo del negocio y con tráfico: redirigirlas al índice sería perder su posicionamiento específico. Si finalmente no se construyen, redirigir al índice de repuestos.",
    maquinaria:
      "**Fuera del alcance del MVP.** Decidir con el cliente: si la sección se migra en una fase posterior, mantener las URLs y no redirigir todavía; si no se migra, redirigir al índice de repuestos o a la home. No redirigir a repuestos por defecto: la intención de búsqueda (comprar maquinaria) no es la misma que repuestos.",
    blog: "**Requiere migración de contenido**, no solo de URLs (hallazgo del crawl: 51 artículos vivos). Cada artículo necesita su equivalente 1:1. Redirigir todo el blog a un índice destruiría el posicionamiento de long tail, que suele ser su mayor aporte.",
    corporativo:
      "**Páginas institucionales** (nosotros, contacto, políticas, etc.). Son pocas y de destino evidente una vez construidas: mapear 1:1 cuando existan. Varias son de cumplimiento legal (tratamiento de datos, garantías) y no deberían quedar en 404.",
    otro: "**Revisar caso por caso.** Incluye taxonomías de WordPress y la subsección de lubricantes ENI, que tienen estructura propia.",
  };

  const l: string[] = [];
  l.push("# Cobertura de redirects para la migración");
  l.push("");
  l.push(`Generado: ${new Date().toISOString()}`);
  l.push("");
  l.push("Fuente: `docs/url-map.csv` (rastreo propio del sitio en producción).");
  l.push("Salida: `docs/redirects-map.csv`. Regenerable con `npm run redirects:map`.");
  l.push("");
  l.push(
    "> **Nada de esto se ha cargado en Payload.** El mapa se valida primero; la carga es un paso aparte.",
  );
  l.push("");

  l.push("## 1. Resumen");
  l.push("");
  l.push("| Situación | URLs | % |");
  l.push("| --- | ---: | ---: |");
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)} %`;
  l.push(
    `| **Ruta conservada** (no necesita redirect) | ${conservadas.length} | ${pct(conservadas.length)} |`,
  );
  l.push(
    `| **Con destino propuesto** (necesita redirect) | ${conRedirect.length} | ${pct(conRedirect.length)} |`,
  );
  l.push(
    `| **Huérfanas** (sin destino, decisión humana) | ${huerfanas.length} | ${pct(huerfanas.length)} |`,
  );
  l.push(`| **Total rastreado** | **${total}** | 100 % |`);
  l.push("");
  l.push("### Por nivel de confianza");
  l.push("");
  l.push("| Confianza | URLs | Significado |");
  l.push("| --- | ---: | --- |");
  l.push(
    `| **alta** | ${porConfianza("alta")} | La ruta es idéntica en el sitio nuevo. Sin redirect. |`,
  );
  l.push(
    `| **media** | ${porConfianza("media")} | Transformación predecible y verificada contra el rastreo. |`,
  );
  l.push(
    `| **baja** | ${porConfianza("baja")} | Sin destino evidente. **Requiere decisión humana.** |`,
  );
  l.push("");

  l.push("## 2. Validaciones automáticas");
  l.push("");
  const v = (nombre: string, arr: string[]) => {
    l.push(`- **${nombre}:** ${arr.length === 0 ? "ninguno ✅" : `${arr.length} ⚠️`}`);
    arr.slice(0, 20).forEach((x) => l.push(`  - \`${x}\``));
  };
  v("Bucles (A → A)", val.bucles);
  v("Cadenas (A → B → C)", val.cadenas);
  v("Destinos que no existen en la estructura nueva", val.destinoInexistente);
  v("Orígenes duplicados (dos reglas para la misma URL)", val.duplicados);

  // Anomalía estructural: URLs del catálogo más profundas que Marca→Tipo→Modelo.
  const demasiadoProfundas = filas.filter(
    (f) =>
      f.seccion === "repuestos" &&
      f.desde.split("/").filter(Boolean).length > 5 &&
      f.desde.split("/").filter(Boolean)[1] === SEGMENTO_MARCAS,
  );
  l.push(
    `- **URLs de catálogo más profundas que el modelo Marca→Tipo→Modelo:** ${
      demasiadoProfundas.length === 0 ? "ninguna ✅" : `${demasiadoProfundas.length} ⚠️`
    }`,
  );
  demasiadoProfundas.forEach((f) => l.push(`  - \`${f.desde}\``));
  if (demasiadoProfundas.length > 0) {
    l.push("");
    l.push(
      "  Tienen **dos niveles de tipo anidados** (`…/cargador-frontal-…/excavadora-…/modelo`), algo que el modelo de datos no contempla. Se comprobó que el tipo interior **no existe** como rama propia en el rastreo, así que **no hay destino demostrable** y quedan como huérfanas. Es una anomalía de catalogación del sitio origen, del mismo tipo que el caso Bobcat del ADR 0004.",
    );
  }
  l.push("");

  l.push("## 3. URLs huérfanas por sección");
  l.push("");
  if (huerfanas.length === 0) {
    l.push("Ninguna. ✅");
  } else {
    const secciones = [...porSeccion.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [seccion, lista] of secciones) {
      l.push(`### ${seccion} — ${lista.length} URLs`);
      l.push("");
      l.push(`**Recomendación:** ${recomendacion[seccion] ?? "Revisar caso por caso."}`);
      l.push("");
      // Agrupa por subrama para que la lista sea legible.
      const porRama = new Map<string, string[]>();
      for (const f of lista) {
        const segs = f.desde.split("/").filter(Boolean);
        const rama = segs.slice(0, 2).join("/") || "(raíz)";
        const arr = porRama.get(rama) ?? [];
        arr.push(f.desde);
        porRama.set(rama, arr);
      }
      for (const [rama, rutas] of [...porRama.entries()].sort(
        (a, b) => b[1].length - a[1].length,
      )) {
        l.push(`<details><summary><code>/${rama}</code> — ${rutas.length} URLs</summary>`);
        l.push("");
        rutas.sort().forEach((r) => l.push(`- \`${r}\``));
        l.push("");
        l.push("</details>");
        l.push("");
      }
    }
  }

  l.push("## 4. Barra final — RESUELTO");
  l.push("");
  l.push(
    "Las **648** URLs del sitio actual terminan en `/`. Se activó **`trailingSlash: true`** (ADR 0006), así que el sitio nuevo sirve esas mismas rutas **con barra**: son **byte a byte idénticas** a las indexadas y ya no hay ningún 308 intermedio.",
  );
  l.push("");
  l.push(
    "Esto no cambia la clasificación de este informe —el mapeo siempre comparó rutas normalizadas—, pero sí su significado: las URLs marcadas como *ruta conservada* ahora se sirven **directamente con 200**, sin el salto extra que se pagaba antes en cada visita.",
  );
  l.push("");

  fs.writeFileSync(path.join(docsDir, "redirects-cobertura.md"), l.join("\n") + "\n");
}

try {
  process.exit(main());
} catch (err) {
  console.error("Generación del mapa abortada:");
  console.error(err);
  process.exit(1);
}
