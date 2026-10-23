import { rutas } from "@/lib/routes";

/**
 * Páginas 2 en adelante del ANTIGUO listado de maquinaria nueva. Desde el 2026-10-22 el índice
 * ya no es un listado (dirección: el marketplace es solo para usados), así que estas URL —con o
 * sin filtros en la query— dan 301 al índice, sin query: nunca 404. Desde el 2026-10-23 (dirección)
 * el índice es el de tipos: la página de «Por marca» / «Por tipo» también da 301 allí, así que
 * van directas, en un solo salto.
 */
function alIndice(peticion: Request): Response {
  return new Response(null, {
    status: 301,
    headers: { Location: new URL(`${rutas.nuevaTipos()}/`, peticion.url).toString() },
  });
}

export const GET = alIndice;
export const HEAD = alIndice;
