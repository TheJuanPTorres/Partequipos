import { esDelSitio } from "../pie";

/**
 * Un enlace de la barra de la cabecera. `externo`: una dirección https:// de
 * otro sitio (la tienda del cliente, 2026-10-27), que se abre en una pestaña
 * nueva con el icono de enlace externo, en escritorio y en móvil.
 */
export type EnlaceCabecera = { etiqueta: string; href: string; externo?: boolean };

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
