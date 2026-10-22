/**
 * MEJORAS DE LAS PÁGINAS DE REPUESTOS (dirección, 2026-10-21), cada una con su INTERRUPTOR:
 *
 * - R1: buscador de modelo en la página de tipo.
 * - R2: barra de series fija en la página de tipo.
 * - R3: «Nuestras categorías de repuestos» de la marca en tarjetas con foto (antes, píldoras).
 * - R4: «¿No encuentras tu modelo?» al final de cada serie, con la ventana del formulario.
 * - R5: buscador y orden natural (EX100, EX120, EX200…) en el panel «Ver todos».
 *
 * `MEJORAS_ACTIVAS` es el interruptor de verdad: una mejora en `false` no se pinta en ningún
 * entorno, y quitarla no toca las demás.
 *
 * PARA PROBARLAS EN EL PREVIEW (nunca en producción), la URL apaga las que no se nombren:
 * `?mejoras=R1,R3` deja solo esas dos; `?mejoras=no`, ninguna; sin parámetro, todas. Un
 * script en línea (`codigoInterruptorMejoras`) lo lee antes de pintar y pone en `<html>` el
 * atributo `data-mejoras-apagadas="R2 R4 R5"`; el CSS oculta lo apagado y los componentes con
 * JavaScript lo consultan (`mejoraApagadaEnLaPagina`). Por eso, en el preview, lo que tiene
 * dos versiones (R3) pinta las dos y el CSS elige.
 */
export const MEJORAS = ["R1", "R2", "R3", "R4", "R5"] as const;
export type Mejora = (typeof MEJORAS)[number];

export const MEJORAS_ACTIVAS: Record<Mejora, boolean> = {
  R1: true,
  R2: true,
  R3: true,
  R4: true,
  R5: true,
};

/** El atributo de `<html>` con las mejoras apagadas por la URL, separadas por espacios. */
export const ATRIBUTO_MEJORAS = "data-mejoras-apagadas";

/** Las mejoras que la URL apaga: `null` (sin parámetro), ninguna; «no», todas. */
export function mejorasApagadasPorUrl(valor: string | null): Mejora[] {
  if (valor === null) return [];
  const pedidas = valor
    .toUpperCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  return MEJORAS.filter((m) => !pedidas.includes(m));
}

/**
 * El script en línea que aplica la URL antes de pintar (solo fuera de producción). Repite la
 * lógica de `mejorasApagadasPorUrl` en JavaScript sin dependencias; las pruebas lo ejecutan.
 */
export function codigoInterruptorMejoras(): string {
  const lista = JSON.stringify(MEJORAS);
  return `(function(){try{var v=new URLSearchParams(location.search).get("mejoras");if(v===null)return;var p=v.toUpperCase().split(/[\\s,]+/).filter(Boolean);var a=${lista}.filter(function(m){return p.indexOf(m)<0});document.documentElement.setAttribute("${ATRIBUTO_MEJORAS}",a.join(" "))}catch(e){}})();`;
}

/** ¿Se prueban las mejoras con la URL? En todo entorno salvo producción. */
export function interruptoresPorUrl(): boolean {
  return process.env.VERCEL_ENV !== "production";
}

/** En el navegador: ¿la URL del preview apagó esta mejora? (En producción, nunca.) */
export function mejoraApagadaEnLaPagina(m: Mejora): boolean {
  if (typeof document === "undefined") return false;
  const apagadas = document.documentElement.getAttribute(ATRIBUTO_MEJORAS);
  return apagadas !== null && apagadas.split(" ").includes(m);
}
