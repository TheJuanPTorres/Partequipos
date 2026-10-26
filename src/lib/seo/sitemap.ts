import { REDIRECTS_FIJOS } from "../redirects/fijos";
import { rutas, SLUGS_CON_RUTA_PROPIA } from "../routes";
import { absoluteUrl } from "./config";
import { rutaDeCategoriaTecnica } from "../repuestos/subcategorias";

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
  /** Categorías técnicas de repuestos: índice y una página por categoría. */
  /** Con `padre` las que cuelgan de otra categoría (Filtros Donaldson): su dirección completa. */
  categoriasRepuestos: (ConSlug & {
    padre?: number | { id: number; slug?: string | null } | null;
  })[];
  tipos: TipoLike[];
  modelos: ModeloLike[];
  /** Páginas institucionales. El slug `inicio` corresponde a la portada `/`. */
  paginas: ConSlug[];
  /** Maquinaria (ADR 0007). Colecciones propias, jerarquía propia. */
  marcasMaquinaria: ConSlug[];
  tiposMaquinaria: TipoLike[];
  equiposNuevos: ModeloLike[];
  categoriasNueva: ConSlug[];
  categoriasUsada: ConSlug[];
  /** Unidades usadas DISPONIBLES con su página (las vendidas redirigen y no van). */
  unidadesUsada: (ConSlug & { categoriaSlug: string })[];
  /** Marcas de usada con unidades disponibles (D4: las vacías no van). */
  marcasUsada: ConSlug[];
  /**
   * Las categorías de «Otros» de usados CON unidades (2026-10-19). Vacío o sin
   * el dato, la página «Otros» no va: como D4, vuelve con la primera unidad.
   */
  categoriasOtrosUsada?: ConSlug[];
  /** Lubricantes: la página de cada marca y la de cada línea (desde el 2026-10-22). */
  marcasLubricante: ConSlug[];
  categoriasLubricante?: TipoLike[];
  /** Blog. Los artículos van en la raíz, sin prefijo. */
  articulos: ConSlug[];
  categoriasBlog: ConSlug[];
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
  "/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada",
  "/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/[categoria]",
  // Páginas dentro de una categoría técnica (Filtros Donaldson, 2026-10-26).
  "/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/[categoria]/[subcategoria]",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/[marca]",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/[marca]/[tipo]",
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/[marca]/[tipo]/[modelo]",
  // Fichas de un tipo ANIDADO (las excavadoras de CASE, src/lib/repuestos/anidado.ts).
  "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/[marca]/[tipo]/[modelo]/[submodelo]",
  "/maquinaria-pesada",
  "/maquinaria-pesada/maquinaria-pesada-nueva/[categoria]",
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas",
  // El índice de tipos de nueva (2026-10-22, URL nueva): la página principal de nueva desde el
  // 2026-10-23 (la de «Por marca» / «Por tipo» da 301 aquí, `REDIRECTS_FIJOS`).
  "/maquinaria-pesada/maquinaria-pesada-nueva/tipos",
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/[marca]",
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/[marca]/[tipo]",
  "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/[marca]/[tipo]/[modelo]",
  "/maquinaria-pesada/maquinaria-pesada-usada",
  "/maquinaria-pesada/maquinaria-pesada-usada/[categoria]",
  "/maquinaria-pesada/maquinaria-pesada-usada/[categoria]/[unidad]",
  "/maquinaria-pesada/maquinaria-pesada-usada/marcas/[marca]",
  "/maquinaria-pesada/maquinaria-pesada-usada/otros",
  // Lubricantes: la página general (2026-10-20), una por marca y una por línea (2026-10-22).
  "/lubricantes",
  "/lubricantes/[marca]",
  "/lubricantes/[marca]/[categoria]",
  // «Trabaja con nosotros» (2026-10-23): ruta propia, en su URL de WordPress.
  "/nosotros/trabaja-con-nosotros",
  /*
   * Blog. Los ARTÍCULOS no aparecen aquí: se sirven desde `[...slug]`, que ya
   * está declarado arriba, porque viven en la raíz igual que las páginas
   * institucionales. Sus URLs sí se emiten en `buildSitemapEntries`.
   */
  "/noticias",
  "/category/[categoria]",
] as const;

/**
 * Rutas construidas que NO van al sitemap, cada una con su motivo. Existen para
 * que el guardián de `sitemap.test.ts` no las confunda con un olvido: quitar
 * una ruta del sitemap tiene que ser una decisión escrita, no un silencio.
 */
export const RUTAS_FUERA_DEL_SITEMAP = {
  /*
   * Banco de pruebas del movimiento (fase A de la home). Devuelve 404 en
   * PRODUCCIÓN (`VERCEL_ENV`): solo existe en local y en los preview.
   */
  "/laboratorio/movimiento": "banco de pruebas, 404 en producción",
  /*
   * Resultados de búsqueda (`?q=…`): `noindex, follow`. Una página por cada texto
   * que alguien escriba no es contenido que indexar.
   */
  "/buscar": "resultados de búsqueda: noindex, fuera del sitemap",
  /*
   * Páginas 2 y siguientes del listado de usados (src/lib/usados/paginacion.ts).
   * Son indexables, con canónica propia, y se descubren por los enlaces de la
   * página 1, que sí está en el sitemap. Cambian con el inventario: listarlas
   * aquí daría URL que desaparecen en cuanto se vende una unidad.
   */
  "/maquinaria-pesada/maquinaria-pesada-usada/[categoria]/pagina/[pagina]":
    "paginación: se llega desde la página 1 de la categoría",
  "/maquinaria-pesada/maquinaria-pesada-usada/marcas/[marca]/pagina/[pagina]":
    "paginación: se llega desde la página 1 de la marca",
  /*
   * Lo mismo en el blog (2026-10-21, plantilla «Blog» de Andrés): el índice y cada
   * categoría están en el sitemap; sus páginas siguientes se descubren desde la 1.
   */
  "/noticias/pagina/[pagina]": "paginación: se llega desde la página 1 del índice del blog",
  "/category/[categoria]/pagina/[pagina]":
    "paginación: se llega desde la página 1 del archivo de la categoría",
} as const;

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
  {
    marcas,
    categoriasRepuestos,
    tipos,
    modelos,
    paginas,
    marcasMaquinaria,
    tiposMaquinaria,
    equiposNuevos,
    categoriasNueva,
    categoriasUsada,
    unidadesUsada,
    marcasUsada,
    categoriasOtrosUsada = [],
    marcasLubricante,
    categoriasLubricante = [],
    articulos,
    categoriasBlog,
  }: SitemapInput,
  ahora: Date = new Date(),
): SitemapEntry[] {
  const portada = paginas.find((p) => p.slug === SLUG_PORTADA_SITEMAP);
  // Las que tienen ruta propia se anuncian aparte, una sola vez.
  const institucionales = paginas.filter(
    (p) => p.slug !== SLUG_PORTADA_SITEMAP && !SLUGS_CON_RUTA_PROPIA.includes(p.slug),
  );

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
    {
      url: absoluteUrl(rutas.categoriasRepuestos()),
      lastModified: masReciente(categoriasRepuestos, ahora),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  );

  // También las páginas que cuelgan de una categoría (Filtros Donaldson, 2026-10-26), en su
  // dirección completa; sin la categoría de la que cuelgan, no salen (sin enlace roto).
  for (const categoria of categoriasRepuestos) {
    const ruta = rutaDeCategoriaTecnica(categoria);
    if (!ruta) continue;
    entradas.push({
      url: absoluteUrl(ruta),
      lastModified: fecha(categoria.updatedAt, ahora),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Páginas institucionales y legales. Cambian poco, de ahí `monthly`.
  for (const pagina of institucionales) {
    entradas.push({
      url: absoluteUrl(`/${pagina.slug}`),
      lastModified: fecha(pagina.updatedAt, ahora),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  /*
   * «Trabaja con nosotros» (2026-10-23): siempre, con vacantes o sin ellas (sin
   * vacantes la página sigue sirviendo: lleva al portal de Buk). Las vacantes
   * cambian a menudo, de ahí `daily`.
   */
  entradas.push({
    url: absoluteUrl(rutas.trabajaConNosotros()),
    lastModified: fecha(
      paginas.find((p) => p.slug === "nosotros/trabaja-con-nosotros")?.updatedAt,
      ahora,
    ),
    changeFrequency: "daily",
    priority: 0.5,
  });

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

  /*
   * MAQUINARIA (ADR 0007).
   *
   * Los tres índices (raíz, nueva, marcas) y el de usada son rutas estáticas:
   * existen siempre, aunque todavía no haya datos. Se listan igual porque son
   * URLs vivas del sitio actual y su desaparición del sitemap sería una pérdida
   * de cobertura, no una mejora.
   */
  const maquinariaTodo = [
    ...marcasMaquinaria,
    ...tiposMaquinaria,
    ...equiposNuevos,
    ...categoriasNueva,
  ];

  entradas.push(
    {
      url: absoluteUrl(rutas.maquinaria()),
      lastModified: masReciente([...maquinariaTodo, ...categoriasUsada], ahora),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      // La página principal de maquinaria nueva (2026-10-23): el índice de tipos.
      url: absoluteUrl(rutas.nuevaTipos()),
      lastModified: masReciente(maquinariaTodo, ahora),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl(rutas.marcasMaquinaria()),
      lastModified: masReciente(marcasMaquinaria, ahora),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl(rutas.usada()),
      // El inventario de usada rota rápido: una unidad se vende y desaparece.
      lastModified: masReciente([...categoriasUsada, ...marcasUsada], ahora),
      changeFrequency: "daily",
      priority: 0.8,
    },
  );

  for (const categoria of categoriasNueva) {
    entradas.push({
      url: absoluteUrl(rutas.categoriaNueva(categoria.slug)),
      lastModified: fecha(categoria.updatedAt, ahora),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const marca of marcasMaquinaria) {
    entradas.push({
      url: absoluteUrl(rutas.marcaMaquinaria(marca.slug)),
      lastModified: fecha(marca.updatedAt, ahora),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const tipo of tiposMaquinaria) {
    entradas.push({
      url: absoluteUrl(rutas.tipoMaquinaria(tipo.marcaSlug, tipo.slug)),
      lastModified: fecha(tipo.updatedAt, ahora),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const equipo of equiposNuevos) {
    entradas.push({
      url: absoluteUrl(rutas.equipoNuevo(equipo.marcaSlug, equipo.tipoSlug, equipo.slug)),
      lastModified: fecha(equipo.updatedAt, ahora),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  const otros = categoriasOtrosUsada;
  if (otros.length > 0) {
    entradas.push({
      url: absoluteUrl(rutas.usadaOtros()),
      lastModified: masReciente(otros, ahora),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  for (const categoria of categoriasUsada) {
    entradas.push({
      url: absoluteUrl(rutas.categoriaUsada(categoria.slug)),
      lastModified: fecha(categoria.updatedAt, ahora),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  // Cada unidad disponible tiene su página (2026-10-16); una vendida redirige a su
  // categoría y no se lista. Cambian a diario con el inventario.
  for (const unidad of unidadesUsada) {
    entradas.push({
      url: absoluteUrl(rutas.unidadUsada(unidad.categoriaSlug, unidad.slug)),
      lastModified: fecha(unidad.updatedAt, ahora),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  for (const marca of marcasUsada) {
    entradas.push({
      url: absoluteUrl(rutas.marcaUsada(marca.slug)),
      lastModified: fecha(marca.updatedAt, ahora),
      changeFrequency: "daily",
      priority: 0.6,
    });
  }

  /*
   * LUBRICANTES: la página general (2026-10-20) y una por marca. Cambian poco,
   * de ahí `monthly`.
   */
  entradas.push({
    url: absoluteUrl(rutas.lubricantes()),
    lastModified: masReciente(marcasLubricante, ahora),
    changeFrequency: "monthly",
    priority: 0.8,
  });
  for (const marca of marcasLubricante) {
    entradas.push({
      url: absoluteUrl(rutas.marcaLubricante(marca.slug)),
      lastModified: fecha(marca.updatedAt, ahora),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }
  // Las líneas vuelven a tener página, en su URL de WordPress (2026-10-22).
  for (const linea of categoriasLubricante) {
    entradas.push({
      url: absoluteUrl(rutas.categoriaLubricante(linea.marcaSlug, linea.slug)),
      lastModified: fecha(linea.updatedAt, ahora),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  /*
   * BLOG.
   *
   * El índice se lista siempre (es una ruta estática y una URL viva). Los
   * artículos van en la RAÍZ, sin prefijo: es la estructura del sitio actual.
   *
   * No se emite `/blog-partequipos/`: es una de las tres puertas de entrada del
   * sitio actual y su destino está pendiente de decisión del cliente (ADR 0008).
   * Anunciar en el sitemap una URL que quizá acabe en 301 sería contraproducente.
   */
  entradas.push({
    url: absoluteUrl(rutas.blog()),
    lastModified: masReciente(articulos, ahora),
    changeFrequency: "weekly",
    priority: 0.8,
  });

  for (const categoria of categoriasBlog) {
    entradas.push({
      url: absoluteUrl(rutas.categoriaBlog(categoria.slug)),
      lastModified: fecha(categoria.updatedAt, ahora),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const articulo of articulos) {
    entradas.push({
      url: absoluteUrl(rutas.articulo(articulo.slug)),
      lastModified: fecha(articulo.updatedAt, ahora),
      changeFrequency: "yearly",
      priority: 0.6,
    });
  }

  // Una URL que redirige no se anuncia (2026-10-17, dirección). Hasta el
  // 2026-10-23 era `nosotros/trabaja-con-nosotros`, que iba al portal de Buk;
  // hoy tiene página propia y la lista solo lleva `/maquinaria/`.
  const conBarra = (ruta: string) => (ruta.endsWith("/") ? ruta : `${ruta}/`);
  const redirigidas = new Set(REDIRECTS_FIJOS.map((r) => conBarra(r.source)));
  return entradas.filter((e) => !redirigidas.has(conBarra(new URL(e.url).pathname)));
}
