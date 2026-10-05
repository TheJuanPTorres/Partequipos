import { APIError, type CollectionBeforeOperationHook } from "payload";

/**
 * Rechaza subidas a `documentos` que no sean un PDF POR CONTENIDO, o que pasen
 * del tope de tamaño, con mensajes en español. Mismo criterio que
 * `formatoDeVideoPermitido`: Payload solo valida `mimeTypes`, detrás y en
 * inglés.
 *
 * Qué se exige, y por qué:
 *
 * - **Firma `%PDF-`** al principio del fichero (ISO 32000: la cabecera va en el
 *   byte 0; se tolera hasta 1 KB de basura delante, como hacen los lectores).
 *   Un fichero renombrado a `.pdf` no pasa.
 * - **Tope de 4 MB**: la subida del panel pasa por una función de Vercel, que
 *   corta el cuerpo en 4,5 MB (el mismo límite que los vídeos). Una ficha
 *   técnica de fabricante cabe de sobra; si no, hay que comprimirla.
 */

export const TOPE_PDF_BYTES = 4 * 1024 * 1024;

const FIRMA = Buffer.from("%PDF-", "ascii");

export function esPdf(b: Buffer): boolean {
  const i = b.subarray(0, 1024).indexOf(FIRMA);
  return i !== -1;
}

export const formatoDePdfPermitido: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== "create" && operation !== "update") return args;

  const file = req.file;
  if (!file?.data || !Buffer.isBuffer(file.data) || file.data.length === 0) return args;

  if (!esPdf(file.data)) {
    throw new APIError(
      `«${file.name}» no es un PDF. Si el nombre acaba en .pdf pero el contenido es de otro ` +
        `formato, también se rechaza.`,
      400,
    );
  }

  if (file.data.length > TOPE_PDF_BYTES) {
    const mb = (file.data.length / (1024 * 1024)).toFixed(1).replace(".", ",");
    throw new APIError(
      `«${file.name}» pesa ${mb} MB y el máximo es 4 MB. Hay que comprimirlo (por ejemplo, ` +
        `«Reducir tamaño» al exportar) y volver a subirlo.`,
      400,
    );
  }

  return args;
};
