import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "@/lib/cacheDatos";

import { getArticulos, getCategoriasBlog } from "@/lib/queries/getBlog";
import { getCategoriasLubricante, getMarcasLubricante } from "@/lib/queries/getLubricantes";
import {
  getCategoriasMaquinaria,
  getCategoriasUsada,
  getEquiposNuevos,
  getInventarioUsados,
  getMarcasUsada,
  getMarcasMaquinaria,
  getTiposMaquinaria,
} from "@/lib/queries/getMaquinaria";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getModelos } from "@/lib/queries/getModelos";
import { getPaginas } from "@/lib/queries/getPaginas";
import { getTipos } from "@/lib/queries/getTipos";
import { getCategoriasRepuestos } from "@/lib/queries/getCategoriasRepuestos";
import { tiposConEquipos } from "@/lib/nueva/tiposConEquipos";
import { buildSitemapEntries } from "@/lib/seo/sitemap";
import { vaEnOtros } from "@/lib/usados/otros";
import { poblado } from "@/lib/utils/relations";
import { segmentoDeTipo } from "@/lib/repuestos/anidado";
import type { Marca, MarcasMaquinaria, TiposEquipo, TiposMaquinaria } from "@/payload-types";

/**
 * Sitemap generado desde Payload (nunca escrito a mano).
 *
 * CACHEADO desde el 2026-10-15 (antes, `force-dynamic`). Era dinámico porque
 * «lo piden pocos rastreadores y son 3 consultas»: en realidad son **15
 * consultas**, entre ellas los 351 modelos de repuesto, y cada rastreador que
 * lo pedía las repetía contra la base (`propuestas/2026-10-15-consumo-base.md`).
 *
 * EN LA CACHÉ DE DATOS desde el 2026-10-19 (antes, ruta ISR con
 * `revalidate`). Medido en un preview: en Vercel, `revalidatePath("/sitemap.xml")`
 * NO regeneraba la copia ISR de esta ruta —ni desde los ganchos ni desde
 * `POST /api/revalidar/`; la página seguía «HIT» con su edad creciendo—, así
 * que solo se renovaba por la vigencia de 1 h. La etiqueta de la caché de
 * datos sí se invalida (como los listados), por eso:
 *
 * - las ENTRADAS van en `unstable_cache` con la etiqueta `datos:sitemap` (y
 *   las de usados y nueva), que invalidan `revalidarIndices` (ganchos del
 *   catálogo) y `POST /api/revalidar/`; vigencia de 1 h como red;
 * - la RUTA es dinámica: cada petición sirve las entradas en caché, sin tocar
 *   la base (las 15 consultas solo corren al renovar la entrada).
 *
 * Cuenta para ocultar una marca de nueva (`src/lib/nueva/visibilidad.ts`):
 * sin esto, sus URL seguían en el sitemap hasta una hora.
 *
 * SOBRE EL LÍMITE DE 50.000 URLs: hoy son ~96 (y ~400 con los datos reales, 648
 * contando toda la migración), menos del 1,5 % del límite —y muy lejos también
 * del tope de 50 MB. Se deja **un solo sitemap**: segmentar ahora añadiría un
 * índice y varias rutas para cero beneficio, y complicaría la depuración.
 * Cuando se acerque a las 50.000 URLs, Next ofrece `generateSitemaps()` para
 * partirlo por sección sin cambiar el resto del diseño.
 */
export const dynamic = "force-dynamic";

/** Vigencia de las entradas en caché, como red si algún gancho no la invalida. */
export const VIGENCIA_SITEMAP = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return entradasEnCache();
}

const entradasEnCache = unstable_cache(() => entradas(), ["sitemap", CLAVE_DESPLIEGUE], {
  tags: [ETIQUETAS_DATOS.sitemap, ETIQUETAS_DATOS.nueva, ETIQUETAS_DATOS.usados],
  revalidate: VIGENCIA_SITEMAP,
});

async function entradas(): Promise<MetadataRoute.Sitemap> {
  const [
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
    marcasLubricante,
    articulos,
    categoriasBlog,
    inventarioUsados,
    marcasUsada,
    categoriasLubricante,
  ] = await Promise.all([
    getMarcas(),
    getCategoriasRepuestos(),
    getTipos(),
    getModelos(),
    getPaginas(),
    getMarcasMaquinaria(),
    getTiposMaquinaria(),
    getEquiposNuevos(),
    getCategoriasMaquinaria(),
    getCategoriasUsada(),
    getMarcasLubricante(),
    getArticulos(),
    getCategoriasBlog(),
    getInventarioUsados(),
    getMarcasUsada(),
    getCategoriasLubricante(),
  ]);

  const conEquipos = tiposConEquipos(equiposNuevos, tiposMaquinaria);

  return buildSitemapEntries({
    paginas: paginas.map((pagina) => ({ slug: pagina.slug, updatedAt: pagina.updatedAt })),

    marcas: marcas.map((marca) => ({ slug: marca.slug, updatedAt: marca.updatedAt })),

    categoriasRepuestos: categoriasRepuestos.map((c) => ({
      slug: c.slug,
      updatedAt: c.updatedAt,
    })),

    tipos: tipos.flatMap((tipo) => {
      const marca = poblado<Marca>(tipo.marca);
      // Sin marca poblada no se puede construir la URL: se omite.
      // Un tipo anidado (src/lib/repuestos/anidado.ts) lleva el slug de su padre delante.
      return marca
        ? [{ slug: segmentoDeTipo(tipo), updatedAt: tipo.updatedAt, marcaSlug: marca.slug }]
        : [];
    }),

    modelos: modelos.flatMap((modelo) => {
      const marca = poblado<Marca>(modelo.marca);
      const tipo = poblado<TiposEquipo>(modelo.tipo);
      if (!marca || !tipo) return [];
      return [
        {
          slug: modelo.slug,
          updatedAt: modelo.updatedAt,
          marcaSlug: marca.slug,
          tipoSlug: segmentoDeTipo(tipo),
        },
      ];
    }),

    // --- Maquinaria ---------------------------------------------------------
    marcasMaquinaria: marcasMaquinaria.map((marca) => ({
      slug: marca.slug,
      updatedAt: marca.updatedAt,
    })),

    // D4 (dirección, 2026-10-14): un tipo de nueva sin equipos no sale aquí.
    // Vuelve en cuanto tenga uno.
    tiposMaquinaria: tiposMaquinaria.flatMap((tipo) => {
      const marca = poblado<MarcasMaquinaria>(tipo.marca);
      if (!marca || !conEquipos.has(tipo.id)) return [];
      return [{ slug: tipo.slug, updatedAt: tipo.updatedAt, marcaSlug: marca.slug }];
    }),

    equiposNuevos: equiposNuevos.flatMap((equipo) => {
      const marca = poblado<MarcasMaquinaria>(equipo.marca);
      const tipo = poblado<TiposMaquinaria>(equipo.tipo);
      if (!marca || !tipo) return [];
      return [
        {
          slug: equipo.slug,
          updatedAt: equipo.updatedAt,
          marcaSlug: marca.slug,
          tipoSlug: tipo.slug,
        },
      ];
    }),

    categoriasNueva: categoriasNueva.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),

    // D4 (dirección, 2026-10-13 y 2026-10-14): una categoría de usada sin
    // unidades disponibles no sale aquí, tampoco las heredadas del sitio
    // actual. Vuelve en cuanto tenga una.
    categoriasUsada: categoriasUsada
      .filter((c) => inventarioUsados.some((u) => u.categoria === c.id))
      .map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),

    // «Otros» de usados (2026-10-19): sus categorías agrupadas con unidades.
    categoriasOtrosUsada: categoriasUsada
      .filter((c) => vaEnOtros(c) && inventarioUsados.some((u) => u.categoria === c.id))
      .map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),

    // Las unidades DISPONIBLES con dirección web; el inventario ya excluye las vendidas.
    unidadesUsada: inventarioUsados.flatMap((u) =>
      u.slug && u.categoriaRef
        ? [{ slug: u.slug, categoriaSlug: u.categoriaRef.slug, updatedAt: u.updatedAt }]
        : [],
    ),

    // D4: una marca de usada solo con unidades disponibles.
    marcasUsada: marcasUsada
      .filter((m) => inventarioUsados.some((u) => u.marcaUsada === m.id))
      .map((m) => ({ slug: m.slug, updatedAt: m.updatedAt })),

    // --- Lubricantes --------------------------------------------------------
    marcasLubricante: marcasLubricante.map((m) => ({ slug: m.slug, updatedAt: m.updatedAt })),
    categoriasLubricante,

    // --- Blog ---------------------------------------------------------------
    articulos: articulos.map((a) => ({ slug: a.slug, updatedAt: a.updatedAt })),

    categoriasBlog: categoriasBlog.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),
  });
}
