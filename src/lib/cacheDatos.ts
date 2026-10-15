import { revalidateTag } from "next/cache";

/**
 * CACHÉ DE DATOS de los listados DINÁMICOS (2026-10-13).
 *
 * Casi todo el catálogo es HTML prerenderizado, y por eso `revalidation.ts`
 * trabaja con `revalidatePath` y no con etiquetas. Los listados con filtros
 * (maquinaria usada; decisión D3 de dirección) se pintan EN CADA PETICIÓN,
 * porque leen la query de la URL. Para no consultar la base cada vez, sus
 * datos van en `unstable_cache` con una etiqueta, y los ganchos de Payload la
 * invalidan con `revalidarDatos`.
 *
 * Por qué `unstable_cache` y no `use cache`: `use cache` exige activar Cache
 * Components en todo el sitio, que es otra tarea.
 */

/** Etiquetas de la caché de datos. Un cambio en esa colección las invalida. */
export const ETIQUETAS_DATOS = {
  /** Unidades usadas disponibles (con su primera foto) y categorías de usada. */
  usados: "datos:usados",
  /**
   * Equipos nuevos con lo que pinta su tarjeta (foto, logo de la marca, datos
   * de la ficha, PDF), marcas, tipos y categorías de maquinaria nueva: el
   * listado de «Categoría secundaria» (índice de nueva y sus categorías).
   */
  nueva: "datos:nueva",
  /**
   * El MARCO de todas las páginas: globales `cabecera`, `pie` y `seo` (empresa,
   * logo, horario) y el megamenú. Sin caché, cada visita a una página dinámica
   * (listados, buscador, 404) hacía unas 10 consultas solo para pintarlo
   * (`propuestas/2026-10-15-consumo-base.md`). La invalida
   * `revalidarTodoElSitio`, que ya llaman los ganchos de los tres globales y de
   * las 6 colecciones del megamenú.
   */
  marco: "datos:marco",
} as const;

/**
 * Va en la clave de cada entrada. La caché de Next PERSISTE ENTRE
 * DESPLIEGUES (documentación de `unstable_cache` de la versión instalada),
 * y los scripts de importación corren fuera de Next y no invalidan nada: el
 * remedio de siempre es redesplegar, y con esto sigue funcionando. Fuera de
 * Vercel (local, CI) no hay id y vale una sola clave.
 */
export const CLAVE_DESPLIEGUE =
  process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || "local";

/*
 * SIN vigencia por tiempo (`revalidate`), a propósito: la portada y el índice
 * de usada (y, con el marco, TODAS las páginas), que son estáticos, también leen estos datos, y Next les pasaría
 * esa vigencia (con una hora, el build los marcaba «Revalidate 1h»). Las
 * entradas se renuevan por etiqueta (los ganchos) y por despliegue.
 */

/**
 * Invalida una etiqueta sin dejar servir lo viejo (`expire: 0`): quien edita
 * y pulsa «Ver en el sitio» tiene que ver ya su cambio. Nunca relanza: el
 * editor tiene que poder guardar aunque esto falle.
 */
export function revalidarDatos(etiqueta: string, motivo: string): void {
  try {
    revalidateTag(etiqueta, { expire: 0 });
  } catch (error) {
    console.error(`[revalidación] falló la etiqueta ${etiqueta} (${motivo}):`, error);
  }
}
