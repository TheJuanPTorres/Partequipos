/**
 * Análisis de una página servida: SEO estructural y accesibilidad básica.
 *
 * Función PURA sobre el HTML ya descargado. Separarla del script que hace las
 * peticiones permite probar cada criterio con un HTML de tres líneas, en vez de
 * levantar el sitio entero para comprobar que el detector de `h1` funciona.
 *
 * Se usan expresiones regulares y no un parser de DOM a propósito: meter una
 * dependencia nueva necesita aprobación (CLAUDE.md §2), y lo que se comprueba
 * aquí —presencia y unicidad de etiquetas concretas— no requiere un árbol.
 * La limitación está asumida: no valida HTML mal formado, solo lo que buscamos.
 */

export type Gravedad = "error" | "aviso";

export type Hallazgo = {
  gravedad: Gravedad;
  criterio: string;
  detalle: string;
};

export type Pagina = {
  /** Ruta con la que se pidió, empezando por `/`. */
  ruta: string;
  estado: number;
  html: string;
};

export type Contexto = {
  /** Base absoluta esperada en `canonical` y en el sitemap. */
  base: string;
  /** Rutas que anuncia el sitemap, normalizadas con barra final. */
  enSitemap: Set<string>;
  /** Rutas que respondieron 200 en este recorrido. */
  rutasVivas: Set<string>;
};

// --- Extractores -------------------------------------------------------------

const sinScripts = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, "");

export function extraerEtiquetas(html: string, etiqueta: string): string[] {
  const re = new RegExp(`<${etiqueta}\\b[^>]*>([\\s\\S]*?)</${etiqueta}>`, "gi");
  return [...html.matchAll(re)].map((m) => m[1] ?? "");
}

export function extraerAtributo(fragmento: string, atributo: string): string | null {
  const m = fragmento.match(new RegExp(`\\b${atributo}\\s*=\\s*"([^"]*)"`, "i"));
  return m?.[1] ?? null;
}

function contenidoMeta(html: string, nombre: string): string | null {
  const re = new RegExp(`<meta[^>]*\\bname\\s*=\\s*"${nombre}"[^>]*>`, "i");
  const etiqueta = html.match(re)?.[0];
  return etiqueta ? extraerAtributo(etiqueta, "content") : null;
}

function canonical(html: string): string | null {
  const etiqueta = html.match(/<link[^>]*\brel\s*=\s*"canonical"[^>]*>/i)?.[0];
  return etiqueta ? extraerAtributo(etiqueta, "href") : null;
}

/** Bloques JSON-LD ya parseados. Devuelve también los que no parsean. */
export function extraerJsonLd(html: string): { ok: unknown[]; rotos: string[] } {
  const ok: unknown[] = [];
  const rotos: string[] = [];

  const re = /<script[^>]*type\s*=\s*"application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    const crudo = m[1] ?? "";
    try {
      const datos = JSON.parse(crudo);
      if (Array.isArray(datos)) ok.push(...datos);
      else ok.push(datos);
    } catch {
      rotos.push(crudo.slice(0, 60));
    }
  }
  return { ok, rotos };
}

/** Normaliza a ruta con barra final, que es la forma canónica del sitio. */
export function conBarra(ruta: string): string {
  if (!ruta) return "/";
  const limpia = ruta.split("?")[0]?.split("#")[0] ?? "";
  if (limpia === "" || limpia === "/") return "/";
  return limpia.endsWith("/") ? limpia : `${limpia}/`;
}

/** Enlaces internos de la página, como rutas normalizadas. */
export function enlacesInternos(html: string, base: string): string[] {
  const rutas = new Set<string>();

  for (const m of sinScripts(html).matchAll(/<a\b[^>]*\bhref\s*=\s*"([^"]*)"/gi)) {
    const href = (m[1] ?? "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }
    if (/^https?:\/\//i.test(href)) {
      if (!href.startsWith(base)) continue; // externo: no es cosa nuestra
      // `base` ya termina en barra, así que el resto viene sin la inicial.
      const resto = href.slice(base.length);
      rutas.add(conBarra(resto ? `/${resto}` : "/"));
      continue;
    }
    if (href.startsWith("/")) rutas.add(conBarra(href));
  }

  return [...rutas];
}

/** Tipo de JSON-LD que se espera según la ruta. `null` = no se exige ninguno. */
export function tipoJsonLdEsperado(ruta: string): string | null {
  const partes = conBarra(ruta).split("/").filter(Boolean);

  if (partes.length === 0) return null; // portada
  if (partes[0] === "repuestos-maquinaria-pesada-colombia" && partes.length === 5) return "Product";
  if (partes[0] === "maquinaria-pesada" && partes.length === 6) return "Product";
  return "BreadcrumbList";
}

// --- Análisis ----------------------------------------------------------------

export function analizarPagina(pagina: Pagina, ctx: Contexto): Hallazgo[] {
  const h: Hallazgo[] = [];
  const err = (criterio: string, detalle: string) =>
    h.push({ gravedad: "error", criterio, detalle });
  const avi = (criterio: string, detalle: string) =>
    h.push({ gravedad: "aviso", criterio, detalle });

  const { ruta, estado, html } = pagina;

  if (estado !== 200) {
    err("http", `respondió ${estado}`);
    return h; // sin cuerpo útil, el resto no aplica
  }

  // --- h1 --------------------------------------------------------------------
  const h1s = extraerEtiquetas(html, "h1");
  if (h1s.length === 0) err("h1", "no hay ningún <h1>");
  else if (h1s.length > 1) err("h1", `hay ${h1s.length} <h1>, debe haber exactamente uno`);

  // --- title y meta description ---------------------------------------------
  const title = extraerEtiquetas(html, "title")[0]?.trim() ?? "";
  if (!title) err("title", "vacío o ausente");
  else if (title.length > 70) avi("title", `${title.length} caracteres (se corta hacia los 60)`);

  const desc = contenidoMeta(html, "description")?.trim() ?? "";
  if (!desc) err("meta-description", "vacía o ausente");
  else if (desc.length > 165) avi("meta-description", `${desc.length} caracteres`);

  // --- canonical -------------------------------------------------------------
  const canon = canonical(html);
  if (!canon) {
    err("canonical", "ausente");
  } else {
    const esperado = `${ctx.base}${conBarra(ruta).slice(1)}`;
    if (canon !== esperado) err("canonical", `apunta a ${canon}, se esperaba ${esperado}`);
  }

  // --- JSON-LD ---------------------------------------------------------------
  const { ok: bloques, rotos } = extraerJsonLd(html);
  for (const r of rotos) err("json-ld", `bloque que no parsea: ${r}…`);

  const esperado = tipoJsonLdEsperado(ruta);
  if (esperado) {
    const tipos = bloques.map((b) => (b as { "@type"?: string })["@type"]);
    if (!tipos.includes(esperado)) {
      err("json-ld", `falta un bloque @type="${esperado}" (hay: ${tipos.join(", ") || "ninguno"})`);
    }
  }
  for (const b of bloques) {
    const obj = b as Record<string, unknown>;
    if (!obj["@context"]) err("json-ld", `bloque @type="${obj["@type"]}" sin @context`);
  }

  // --- imágenes --------------------------------------------------------------
  const imgs = [...sinScripts(html).matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  imgs.forEach((img, i) => {
    const alt = extraerAtributo(img, "alt");
    if (alt === null) err("alt", `la imagen ${i + 1} no tiene atributo alt`);
    const w = extraerAtributo(img, "width");
    const hh = extraerAtributo(img, "height");
    if (!w || !hh) avi("dimensiones", `la imagen ${i + 1} no declara width/height (provoca CLS)`);
  });

  // --- accesibilidad estructural ---------------------------------------------
  if (!/<html[^>]*\blang\s*=/i.test(html)) err("lang", "el <html> no declara idioma");
  if (!/<main\b/i.test(html)) err("landmark", "no hay <main>");

  /*
   * Salto de nivel de encabezado (h1 -> h3 sin h2). No rompe nada visualmente,
   * pero rompe el esquema del documento para quien navega con lector.
   */
  const niveles = [...sinScripts(html).matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  for (let i = 1; i < niveles.length; i++) {
    const anterior = niveles[i - 1] ?? 0;
    const actual = niveles[i] ?? 0;
    if (actual > anterior + 1) {
      avi("encabezados", `salto de h${anterior} a h${actual}`);
      break;
    }
  }

  // --- sitemap ---------------------------------------------------------------
  const normal = conBarra(ruta);
  if (!ctx.enSitemap.has(normal)) {
    avi("sitemap", "la URL responde 200 pero no está en el sitemap");
  }

  return h;
}

/** Enlaces internos que apuntan a rutas que no respondieron 200. */
export function enlacesRotos(pagina: Pagina, ctx: Contexto): Hallazgo[] {
  if (pagina.estado !== 200) return [];

  return enlacesInternos(pagina.html, ctx.base)
    .filter((destino) => !ctx.rutasVivas.has(destino))
    .map((destino) => ({
      gravedad: "error" as const,
      criterio: "enlace-roto",
      detalle: `enlaza a ${destino}, que no responde 200`,
    }));
}
