import type { Metadata } from "next";

import { absoluteUrl, seoConfig } from "./config";

/**
 * Grupo `seo` tal como lo define `seoField()` en las colecciones de Payload.
 * Se acepta parcial y nullable porque los campos son opcionales en el CMS.
 */
export type SeoGroup = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: { url?: string | null } | number | null;
} | null;

export type BuildMetadataInput = {
  /** Nombre de la entidad (Marca, Tipo, Modelo, Categoría). Fallback del title. */
  nombre: string;
  /** Ruta de la página, relativa al sitio (ej. "/repuestos/.../320d"). */
  path: string;
  /** Descripción propia de la entidad. Fallback de la meta description. */
  descripcion?: string | null;
  /** Grupo SEO del CMS; tiene prioridad sobre los fallbacks. */
  seo?: SeoGroup;
  /** Imagen social explícita ya resuelta (URL absoluta del CDN). */
  imageUrl?: string | null;
  /** Tipo de Open Graph. Las fichas usan "website" salvo artículos de blog. */
  ogType?: "website" | "article";
};

/** Recorta una descripción a una longitud sensata para un meta tag. */
function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Extrae la URL de un `ogImage` que puede venir poblado o como id. */
function ogImageUrl(ogImage: SeoGroup extends null ? never : NonNullable<SeoGroup>["ogImage"]) {
  if (ogImage && typeof ogImage === "object" && typeof ogImage.url === "string") {
    return ogImage.url;
  }
  return null;
}

/**
 * Construye el objeto `Metadata` de Next para cualquier entidad del catálogo.
 * Un solo patrón para Marca, Tipo, Modelo y Categoría (CLAUDE.md §3.4).
 *
 * Prioridad de datos:
 *   title       -> seo.metaTitle        | nombre
 *   description -> seo.metaDescription  | descripcion | descripción por defecto
 *   imagen      -> imageUrl             | seo.ogImage | imagen social por defecto
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const { nombre, path, descripcion, seo, imageUrl, ogType = "website" } = input;

  const title = seo?.metaTitle?.trim() || nombre.trim();
  const description = truncate(
    seo?.metaDescription?.trim() || descripcion?.trim() || seoConfig.defaultDescription,
  );

  const canonical = absoluteUrl(path);
  const image = absoluteUrl(
    imageUrl?.trim() || ogImageUrl(seo?.ogImage) || seoConfig.defaultOgImagePath,
  );

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: seoConfig.siteName,
      locale: seoConfig.locale,
      type: ogType,
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
