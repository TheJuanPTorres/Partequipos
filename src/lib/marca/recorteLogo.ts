import sharp from "sharp";
import { unstable_cache } from "next/cache";

import { CLAVE_DESPLIEGUE } from "@/lib/cacheDatos";

import { SIN_RECORTE, type Recorte } from "./tamanoOptico";

/**
 * LA PARTE VISIBLE DE UN LOGO (selector de marcas de nueva, 2026-11-09): sus márgenes
 * transparentes (o de fondo liso) fuera, medidos con `sharp().trim()` sobre el fichero del Blob,
 * en fracciones de su ancho y su alto. Lo usa `colocarLogo` para que dos versiones del mismo logo
 * —la de siempre, con márgenes, y la de la baldosa, recortada— ocupen lo mismo.
 *
 * En caché por URL y despliegue, sin vigencia: el fichero de una URL del Blob no cambia (las
 * subidas llevan sufijo aleatorio). Un fallo (red, formato) NO se guarda: devuelve el fichero
 * entero y se vuelve a intentar en la siguiente generación.
 */
const medir = unstable_cache(
  async (url: string): Promise<Recorte> => {
    const respuesta = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const bytes = Buffer.from(await respuesta.arrayBuffer());
    const meta = await sharp(bytes).metadata();
    const ancho = meta.width ?? 0;
    const alto = meta.height ?? 0;
    if (!ancho || !alto) throw new Error("sin medidas");
    const { info } = await sharp(bytes)
      .trim({ threshold: 12 })
      .toBuffer({ resolveWithObject: true });
    const izquierda = -(info.trimOffsetLeft ?? 0);
    const arriba = -(info.trimOffsetTop ?? 0);
    return {
      x: izquierda / ancho,
      y: arriba / alto,
      w: info.width / ancho,
      h: info.height / alto,
    };
  },
  ["recorte-logo", CLAVE_DESPLIEGUE],
);

/** Solo el Blob (las URL de los logos): nunca se descarga otra cosa desde el servidor. */
const DEL_BLOB = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//;

export async function recorteVisible(url: string): Promise<Recorte> {
  if (!DEL_BLOB.test(url)) return SIN_RECORTE;
  try {
    return await medir(url);
  } catch (error) {
    console.error("[logos] No se pudo medir la parte visible de un logo:", String(error));
    return SIN_RECORTE;
  }
}
