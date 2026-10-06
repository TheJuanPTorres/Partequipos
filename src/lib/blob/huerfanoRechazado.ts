import { del } from "@vercel/blob";

import { almacenDeToken } from "./almacen";

/**
 * SUBIDA DIRECTA (§10.39): cuando un gancho de formato rechaza un fichero que
 * el navegador ya subió al Blob, ese fichero se borra para no dejar huérfanos.
 * Nunca relanza: el rechazo que importa es el del gancho.
 *
 * Solo borra en el almacén del propio token, y solo por el nombre del fichero
 * subido (con su sufijo aleatorio): no puede alcanzar otro.
 */
export async function borrarHuerfanoRechazado(nombre: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const almacen = almacenDeToken(token);
  if (!token || !almacen || !nombre || nombre.includes("/")) return;
  try {
    await del(`https://${almacen}.public.blob.vercel-storage.com/${encodeURIComponent(nombre)}`, {
      token,
    });
  } catch (error) {
    console.error(`[subida-directa] no se pudo borrar el fichero rechazado «${nombre}»:`, error);
  }
}

/** ¿El fichero llegó por la subida directa (sin datos en la petición)? */
export function llegoPorSubidaDirecta(file: { data?: unknown } | undefined): boolean {
  return !!file && !(Buffer.isBuffer(file.data) && file.data.length > 0);
}
