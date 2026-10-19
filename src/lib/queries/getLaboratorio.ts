import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { Media, Video } from "@/payload-types";

/**
 * Datos del LABORATORIO del preview (páginas de muestra que 404 en
 * producción). Solo para la muestra de servicio técnico (2026-10-19): los tres
 * ficheros que faltaban frente a WordPress (`importar.ts solo=faltantes`) aún
 * no cuelgan de ningún bloque —dónde van lo decide el diseño que se apruebe—,
 * así que la muestra los busca por su nombre determinista.
 */
async function videoPorNombre(raiz: string): Promise<Video | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "videos",
    where: { filename: { contains: raiz } },
    depth: 1,
    limit: 1,
    sort: "createdAt",
  });
  return docs[0] ?? null;
}

async function imagenPorNombre(raiz: string): Promise<Media | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "media",
    where: { filename: { contains: raiz } },
    depth: 0,
    limit: 1,
    sort: "createdAt",
  });
  return docs[0] ?? null;
}

export const getRecursosServicioTecnicoLab = cache(async () => {
  const [etapas, fondo, textura] = await Promise.all([
    videoPorNombre("wp-2022-03-partequipos-video-de-alistamiento-de-maquinaria"),
    videoPorNombre("wp-2022-04-whatsapp-video-2022-04-01-at-7.50.39-am"),
    imagenPorNombre("wp-2022-02-fondo-2"),
  ]);
  return { etapas, fondo, textura };
});
