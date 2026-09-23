import { APIError, type CollectionBeforeOperationHook } from "payload";

/**
 * CIERRA LA DESCARGA REMOTA DESDE EL SERVIDOR en las colecciones de subida
 * (`media`, `videos`). CLAUDE.md §10.32.
 *
 * EL MECANISMO, leído en Payload 3.89 (`uploads/generateFileData.js`): si una
 * operación de subida llega SIN fichero pero con `filename` y `url` en los
 * datos, y Payload cree que hay que «volver a subir» (un recorte, un cambio de
 * punto focal… o simplemente un `create`, donde el punto focal por defecto
 * 50/50 ya basta), el LAMBDA descarga esa `url` (`getExternalFile`). Es lo que
 * usa el panel para recortar una imagen ya subida, pero con la API se le puede
 * pasar CUALQUIER url.
 *
 * Lo que eso salta: nuestros ganchos de formato y tamaño miran `req.file`, que
 * en esta vía no existe; el fichero se carga entero en memoria sin tope; y una
 * `url` que empieza por «/» se completa con la cabecera `Origin` de la petición.
 *
 * EL CIERRE: una lista de permitidos de UN host, el almacén de Blob propio. Así
 * recortar, cambiar el punto focal y duplicar —que reutilizan la url del propio
 * fichero— siguen funcionando, y todo lo demás se rechaza.
 *
 * DEPENDE DE UN COMPORTAMIENTO INTERNO DE PAYLOAD: que `beforeOperation` corra
 * ANTES de `generateFileData` (create, update y updateByID en 3.89) y que la
 * url se lea de `data.url`. Revisar en cada actualización: docs/design-tokens.md,
 * tabla de defectos de Payload.
 */

/** Host público del almacén de Blob, deducido del token como hace el plugin. */
export function hostDeBlob(token: string | undefined): string | null {
  const id = token?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1];
  return id ? `${id.toLowerCase()}.public.blob.vercel-storage.com` : null;
}

/**
 * ¿Se puede dejar que Payload descargue esta url?
 *
 * - Sin url: sí (no hay descarga).
 * - https y EXACTAMENTE el host propio: sí (recorte, punto focal, duplicado).
 * - Todo lo demás —otro dominio, http, ruta relativa, host que solo contiene
 *   el nuestro, sin host propio configurado—: no.
 */
export function urlDeSubidaPermitida(url: unknown, hostPropio: string | null): boolean {
  if (url === undefined || url === null || url === "") return true;
  if (typeof url !== "string" || !hostPropio) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false; // incluye «/api/media/file/x.png»: sin base no es URL absoluta
  }
  return u.protocol === "https:" && u.hostname === hostPropio && !u.username && !u.password;
}

export const sinDescargaRemota: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== "create" && operation !== "update") return args;
  // Con fichero en la petición, Payload usa ese fichero y no descarga nada.
  if (req.file?.data && Buffer.isBuffer(req.file.data) && req.file.data.length > 0) return args;

  const url = (args as { data?: { url?: unknown } }).data?.url;
  if (urlDeSubidaPermitida(url, hostDeBlob(process.env.BLOB_READ_WRITE_TOKEN))) return args;

  /*
   * 400: es un dato de entrada no admitido. El mensaje no repite la url: no se
   * devuelven al cliente datos que él mismo mandó para sondear (§8).
   */
  throw new APIError(
    "No se admite traer un archivo desde una dirección externa. Descárgalo y súbelo desde tu equipo.",
    400,
  );
};
