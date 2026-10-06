"use client";

import { createClientUploadHandler, getFileKey } from "@payloadcms/plugin-cloud-storage/client";
import { upload } from "@vercel/blob/client";
import { formatAdminURL } from "payload/shared";

import { avisoAntesDeSubir } from "@/lib/blob/subidaDirecta";

/**
 * MANEJADOR DE LA SUBIDA DIRECTA EN EL NAVEGADOR (CLAUDE.md §10.39).
 *
 * Es el `VercelBlobClientUploadHandler` del adaptador 3.89.0 con UNA cosa más:
 * ANTES de pedir el permiso comprueba tipo y tamaño con las reglas de la
 * colección y, si no valen, lanza nuestro aviso en español. El formulario del
 * panel lo enseña en un aviso (`errorToast`) y no se sube nada. Sin esto, el
 * aviso lo daba Vercel, en inglés y después de empezar a subir.
 *
 * Lo pone en su sitio `endurecerSubidaDirecta` (sustituye al del adaptador).
 */

/** Último segmento de la ruta, como el manejador del adaptador. */
function nombreBase(clave: string): string {
  const limpio = clave.replace(/^\/+/, "");
  const barra = limpio.lastIndexOf("/");
  return barra === -1 ? limpio : limpio.slice(barra + 1);
}

type Extra = { addRandomSuffix?: boolean; useCompositePrefixes?: boolean };

export const ManejadorSubidaDirecta = createClientUploadHandler<Extra>({
  handler: async ({
    apiRoute,
    collectionSlug,
    docPrefix,
    extra: { addRandomSuffix, useCompositePrefixes = false },
    file,
    prefix,
    serverHandlerPath,
    serverURL,
    updateFilename,
  }) => {
    const aviso = avisoAntesDeSubir(collectionSlug, file);
    if (aviso) throw new Error(aviso);

    const ruta = formatAdminURL({ apiRoute, path: serverHandlerPath, serverURL });
    const { fileKey, sanitizedDocPrefix } = getFileKey({
      collectionPrefix: prefix,
      docPrefix,
      filename: file.name,
      useCompositePrefixes,
    });
    const resultado = await upload(fileKey, file, {
      access: "public",
      clientPayload: collectionSlug,
      contentType: file.type,
      handleUploadUrl: ruta,
    });
    if (addRandomSuffix) updateFilename(decodeURIComponent(nombreBase(resultado.pathname)));
    return { prefix: sanitizedDocPrefix };
  },
});
