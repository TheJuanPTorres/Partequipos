import { APIError, type CollectionBeforeOperationHook } from "payload";

/**
 * RECORTE DESACTIVADO EN EL SERVIDOR, no solo en el panel (CLAUDE.md §10.32).
 *
 * `upload.crop: false` solo quita el botón. Payload 3.89 recorta si la query
 * trae `uploadEdits[crop]` (o `heightInPixels`/`widthInPixels`), SIN mirar esa
 * opción (`uploads/generateFileData.js`). Y recortar SOBRESCRIBE el fichero con
 * el mismo nombre: con la caché de un año del plugin de Blob, se sigue sirviendo
 * el original mientras el registro ya guarda las medidas del recorte, así que la
 * imagen se pinta con la proporción equivocada.
 *
 * El punto focal NO se bloquea aquí: no cambia los bytes y se usa en la fase C.
 */
export function pideRecorte(uploadEdits: unknown): boolean {
  if (!uploadEdits || typeof uploadEdits !== "object") return false;
  const e = uploadEdits as Record<string, unknown>;
  return Boolean(e.crop || e.heightInPixels || e.widthInPixels);
}

export const sinRecorte: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== "create" && operation !== "update") return args;
  if (!pideRecorte(req.query?.uploadEdits)) return args;
  throw new APIError(
    "El recorte está desactivado: recorta la imagen antes de subirla. " +
      "Recortar aquí dejaba el sitio mostrando la imagen original con otras medidas.",
    400,
  );
};
