import { revalidatePath } from "next/cache";

import { rutas } from "./routes";

/**
 * Revalidación granular del catálogo (ISR), disparada por hooks de Payload.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ `revalidatePath` Y NO `revalidateTag`
 * ---------------------------------------------------------------------------
 * `revalidateTag` invalida entradas del *Data Cache*, y solo existen entradas
 * etiquetadas si los datos se obtienen con `fetch(..., { next: { tags } })` o se
 * envuelven en `unstable_cache` / `cacheTag`. Aquí los datos vienen de la **API
 * local de Payload** (`payload.find`, CLAUDE.md §3.2), que no pasa por `fetch`
 * y por tanto no genera entradas etiquetadas.
 *
 * Lo que sí existe es el *Full Route Cache*: cada ruta del catálogo es HTML
 * prerenderizado por `generateStaticParams`. La unidad de invalidación real es
 * **la ruta**, así que `revalidatePath` ataca exactamente lo que hay que
 * refrescar, sin una capa extra de envoltorios de caché.
 *
 * Alternativa considerada y descartada: envolver cada consulta en
 * `unstable_cache` con tags (`marca:<slug>`, `tipo:<id>`, …). Añade una segunda
 * capa de caché y un esquema de nombres que mantener, para invalidar igualmente
 * las mismas rutas. No compensa mientras el acceso a datos sea la API local.
 *
 * ---------------------------------------------------------------------------
 * GRAFO DE DEPENDENCIAS
 * ---------------------------------------------------------------------------
 * Dónde aparece cada entidad determina qué hay que revalidar al cambiarla:
 *
 *   Marca aparece en:  índice de repuestos (conteo) · índice de marcas ·
 *                      su propia página · migas de sus tipos y modelos
 *   Tipo aparece en:   página de su marca (listado) · su propia página ·
 *                      migas de sus modelos
 *   Modelo aparece en: página de su tipo (listado) · su propia ficha
 *
 * Por tanto:
 *
 *   cambia MODELO  -> ficha del modelo + página del tipo (donde se lista)
 *   cambia TIPO    -> página del tipo + página de la marca + fichas de sus
 *                     modelos (las migas muestran el nombre del tipo)
 *   cambia MARCA   -> página de la marca + índice de marcas + índice de
 *                     repuestos + todo el subárbol (tipos y modelos: sus migas
 *                     muestran el nombre de la marca)
 *
 * Si cambia un SLUG, además hay que revalidar la ruta ANTERIOR (queda huérfana)
 * y el subárbol, porque las URLs hijas cuelgan del slug del padre.
 */

/** Ejecuta `revalidatePath` sin permitir que un fallo rompa el guardado. */
function revalidar(path: string, motivo: string): void {
  try {
    revalidatePath(path);
  } catch (error) {
    // CLAUDE.md §5: sin console.log; los errores van a Sentry (tarea 0.4).
    // Nunca se relanza: el editor debe poder guardar aunque la revalidación falle.
    console.error(`[revalidación] falló ${path} (${motivo}):`, error);
  }
}

/** Revalida una lista de rutas, deduplicando. */
export function revalidarRutas(paths: string[], motivo: string): void {
  for (const path of new Set(paths)) {
    revalidar(path, motivo);
  }
}

/** Rutas afectadas por un cambio en una MARCA. */
export function rutasDeMarca(
  marcaSlug: string,
  hijos: { tipoSlug: string; modeloSlugs: string[] }[],
): string[] {
  const paths = [rutas.repuestos(), rutas.marcas(), rutas.marca(marcaSlug)];

  // El subárbol también depende del slug de la marca (URL) y de su nombre (migas).
  for (const { tipoSlug, modeloSlugs } of hijos) {
    paths.push(rutas.tipo(marcaSlug, tipoSlug));
    for (const modeloSlug of modeloSlugs) {
      paths.push(rutas.modelo(marcaSlug, tipoSlug, modeloSlug));
    }
  }

  return paths;
}

/** Rutas afectadas por un cambio en un TIPO. */
export function rutasDeTipo(marcaSlug: string, tipoSlug: string, modeloSlugs: string[]): string[] {
  const paths = [
    rutas.marca(marcaSlug), // el tipo se lista aquí
    rutas.tipo(marcaSlug, tipoSlug),
  ];

  // Las fichas de sus modelos muestran el nombre del tipo en las migas.
  for (const modeloSlug of modeloSlugs) {
    paths.push(rutas.modelo(marcaSlug, tipoSlug, modeloSlug));
  }

  return paths;
}

/** Rutas afectadas por un cambio en un MODELO. */
export function rutasDeModelo(marcaSlug: string, tipoSlug: string, modeloSlug: string): string[] {
  return [
    rutas.tipo(marcaSlug, tipoSlug), // el modelo se lista aquí
    rutas.modelo(marcaSlug, tipoSlug, modeloSlug),
  ];
}
