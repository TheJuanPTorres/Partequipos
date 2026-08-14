import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Utilidades compartidas por los scripts de respaldo.
 *
 * No cargan Payload a propósito: un respaldo tiene que poder ejecutarse aunque
 * la aplicación no arranque. Si el CMS está roto es justo cuando más falta hace.
 */

/**
 * Lee `DATABASE_URI` del entorno y, si no está, de los `.env` locales.
 *
 * Mismo criterio que `scripts/db/check-migrations.ts`: en un servidor la
 * variable llega por el entorno; en una máquina de desarrollo vive en
 * `.env.local`, que `tsx` no carga por su cuenta.
 */
export function leerConexion(): string {
  const delEntorno = process.env.DATABASE_URI?.trim();
  if (delEntorno) return delEntorno;

  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  for (const fichero of [".env.local", ".env"]) {
    const ruta = path.join(raiz, fichero);
    if (!fs.existsSync(ruta)) continue;
    const m = fs.readFileSync(ruta, "utf8").match(/^DATABASE_URI=(.+)$/m);
    if (m?.[1]) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

/**
 * Etiqueta legible del entorno, deducida del host y de la base.
 *
 * Sirve para nombrar el fichero y, sobre todo, para que al restaurar se vea de
 * un vistazo de dónde salió: restaurar un respaldo de producción sobre
 * desarrollo (o al revés) es un error caro y silencioso.
 */
export function nombreDeEntorno(conexion: string): string {
  try {
    const u = new URL(conexion);
    const base = u.pathname.slice(1) || "desconocida";
    const host = u.hostname;

    if (/\blocalhost\b|127\.0\.0\.1/.test(host)) return `local-${base}`;

    // Neon mete la rama en el host: ep-<algo>-<rama>.
    const m = host.match(/^ep-([a-z0-9-]+?)(?:-pooler)?\./);
    return m?.[1] ? `${m[1]}-${base}` : base;
  } catch {
    return "desconocido";
  }
}

/** ¿La cadena apunta a algo que parece producción? Se usa para pedir confirmación. */
export function pareceProduccion(conexion: string): boolean {
  const s = conexion.toLowerCase();
  return /prod|production/.test(s);
}
