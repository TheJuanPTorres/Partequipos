import { createHash, timingSafeEqual } from "node:crypto";

/**
 * TOKEN DE LA RUTA DE REVALIDACIÓN (2026-10-18, dirección).
 *
 * `POST /api/revalidar/` vacía la caché del sitio desplegado (ver
 * `src/app/(site)/api/revalidar/route.ts`). La llaman los runbooks al final de
 * cada importación por script, porque un script corre fuera de Next y sus
 * ganchos no pueden revalidar nada.
 *
 * Secreto PROPIO (`REVALIDACION_TOKEN`), distinto del de lectura de la API:
 * revalidar no lee ni escribe datos, pero obliga a repintar todo el sitio (y a
 * consultar la base) en las visitas siguientes. Va en la cabecera
 * `x-partequipos-revalidar`, nunca en la URL.
 *
 * FALLA CERRADO: sin variable, o con una de menos de `LONGITUD_MINIMA_REVALIDACION`
 * caracteres, ningún valor vale.
 */
export const CABECERA_REVALIDACION = "x-partequipos-revalidar";
export const LONGITUD_MINIMA_REVALIDACION = 32;

const huella = (texto: string) => createHash("sha256").update(texto, "utf8").digest();

/** ¿Trae la petición el token correcto? En tiempo constante; nunca lo registra. */
export function tokenDeRevalidacionValido(
  cabeceras: Pick<Headers, "get"> | undefined | null,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const esperado = env.REVALIDACION_TOKEN?.trim();
  if (!esperado || esperado.length < LONGITUD_MINIMA_REVALIDACION) return false;
  const recibido = cabeceras?.get(CABECERA_REVALIDACION)?.trim();
  if (!recibido) return false;
  return timingSafeEqual(huella(recibido), huella(esperado));
}
