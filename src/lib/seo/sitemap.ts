import { rutas } from "../routes";
import { absoluteUrl } from "./config";

/** Entrada de sitemap con los campos que usa Next (`MetadataRoute.Sitemap`). */
export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
};

/** Forma mínima que necesita el sitemap de cada entidad del catálogo. */
type ConSlug = { slug: string; updatedAt?: string | null };
type TipoLike = ConSlug & { marcaSlug: string };
type ModeloLike = ConSlug & { marcaSlug: string; tipoSlug: string };

export type SitemapInput = {
  marcas: ConSlug[];
  tipos: TipoLike[];
  modelos: ModeloLike[];
  /** Páginas institucionales. El slug `inicio` corresponde a la portada `/`. */
  paginas: ConSlug[];
};

/**
 * Patrones de ruta que este sitemap cubre.
 *
 * Es una declaración explícita, no decorativa: `sitemap.test.ts` recorre
 * `src/app/(site)` buscando `page.tsx` y **falla si encuentra una ruta que no
 * esté aquí**. Así, añadir una sección nueva (maquinaria, blog, lubricantes…)
 * rompe la prueba con el nombre de la ruta en vez de quedar fuera del sitemap
 * en silencio, que es como se detectó el hueco de las páginas institucionales.
 *
 * Al añadir un patrón hay que añadir también sus URLs en `buildSitemapEntries`;
 * declararlo aquí sin emitirlas dejaría la prueba en verde mintiendo.
 */
export const PATRONES_SITEMAP = [
  "/",
  "/[...slug]",
  "/repuestos-maquinaria-pesada-colombia",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/[marca]",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/[marca]/[tipo]",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/[marca]/[tipo]/[modelo]",
] as const;

/** Slug reservado de la portada dentro de la colección de páginas. */
export const SLUG_PORTADA_SITEMAP = "inicio";

/** Convierte `updatedAt` en Date; si falta o es inválido, usa `porDefecto`. */
function fecha(updatedAt: string | null | undefined, porDefecto: Date): Date {
  if (!updatedAt) return porDefecto;
  const d = new Date(updatedAt);
  return Number.isNaN(d.getTime()) ? porDefecto : d;
}

/** La fecha más reciente de una lista; `porDefecto` si la lista está vacía. */
function masReciente(items: ConSlug[], porDefecto: Date): Date {
  let max: Date | null = null;
  for (const item of items) {
    const d = fecha(item.updatedAt, porDefecto);
    if (!max || d > max) max = d;
  }
  return max ?? porDefecto;
}

/**
 * Construye las entradas del sitemap a partir de las entidades del catálogo.
 *
 * Función pura (sin E/S) para poder probarla: la ruta `sitemap.ts` solo consulta
 * Payload y delega aquí.
 *
 * - Todas las URLs son **absolutas** vía `absoluteUrl` (nunca relativas).
 * - `lastModified` sale del `updatedAt` real de cada entidad; los índices toman
 *   la fecha más reciente de lo que listan, porque su contenido cambia cuando
 *   cambia cualquiera de sus hijos.
 */
export function buildSitemapEntries(
  { marcas, tipos, modelos, paginas }: SitemapInput,
  ahora: Date = new Date(),
): SitemapEntry[] {
  const portada = paginas.find((p) => p.slug === SLUG_PORTADA_SITEMAP);
  const institucionales = paginas.filter((p) => p.slug !== SLUG_PORTADA_SITEMAP);

  const entradas: SitemapEntry[] = [];

  // Portada. Solo se lista si existe el documento que la alimenta: sin él la
  // ruta responde 404 y anunciarla sería mandar al rastreador a un error.
  if (portada) {
    entradas.push({
      url: absoluteUrl("/"),
      lastModified: fecha(portada.updatedAt, ahora),
      changeFrequency: "weekly",
      priority: 1,
    });
  }

  entradas.push(
    // Índices de catálogo: cambian cuando cambia cualquier hijo.
    {
      url: absoluteUrl(rutas.repuestos()),
      lastModified: masReciente(marcas, ahora),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl(rutas.marcas()),
      lastModified: masReciente(marcas, ahora),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  );

  // Páginas institucionales y legales. Cambian poco, de ahí `monthly`.
  for (const pagina of institucionales) {
    entradas.push({
      url: absoluteUrl(`/${pagina.slug}`),
      lastModified: fecha(pagina.updatedAt, ahora),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const marca of marcas) {
    entradas.push({
      url: absoluteUrl(rutas.marca(marca.slug)),
      lastModified: fecha(marca.updatedAt, ahora),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const tipo of tipos) {
    entradas.push({
      url: absoluteUrl(rutas.tipo(tipo.marcaSlug, tipo.slug)),
      lastModified: fecha(tipo.updatedAt, ahora),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const modelo of modelos) {
    entradas.push({
      url: absoluteUrl(rutas.modelo(modelo.marcaSlug, modelo.tipoSlug, modelo.slug)),
      lastModified: fecha(modelo.updatedAt, ahora),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entradas;
}
