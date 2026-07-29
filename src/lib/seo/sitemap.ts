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
};

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
  { marcas, tipos, modelos }: SitemapInput,
  ahora: Date = new Date(),
): SitemapEntry[] {
  const entradas: SitemapEntry[] = [
    // Índices: prioridad alta, cambian cuando cambia cualquier hijo.
    {
      url: absoluteUrl(rutas.repuestos()),
      lastModified: masReciente(marcas, ahora),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl(rutas.marcas()),
      lastModified: masReciente(marcas, ahora),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

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
