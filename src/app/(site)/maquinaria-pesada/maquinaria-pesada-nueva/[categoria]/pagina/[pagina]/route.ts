import { rutas } from "@/lib/routes";

/**
 * Páginas 2 en adelante del ANTIGUO listado de una categoría de nueva. Desde el 2026-10-22 la
 * categoría ya no es un listado (dirección: en nueva no hay catálogo con filtros), así que estas
 * URL —con o sin filtros en la query— dan 301 a la categoría, sin query: nunca 404. Si la
 * categoría no existe, la propia categoría da su 404.
 */
async function aLaCategoria(
  peticion: Request,
  { params }: { params: Promise<{ categoria: string }> },
): Promise<Response> {
  const { categoria } = await params;
  return new Response(null, {
    status: 301,
    headers: {
      Location: new URL(`${rutas.categoriaNueva(categoria)}/`, peticion.url).toString(),
    },
  });
}

export const GET = aLaCategoria;
export const HEAD = aLaCategoria;
