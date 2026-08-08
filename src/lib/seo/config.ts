/**
 * Única fuente de los datos de negocio usados por el SEO (CLAUDE.md §5: nada
 * de valores quemados repartidos por el código). Ajustar aquí cambia metadata,
 * Open Graph y JSON-LD de todo el sitio.
 */
export const seoConfig = {
  /** Nombre comercial de la organización. Fuente: sitio actual (marca y footer). */
  siteName: "Partequipos",
  /**
   * Razón social para JSON-LD `Organization`.
   *
   * PENDIENTE DE CONFIRMAR CON EL CLIENTE. El sitio actual declara **dos**
   * entidades legales en /tratamiento-de-datos/ y no hay forma de deducir cuál
   * corresponde a este dominio:
   *   - "PARTEQUIPOS S.A.S"           · NIT 830.080.641-4 · Carrera 68D # 17 A – 84
   *   - "PARTEQUIPOS MAQUINARIA S.A.S" · NIT 830.116.807-7 · Diagonal 16 # 96 G-85
   * Se deja vacío a propósito: `buildOrganizationJsonLd` omite el campo si no hay
   * valor, y es preferible omitirlo a publicar una razón social equivocada.
   */
  legalName: "",
  /**
   * NIT / identificación tributaria. PENDIENTE: depende de cuál razón social
   * se confirme arriba (830.080.641-4 o 830.116.807-7).
   */
  taxId: "",
  /** Descripción por defecto cuando la entidad no trae una propia. */
  defaultDescription:
    "Repuestos para maquinaria pesada en Colombia: excavadoras, bulldozers, retrocargadoras y más, con respaldo técnico.",
  /** Logo institucional (Media id 5, servido desde el CDN del Blob). */
  logoPath: "https://sr2s4ngkjzfzpxhi.public.blob.vercel-storage.com/logo-partequipos.png",
  /** Imagen social por defecto cuando la entidad no tiene `ogImage`. */
  defaultOgImagePath:
    "https://sr2s4ngkjzfzpxhi.public.blob.vercel-storage.com/logo-partequipos.png",
  /** Idioma/mercado objetivo. */
  locale: "es_CO",
  /** País de operación (ISO 3166-1 alfa-2), para JSON-LD Organization. */
  country: "CO",
  /** Datos de contacto públicos. Fuente: footer y /contactanos/ del sitio actual. */
  contact: {
    email: "info@partequipos.com",
    /** Teléfono principal publicado en el encabezado y el footer. */
    phone: "+57 317 670 7071",
    streetAddress: "Carrera 68D # 17A-84",
    addressLocality: "Bogotá D.C.",
    /** Horario tal como lo publica el sitio. */
    openingHours: "Lunes a viernes de 8:00 a. m. a 5:30 p. m. y sábados de 9:00 a. m. a 12:00 m.",
  },
  /**
   * Portales externos enlazados desde el pie del sitio actual (zona de clientes
   * y proveedores, tienda, empleo).
   *
   * PENDIENTE: las URLs reales no están confirmadas. Se dejan vacías a
   * propósito — el pie omite el enlace si falta el valor, en vez de apuntar a
   * un destino inventado. Ver CLAUDE.md §10.3.
   */
  portales: {
    /** Zona de clientes/proveedores de repuestos (SAP). */
    sapRepuestos: "",
    /** Zona de clientes/proveedores de maquinaria (SAP). */
    sapMaquinaria: "",
    /** Portal de empleo (Buk). */
    empleo: "",
    /** Tienda en línea (PE PartsShop / STAL). */
    tienda: "",
  },
  /** Perfiles oficiales; alimentan `sameAs` de Organization. Fuente: footer. */
  sameAs: [
    "https://www.facebook.com/partequip0s",
    "https://www.instagram.com/partequipos_sas/",
    "https://www.youtube.com/channel/UCiUU1dE8QvchvTKv47KuDVw",
  ] as string[],
  /** Plantilla de títulos: `%s` se sustituye por el título de la página. */
  titleTemplate: "%s | Partequipos",
} as const;

/**
 * ¿Se permite que los buscadores indexen este despliegue?
 *
 * Mientras el sitio real siga en WordPress, este entorno es una DEMOSTRACIÓN.
 * Si se indexa: compite como contenido duplicado con el sitio vivo del cliente
 * y expone textos legales que hoy son marcadores sin validez jurídica.
 *
 * Controlado por `NEXT_PUBLIC_PERMITIR_INDEXACION`. **Por defecto bloqueado**:
 * si la variable falta o está mal escrita, el resultado seguro es no indexar.
 * Para abrir el sitio el día del lanzamiento basta ponerla en "true" y
 * redesplegar — no hay que tocar código.
 *
 * Es `NEXT_PUBLIC_*` porque se incrusta en build: la decisión se congela con el
 * artefacto desplegado, no cambia sola en caliente.
 */
export function indexacionPermitida(): boolean {
  return process.env.NEXT_PUBLIC_PERMITIR_INDEXACION?.trim().toLowerCase() === "true";
}

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
 *
 * Emite **con barra final**, para que coincida con lo que sirve el sitio
 * (`trailingSlash: true`, ADR 0006). Sin esto, el `canonical` y el JSON-LD
 * apuntarían a una URL que responde 308 hacia la versión con barra: una
 * autorreferencia que no es canónica.
 *
 * Excepción: las rutas que terminan en un archivo con extensión (`/sitemap.xml`,
 * `/robots.txt`, imágenes) no llevan barra — no son directorios.
 */
export function absoluteUrl(pathOrUrl: string): string {
  const value = (pathOrUrl ?? "").trim();
  if (value.length === 0) return `${getSiteUrl()}/`;
  if (/^https?:\/\//i.test(value)) return value;

  const ruta = value.replace(/^\/+/, "").replace(/\/+$/, "");
  if (ruta.length === 0) return `${getSiteUrl()}/`;

  // Un último segmento con extensión es un archivo, no un directorio.
  const ultimo = ruta.split("/").pop() ?? "";
  const esArchivo = /\.[a-z0-9]{2,5}$/i.test(ultimo);

  return `${getSiteUrl()}/${ruta}${esArchivo ? "" : "/"}`;
}
