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
 * EL PANEL MANDA UN «RECORTE» AUNQUE SOLO SE CAMBIE EL PUNTO FOCAL. Medido en el
 * preview (2026-09-24): al guardar el punto focal envía también
 * `crop = {x:0, y:0, width:100, height:100, unit:"%"}` y las medidas completas.
 * La primera versión de este gancho lo rechazaba —400 al guardar el punto
 * focal—. Y dejarlo pasar tampoco vale: Payload recortaría la imagen entera con
 * `sharp`, o sea la RECODIFICARÍA (otros bytes, pérdida de calidad) y la
 * sobrescribiría con el mismo nombre en cada ajuste. Así que el recorte de la
 * imagen entera SE QUITA de la petición y queda solo el punto focal: Payload
 * vuelve a subir los mismos bytes, sin recodificar. Un recorte real se rechaza.
 */

type Recorte = { x?: unknown; y?: unknown; width?: unknown; height?: unknown; unit?: unknown };
type Ediciones = {
  crop?: Recorte;
  heightInPixels?: unknown;
  widthInPixels?: unknown;
  focalPoint?: unknown;
};

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN);

/** ¿El «recorte» abarca la imagen entera? Es lo que manda el panel con el punto focal. */
export function esRecorteDeImagenEntera(e: Ediciones): boolean {
  const c = e.crop;
  if (!c) return true; // sin recorte, nada que recortar (queda ver las medidas sueltas)
  const x = num(c.x),
    y = num(c.y),
    w = num(c.width),
    h = num(c.height);
  if (x !== 0 || y !== 0) return false;
  if (c.unit === "%") return w === 100 && h === 100;
  // En píxeles: entero si coincide con las medidas que manda el propio panel.
  return c.unit === "px" && w === num(e.widthInPixels) && h === num(e.heightInPixels);
}

export function pideRecorte(uploadEdits: unknown): boolean {
  if (!uploadEdits || typeof uploadEdits !== "object") return false;
  const e = uploadEdits as Ediciones;
  return Boolean(e.crop || e.heightInPixels || e.widthInPixels);
}

export const sinRecorte: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== "create" && operation !== "update") return args;
  const ediciones = req.query?.uploadEdits as Ediciones | undefined;
  if (!pideRecorte(ediciones)) return args;

  if (ediciones && ediciones.crop && esRecorteDeImagenEntera(ediciones)) {
    // Recorte de la imagen entera: se quita para que Payload no recodifique.
    delete ediciones.crop;
    delete ediciones.heightInPixels;
    delete ediciones.widthInPixels;
    return args;
  }

  throw new APIError(
    "El recorte está desactivado: recorta la imagen antes de subirla. " +
      "Recortar aquí dejaba el sitio mostrando la imagen original con otras medidas.",
    400,
  );
};
