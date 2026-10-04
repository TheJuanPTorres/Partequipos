import { horarioJsonLd, type Tramo } from "./horario";
import { absoluteUrl, getSiteUrl, seoConfig } from "./config";
import { datosEmpresa, type Empresa } from "./empresa";

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
 * JSON-LD `Organization`. El contacto sale del global `seo` (`empresa`, con
 * respaldo en `seoConfig`); el resto de datos de negocio, de `seoConfig`.
 */
export function buildOrganizationJsonLd(
  horario: Tramo[] = [],
  empresa: Empresa = datosEmpresa(undefined),
  /** Logo del panel o el de siempre (`getLogo().buscadores`). */
  logoUrl: string = seoConfig.logoPath,
): JsonLdObject {
  const address: JsonLdObject = {
    "@type": "PostalAddress",
    addressCountry: seoConfig.country,
  };
  if (empresa.direccion) address.streetAddress = empresa.direccion;
  if (empresa.ciudad) address.addressLocality = empresa.ciudad;

  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seoConfig.siteName,
    url: getSiteUrl(),
    logo: absoluteUrl(logoUrl),
    description: seoConfig.defaultDescription,
    address,
  };

  // Campos pendientes de confirmar con el cliente: se omiten si están vacíos.
  // Mejor omitir que publicar una razón social o un NIT equivocados.
  if (seoConfig.legalName) jsonLd.legalName = seoConfig.legalName;
  if (seoConfig.taxId) jsonLd.taxID = seoConfig.taxId;

  if (empresa.correo) jsonLd.email = empresa.correo;
  if (empresa.telefono) jsonLd.telephone = empresa.telefono;

  /*
   * Horario de atención (global `seo`). `Organization` no admite
   * `openingHoursSpecification` en schema.org (es propiedad de `Place` y
   * `LocalBusiness`): va en un `ContactPoint`, cuyo `hoursAvailable` sí espera
   * `OpeningHoursSpecification`. Sin tramos válidos, no se emite.
   */
  if (horario.length > 0) {
    const punto: JsonLdObject = {
      "@type": "ContactPoint",
      contactType: "customer service",
      hoursAvailable: horarioJsonLd(horario),
      areaServed: seoConfig.country,
      availableLanguage: "es",
    };
    if (empresa.telefono) punto.telephone = empresa.telefono;
    if (empresa.correo) punto.email = empresa.correo;
    jsonLd.contactPoint = punto;
  }
  if (empresa.redes.length > 0) jsonLd.sameAs = [...empresa.redes];

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
  /** Logo del editor: el del panel o el de siempre (`getLogo().buscadores`). */
  logoUrl?: string | null;
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
      logo: { "@type": "ImageObject", url: absoluteUrl(input.logoUrl ?? seoConfig.logoPath) },
    },
  };

  if (descripcion?.trim()) jsonLd.description = descripcion.trim();
  if (fechaModificacion?.trim()) jsonLd.dateModified = fechaModificacion.trim();
  if (autor?.trim()) jsonLd.author = { "@type": "Person", name: autor.trim() };
  if (imagenUrl?.trim()) jsonLd.image = [absoluteUrl(imagenUrl.trim())];

  return jsonLd;
}

// ---------------------------------------------------------------------------
// FAQPage — preguntas frecuentes de la portada (fase H)
// ---------------------------------------------------------------------------
export type PreguntaJsonLd = { pregunta: string; respuesta: string };

/**
 * JSON-LD `FAQPage`. Google dejó de mostrar el resultado enriquecido de FAQ
 * para la mayoría de sitios: se emite por corrección estructural, sin esperar
 * un resultado visible (docs/diseno/decisiones-home-ux9.md §7). Sin preguntas,
 * no se emite: un `FAQPage` vacío afirma algo falso.
 */
export function buildFaqJsonLd(preguntas: PreguntaJsonLd[]): JsonLdObject | null {
  const validas = preguntas.filter((p) => p.pregunta.trim() && p.respuesta.trim());
  if (validas.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validas.map((p) => ({
      "@type": "Question",
      name: p.pregunta.trim(),
      acceptedAnswer: { "@type": "Answer", text: p.respuesta.trim() },
    })),
  };
}
