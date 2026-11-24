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
 * máquina, porque algunos interpretan fechas sin desfase y cambiarles la zona movería los datos. El
 * sitio no cambia: lo que formatea fechas fija su zona (`timeZone`). Se fija al cargar
 * `payload.config.ts`, antes del primer formateo (la zona se resuelve en el primer uso).
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
