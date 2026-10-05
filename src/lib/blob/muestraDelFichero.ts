import { openSync, readSync, closeSync, fstatSync } from "node:fs";

/**
 * LO QUE LOS GANCHOS DE FORMATO NECESITAN DE UN FICHERO SUBIDO: el principio,
 * el final y el tamaño REAL.
 *
 * Con una subida normal, Payload da el fichero entero en `req.file.data`. Con
 * la SUBIDA DIRECTA (`clientUploads`), `data` llega VACÍO: Payload descarga el
 * fichero del Blob a un temporal (`tempFilePath`) y el `size` es el que dice el
 * navegador, que no es fiable. Antes de este módulo, los ganchos devolvían
 * «vale» con `data` vacío: con subida directa no habrían comprobado nada.
 */
export type Muestra = { inicio: Buffer; final: Buffer; tamano: number };

type FicheroSubido = { data?: unknown; tempFilePath?: string } | undefined;

export function muestraDelFichero(file: FicheroSubido, bytes = 4096): Muestra | null {
  if (!file) return null;
  if (Buffer.isBuffer(file.data) && file.data.length > 0) {
    const d = file.data;
    return {
      inicio: d.subarray(0, bytes),
      final: d.subarray(Math.max(0, d.length - bytes)),
      tamano: d.length,
    };
  }
  if (typeof file.tempFilePath === "string" && file.tempFilePath) {
    const fd = openSync(file.tempFilePath, "r");
    try {
      const tamano = fstatSync(fd).size;
      const inicio = Buffer.alloc(Math.min(bytes, tamano));
      readSync(fd, inicio, 0, inicio.length, 0);
      const final = Buffer.alloc(Math.min(bytes, tamano));
      readSync(fd, final, 0, final.length, Math.max(0, tamano - final.length));
      return { inicio, final, tamano };
    } finally {
      closeSync(fd);
    }
  }
  return null;
}
