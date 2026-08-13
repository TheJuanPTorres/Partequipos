import { absoluteUrl, getSiteUrl, seoConfig } from "./config";

/** Objeto JSON-LD serializable. */
export type JsonLdObject = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Product — fichas de modelo de repuesto
// ---------------------------------------------------------------------------
export type ProductJsonLdInput = {
  /** Nombre del modelo, ej. "Caterpillar 320D". */
  nombre: string;
  /** Ruta de la ficha, relativa al sitio. */
  path: string;
  descripcion?: string | null;
  /** Marca a la que pertenece el modelo. */
  marca?: string | null;
  /** Código/SKU del modelo, ej. "320D". */
  codigo?: string | null;
  /** Imágenes de la ficha (URLs absolutas del CDN o rutas relativas). */
  imagenes?: string[];
};

/**
 * JSON-LD `Product` para la ficha de un modelo.
 * No se emiten `offers` (precio/stock): el sitio es de catálogo y consulta,
 * no un e-commerce; declarar ofertas falsas sería incorrecto.
 */
export function buildProductJsonLd(input: ProductJsonLdInput): JsonLdObject {
  const { nombre, path, descripcion, marca, codigo, imagenes } = input;

  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: nombre,
    url: absoluteUrl(path),
  };

  if (descripcion?.trim()) jsonLd.description = descripcion.trim();
  if (marca?.trim()) jsonLd.brand = { "@type": "Brand", name: marca.trim() };
  if (codigo?.trim()) jsonLd.sku = codigo.trim();

  const images = (imagenes ?? []).filter((u) => u?.trim()).map((u) => absoluteUrl(u));
  if (images.length > 0) jsonLd.image = images;

  return jsonLd;
}

// ---------------------------------------------------------------------------
// BreadcrumbList — migas de pan
// ---------------------------------------------------------------------------
export type BreadcrumbItem = {
  nombre: string;
  /** Ruta relativa o URL absoluta del nivel. */
  path: string;
};

/** JSON-LD `BreadcrumbList` a partir de los niveles de la jerarquía. */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.nombre,
      item: absoluteUrl(item.path),
    })),
  };
}

// ---------------------------------------------------------------------------
// Organization — identidad del sitio
// ---------------------------------------------------------------------------
/**
 * JSON-LD `Organization`. Todos los datos de negocio salen de `seoConfig`,
 * no hay valores quemados aquí.
 */
export function buildOrganizationJsonLd(): JsonLdObject {
  const { contact } = seoConfig;

  const address: JsonLdObject = {
    "@type": "PostalAddress",
    addressCountry: seoConfig.country,
  };
  if (contact.streetAddress) address.streetAddress = contact.streetAddress;
  if (contact.addressLocality) address.addressLocality = contact.addressLocality;

  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seoConfig.siteName,
    url: getSiteUrl(),
    logo: absoluteUrl(seoConfig.logoPath),
    description: seoConfig.defaultDescription,
    address,
  };

  // Campos pendientes de confirmar con el cliente: se omiten si están vacíos.
  // Mejor omitir que publicar una razón social o un NIT equivocados.
  if (seoConfig.legalName) jsonLd.legalName = seoConfig.legalName;
  if (seoConfig.taxId) jsonLd.taxID = seoConfig.taxId;

  if (contact.email) jsonLd.email = contact.email;
  if (contact.phone) jsonLd.telephone = contact.phone;
  if (seoConfig.sameAs.length > 0) jsonLd.sameAs = [...seoConfig.sameAs];

  return jsonLd;
}

export type ArticleJsonLdInput = {
  titulo: string;
  path: string;
  descripcion?: string | null;
  /** ISO. Obligatoria: `datePublished` es lo que distingue un Article. */
  fechaPublicacion: string;
  fechaModificacion?: string | null;
  autor?: string | null;
  imagenUrl?: string | null;
};

/**
 * JSON-LD `Article` para las fichas del blog.
 *
 * Los campos ausentes se **omiten** en vez de emitirse vacíos, igual que en el
 * resto de constructores: un `author` con cadena vacía es peor que no declarar
 * autor, porque afirma algo falso.
 *
 * El `publisher` sale de `Organization`, que ya construye este módulo desde
 * `seoConfig`: no se repiten aquí los datos de la empresa.
 */
export function buildArticleJsonLd(input: ArticleJsonLdInput): JsonLdObject {
  const { titulo, path, descripcion, fechaPublicacion, fechaModificacion, autor, imagenUrl } =
    input;

  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: titulo,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    datePublished: fechaPublicacion,
    publisher: {
      "@type": "Organization",
      name: seoConfig.siteName,
      logo: { "@type": "ImageObject", url: absoluteUrl(seoConfig.logoPath) },
    },
  };

  if (descripcion?.trim()) jsonLd.description = descripcion.trim();
  if (fechaModificacion?.trim()) jsonLd.dateModified = fechaModificacion.trim();
  if (autor?.trim()) jsonLd.author = { "@type": "Person", name: autor.trim() };
  if (imagenUrl?.trim()) jsonLd.image = [absoluteUrl(imagenUrl.trim())];

  return jsonLd;
}
