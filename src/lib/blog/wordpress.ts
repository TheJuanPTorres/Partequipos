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

/**
 * Texto alternativo para la `Media`: el de WordPress si sirve; si no (vacío,
 * genérico o el nombre del fichero), uno de respaldo con el título del
 * artículo, que hay que revisar en el panel (sale en el informe).
 */
export function altParaMedia(
  altWp: string | null | undefined,
  titulo: string,
  n: number,
  fichero: string,
): { alt: string; deRespaldo: boolean } {
  const propio = textoPlano(altWp ?? "");
  if (!motivoAltFlojo(propio, fichero)) return { alt: propio, deRespaldo: false };
  return {
    alt: `Ilustración del artículo «${titulo}»${n > 1 ? ` (${n})` : ""}`,
    deRespaldo: true,
  };
}

/** Enlace interno del sitio actual → ruta relativa (las URL del sitio nuevo son las mismas). */
export function enlaceInterno(href: string): string {
  try {
    const u = new URL(href);
    if (/^(www\.)?partequipos\.com$/i.test(u.hostname) && !/\/wp-content\//.test(u.pathname)) {
      return `${u.pathname}${u.search}${u.hash}`;
    }
  } catch {
    // Relativo, ancla o `mailto:`: tal cual.
  }
  return href;
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
