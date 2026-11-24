/**
 * LA GUARDA DE LOS SCRIPTS DE PRUEBA (tanda 21, tarea 8, 2026-11-23; dirección). Un script que
 * escribe para PROBAR algo (las verificaciones por efecto de `scripts/qa`, las siembras de prueba)
 * solo corre contra una base de prueba: la rama `development`, la del preview o un Postgres local (el
 * de CI). Con cualquier otra, y sobre todo con la del sitio publicado, se niega ANTES de conectar.
 *
 * Motivo: el 2026-11-23 apareció en el listado publicado una unidad usada «Test segunda pasada».
 * Esa vino del panel, no de un script, pero un script de prueba lanzado con la variable equivocada
 * habría dejado lo mismo. Las siembras del preview ya tenían su guarda (`puedeTocarHeroDePrueba`);
 * esta cubre el resto. `guardaScripts.test.ts` exige una guarda en todo script de `scripts/` que
 * escriba, salvo los de runbook, que van en una lista con su motivo.
 */
import { HOST_DEVELOPMENT } from "../demo/copiaDemo";
import { HOST_PREVIEW, hostDeConexion } from "./vaciadoSolicitudes";

/** Un Postgres en esta máquina (el de CI, o uno de pruebas). */
const LOCALES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export type VeredictoBase =
  { permitido: true; host: string } | { permitido: false; motivo: string };

/** ¿Es `databaseUri` una base de prueba? (`development`, el preview o un Postgres local). */
export function esBaseDePrueba(databaseUri: string | undefined): VeredictoBase {
  const uri = databaseUri?.trim();
  if (!uri) return { permitido: false, motivo: "sin DATABASE_URI" };
  const host = hostDeConexion(uri);
  if (host && (host === HOST_DEVELOPMENT || host === HOST_PREVIEW || LOCALES.has(host)))
    return { permitido: true, host };
  return {
    permitido: false,
    motivo: `la base «${host ?? "ilegible"}» no es de prueba (development, preview o local)`,
  };
}

/**
 * Para la primera línea de un script de prueba: lanza un error (y `payload run` sale con 1) si la
 * base no es de prueba. Se llama ANTES de cargar la config de Payload, así no llega a conectar.
 */
export function exigirBaseDePrueba(
  area: string,
  databaseUri: string | undefined = process.env.DATABASE_URI,
): string {
  const v = esBaseDePrueba(databaseUri);
  if (!v.permitido) throw new Error(`[${area}] se niega: ${v.motivo}.`);
  return v.host;
}
