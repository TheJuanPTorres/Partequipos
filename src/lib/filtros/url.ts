import { conConsulta, consultaCanonica } from "./leer";
import type { Catalogo, FacetaPintada, Seleccion } from "./tipos";

/** Un cambio sobre lo elegido. */
export type Cambio =
  | { alternar: { clave: string; valor: string } }
  | { quitar: { clave: string; valor: string } }
  | { orden: string }
  | { limpiar: true };

/** Lo elegido tras aplicar un cambio (sin tocar lo recibido). */
export function aplicarCambio(seleccion: Seleccion, cambio: Cambio): Seleccion {
  if ("limpiar" in cambio) return { valores: {}, orden: seleccion.orden };
  if ("orden" in cambio) return { valores: seleccion.valores, orden: cambio.orden };
  const { clave, valor } = "alternar" in cambio ? cambio.alternar : cambio.quitar;
  const actuales = seleccion.valores[clave] ?? [];
  const tiene = actuales.includes(valor);
  const nuevos =
    tiene || "quitar" in cambio ? actuales.filter((v) => v !== valor) : [...actuales, valor];
  const valores = { ...seleccion.valores };
  if (nuevos.length) valores[clave] = nuevos;
  else delete valores[clave];
  return { valores, orden: seleccion.orden };
}

/**
 * El enlace a la página 1 del listado con un cambio aplicado. Cambiar un
 * filtro u orden siempre vuelve a la página 1: la página en la que se estaba
 * puede no existir con la nueva selección.
 */
export function enlaceCon<T>(
  rutaBase: string,
  catalogo: Catalogo<T>,
  seleccion: Seleccion,
  cambio: Cambio,
): string {
  return conConsulta(rutaBase, consultaCanonica(aplicarCambio(seleccion, cambio), catalogo));
}

/** Los chips de «Selección actual»: uno por valor elegido, con el enlace que lo quita. */
export function chipsDe<T>(
  rutaBase: string,
  catalogo: Catalogo<T>,
  seleccion: Seleccion,
  facetas: FacetaPintada[],
): { clave: string; etiqueta: string; href: string }[] {
  return facetas.flatMap((f) =>
    f.opciones
      .filter((o) => o.activa)
      .map((o) => ({
        clave: `${f.clave}=${o.valor}`,
        etiqueta: o.etiqueta,
        href: enlaceCon(rutaBase, catalogo, seleccion, {
          quitar: { clave: f.clave, valor: o.valor },
        }),
      })),
  );
}

/** Las opciones de «Ordenar», con el enlace de cada una. */
export function ordenesDe<T>(
  rutaBase: string,
  catalogo: Catalogo<T>,
  seleccion: Seleccion,
): { valor: string; etiqueta: string; href: string; activa: boolean }[] {
  return catalogo.ordenes.map((o) => ({
    valor: o.valor,
    etiqueta: o.etiqueta,
    href: enlaceCon(rutaBase, catalogo, seleccion, { orden: o.valor }),
    activa: o.valor === seleccion.orden,
  }));
}

/** Cuántos valores hay elegidos en total. */
export function valoresElegidos(seleccion: Seleccion): number {
  return Object.values(seleccion.valores).reduce((n, v) => n + v.length, 0);
}
