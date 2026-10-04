import { APIError, type CollectionBeforeOperationHook } from "payload";

import { veredictoAlmacen } from "../../lib/blob/almacen";

/** Operaciones que pueden escribir o borrar ficheros en el Blob. */
const ESCRIBEN = new Set(["create", "update", "updateByID", "delete", "deleteByID"]);

/**
 * GUARDA DEL ALMACÉN (CLAUDE.md §10.37): antes de cualquier operación que
 * pueda subir, sobrescribir o borrar un fichero de `media`, `videos` o `animaciones`, comprueba
 * SIN ESCRIBIR que el token activo es del almacén que toca a este entorno
 * (`src/lib/blob/almacen.ts`). Si no, aborta antes de tocar nada.
 *
 * Cubre el panel, la API y cualquier script con la API local: todos pasan por
 * aquí. Va el PRIMERO en `beforeOperation`.
 */
export const almacenEsperado: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (!ESCRIBEN.has(operation)) return args;
  const v = veredictoAlmacen(process.env);
  if (v.valido) return args;
  console.error(`[blob] escritura bloqueada: ${v.motivo}`);
  // 500 y mensaje genérico: es configuración del servidor, no un dato del editor (§8).
  throw new APIError(
    "El almacenamiento de archivos no está bien configurado en este entorno. No se ha guardado nada; avisa a quien mantiene el sitio.",
    500,
  );
};
