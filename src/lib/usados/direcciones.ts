/**
 * Dirección web (slug) y 301 de cada unidad que viene de WordPress
 * (2026-10-16). Puro: el importador lo llama con las unidades ya normalizadas
 * y la prueba con serial lo comprueba contra la exportación real.
 */
import { rutas } from "../routes";
import { rutaAntiguaDeUnidad, slugDeUnidad, slugLibre } from "./urls";

export type UnidadParaDireccion = {
  idWp: number;
  /** URL de la unidad en WordPress (`enlace` de la exportación). */
  enlace: string;
  /** Slug de su categoría en `categorias-usada`. */
  categoria: string;
  /** Nombre compuesto de la unidad, SIN serial. */
  nombre: string;
};

export type DireccionUnidad = {
  idWp: number;
  categoria: string;
  slug: string;
  /** Ruta nueva, sin barra final. */
  hacia: string;
  /** Ruta antigua de WordPress, sin barra final; `null` si el enlace no es de esa raíz. */
  desde: string | null;
};

/**
 * Slug único dentro de su categoría. Se asigna por orden de `idWp` (estable):
 * la primera unidad se queda con el slug base y, si otra lo repite, lleva el
 * id de WordPress al final.
 */
export function direccionesDeUnidades(unidades: UnidadParaDireccion[]): DireccionUnidad[] {
  const ocupados = new Map<string, Set<string>>();
  return [...unidades]
    .sort((a, b) => a.idWp - b.idWp)
    .map((u) => {
      const usados = ocupados.get(u.categoria) ?? new Set<string>();
      ocupados.set(u.categoria, usados);
      const slug = slugLibre(slugDeUnidad(u.nombre), usados, u.idWp);
      usados.add(slug);
      return {
        idWp: u.idWp,
        categoria: u.categoria,
        slug,
        hacia: rutas.unidadUsada(u.categoria, slug),
        desde: rutaAntiguaDeUnidad(u.enlace),
      };
    });
}
