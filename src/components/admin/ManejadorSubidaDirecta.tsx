"use client";

import { createClientUploadHandler, getFileKey } from "@payloadcms/plugin-cloud-storage/client";
import { toast } from "@payloadcms/ui";
import { upload } from "@vercel/blob/client";
import { formatAdminURL } from "payload/shared";

import { avisoAntesDeSubir } from "@/lib/blob/subidaDirecta";
import { avisoDeOriginalPesado, avisoDeTope } from "@/lib/media/reducirImagen";

import { reducirEnNavegador } from "./reducirEnNavegador";

/**
 * MANEJADOR DE LA SUBIDA DIRECTA EN EL NAVEGADOR (CLAUDE.md §10.39).
 *
 * Es el `VercelBlobClientUploadHandler` del adaptador 3.89.0 con UNA cosa más:
 * ANTES de pedir el permiso comprueba tipo y tamaño con las reglas de la
 * colección y, si no valen, lanza nuestro aviso en español. El formulario del
 * panel lo enseña en un aviso (`errorToast`) y no se sube nada. Sin esto, el
 * aviso lo daba Vercel, en inglés y después de empezar a subir.
 *
 * IMÁGENES (dirección, 2026-11-20): antes de subir, una imagen se reduce sola a 3840 px de ancho
 * como mucho (sin ampliar nunca) y pasa a WebP (`reducirEnNavegador`). El tope de 15 MB se mira
 * DESPUÉS de reducir, así que una foto de cámara de 25 MB ya se puede subir; si el original pesaba
 * demasiado, además se avisa (sin impedir la subida). El servidor comprueba después el contenido
 * y el tamaño reales, como siempre.
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
    file: elegido,
    prefix,
    serverHandlerPath,
    serverURL,
    updateFilename,
  }) => {
    let file = elegido;
    if (collectionSlug === "media") {
      // Tipo y nombre, antes de abrirla; el peso se mira con lo que se vaya a subir.
      const previo = avisoAntesDeSubir(collectionSlug, {
        name: file.name,
        type: file.type,
        size: 0,
      });
      const tope = previo ?? avisoDeTope(file);
      if (tope) throw new Error(tope);
      const reducida = await reducirEnNavegador(file);
      file = reducida.file;
      const pesado = avisoDeOriginalPesado(
        { name: elegido.name, size: elegido.size, medidas: reducida.original },
        { size: file.size, medidas: reducida.subida, type: file.type, cambiada: reducida.cambiada },
      );
      const aviso = avisoAntesDeSubir(collectionSlug, file);
      if (aviso) throw new Error(aviso);
      if (pesado) toast.warning(pesado, { duration: 12000 });
    } else {
      const aviso = avisoAntesDeSubir(collectionSlug, file);
      if (aviso) throw new Error(aviso);
    }

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
    // El nombre que se guarda es el del fichero subido (con sufijo, o con la extensión nueva).
    if (addRandomSuffix || file !== elegido) {
      updateFilename(decodeURIComponent(nombreBase(resultado.pathname)));
    }
    return { prefix: sanitizedDocPrefix };
  },
});
