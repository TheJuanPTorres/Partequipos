import { ValidationError } from "payload";
import type { CollectionBeforeValidateHook, CollectionSlug, PayloadRequest } from "payload";

/**
 * Guardarraíl de unicidad de slug ENTRE dos colecciones.
 *
 * EL PROBLEMA. Los artículos del blog viven en `/{slug}/`, el mismo espacio de
 * nombres que las páginas institucionales (`/nosotros/`, `/contactanos/`): el
 * rastreo confirma que los 51 artículos están en profundidad 1, sin prefijo
 * `/blog/`. La ruta `[...slug]` resuelve primero página y luego artículo, así
 * que un artículo con slug `nosotros` **no daría error en ninguna parte**:
 * simplemente quedaría inalcanzable para siempre, tapado por la página.
 *
 * Eso es justo el tipo de fallo que este proyecto no quiere: silencioso, sin
 * traza y difícil de diagnosticar meses después. Se corta al guardar.
 *
 * `unique: true` de Payload NO sirve aquí: garantiza unicidad dentro de una
 * colección, y el choque es entre dos colecciones distintas (tablas distintas).
 *
 * BIDIRECCIONAL. Se instala en las dos colecciones, cada una mirando a la otra,
 * porque el choque se puede crear desde cualquiera de los dos lados.
 *
 * TAMBIÉN EN LOS SCRIPTS. Es un hook de colección, así que corre igual por la
 * API local (`payload.create`) que desde el panel. La importación masiva no
 * puede colarse por debajo — que es donde más fácil sería introducir el choque
 * sin darse cuenta.
 */

/** Comprueba si un slug ya existe en `coleccion`. Aislado para poder probarlo. */
export type BuscadorDeSlug = (slug: string) => Promise<boolean>;

/**
 * Núcleo de la validación, sin Payload de por medio.
 *
 * Devuelve el mensaje de error, o `null` si el slug está libre. Se separa del
 * hook para poder probar las dos direcciones sin base de datos.
 */
export async function comprobarSlugLibre(
  slug: string | undefined | null,
  etiquetaOtraColeccion: string,
  existeEnLaOtra: BuscadorDeSlug,
): Promise<string | null> {
  const limpio = (slug ?? "").trim();
  // Sin slug no hay nada que comprobar: de eso ya se encarga `required`.
  if (!limpio) return null;

  if (await existeEnLaOtra(limpio)) {
    return (
      `El slug "${limpio}" ya lo usa ${etiquetaOtraColeccion}. ` +
      "Las dos comparten el espacio de URLs raíz, así que una de las dos quedaría " +
      "inalcanzable. Elige otro slug."
    );
  }
  return null;
}

/**
 * Construye el hook para una colección concreta.
 *
 * @param otraColeccion  colección contra la que se comprueba
 * @param etiqueta       nombre legible de esa colección, para el mensaje
 */
export function slugUnicoFrenteA(
  otraColeccion: CollectionSlug,
  etiqueta: string,
): CollectionBeforeValidateHook {
  return async ({ data, req }) => {
    const slug = data?.slug;
    if (typeof slug !== "string") return data;

    const buscar: BuscadorDeSlug = async (valor) => {
      const { totalDocs } = await (req as PayloadRequest).payload.count({
        collection: otraColeccion,
        where: { slug: { equals: valor } },
      });
      return totalDocs > 0;
    };

    const error = await comprobarSlugLibre(slug, etiqueta, buscar);
    if (error) {
      // ValidationError deja el mensaje junto al campo `slug` en el panel, en
      // vez de soltar un error genérico de servidor.
      throw new ValidationError({
        errors: [{ path: "slug", message: error }],
      });
    }

    return data;
  };
}
