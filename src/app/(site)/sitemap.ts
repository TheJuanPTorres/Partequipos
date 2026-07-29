import type { MetadataRoute } from "next";

import { getMarcas } from "@/lib/queries/getMarcas";
import { getModelos } from "@/lib/queries/getModelos";
import { getTipos } from "@/lib/queries/getTipos";
import { buildSitemapEntries } from "@/lib/seo/sitemap";
import { poblado } from "@/lib/utils/relations";
import type { Marca, TiposEquipo } from "@/payload-types";

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
  const [marcas, tipos, modelos] = await Promise.all([getMarcas(), getTipos(), getModelos()]);

  return buildSitemapEntries({
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
  });
}
