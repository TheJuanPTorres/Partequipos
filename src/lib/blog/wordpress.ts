import { motivoAltFlojo } from "../media/altFlojo";

/**
 * Piezas PURAS del importador del blog desde el WordPress actual
 * (`scripts/blog/importar-wordpress.ts`). Sin red, sin Payload y sin DOM: lo
 * que se puede probar sin nada alrededor.
 */

/**
 * Firma de los artículos importados (decisión de dirección, 2026-10-06): en
 * WordPress todas dicen «Analista.Mercadeo». Se cambia por artículo en el
 * panel; en el JSON-LD, «Partequipos» es una `Organization`.
 */
export const FIRMA_POR_DEFECTO = "Partequipos";

/**
 * La API REST del WordPress de partequipos.com antepone a cada respuesta JSON
 * los `<style>` de Elementor de cada entrada (un plugin escribe en la salida).
 * Se lee desde el primer `[` o `{` que abre el JSON de verdad.
 */
export function extraerJsonWp(texto: string): unknown {
  const candidatos = [texto.indexOf('[{"'), texto.indexOf('{"'), texto.indexOf("[]")].filter(
    (i) => i >= 0,
  );
  if (candidatos.length === 0) throw new Error("la respuesta no contiene JSON");
  return JSON.parse(texto.slice(Math.min(...candidatos)));
}

const ENTIDADES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
  iexcl: "¡",
  iquest: "¿",
};

/** Decodifica las entidades HTML que usa WordPress (con nombre, decimales y hex). */
export function decodificarEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (todo, cuerpo: string) => {
    if (cuerpo[0] === "#") {
      const n =
        cuerpo[1] === "x" || cuerpo[1] === "X"
          ? parseInt(cuerpo.slice(2), 16)
          : parseInt(cuerpo.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : todo;
    }
    return ENTIDADES[cuerpo.toLowerCase()] ?? todo;
  });
}

/** Texto plano de un fragmento HTML: sin etiquetas, entidades decodificadas, espacios normalizados. */
export function textoPlano(html: string): string {
  return decodificarEntidades(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Entradilla desde el extracto de WordPress: texto plano, sin el «[…]» final. */
export function entradillaDeExtracto(html: string, max = 300): string {
  const t = textoPlano(html)
    .replace(/\s*\[(…|&hellip;|\.\.\.)\]\s*$/, "")
    .trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(" ")).trim()}…`;
}

/**
 * Corrige las URL de imagen rotas que hay en el contenido de WordPress (medido:
 * `https://partequipos.comquipos.com/partequipos/wp-content/…`, de una
 * migración antigua de dominio). Solo ese patrón; el resto, tal cual.
 */
export function urlImagenCorregida(src: string): { url: string; corregida: boolean } {
  const m = src.match(/^https?:\/\/partequipos\.com[a-z.]*\/partequipos\/(wp-content\/.+)$/i);
  if (m && !/^https:\/\/partequipos\.com\/wp-content\//.test(src)) {
    return { url: `https://partequipos.com/${m[1]}`, corregida: true };
  }
  return { url: src, corregida: false };
}

export type FormatoImagen = "jpeg" | "png" | "webp";

/**
 * Formato admitido por `Media` (JPEG, PNG o WebP, CLAUDE.md §10.28) según la
 * extensión de la URL; `null` si no se puede importar (AVIF, GIF, SVG…).
 * La comprobación de verdad, por contenido, la hace `Media` al subir.
 */
export function formatoPorExtension(url: string): FormatoImagen | null {
  const ext = (url.split(/[?#]/)[0]!.split(".").pop() ?? "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpeg";
  if (ext === "png") return "png";
  if (ext === "webp") return "webp";
  return null;
}

/** AVIF: `Media` no lo admite de entrada (§10.28); el importador lo convierte a WebP. */
export function esAvif(url: string): boolean {
  return /\.avif$/i.test(url.split(/[?#]/)[0]!);
}

/**
 * Nombre de fichero determinista para una imagen de WordPress:
 * `wp-AAAA-MM-<nombre original>`. Es lo que hace idempotente la importación:
 * antes de subir se busca en `Media` por este nombre.
 */
export function nombreDeFicheroWp(url: string): string {
  const ruta = new URL(url).pathname;
  const fecha = ruta.match(/\/uploads\/(\d{4})\/(\d{2})\//);
  const base = decodeURIComponent(ruta.split("/").pop() ?? "imagen")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^-+|-+$/g, "");
  return `wp-${fecha ? `${fecha[1]}-${fecha[2]}-` : ""}${base}`;
}

/**
 * ¿El fichero guardado en `Media` es la imagen de WordPress con este nombre
 * determinista? Desde la subida directa al Blob (§10.39) el almacén añade un
 * sufijo aleatorio (`wp-2024-05-foto-AbC123….jpg`), así que no basta con
 * comparar el nombre exacto.
 */
export function esMismaImagen(guardado: string, determinista: string): boolean {
  const punto = determinista.lastIndexOf(".");
  const raiz = determinista.slice(0, punto);
  const ext = determinista.slice(punto + 1);
  const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapar(raiz)}(-[A-Za-z0-9]{20,40})?\\.${escapar(ext)}$`, "i").test(
    guardado,
  );
}

/** Palabras que delatan una frase en español (para no usar títulos en inglés como alt). */
const PALABRAS_ES = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "para",
  "en",
  "y",
  "con",
  "por",
  "un",
  "una",
  "sus",
]);

/**
 * El TÍTULO o el PIE DE FOTO de la imagen en WordPress como texto alternativo,
 * solo si describe algo: al menos tres palabras, alguna en español, sin
 * identificadores sueltos (`IMG_0556`, `a0ce467c-…`, `Gemini_Generated_Image…`).
 * Medido el 2026-10-06: casi todos los títulos son el nombre del fichero; unos
 * pocos sí describen (`sistema-hidráulico-del-pistón…`).
 */
export function textoDescriptivo(bruto: string | null | undefined): string | null {
  const t = textoPlano(bruto ?? "")
    .replace(/\.(jpe?g|png|webp|avif|svg|gif)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+\d+x\d+$|\s+\d+$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  if (/[0-9a-f]{8}|gemini|^img|^images?|^dsc|^version/i.test(t)) return null;
  const palabras = t
    .toLowerCase()
    .split(" ")
    .filter((w) => /\p{L}{2,}/u.test(w));
  if (palabras.length < 3 || !palabras.some((w) => PALABRAS_ES.has(w))) return null;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export type OrigenAlt =
  "wordpress" | "pie de foto" | "título de la imagen" | "sección" | "respaldo";

/**
 * Texto alternativo para la `Media`, de mejor a peor fuente:
 *
 * 1. el `alt` de WordPress, si sirve (regla de `altFlojo`, #67);
 * 2. el pie de foto o el título de la imagen en WordPress, si describen algo;
 * 3. el encabezado de la sección del artículo donde va la imagen;
 * 4. uno de respaldo con el título del artículo.
 *
 * Los dos últimos empiezan por «Ilustración» y quedan MARCADOS para que el
 * editor los revise (se buscan así en «Imágenes»).
 */
export function altParaMedia(p: {
  altWp?: string | null;
  pieWp?: string | null;
  tituloWp?: string | null;
  seccion?: string | null;
  titulo: string;
  n: number;
  fichero: string;
}): { alt: string; origen: OrigenAlt; marcado: boolean } {
  const propio = textoPlano(p.altWp ?? "");
  if (!motivoAltFlojo(propio, p.fichero))
    return { alt: propio, origen: "wordpress", marcado: false };
  for (const [bruto, origen] of [
    [p.pieWp, "pie de foto"],
    [p.tituloWp, "título de la imagen"],
  ] as const) {
    const t = textoDescriptivo(bruto);
    if (t && !motivoAltFlojo(t, p.fichero)) return { alt: t, origen, marcado: false };
  }
  const seccion = textoPlano(p.seccion ?? "").replace(/[:.]+$/, "");
  if (seccion && seccion.length <= 120) {
    return {
      alt: `Ilustración de «${seccion}», en el artículo «${p.titulo}»`,
      origen: "sección",
      marcado: true,
    };
  }
  return {
    alt: `Ilustración del artículo «${p.titulo}»${p.n > 1 ? ` (${p.n})` : ""}`,
    origen: "respaldo",
    marcado: true,
  };
}

/** ¿Lo escribió el importador (y se puede rehacer), o ya lo tocó un editor? */
export const esAltGenerado = (alt: string | null | undefined) =>
  /^Ilustración (del artículo|de «)/.test(alt ?? "");

/**
 * Enlace interno del sitio actual → RUTA RELATIVA (las URL del sitio nuevo son
 * las mismas), sin codificar y con la barra final de las URL del sitio
 * (`trailingSlash`). Los enlaces a ficheros (`/wp-content/…`), a otros sitios,
 * anclas y `mailto:` quedan tal cual.
 */
export function enlaceInterno(href: string): string {
  try {
    const u = new URL(href);
    if (/^(www\.)?partequipos\.com$/i.test(u.hostname) && !/\/wp-content\//.test(u.pathname)) {
      return `${normalizarRuta(u.pathname)}${u.search}${u.hash}`;
    }
  } catch {
    // Relativo, ancla o `mailto:`: tal cual.
  }
  return href;
}

/** `/a/b` → `/a/b/`, decodificada; un fichero (con extensión) sin barra. */
export function normalizarRuta(ruta: string): string {
  let r = ruta;
  try {
    r = decodeURIComponent(ruta);
  } catch {
    // Mal codificada: tal cual.
  }
  if (!r.startsWith("/")) r = `/${r}`;
  if (!r.endsWith("/") && !/\.[a-z0-9]{2,5}$/i.test(r)) r = `${r}/`;
  return r;
}

/**
 * Rutas viejas del sitio actual que ya dan 404 en WordPress y que ningún
 * redirect resuelve (decisión de dirección, 2026-10-06). Con destino: el
 * equivalente real en el sitio nuevo. `null`: no hay equivalente, así que se
 * quita el enlace y se deja su texto (nada de mandarlas a un índice genérico).
 */
export const ENLACES_VIEJOS: Readonly<Record<string, string | null>> = {
  "/maquinaria/maquinaria-nueva/excavadoras/":
    "/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras/",
  "/maquinaria/maquinaria-nueva/miniexcavadoras/":
    "/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras/",
  "/maquinaria/maquinaria-nueva/cargadores/":
    "/maquinaria-pesada/maquinaria-pesada-nueva/cargadores/",
  "/maquinaria-pesada/maquinaria-pesada-nueva/nuestras-marcas/case-construction/retrocargadores/":
    "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/",
  "/lubricantes/": "/lubricantes/lubricantes-eni/",
  "/maquinaria/maquinaria-nueva/bulldozer/": null,
  "/maquinaria/maquinaria-nueva/minicargadores/": null,
  "/maquinaria/maquinaria-nueva/motoniveladoras/": null,
  "/maquinaria/maquinaria-nueva/retrocargadores/": null,
};

/**
 * Qué hacer con un enlace a una ruta vieja: `{ destino }` (con el ancla o la
 * consulta del original), `{ quitar: true }`, o `null` si no es una de ellas.
 */
export function enlaceViejo(rel: string): { destino: string } | { quitar: true } | null {
  const ruta = rel.split(/[?#]/)[0]!;
  const clave = normalizarRuta(ruta);
  if (!(clave in ENLACES_VIEJOS)) return null;
  const destino = ENLACES_VIEJOS[clave];
  return destino === null ? { quitar: true } : { destino: `${destino}${rel.slice(ruta.length)}` };
}

/** Un párrafo «corto» para pasar a título: como mucho esto, en caracteres. */
export const MAX_TITULO_NEGRITA = 90;

export type VeredictoNegrita =
  | { titulo: true }
  | { titulo: false; motivo: "largo" | "punto final" | "dos puntos" | "salto de línea" };

/**
 * ¿Un párrafo entero en negrita es un título? Solo cuando está claro
 * (decisión de dirección, 2026-10-06): corto, entero en negrita y sin punto
 * final. Lo dudoso se queda como párrafo: con un salto de línea dentro (son
 * dos cosas), o acabado en dos puntos (es una etiqueta que presenta lo que
 * sigue, no un título). `null` si no está entero en negrita: no es candidato.
 */
export function tituloEnNegrita(p: {
  texto: string;
  negrita: string;
  saltos: boolean;
}): VeredictoNegrita | null {
  const texto = p.texto.replace(/\s+/g, " ").trim();
  const negrita = p.negrita.replace(/\s+/g, " ").trim();
  // Sin espacios al comparar: la negrita puede venir partida en varios
  // <strong> sin espacio entre ellos («la línea» + «80/40»).
  if (!texto || negrita.replace(/\s/g, "") !== texto.replace(/\s/g, "")) return null;
  if (texto.length > MAX_TITULO_NEGRITA) return { titulo: false, motivo: "largo" };
  if (p.saltos) return { titulo: false, motivo: "salto de línea" };
  if (/[.…]$/.test(texto)) return { titulo: false, motivo: "punto final" };
  if (/:$/.test(texto)) return { titulo: false, motivo: "dos puntos" };
  return { titulo: true };
}

const VINETA = "[\\u{1F536}-\\u{1F539}•▪▫◆◇►▶]\\uFE0F?";

/**
 * ¿El título es un subapartado? Los que empiezan por una viñeta (🔹, •, ▪…) o
 * un número («1. », «2) ») enumeran dentro del apartado anterior.
 */
export const esSubapartado = (texto: string) =>
  new RegExp(`^\\s*(${VINETA}|(${VINETA}\\s*)?\\d+[.)]\\s)`, "u").test(texto);

/**
 * Nivel del título que sale de un párrafo en negrita, respetando la jerarquía
 * del artículo. `encabezadoReal`: el último encabezado de WordPress antes de
 * él; `tituloAnterior`: el último título, real o convertido, que no sea un
 * subapartado. Un subapartado va un nivel por debajo del título anterior; el
 * resto, un nivel por debajo del encabezado real (h2 si no lo hay). Como mucho
 * h4; `limpiarLexical` quita después cualquier salto.
 */
export function nivelTituloNegrita(
  encabezadoReal: number | null,
  sub = false,
  tituloAnterior: number | null = encabezadoReal,
): number {
  const base = sub ? tituloAnterior : encabezadoReal;
  return base ? Math.min(base + 1, 4) : 2;
}

type NodoLx = { type: string; tag?: string; format?: unknown; text?: string; children?: NodoLx[] };

const textoNodo = (n: NodoLx): string =>
  typeof n.text === "string" ? n.text : (n.children ?? []).map(textoNodo).join("");

/**
 * Limpieza mecánica del contenido ya convertido a Lexical (2026-10-06):
 * fuera las alineaciones heredadas (`justify` y `center`, de estilos en línea
 * de WordPress), fuera los párrafos vacíos, y encabezados sin saltos de nivel:
 * el primero es un h2 (el h1 es el título de la página) y ninguno baja más de
 * un nivel respecto al anterior.
 */
export function limpiarLexical(raiz: { children?: NodoLx[] }): {
  alineaciones: number;
  vacios: number;
  niveles: number;
} {
  const r = { alineaciones: 0, vacios: 0, niveles: 0 };
  const visitar = (n: NodoLx) => {
    if ((n.type === "paragraph" || n.type === "heading") && n.format) {
      n.format = "";
      r.alineaciones++;
    }
    (n.children ?? []).forEach(visitar);
  };
  const hijos = (raiz.children ?? []).filter((n) => {
    const vacio = n.type === "paragraph" && !textoNodo(n).trim();
    if (vacio) r.vacios++;
    return !vacio;
  });
  hijos.forEach(visitar);
  let anterior = 1;
  for (const n of hijos) {
    if (n.type !== "heading" || !n.tag) continue;
    const nivel = Number(n.tag.slice(1));
    const nuevo = Math.max(2, Math.min(nivel, anterior + 1));
    if (nuevo !== nivel) {
      n.tag = `h${nuevo}`;
      r.niveles++;
    }
    anterior = nuevo;
  }
  raiz.children = hijos;
  return r;
}

/** Shortcodes de WordPress que quedan como texto (`[if …]`, `[endif]`…): se quitan y se cuentan. */
export function quitarShortcodes(texto: string): { texto: string; quitados: string[] } {
  const quitados: string[] = [];
  const limpio = texto.replace(/\[\/?([a-z_][a-z0-9_-]*)(?:\s[^\]]*)?\]/gi, (todo, nombre) => {
    quitados.push(String(nombre));
    return "";
  });
  return { texto: limpio, quitados };
}

/**
 * SEO de Yoast SOLO si es único en el blog. Medido: de 53 artículos hay 38
 * títulos y 32 descripciones distintos (entradas duplicadas con el SEO sin
 * actualizar). Importar un título repetido haría que varias páginas compitan
 * por lo mismo; vacío, el sitio usa el título y la entradilla del artículo.
 */
export function valoresUnicos(valores: (string | null | undefined)[]): Set<string> {
  const cuenta = new Map<string, number>();
  for (const v of valores) {
    const k = (v ?? "").trim();
    if (k) cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
  }
  return new Set([...cuenta].filter(([, n]) => n === 1).map(([k]) => k));
}
