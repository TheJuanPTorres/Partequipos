/**
 * ANALÍTICA (dirección, 2026-11-20): Google Analytics 4 con aviso de cookies (Ley 1581 de 2012).
 *
 * El identificador va en `NEXT_PUBLIC_GA4_ID` («G-XXXXXXXXXX»). SIN él —o con un valor que no
 * tiene esa forma— no se carga nada: ni Analytics, ni el aviso, ni el enlace del pie.
 *
 * Con él, tampoco se carga nada hasta que el visitante acepta: el script de Google se pide solo
 * después de «Aceptar» (o de marcar «Analítica» en «Configurar»), con Consent Mode y la publicidad
 * siempre denegada. Si después lo retira, Analytics se apaga y sus cookies se borran.
 */

/** La forma de un identificador de medición de GA4. */
const FORMA_ID = /^G-[A-Z0-9]{4,20}$/;

/** El identificador de GA4 si es válido; si no, `null` (y no se carga nada). */
export function idDeGa4(valor: string | undefined): string | null {
  const id = (valor ?? "").trim();
  return FORMA_ID.test(id) ? id : null;
}

/** El de este despliegue. */
export const idGa4 = () => idDeGa4(process.env.NEXT_PUBLIC_GA4_ID);

/** Evento del navegador con el que el pie reabre el aviso («Configurar cookies»). */
export const EVENTO_ABRIR_COOKIES = "pq:cookies";
