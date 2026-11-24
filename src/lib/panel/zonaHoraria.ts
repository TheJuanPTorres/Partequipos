/**
 * LA HORA DEL PANEL ES LA DE COLOMBIA, TAMBIÉN LA QUE FORMATEA EL SERVIDOR (2026-11-24, dirección).
 *
 * Payload 3.89 formatea algunas fechas del panel EN EL SERVIDOR y sin zona horaria: las migas de la
 * comparación de versiones y el aviso de «Restaurar esta versión» (`views/Version/index.js`). En
 * Vercel el servidor está en UTC, así que salían las 17:58 mientras la lista de versiones, que se
 * formatea en el navegador, decía las 12:58. Payload no deja pasarle la zona; la única salida sin
 * tocar su código es la zona del proceso.
 *
 * Solo dentro de Next (`NEXT_RUNTIME`): los scripts de `payload run` siguen en la zona de la
 * máquina, porque algunos interpretan fechas sin desfase y cambiarles la zona movería los datos. Se
 * fija al cargar `payload.config.ts`, antes del primer formateo (la zona se resuelve en el primer
 * uso). `admin.timezones.defaultTimezone` NO sirve: la vista de versiones no la lee.
 *
 * ES UN EFECTO DE TODO EL PROCESO DE NEXT, TAMBIÉN EN EL SITIO (aprobado por dirección con esta
 * búsqueda, 2026-11-24). Se buscaron en `src` los formateos de fecha del servidor (`toLocale*`,
 * `Intl.DateTimeFormat`, date-fns, `getHours`/`getDate`/`getFullYear`…):
 * - el blog (`components/blog/fecha.ts`) fija `timeZone: "UTC"` y el panel (`lib/panel/fechas.ts`),
 *   America/Bogota: no cambian;
 * - el © del pie (`Footer.tsx`) y el año máximo de la ficha usada (`lib/panel/fichaUsada.ts`) usan
 *   `getFullYear()`: solo cambian entre las 00:00 y las 05:00 UTC del 1 de enero, al año de Colombia;
 * - `ResumenWeb.tsx` (panel) usa `Intl.DateTimeFormat` sin zona: pasa a la de Colombia, como debe;
 * - lo demás son números o ISO/UTC (`toISOString`, sitemap, JSON-LD), que no dependen de la zona.
 * QUIEN AÑADA UNA FECHA FORMATEADA EN EL SERVIDOR: con `timeZone` explícita, o saldrá en la hora
 * de Colombia; y repetir esta búsqueda si se cambia o se quita este módulo.
 */
export const ZONA_PANEL = "America/Bogota";

type Entorno = { NEXT_RUNTIME?: string; TZ?: string };

/** La zona que hay que fijar en el proceso, o `undefined` si no se toca. */
export function zonaDelProceso(env: Entorno): string | undefined {
  return env.NEXT_RUNTIME === "nodejs" ? ZONA_PANEL : undefined;
}

export function fijarZonaDelPanel(env: Entorno = process.env as Entorno): void {
  const zona = zonaDelProceso(env);
  if (zona && env.TZ !== zona) env.TZ = zona;
}
