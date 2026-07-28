/**
 * Única fuente de los datos de negocio usados por el SEO (CLAUDE.md §5: nada
 * de valores quemados repartidos por el código). Ajustar aquí cambia metadata,
 * Open Graph y JSON-LD de todo el sitio.
 */
export const seoConfig = {
  /** Nombre comercial de la organización. */
  siteName: "Partequipos",
  /** Razón social / nombre legal para JSON-LD Organization. */
  legalName: "Partequipos S.A.S.",
  /** Descripción por defecto cuando la entidad no trae una propia. */
  defaultDescription:
    "Repuestos para maquinaria pesada en Colombia: excavadoras, bulldozers, retrocargadoras y más, con respaldo técnico.",
  /** Ruta del logo, relativa al sitio (se absolutiza al construir el JSON-LD). */
  logoPath: "/next.svg",
  /** Imagen social por defecto cuando la entidad no tiene `ogImage`. */
  defaultOgImagePath: "/next.svg",
  /** Idioma/mercado objetivo. */
  locale: "es_CO",
  /** País de operación (ISO 3166-1 alfa-2), para JSON-LD Organization. */
  country: "CO",
  /** Perfiles oficiales; alimentan `sameAs` de Organization. */
  sameAs: [] as string[],
  /** Plantilla de títulos: `%s` se sustituye por el título de la página. */
  titleTemplate: "%s | Partequipos",
} as const;

/**
 * Base absoluta del sitio, sin barra final.
 * Sale de NEXT_PUBLIC_SERVER_URL (CLAUDE.md §8: configuración por entorno).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SERVER_URL?.trim();
  if (raw && raw.length > 0) return raw.replace(/\/+$/, "");
  // Fallback de desarrollo: evita emitir rutas relativas si la variable falta.
  return "http://localhost:3000";
}

/**
 * Convierte una ruta o URL en absoluta. Las URLs que ya son absolutas
 * (p. ej. las imágenes servidas desde el CDN del Blob, ver ADR 0003) se
 * devuelven intactas.
 */
export function absoluteUrl(pathOrUrl: string): string {
  const value = (pathOrUrl ?? "").trim();
  if (value.length === 0) return getSiteUrl();
  if (/^https?:\/\//i.test(value)) return value;
  return `${getSiteUrl()}/${value.replace(/^\/+/, "")}`;
}
