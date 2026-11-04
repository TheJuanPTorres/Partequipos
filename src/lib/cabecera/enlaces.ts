import { esDelSitio } from "../pie";

/**
 * Un enlace de la barra de la cabecera. `externo`: una dirección https:// de
 * otro sitio (la tienda del cliente, 2026-10-27), que se pinta como botón oscuro
 * en su sitio de la fila (2026-11-03) y se abre en una pestaña nueva.
 */
export type EnlaceCabecera = { etiqueta: string; href: string; externo?: boolean };

/** Filas de «Enlaces del menú» (2026-11-04: de 6 a 8, «Transporte» e «Industrial»). */
export const MAX_ENLACES_CABECERA = 8;

/**
 * «Enlace» de una fila: obligatorio solo si la fila se muestra (2026-11-04). Así
 * una fila se puede crear con «Mostrar en el menú» desmarcado antes de tener su
 * dirección; no ocupa sitio en la barra ni en el menú del móvil. El formato lo
 * comprueba `validarEnlace` aparte.
 */
export function enlaceDeFilaObligatorio(
  valor: unknown,
  mostrar: boolean | null | undefined,
): true | string {
  if (mostrar === false) return true;
  if (typeof valor === "string" && valor.trim() !== "") return true;
  return "Escribe el enlace, o desmarca «Mostrar en el menú» hasta tenerlo.";
}

type FilaEnlace = {
  mostrar?: boolean | null;
  etiqueta?: string | null;
  enlace?: string | null;
};

/**
 * Las filas de «Enlaces del menú» del global `cabecera`, listas para pintar y
 * en su orden. No salen las que tienen «Mostrar» desmarcado ni las que no
 * tienen texto o destino. Una fila guardada antes de existir la casilla
 * (`mostrar` vacío) se muestra.
 */
export function enlacesDeCabecera(
  filas: readonly FilaEnlace[] | null | undefined,
): EnlaceCabecera[] {
  return (filas ?? []).flatMap((e) => {
    const etiqueta = e.etiqueta?.trim();
    const href = e.enlace?.trim();
    if (e.mostrar === false || !etiqueta || !href) return [];
    const externo = !href.startsWith("/") && !esDelSitio(href);
    return [{ etiqueta, href, ...(externo ? { externo } : {}) }];
  });
}
