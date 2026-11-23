import config from "@payload-config";
import { draftMode, headers } from "next/headers";
import { getPayload } from "payload";

/**
 * ¿Esta petición ve el BORRADOR? Solo si el modo borrador de Next está activo (la cookie que pone
 * `/api/borrador/` tras comprobar la sesión) Y la petición trae una sesión del panel. Si caduca la
 * sesión, vuelve a ver lo publicado aunque la cookie siga.
 *
 * `draftMode()` no hace dinámica una página estática; `headers()` solo se lee con el modo activo,
 * así que las visitas normales siguen saliendo de la caché. Fuera de una petición de Next (un
 * script, una prueba), `draftMode()` lanza: entonces, lo publicado.
 */
export async function vistaPreviaActiva(): Promise<boolean> {
  let activo = false;
  try {
    activo = (await draftMode()).isEnabled;
  } catch {
    return false;
  }
  if (!activo) return false;
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  return Boolean(user);
}
