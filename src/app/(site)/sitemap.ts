import type { MetadataRoute } from "next";

import { getArticulos, getCategoriasBlog } from "@/lib/queries/getBlog";
import { getCategoriasLubricante, getMarcasLubricante } from "@/lib/queries/getLubricantes";
import {
  getCategoriasMaquinaria,
  getCategoriasUsada,
  getEquiposNuevos,
  getMarcasMaquinaria,
  getTiposMaquinaria,
} from "@/lib/queries/getMaquinaria";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getModelos } from "@/lib/queries/getModelos";
import { getPaginas } from "@/lib/queries/getPaginas";
import { getTipos } from "@/lib/queries/getTipos";
import { buildSitemapEntries } from "@/lib/seo/sitemap";
import { poblado } from "@/lib/utils/relations";
import type {
  Marca,
  MarcasLubricante,
  MarcasMaquinaria,
  TiposEquipo,
  TiposMaquinaria,
} from "@/payload-types";

/**
 * Sitemap dinámico generado desde Payload (nunca escrito a mano).
 *
 * REFLEJA CAMBIOS SIN REBUILD: la ruta es dinámica, así que se construye en cada
 * petición leyendo la base. Un modelo publicado en el panel aparece en el
 * sitemap de inmediato, en coherencia con el ISR del catálogo.
 *
 * Por qué dinámica y no cacheada: el sitemap lo piden **rastreadores**, no
 * visitantes — son unas pocas peticiones al día. El coste (3 consultas) es
 * irrelevante frente a la ventaja de que nunca quede obsoleto. Cachearlo
 * obligaría además a invalidarlo desde los hooks de las tres colecciones, sin
 * ganancia real.
 *
 * SOBRE EL LÍMITE DE 50.000 URLs: hoy son ~96 (y ~400 con los datos reales, 648
 * contando toda la migración), menos del 1,5 % del límite —y muy lejos también
 * del tope de 50 MB. Se deja **un solo sitemap**: segmentar ahora añadiría un
 * índice y varias rutas para cero beneficio, y complicaría la depuración.
 * Cuando se acerque a las 50.000 URLs, Next ofrece `generateSitemaps()` para
 * partirlo por sección sin cambiar el resto del diseño.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    marcas,
    tipos,
    modelos,
    paginas,
    marcasMaquinaria,
    tiposMaquinaria,
    equiposNuevos,
    categoriasNueva,
    categoriasUsada,
    marcasLubricante,
    categoriasLubricante,
    articulos,
    categoriasBlog,
  ] = await Promise.all([
    getMarcas(),
    getTipos(),
    getModelos(),
    getPaginas(),
    getMarcasMaquinaria(),
    getTiposMaquinaria(),
    getEquiposNuevos(),
    getCategoriasMaquinaria(),
    getCategoriasUsada(),
    getMarcasLubricante(),
    getCategoriasLubricante(),
    getArticulos(),
    getCategoriasBlog(),
  ]);

  return buildSitemapEntries({
    paginas: paginas.map((pagina) => ({ slug: pagina.slug, updatedAt: pagina.updatedAt })),

    marcas: marcas.map((marca) => ({ slug: marca.slug, updatedAt: marca.updatedAt })),

    tipos: tipos.flatMap((tipo) => {
      const marca = poblado<Marca>(tipo.marca);
      // Sin marca poblada no se puede construir la URL: se omite.
      return marca ? [{ slug: tipo.slug, updatedAt: tipo.updatedAt, marcaSlug: marca.slug }] : [];
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
          tipoSlug: tipo.slug,
        },
      ];
    }),

    // --- Maquinaria ---------------------------------------------------------
    marcasMaquinaria: marcasMaquinaria.map((marca) => ({
      slug: marca.slug,
      updatedAt: marca.updatedAt,
    })),

    tiposMaquinaria: tiposMaquinaria.flatMap((tipo) => {
      const marca = poblado<MarcasMaquinaria>(tipo.marca);
      return marca ? [{ slug: tipo.slug, updatedAt: tipo.updatedAt, marcaSlug: marca.slug }] : [];
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

    categoriasUsada: categoriasUsada.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),

    // --- Lubricantes --------------------------------------------------------
    marcasLubricante: marcasLubricante.map((m) => ({ slug: m.slug, updatedAt: m.updatedAt })),

    categoriasLubricante: categoriasLubricante.flatMap((categoria) => {
      const marca = poblado<MarcasLubricante>(categoria.marca);
      return marca
        ? [{ slug: categoria.slug, updatedAt: categoria.updatedAt, marcaSlug: marca.slug }]
        : [];
    }),

    // --- Blog ---------------------------------------------------------------
    articulos: articulos.map((a) => ({ slug: a.slug, updatedAt: a.updatedAt })),

    categoriasBlog: categoriasBlog.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),
  });
}
