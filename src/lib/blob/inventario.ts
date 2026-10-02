import { almacenDeUrl } from "./almacen";

/**
 * Veredicto del INVENTARIO DE FICHEROS de un respaldo (`npm run backup:blob`).
 *
 * El inventario usa la URL GUARDADA de cada registro, no la que devuelve la API
 * local: con `disablePayloadAccessControl`, el plugin de Blob recalcula la URL
 * al leer con el almacén del token del proceso (CLAUDE.md §10.37), así que
 * lanzado con otro token el inventario listaría otro almacén sin avisar.
 *
 * Y falla si algún registro no está en el almacén esperado del entorno: un
 * respaldo de producción hecho desde una máquina local tiene que DECLARAR su
 * almacén (`ALMACEN_BLOB_ESPERADO`), o no sale.
 */
export type FilaInventario = { id: number; coleccion: string; url: string | null };

export type VeredictoInventario =
  | { valido: true }
  | {
      valido: false;
      motivo: string;
      fuera: { id: number; coleccion: string; almacen: string | null }[];
    };

export function veredictoInventario(
  filas: FilaInventario[],
  esperado: string,
): VeredictoInventario {
  const fuera = filas
    .map((f) => ({ id: f.id, coleccion: f.coleccion, almacen: almacenDeUrl(f.url) }))
    .filter((f) => f.almacen !== esperado);
  if (fuera.length === 0) return { valido: true };
  const almacenes = [...new Set(fuera.map((f) => f.almacen ?? "sin URL del Blob"))].join(", ");
  return {
    valido: false,
    motivo: `${fuera.length} de ${filas.length} registros no están en el almacén esperado (${esperado}), sino en: ${almacenes}`,
    fuera,
  };
}
