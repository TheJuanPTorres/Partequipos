import { ORDEN_ARRASTRE } from "../ordenArrastre";

/**
 * LAS LISTAS ORDENABLES SE ABREN SIEMPRE POR SU ARRASTRE (tanda 23, dirección; Juan Pablo se atascó
 * en «Categorías de maquinaria usada»).
 *
 * Payload 3.89 (`views/List/index.js`) ordena la lista por la PREFERENCIA guardada del usuario y
 * solo sin ella por el `defaultSort`: quien una vez pulsó otra columna volvía a entrar así y no
 * podía arrastrar. Al ENTRAR en la lista de una colección ordenable sin `sort` en la dirección, el
 * proxy redirige a la misma con `sort=_order` (lo demás de la query se conserva). Si el usuario
 * ordena por otra columna durante la visita, la dirección lleva ese `sort` y se respeta.
 *
 * No toca la base: Payload guarda el `sort` de la dirección en la preferencia del usuario, lo mismo
 * que cuando pulsa la columna «Orden». Sin Payload aquí (lo usa el proxy): la lista sale de
 * `ORDEN_ARRASTRE`, que `ordenArrastre.test.ts` compara con la configuración.
 */
export const LISTAS_ORDENABLES: ReadonlySet<string> = new Set(
  Object.entries(ORDEN_ARRASTRE)
    .filter(([, campo]) => campo === "_order")
    .map(([slug]) => slug),
);

const LISTA = /^\/admin\/collections\/([^/]+)\/?$/;

/** La dirección a la que redirigir, o `null` si la petición sigue su curso. */
export function entradaListaOrdenable(url: URL): URL | null {
  const m = LISTA.exec(url.pathname);
  const slug = m?.[1];
  if (!slug || !LISTAS_ORDENABLES.has(slug)) return null;
  if (url.searchParams.has("sort")) return null;
  const destino = new URL(url.toString());
  destino.searchParams.set("sort", "_order");
  return destino;
}
