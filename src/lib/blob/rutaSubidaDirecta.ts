import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import {
  APIError,
  Forbidden,
  type CollectionSlug,
  type Config,
  type PayloadHandler,
  type Plugin,
} from "payload";

import { permisoDeSubida } from "./subidaDirecta";

/**
 * RUTA DE LA SUBIDA DIRECTA, ENDURECIDA — prototipo (§10.39).
 *
 * El adaptador `@payloadcms/storage-vercel-blob` 3.89.0 registra
 * `POST /api/vercel-blob-client-upload-route`, que firma el permiso con el que
 * el navegador sube al Blob. Su versión firma CUALQUIER tipo y tamaño, con
 * `allowOverwrite: true`, para cualquiera con sesión. Este plugin, que va
 * DESPUÉS del adaptador en `plugins`, cambia el manejador de esa ruta por este:
 *
 * - Sesión obligatoria, y permiso de CREAR en la colección que pide.
 * - Solo colecciones de `REGLAS_SUBIDA_DIRECTA`, con su tipo y su tope: los
 *   comprueba Vercel al subir (`allowedContentTypes`, `maximumSizeInBytes`).
 * - Sin sobrescribir y con sufijo aleatorio: cada fichero es inmutable.
 * - Un nombre simple, sin carpetas.
 * - El permiso caduca a la hora (valor por defecto de Vercel).
 *
 * Lo que el permiso NO garantiza —que el contenido sea de verdad un PDF— lo
 * comprueban después los ganchos de formato, que leen el fichero subido.
 */
export const RUTA_SUBIDA_DIRECTA = "/vercel-blob-client-upload-route";

const UN_ANO = 60 * 60 * 24 * 365;

export function rutaSubidaDirecta(token: string): PayloadHandler {
  return async (req) => {
    if (!req.user) throw new Forbidden(req.t);
    const body = (await req.json?.()) as HandleUploadBody;
    try {
      const respuesta = await handleUpload({
        body,
        request: req as unknown as Request,
        token,
        onBeforeGenerateToken: async (nombre, coleccion) => {
          const permiso = permisoDeSubida(coleccion, nombre);
          if (!permiso.ok) throw new APIError(permiso.motivo, 400);
          const crear = coleccion
            ? req.payload.collections[coleccion as CollectionSlug]?.config.access?.create
            : undefined;
          const puede = typeof crear === "function" ? await crear({ req, data: {} }) : false;
          if (!puede) throw new Forbidden(req.t);
          return {
            allowedContentTypes: permiso.allowedContentTypes,
            maximumSizeInBytes: permiso.maximumSizeInBytes,
            addRandomSuffix: permiso.addRandomSuffix,
            allowOverwrite: permiso.allowOverwrite,
            cacheControlMaxAge: UN_ANO,
          };
        },
        // Vercel avisa al terminar solo si la URL es pública; no hace falta:
        // el formulario del panel guarda el documento después.
        onUploadCompleted: async () => {},
      });
      return Response.json(respuesta);
    } catch (error) {
      console.error(
        "[subida-directa] permiso denegado:",
        error instanceof Error ? error.message : error,
      );
      if (error instanceof APIError) throw error;
      throw new APIError("No se pudo autorizar la subida.", 400);
    }
  };
}

/** Plugin: sustituye el manejador del adaptador por el endurecido. */
export const endurecerSubidaDirecta =
  (token: string): Plugin =>
  (config: Config): Config => ({
    ...config,
    endpoints: (config.endpoints ?? []).map((e) =>
      e.path?.startsWith(RUTA_SUBIDA_DIRECTA) ? { ...e, handler: rutaSubidaDirecta(token) } : e,
    ),
  });
