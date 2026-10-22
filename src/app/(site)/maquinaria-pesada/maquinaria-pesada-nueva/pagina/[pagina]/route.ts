import { rutas } from "@/lib/routes";

/**
 * Páginas 2 en adelante del ANTIGUO listado de maquinaria nueva. Desde el 2026-10-22 el índice
 * ya no es un listado (dirección: el marketplace es solo para usados), así que estas URL —con o
 * sin filtros en la query— dan 301 al índice, sin query: nunca 404.
 */
function alIndice(peticion: Request): Response {
  return new Response(null, {
    status: 301,
    headers: { Location: new URL(`${rutas.nueva()}/`, peticion.url).toString() },
  });
}

export const GET = alIndice;
export const HEAD = alIndice;
